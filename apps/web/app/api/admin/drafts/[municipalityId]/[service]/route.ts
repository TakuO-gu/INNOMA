/**
 * Draft Detail API
 * GET: Get draft details
 * PUT: Update draft (approve/reject)
 * DELETE: Delete draft
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getDraft,
  updateDraftStatus,
  updateDraftVariables,
  updateMissingSuggestionStatus,
  deleteDraft,
  applyDraftToStore,
} from "@/lib/drafts";
import { getVariableStore, updateVariableStore } from "@/lib/template";
import { revalidatePath } from "next/cache";
import {
  recordDraftApproval,
  recordDraftRejection,
  VariableChange,
} from "@/lib/history";
import { notifyDraftApproved, notifyDraftRejected } from "@/lib/notification";
import { getMunicipalityMeta } from "@/lib/template";
import { isValidMunicipalityId, isValidServiceId } from "@/lib/security/validators";

interface RouteParams {
  params: Promise<{
    municipalityId: string;
    service: string;
  }>;
}

function getActorFromRequest(request: NextRequest): string {
  const authHeader = request.headers.get("authorization") || "";

  if (authHeader.startsWith("Basic ")) {
    try {
      const decoded = Buffer.from(authHeader.slice(6), "base64").toString("utf-8");
      const [username] = decoded.split(":");
      if (username) return username;
    } catch {
      // ignore decode errors
    }
  }

  if (authHeader.startsWith("Bearer ")) {
    return "bearer";
  }

  return "admin";
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { municipalityId, service } = await params;
    if (!isValidMunicipalityId(municipalityId) || !isValidServiceId(service)) {
      return NextResponse.json(
        { error: "パラメータの形式が正しくありません" },
        { status: 400 }
      );
    }
    const draft = await getDraft(municipalityId, service);

    if (!draft) {
      return NextResponse.json(
        { error: "下書きが見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json(draft);
  } catch (error) {
    console.error("Error fetching draft:", error);
    return NextResponse.json(
      { error: "下書きの取得に失敗しました" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { municipalityId, service } = await params;
    if (!isValidMunicipalityId(municipalityId) || !isValidServiceId(service)) {
      return NextResponse.json(
        { error: "パラメータの形式が正しくありません" },
        { status: 400 }
      );
    }
    const body = await request.json();
    const { action, variables } = body;
    const actor = getActorFromRequest(request);

    const draft = await getDraft(municipalityId, service);
    if (!draft) {
      return NextResponse.json(
        { error: "下書きが見つかりません" },
        { status: 404 }
      );
    }

    // Handle approve action
    if (action === "approve") {
      // Apply draft to variable store
      const existingStore = await getVariableStore(municipalityId);
      const newStore = applyDraftToStore(draft, existingStore);
      await updateVariableStore(municipalityId, newStore);

      // Record history
      const changes: VariableChange[] = Object.entries(draft.variables).map(
        ([variableName, entry]) => ({
          variableName,
          oldValue: existingStore[variableName]?.value,
          newValue: entry.value,
        })
      );
      await recordDraftApproval(municipalityId, service, changes, actor);

      // Send notification
      const meta = await getMunicipalityMeta(municipalityId);
      await notifyDraftApproved(
        municipalityId,
        meta?.name || municipalityId,
        service,
        Object.keys(draft.variables).length
      );

      // Update draft status
      const updated = await updateDraftStatus(municipalityId, service, "approved", {
        approvedAt: new Date().toISOString(),
        approvedBy: actor,
      });

      // Trigger ISR revalidation for the municipality pages
      revalidatePath(`/${municipalityId}`, "layout");
      revalidatePath(`/admin/municipalities/${municipalityId}`);

      return NextResponse.json(updated);
    }

    // Handle reject action
    if (action === "reject") {
      // Record history
      await recordDraftRejection(municipalityId, service, actor, body.reason);

      // Send notification
      const meta = await getMunicipalityMeta(municipalityId);
      await notifyDraftRejected(
        municipalityId,
        meta?.name || municipalityId,
        service,
        body.reason
      );

      const updated = await updateDraftStatus(municipalityId, service, "rejected", {
        rejectedAt: new Date().toISOString(),
        rejectedBy: actor,
        rejectionReason: body.reason,
      });

      return NextResponse.json(updated);
    }

    // Apply suggestion
    if (action === "apply_suggestion") {
      const { variableName, value, sourceUrl, confidence } = body || {};
      if (!variableName || !value) {
        return NextResponse.json(
          { error: "variableName and value are required" },
          { status: 400 }
        );
      }
      const updated = await updateDraftVariables(municipalityId, service, {
        [variableName]: {
          value,
          sourceUrl,
          confidence,
          validated: true,
        },
      });
      await updateMissingSuggestionStatus(municipalityId, service, variableName, "accepted");
      return NextResponse.json(updated);
    }

    // Reject suggestion
    if (action === "reject_suggestion") {
      const { variableName } = body || {};
      if (!variableName) {
        return NextResponse.json(
          { error: "variableName is required" },
          { status: 400 }
        );
      }
      const updated = await updateMissingSuggestionStatus(municipalityId, service, variableName, "rejected");
      return NextResponse.json(updated);
    }

    // Handle variable updates
    if (variables) {
      const updated = await updateDraftVariables(municipalityId, service, variables);
      return NextResponse.json(updated);
    }

    return NextResponse.json(
      { error: "無効なアクションです" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error updating draft:", error);
    return NextResponse.json(
      { error: "下書きの更新に失敗しました" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { municipalityId, service } = await params;
    if (!isValidMunicipalityId(municipalityId) || !isValidServiceId(service)) {
      return NextResponse.json(
        { error: "パラメータの形式が正しくありません" },
        { status: 400 }
      );
    }

    const success = await deleteDraft(municipalityId, service);
    if (!success) {
      return NextResponse.json(
        { error: "下書きの削除に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting draft:", error);
    return NextResponse.json(
      { error: "下書きの削除に失敗しました" },
      { status: 500 }
    );
  }
}
