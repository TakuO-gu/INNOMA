/**
 * Draft Diff Utilities
 * Compare drafts with existing variable stores
 */

import { DraftDiffEntry, DraftComparison, Draft } from './types';
import { VariableStore } from '../template/types';
import { getDraft } from './storage';
import { getVariableStore } from '../template/storage';

/**
 * Compare draft variables with existing variable store
 */
export function compareDraftWithStore(
  draft: Draft,
  existingStore: VariableStore
): DraftComparison {
  const changes: DraftDiffEntry[] = [];
  let addedCount = 0;
  let modifiedCount = 0;
  let removedCount = 0;

  // Get all variable names from both sources
  const allVariableNames = new Set<string>([
    ...Object.keys(draft.variables),
    ...Object.keys(existingStore),
  ]);

  for (const variableName of allVariableNames) {
    const draftVar = draft.variables[variableName];
    const existingVar = existingStore[variableName];

    const oldValue = existingVar?.value ?? null;
    const newValue = draftVar?.value ?? null;

    let changeType: DraftDiffEntry['changeType'];

    if (oldValue === null && newValue !== null) {
      changeType = 'added';
      addedCount++;
    } else if (oldValue !== null && newValue === null) {
      changeType = 'removed';
      removedCount++;
    } else if (oldValue !== newValue) {
      changeType = 'modified';
      modifiedCount++;
    } else {
      changeType = 'unchanged';
    }

    // Only include if there's a change or if it's in the draft
    if (changeType !== 'unchanged' || draftVar) {
      changes.push({
        variableName,
        oldValue,
        newValue,
        changeType,
      });
    }
  }

  // Sort changes: added first, then modified, then removed, then unchanged
  const changeOrder = { added: 0, modified: 1, removed: 2, unchanged: 3 };
  changes.sort((a, b) => changeOrder[a.changeType] - changeOrder[b.changeType]);

  return {
    draftId: draft.id,
    municipalityId: draft.municipalityId,
    service: draft.service,
    changes,
    hasChanges: addedCount > 0 || modifiedCount > 0 || removedCount > 0,
    addedCount,
    modifiedCount,
    removedCount,
  };
}

/**
 * Get comparison for a specific draft
 */
export async function getDraftComparison(
  municipalityId: string,
  service: string
): Promise<DraftComparison | null> {
  const draft = await getDraft(municipalityId, service);
  if (!draft) return null;

  const existingStore = await getVariableStore(municipalityId);

  return compareDraftWithStore(draft, existingStore);
}

/**
 * Get only changed variables from comparison
 */
export function getChangedVariables(comparison: DraftComparison): DraftDiffEntry[] {
  return comparison.changes.filter((c) => c.changeType !== 'unchanged');
}

/**
 * Generate human-readable diff summary
 */
export function generateDiffSummary(comparison: DraftComparison): string {
  const parts: string[] = [];

  if (comparison.addedCount > 0) {
    parts.push(`${comparison.addedCount}件の新規追加`);
  }
  if (comparison.modifiedCount > 0) {
    parts.push(`${comparison.modifiedCount}件の変更`);
  }
  if (comparison.removedCount > 0) {
    parts.push(`${comparison.removedCount}件の削除`);
  }

  if (parts.length === 0) {
    return '変更なし';
  }

  return parts.join('、');
}

/**
 * Apply draft changes to variable store format
 */
export function applyDraftToStore(
  draft: Draft,
  existingStore: VariableStore
): VariableStore {
  const newStore = { ...existingStore };

  for (const [variableName, draftVar] of Object.entries(draft.variables)) {
    if (draftVar.value) {
      newStore[variableName] = {
        value: draftVar.value,
        source: 'llm',
        sourceUrl: draftVar.sourceUrl,
        confidence: draftVar.confidence,
        updatedAt: new Date().toISOString(),
      };
    }
  }

  return newStore;
}

/**
 * Check if draft has significant changes
 */
export function hasSignificantChanges(
  comparison: DraftComparison,
  threshold: number = 0.5
): boolean {
  const totalChanges = comparison.addedCount + comparison.modifiedCount;
  const totalVariables = comparison.changes.length;

  if (totalVariables === 0) return false;

  return totalChanges / totalVariables >= threshold;
}
