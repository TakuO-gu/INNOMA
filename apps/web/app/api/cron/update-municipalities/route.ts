/**
 * Cron Job: Update Municipality Information
 *
 * This endpoint is designed to be called by Vercel Cron or similar schedulers.
 *
 * Usage:
 *   Configure in vercel.json:
 *   {
 *     "crons": [{
 *       "path": "/api/cron/update-municipalities",
 *       "schedule": "0 3 * * 1"  // Every Monday at 3:00 AM
 *     }]
 *   }
 *
 * Environment Variables:
 *   CRON_SECRET: Secret to authorize cron requests
 */

import { NextRequest, NextResponse } from "next/server";
import { getMunicipalities, getMunicipalityMeta } from "@/lib/template";
import { fetchServiceVariables } from "@/lib/llm/fetcher";
import { serviceDefinitions } from "@/lib/llm/variable-priority";
import { createDraft, getDraft } from "@/lib/drafts";
import { DraftVariableEntry } from "@/lib/drafts/types";
import { notifyCronCompleted, notifyCronFailed, notifyDraftCreated } from "@/lib/notification";

// Rate limiting: max municipalities per run
const MAX_MUNICIPALITIES_PER_RUN = 5;

// Rate limiting: delay between services (ms)
const SERVICE_DELAY_MS = 2000;

// Only update municipalities that haven't been updated in X days
const UPDATE_THRESHOLD_DAYS = 7;

export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel adds this header for cron jobs)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // In production, verify the cron secret
  if (process.env.NODE_ENV === "production" && cronSecret) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const municipalities = await getMunicipalities();
    const now = new Date();
    const thresholdDate = new Date(now.getTime() - UPDATE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000);

    // Filter municipalities that need updating
    const municipalitiesToUpdate: { id: string; name: string; officialUrl?: string }[] = [];

    for (const municipality of municipalities) {
      if (municipality.id === "sample") continue; // Skip sample

      const meta = await getMunicipalityMeta(municipality.id);
      if (!meta) continue;

      const lastFetch = meta.lastFetchAt ? new Date(meta.lastFetchAt) : null;

      // Update if never fetched or older than threshold
      if (!lastFetch || lastFetch < thresholdDate) {
        municipalitiesToUpdate.push({
          id: municipality.id,
          name: municipality.name,
          officialUrl: meta.officialUrl,
        });
      }

      if (municipalitiesToUpdate.length >= MAX_MUNICIPALITIES_PER_RUN) {
        break;
      }
    }

    if (municipalitiesToUpdate.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No municipalities need updating",
        processed: 0,
      });
    }

    // Process each municipality
    const results: {
      municipalityId: string;
      servicesUpdated: number;
      errors: string[];
    }[] = [];

    for (const municipality of municipalitiesToUpdate) {
      const municipalityResult = {
        municipalityId: municipality.id,
        servicesUpdated: 0,
        errors: [] as string[],
      };

      // Fetch each service
      for (const service of serviceDefinitions) {
        try {
          // Check if there's already a pending draft
          const existingDraft = await getDraft(municipality.id, service.id);
          if (existingDraft && existingDraft.status === "draft") {
            // Skip if there's already a pending draft
            continue;
          }

          const result = await fetchServiceVariables(
            municipality.name,
            service.id,
            municipality.officialUrl
          );

          if (result.variables.length > 0) {
            // Convert to draft format
            const variables: Record<string, DraftVariableEntry> = {};
            const missingVariables: string[] = [];

            for (const v of result.variables) {
              if (v.value) {
                variables[v.variableName] = {
                  value: v.value,
                  sourceUrl: v.sourceUrl,
                  confidence: v.confidence,
                  extractedAt: v.extractedAt,
                  validated: true,
                };
              } else {
                missingVariables.push(v.variableName);
              }
            }

            // Save as draft
            await createDraft(
              municipality.id,
              service.id,
              variables,
              missingVariables,
              result.errors.map((e) => ({
                code: e.code,
                message: e.message,
                variableName: e.variableName,
              }))
            );

            // Notify about new draft
            await notifyDraftCreated(
              municipality.id,
              municipality.name,
              service.id,
              Object.keys(variables).length
            );

            municipalityResult.servicesUpdated++;
          }
        } catch (error) {
          municipalityResult.errors.push(
            `${service.id}: ${error instanceof Error ? error.message : "Unknown error"}`
          );
        }

        // Rate limiting delay
        await new Promise((resolve) => setTimeout(resolve, SERVICE_DELAY_MS));
      }

      results.push(municipalityResult);
    }

    const totalUpdated = results.reduce((sum, r) => sum + r.servicesUpdated, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);

    // Send completion notification
    await notifyCronCompleted(
      municipalitiesToUpdate.length,
      totalUpdated,
      totalErrors
    );

    return NextResponse.json({
      success: true,
      message: `Processed ${municipalitiesToUpdate.length} municipalities`,
      processed: municipalitiesToUpdate.length,
      servicesUpdated: totalUpdated,
      errors: totalErrors,
      details: results,
    });
  } catch (error) {
    console.error("Cron job error:", error);

    // Send failure notification
    await notifyCronFailed(
      error instanceof Error ? error.message : "Unknown error"
    );

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}
