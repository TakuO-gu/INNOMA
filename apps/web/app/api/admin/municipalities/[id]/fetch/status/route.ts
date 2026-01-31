/**
 * Fetch Job Status API
 * GET: Check service statuses and drafts for a municipality
 */

import { NextRequest } from "next/server";
import { getLatestJob, canResumeJob, getJobSummary } from "@/lib/jobs";
import { getDraft } from "@/lib/drafts";
import { serviceDefinitions } from "@/lib/llm/variable-priority";
import { isValidMunicipalityId } from "@/lib/security/validators";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

interface ServiceStatus {
  id: string;
  name: string;
  hasDraft: boolean;
  filledCount: number;
  missingCount: number;
  totalCount: number;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  if (!isValidMunicipalityId(id)) {
    return Response.json(
      { error: "自治体IDの形式が正しくありません" },
      { status: 400 }
    );
  }

  try {
    // Get service statuses from drafts
    const serviceStatuses: ServiceStatus[] = [];

    for (const serviceDef of serviceDefinitions) {
      const draft = await getDraft(id, serviceDef.id);
      const totalCount = serviceDef.variables.length;

      if (draft) {
        const filledCount = Object.keys(draft.variables).length;
        // Calculate missingCount from service definition, not from draft.missingVariables
        // This handles old drafts that were created before missingVariables was properly tracked
        const fetchedVariableNames = new Set(Object.keys(draft.variables));
        const missingCount = serviceDef.variables.filter(
          (varName) => !fetchedVariableNames.has(varName)
        ).length;
        serviceStatuses.push({
          id: serviceDef.id,
          name: serviceDef.nameJa,
          hasDraft: true,
          filledCount,
          missingCount,
          totalCount,
        });
      } else {
        serviceStatuses.push({
          id: serviceDef.id,
          name: serviceDef.nameJa,
          hasDraft: false,
          filledCount: 0,
          missingCount: totalCount,
          totalCount,
        });
      }
    }

    // Also check for unfinished job (legacy support)
    const job = await getLatestJob(id);
    let unfinishedJobInfo = null;

    if (job) {
      const canResume = canResumeJob(job);
      if (canResume) {
        const summary = getJobSummary(job);
        unfinishedJobInfo = {
          id: job.id,
          status: job.status,
          startedAt: job.startedAt,
          updatedAt: job.updatedAt,
          totalServices: job.totalServices,
          completedCount: summary.completedCount,
          failedCount: summary.failedCount,
          pendingCount: summary.pendingCount,
          error: job.error,
        };
      }
    }

    return Response.json({
      serviceStatuses,
      hasUnfinishedJob: !!unfinishedJobInfo,
      job: unfinishedJobInfo,
    });
  } catch (error) {
    console.error("Error checking service status:", error);
    return Response.json(
      { error: "サービス状態の確認に失敗しました" },
      { status: 500 }
    );
  }
}
