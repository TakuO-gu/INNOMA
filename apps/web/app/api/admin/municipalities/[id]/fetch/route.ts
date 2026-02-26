/**
 * Municipality LLM Fetch API
 * POST: Start LLM information fetch for a municipality (with SSE streaming)
 * Supports:
 * - Fetching specific services via `services` array
 * - Fetching only services with missing variables via `onlyMissing` flag
 */

import { NextRequest } from "next/server";
import { getMunicipalityMeta } from "@/lib/template";
import { fetchServiceVariables } from "@/lib/llm/fetcher";
import { serviceDefinitions, getServiceDefinition, getVariableDefinition } from "@/lib/llm/variable-priority";
import { createDraft, getDraft } from "@/lib/drafts";
import { DraftVariableEntry } from "@/lib/drafts/types";
import { isValidMunicipalityId, isValidServiceId } from "@/lib/security/validators";
import {
  createFetchJob,
  saveJob,
  updateServiceStatus,
  recordJobError,
  completeJob,
  FetchJob,
} from "@/lib/jobs";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// Progress event types
type ProgressEvent =
  | { type: "start"; totalServices: number; services: ServiceInfo[]; jobId: string; isResume: boolean; skippedCount: number }
  | { type: "service_start"; service: string; serviceIndex: number; serviceName: string; variables: VariableInfo[] }
  | { type: "service_complete"; service: string; success: boolean; variablesCount: number; fetchedVariables: FetchedVariableInfo[]; error?: string }
  | { type: "complete"; successCount: number; totalServices: number }
  | { type: "error"; message: string };

interface ServiceInfo {
  id: string;
  name: string;
  variableCount: number;
  status?: "pending" | "completed" | "skipped";
}

interface VariableInfo {
  name: string;
  description: string;
}

