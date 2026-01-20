/**
 * Municipality LLM Fetch API
 * POST: Start LLM information fetch for a municipality
 */

import { NextRequest, NextResponse } from "next/server";
import { getMunicipalityMeta } from "@/lib/template";
import { fetchServiceVariables } from "@/lib/llm/fetcher";
import { serviceDefinitions } from "@/lib/llm/variable-priority";
import { createDraft } from "@/lib/drafts";
import { DraftVariableEntry } from "@/lib/drafts/types";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { services } = body; // Optional: specific services to fetch

    // Get municipality metadata
    const meta = await getMunicipalityMeta(id);
    if (!meta) {
      return NextResponse.json(
        { error: "自治体が見つかりません" },
        { status: 404 }
      );
    }

    // Check if API keys are configured
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEYが設定されていません" },
        { status: 500 }
      );
    }

    if (!process.env.GOOGLE_CUSTOM_SEARCH_API_KEY || !process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID) {
      return NextResponse.json(
        { error: "Google Custom Search APIの設定が不足しています" },
        { status: 500 }
      );
    }

    // Determine which services to fetch
    const servicesToFetch = services || serviceDefinitions.map((s) => s.id);
    const results: { service: string; success: boolean; error?: string }[] = [];

    // Fetch each service
    for (const serviceId of servicesToFetch) {
      try {
        const result = await fetchServiceVariables(
          meta.name,
          serviceId,
          meta.officialUrl
        );

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
          id,
          serviceId,
          variables,
          missingVariables,
          result.errors.map((e) => ({
            code: e.code,
            message: e.message,
            variableName: e.variableName,
          }))
        );

        results.push({
          service: serviceId,
          success: result.success,
        });
      } catch (error) {
        results.push({
          service: serviceId,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }

      // Rate limiting between services
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    const successCount = results.filter((r) => r.success).length;

    return NextResponse.json({
      success: successCount > 0,
      totalServices: servicesToFetch.length,
      successCount,
      results,
    });
  } catch (error) {
    console.error("Error fetching municipality info:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "情報取得に失敗しました" },
      { status: 500 }
    );
  }
}
