/**
 * Municipality Variables API
 * PUT: Update individual variable values
 */

import { NextRequest, NextResponse } from "next/server";
import { getVariableStore, updateVariableStore } from "@/lib/template";
import { validateVariable } from "@/lib/llm/validators";
import { revalidatePath } from "next/cache";
import { recordBulkVariableUpdate, VariableChange } from "@/lib/history";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const updates = await request.json();

    if (!updates || typeof updates !== "object" || Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "更新する変数を指定してください" },
        { status: 400 }
      );
    }

    // Get current variable store
    const currentStore = await getVariableStore(id);
    const now = new Date().toISOString();

    // Process each update
    const updatedStore = { ...currentStore };
    const errors: { variable: string; error: string }[] = [];

    for (const [variableName, value] of Object.entries(updates)) {
      if (typeof value !== "string") {
        errors.push({ variable: variableName, error: "値は文字列である必要があります" });
        continue;
      }

      // Validate the value
      const validation = validateVariable(variableName, value);
      if (!validation.valid && value !== "") {
        errors.push({
          variable: variableName,
          error: validation.error || "検証に失敗しました",
        });
        continue;
      }

      // Update the variable
      updatedStore[variableName] = {
        value: validation.normalized || value,
        source: "manual",
        updatedAt: now,
      };
    }

    // If all updates failed, return error
    if (errors.length === Object.keys(updates).length) {
      return NextResponse.json(
        { error: "すべての更新が失敗しました", errors },
        { status: 400 }
      );
    }

    // Collect changes for history
    const changes: VariableChange[] = [];
    for (const [variableName, value] of Object.entries(updates)) {
      if (typeof value !== "string") continue;
      if (errors.some((e) => e.variable === variableName)) continue;

      const oldValue = currentStore[variableName]?.value;
      const validation = validateVariable(variableName, value);
      const newValue = validation.normalized || value;

      if (oldValue !== newValue) {
        changes.push({
          variableName,
          oldValue,
          newValue,
        });
      }
    }

    // Save the updated store
    await updateVariableStore(id, updatedStore);

    // Record history if there are changes
    if (changes.length > 0) {
      await recordBulkVariableUpdate(id, changes, "manual", "admin");
    }

    // Revalidate the municipality pages
    revalidatePath(`/${id}`);
    revalidatePath(`/admin/municipalities/${id}`);

    return NextResponse.json({
      success: true,
      updated: Object.keys(updates).length - errors.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error updating variables:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "変数の更新に失敗しました" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const variables = await getVariableStore(id);

    return NextResponse.json(variables);
  } catch (error) {
    console.error("Error fetching variables:", error);
    return NextResponse.json(
      { error: "変数の取得に失敗しました" },
      { status: 500 }
    );
  }
}
