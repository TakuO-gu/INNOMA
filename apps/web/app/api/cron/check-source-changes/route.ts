/**
 * Cron Job: Check Source Changes
 *
 * 自治体Webサイトのソース変更を定期的にチェックし、
 * 変更があった場合は関連ページをレビュー待ちにする。
 *
 * Usage:
 *   Configure in vercel.json:
 *   {
 *     "crons": [{
 *       "path": "/api/cron/check-source-changes",
 *       "schedule": "0 4 * * *"  // Every day at 4:00 AM
 *     }]
 *   }
 *
 * Environment Variables:
 *   CRON_SECRET: Secret to authorize cron requests
 */

import { NextRequest, NextResponse } from "next/server";
import { getMunicipalities, getMunicipalityMeta } from "@/lib/template";
import { checkSourceChanges, initializeSourceHashes } from "@/lib/review";
import { addNotification } from "@/lib/notification";
import type { SourceCheckInterval } from "@/lib/template/types";

// Rate limiting: max municipalities per run
const MAX_MUNICIPALITIES_PER_RUN = 10;

// Default check interval
const DEFAULT_CHECK_INTERVAL: SourceCheckInterval = "weekly";

// Check interval in days
const CHECK_INTERVAL_DAYS: Record<SourceCheckInterval, number> = {
  disabled: Infinity,
  daily: 1,
  weekly: 7,
  monthly: 30,
};

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured" },
      { status: 500 }
    );
  }
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const municipalities = await getMunicipalities();

    // Filter municipalities that need source checking
    const municipalitiesToCheck: { id: string; name: string }[] = [];

    for (const municipality of municipalities) {
      if (municipality.id === "sample") continue; // Skip sample

      const meta = await getMunicipalityMeta(municipality.id);
      if (!meta) continue;

      // ソースチェックが無効な場合はスキップ
      const checkInterval = meta.settings?.sourceCheckInterval || DEFAULT_CHECK_INTERVAL;
      if (checkInterval === "disabled") continue;

      // 公開中の自治体のみチェック
      if (meta.status !== "published") continue;

      const intervalDays = CHECK_INTERVAL_DAYS[checkInterval];
      // TODO: lastSourceCheckAtをmetaに追加してチェック間隔を判定
      // 現在は全ての公開中自治体をチェック（intervalDaysは将来使用予定）
      void intervalDays;
      municipalitiesToCheck.push({
        id: municipality.id,
        name: municipality.name,
      });

      if (municipalitiesToCheck.length >= MAX_MUNICIPALITIES_PER_RUN) {
        break;
      }
    }

    if (municipalitiesToCheck.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No municipalities need source checking",
        processed: 0,
      });
    }

    // Process each municipality
    const results: {
      municipalityId: string;
      totalVariables: number;
      changedVariables: number;
      errors: number;
    }[] = [];

    let totalChanged = 0;
    let totalErrors = 0;

    for (const municipality of municipalitiesToCheck) {
      try {
        // 初回の場合はハッシュを初期化
        await initializeSourceHashes(municipality.id);

        // ソース変更をチェック
        const result = await checkSourceChanges(municipality.id, {
          concurrency: 3,
          delayMs: 500,
          sendNotifications: true,
        });

        results.push({
          municipalityId: municipality.id,
          totalVariables: result.totalVariables,
          changedVariables: result.changedVariables.length,
          errors: result.errors.length,
        });

        totalChanged += result.changedVariables.length;
        totalErrors += result.errors.length;
      } catch (error) {
        console.error(`Error checking source changes for ${municipality.id}:`, error);
        results.push({
          municipalityId: municipality.id,
          totalVariables: 0,
          changedVariables: 0,
          errors: 1,
        });
        totalErrors++;
      }
    }

    // 変更があった場合はサマリー通知
    if (totalChanged > 0) {
      await addNotification(
        "source_changed",
        "ソース変更チェック完了",
        `${municipalitiesToCheck.length}自治体をチェックし、${totalChanged}件の変更を検出しました。`,
        {
          severity: "warning",
          data: {
            processedCount: municipalitiesToCheck.length,
            changedCount: totalChanged,
            errorCount: totalErrors,
          },
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Checked ${municipalitiesToCheck.length} municipalities`,
      processed: municipalitiesToCheck.length,
      totalChanged,
      totalErrors,
      details: results,
    });
  } catch (error) {
    console.error("Source check cron job error:", error);

    await addNotification(
      "cron_failed",
      "ソース変更チェック失敗",
      error instanceof Error ? error.message : "Unknown error",
      { severity: "error" }
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