interface FetchedVariableInfo {
  name: string;
  value: string | null;
  confidence: number;
  sourceUrl: string;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  if (!isValidMunicipalityId(id)) {
    return new Response(
      JSON.stringify({ error: "自治体IDの形式が正しくありません" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Parse request body
  let requestedServices: string[] | undefined;
  let onlyMissing = false;

  try {
    const body = await request.json();
    requestedServices = body.services;
    onlyMissing = body.onlyMissing === true;
  } catch {
    // Empty body is OK
  }

  // Get municipality metadata
  const meta = await getMunicipalityMeta(id);
  if (!meta) {
    return new Response(
      JSON.stringify({ error: "自治体が見つかりません" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  // Check if API keys are configured
  if (!process.env.GOOGLE_GEMINI_API_KEY) {
    return new Response(
      JSON.stringify({ error: "GOOGLE_GEMINI_API_KEYが設定されていません" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // Check for search API (Brave or Google)
  const hasBraveSearch = !!process.env.BRAVE_SEARCH_API_KEY;
  const hasGoogleSearch = !!process.env.GOOGLE_CUSTOM_SEARCH_API_KEY && !!process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID;

  if (!hasBraveSearch && !hasGoogleSearch) {
    return new Response(
      JSON.stringify({ error: "検索APIが設定されていません。BRAVE_SEARCH_API_KEYまたはGOOGLE_CUSTOM_SEARCH_API_KEYを設定してください" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // Determine which services to fetch
  let servicesToFetch: string[] = [];

  if (requestedServices && requestedServices.length > 0) {
    // Fetch only requested services
    servicesToFetch = requestedServices.filter(
      (sId) =>
        isValidServiceId(sId) && serviceDefinitions.some((s) => s.id === sId)
    );
  } else if (onlyMissing) {
    // Fetch only services with missing variables or no draft
    for (const serviceDef of serviceDefinitions) {
      const draft = await getDraft(id, serviceDef.id);
      if (!draft) {
        // No draft at all - needs fetching
        servicesToFetch.push(serviceDef.id);
      } else if (draft.missingVariables.length > 0) {
        // Has missing variables - needs fetching
        servicesToFetch.push(serviceDef.id);
      }
      // If draft exists and no missing variables, skip this service
    }
  } else {
    // Fetch all services
    servicesToFetch = serviceDefinitions.map(s => s.id);
  }

  if (servicesToFetch.length === 0) {
    return new Response(
      JSON.stringify({ error: "取得するサービスがありません。全ての変数が取得済みです。" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Create job
  let job: FetchJob = createFetchJob(id, servicesToFetch);
  await saveJob(job);

  // Build service info
  const serviceInfoList: ServiceInfo[] = servicesToFetch.map(serviceId => {
    const service = getServiceDefinition(serviceId);
    return {
      id: serviceId,
      name: service?.nameJa || serviceId,
      variableCount: service?.variables.length || 0,
      status: "pending" as const,
    };
  });

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const sendEvent = (event: ProgressEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      try {
        // Send start event with service details
        sendEvent({
          type: "start",
          totalServices: servicesToFetch.length,
          services: serviceInfoList,
          jobId: job.id,
          isResume: false,
          skippedCount: 0,
        });

        const results: { service: string; success: boolean; error?: string }[] = [];

        // Fetch each service
        for (let i = 0; i < servicesToFetch.length; i++) {
          const serviceId = servicesToFetch[i];
          const service = getServiceDefinition(serviceId);
          const serviceName = service?.nameJa || serviceId;

          // Update job state: service starting
          job = updateServiceStatus(job, serviceId, "running");
          await saveJob(job);

          // Get variable info for this service
          const variableInfoList: VariableInfo[] = (service?.variables || []).map(varName => {
            const def = getVariableDefinition(varName);
            return {
              name: varName,
              description: def?.description || varName,
            };
          });

          // Send service start event with variable list
          sendEvent({
            type: "service_start",
            service: serviceId,
            serviceIndex: i,
            serviceName,
            variables: variableInfoList,
          });

          try {
            const result = await fetchServiceVariables(
              meta.municipalityName || meta.municipalityId || "",
              serviceId,
              meta.officialWebsite || meta.officialUrl || ""
            );

            // Convert to draft format
            const variables: Record<string, DraftVariableEntry> = {};
            const fetchedVariables: FetchedVariableInfo[] = [];

            // Track which variables were fetched
            const fetchedVariableNames = new Set<string>();

            for (const v of result.variables) {
              if (v.value) {
                variables[v.variableName] = {
                  value: v.value,
                  sourceUrl: v.sourceUrl,
                  confidence: v.confidence,
                  extractedAt: v.extractedAt,
                  validated: true,
                };
                fetchedVariables.push({
                  name: v.variableName,
                  value: v.value,
                  confidence: v.confidence,
                  sourceUrl: v.sourceUrl,
                });
                fetchedVariableNames.add(v.variableName);
              }
            }

            // Calculate missing variables from service definition
            const allServiceVariables = service?.variables || [];
            const missingVariables = allServiceVariables.filter(
              (varName) => !fetchedVariableNames.has(varName)
            );

            // Save as draft (this will overwrite existing draft)
            await createDraft(
              id,
              serviceId,
              variables,
              missingVariables,
              result.errors.map((e) => ({
                code: e.code,
                message: e.message,
                variableName: e.variableName,
              })),
              result.searchAttempts,
              result.missingSuggestions
            );

            const variablesCount = Object.keys(variables).length;

            // Update job state: service completed
            job = updateServiceStatus(job, serviceId, "completed", { variablesCount });
            await saveJob(job);

            // Send service complete event with fetched variables
            sendEvent({
              type: "service_complete",
              service: serviceId,
              success: result.success,
              variablesCount,
              fetchedVariables,
            });

            results.push({
              service: serviceId,
              success: result.success,
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";

            // Update job state: service failed
            job = updateServiceStatus(job, serviceId, "failed", { error: errorMessage });
            await saveJob(job);

            // Send service complete event with error
            sendEvent({
              type: "service_complete",
              service: serviceId,
              success: false,
              variablesCount: 0,
              fetchedVariables: [],
              error: errorMessage,
            });

            results.push({
              service: serviceId,
              success: false,
              error: errorMessage,
            });
          }

          // Rate limiting between services
          if (i < servicesToFetch.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }

        // Calculate success count
        const successCount = results.filter((r) => r.success).length;

        // Mark job as completed
        job = completeJob(job);
        await saveJob(job);

        // Send complete event
        sendEvent({
          type: "complete",
          successCount,
          totalServices: servicesToFetch.length,
        });

        controller.close();
      } catch (error) {
        console.error("Error fetching municipality info:", error);

        // Record error in job state
        job = recordJobError(job, error instanceof Error ? error : new Error("Unknown error"));
        await saveJob(job);

        sendEvent({
          type: "error",
          message: error instanceof Error ? error.message : "情報取得に失敗しました",
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
