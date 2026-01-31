/**
 * Draft Storage Operations
 * Handles reading and writing draft data to the filesystem
 */

import { readdir, readFile, writeFile, mkdir, unlink, stat } from 'fs/promises';
import path from 'path';
import { Draft, DraftSummary, DraftStatus, DraftVariableEntry, SearchAttempt } from './types';
import { serviceDefinitions } from '../llm/variable-priority';
import type { DraftVariableUpdate, MissingVariableSuggestion } from './types';

const DRAFTS_DIR = path.join(process.cwd(), 'data', 'artifacts', '_drafts');

/**
 * Ensure drafts directory exists
 */
async function ensureDraftsDir(municipalityId?: string): Promise<string> {
  const dir = municipalityId ? path.join(DRAFTS_DIR, municipalityId) : DRAFTS_DIR;

  try {
    await mkdir(dir, { recursive: true });
  } catch {
    // Directory might already exist
  }

  return dir;
}

/**
 * Generate draft ID
 */
function generateDraftId(municipalityId: string, service: string): string {
  return `${municipalityId}-${service}`;
}

/**
 * Get draft file path
 */
function getDraftPath(municipalityId: string, service: string): string {
  return path.join(DRAFTS_DIR, municipalityId, `${service}.json`);
}

/**
 * Get all drafts
 */
export async function getAllDrafts(): Promise<DraftSummary[]> {
  const summaries: DraftSummary[] = [];

  try {
    await ensureDraftsDir();
    const municipalities = await readdir(DRAFTS_DIR);

    for (const municipalityId of municipalities) {
      const municipalityPath = path.join(DRAFTS_DIR, municipalityId);
      const statResult = await stat(municipalityPath);

      if (!statResult.isDirectory()) continue;

      const files = await readdir(municipalityPath);

      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        try {
          const draft = await getDraft(municipalityId, file.replace('.json', ''));
          if (draft) {
            summaries.push(draftToSummary(draft));
          }
        } catch {
          // Skip invalid drafts
        }
      }
    }
  } catch {
    // Drafts directory might not exist yet
  }

  // Sort by updatedAt descending
  summaries.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return summaries;
}

/**
 * Get drafts for a specific municipality
 */
export async function getMunicipalityDrafts(municipalityId: string): Promise<DraftSummary[]> {
  const summaries: DraftSummary[] = [];

  try {
    const municipalityPath = path.join(DRAFTS_DIR, municipalityId);
    const files = await readdir(municipalityPath);

    for (const file of files) {
      if (!file.endsWith('.json')) continue;

      try {
        const draft = await getDraft(municipalityId, file.replace('.json', ''));
        if (draft) {
          summaries.push(draftToSummary(draft));
        }
      } catch {
        // Skip invalid drafts
      }
    }
  } catch {
    // Directory might not exist
  }

  return summaries;
}

/**
 * Get a specific draft
 */
export async function getDraft(municipalityId: string, service: string): Promise<Draft | null> {
  const filePath = getDraftPath(municipalityId, service);

  try {
    const content = await readFile(filePath, 'utf-8');
    return JSON.parse(content) as Draft;
  } catch {
    return null;
  }
}

/**
 * Save a draft
 */
export async function saveDraft(draft: Draft): Promise<void> {
  await ensureDraftsDir(draft.municipalityId);

  const filePath = getDraftPath(draft.municipalityId, draft.service);
  draft.updatedAt = new Date().toISOString();

  await writeFile(filePath, JSON.stringify(draft, null, 2), 'utf-8');
}

/**
 * Create a new draft from extracted variables
 */
export async function createDraft(
  municipalityId: string,
  service: string,
  variables: Record<string, DraftVariableEntry>,
  missingVariables: string[],
  errors: { code: string; message: string; variableName?: string }[],
  searchAttempts?: Record<string, SearchAttempt[]>,
  missingSuggestions?: Record<string, MissingVariableSuggestion>
): Promise<Draft> {
  const now = new Date().toISOString();
  const id = generateDraftId(municipalityId, service);

  const draft: Draft = {
    id,
    municipalityId,
    service,
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    variables,
    missingVariables,
    searchAttempts,
    missingSuggestions,
    errors: errors.map((e) => ({ ...e, timestamp: now })),
    metadata: {
      totalVariables: Object.keys(variables).length + missingVariables.length,
      filledVariables: Object.keys(variables).length,
    },
  };

  await saveDraft(draft);
  return draft;
}

/**
 * Update draft status
 */
export async function updateDraftStatus(
  municipalityId: string,
  service: string,
  status: DraftStatus,
  metadata?: Partial<Draft['metadata']>
): Promise<Draft | null> {
  const draft = await getDraft(municipalityId, service);
  if (!draft) return null;

  draft.status = status;

  if (metadata) {
    draft.metadata = { ...draft.metadata, ...metadata };
  }

  await saveDraft(draft);
  return draft;
}

/**
 * Update draft variables
 */
export async function updateDraftVariables(
  municipalityId: string,
  service: string,
  updates: Record<string, string | DraftVariableUpdate>
): Promise<Draft | null> {
  const draft = await getDraft(municipalityId, service);
  if (!draft) return null;

  const now = new Date().toISOString();

  for (const [name, value] of Object.entries(updates)) {
    const normalized =
      typeof value === "string"
        ? { value }
        : value;

    if (draft.variables[name]) {
      draft.variables[name].value = normalized.value;
      draft.variables[name].extractedAt = now;
      if (normalized.sourceUrl !== undefined) {
        draft.variables[name].sourceUrl = normalized.sourceUrl;
      }
      if (normalized.confidence !== undefined) {
        draft.variables[name].confidence = normalized.confidence;
      }
      if (normalized.validated !== undefined) {
        draft.variables[name].validated = normalized.validated;
      }
    } else {
      draft.variables[name] = {
        value: normalized.value,
        sourceUrl: normalized.sourceUrl || '',
        confidence: normalized.confidence ?? 1.0,
        extractedAt: now,
        validated: normalized.validated ?? true,
      };

      // Remove from missing list
      draft.missingVariables = draft.missingVariables.filter((v) => v !== name);
    }

    if (draft.missingSuggestions?.[name]) {
      draft.missingSuggestions[name].status = "accepted";
    }
  }

  draft.metadata.filledVariables = Object.keys(draft.variables).length;
  await saveDraft(draft);

  return draft;
}

/**
 * Update missing suggestion status
 */
export async function updateMissingSuggestionStatus(
  municipalityId: string,
  service: string,
  variableName: string,
  status: "suggested" | "accepted" | "rejected"
): Promise<Draft | null> {
  const draft = await getDraft(municipalityId, service);
  if (!draft || !draft.missingSuggestions?.[variableName]) return draft;

  draft.missingSuggestions[variableName].status = status;
  await saveDraft(draft);
  return draft;
}

/**
 * Delete a draft
 */
export async function deleteDraft(municipalityId: string, service: string): Promise<boolean> {
  const filePath = getDraftPath(municipalityId, service);

  try {
    await unlink(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get drafts by status
 */
export async function getDraftsByStatus(status: DraftStatus): Promise<DraftSummary[]> {
  const allDrafts = await getAllDrafts();
  return allDrafts.filter((d) => d.status === status);
}

/**
 * Convert draft to summary
 */
function draftToSummary(draft: Draft): DraftSummary {
  const service = serviceDefinitions.find((s) => s.id === draft.service);

  return {
    id: draft.id,
    municipalityId: draft.municipalityId,
    service: draft.service,
    serviceName: service?.nameJa || draft.service,
    status: draft.status,
    createdAt: draft.createdAt,
    updatedAt: draft.updatedAt,
    filledCount: Object.keys(draft.variables).length,
    missingCount: draft.missingVariables.length,
    totalCount: Object.keys(draft.variables).length + draft.missingVariables.length,
  };
}

/**
 * Check if draft exists
 */
export async function draftExists(municipalityId: string, service: string): Promise<boolean> {
  const draft = await getDraft(municipalityId, service);
  return draft !== null;
}

/**
 * Get pending review count
 */
export async function getPendingReviewCount(): Promise<number> {
  const pendingDrafts = await getDraftsByStatus('pending_review');
  return pendingDrafts.length;
}

/**
 * Get draft statistics
 */
export async function getDraftStatistics(): Promise<{
  total: number;
  byStatus: Record<DraftStatus, number>;
  byMunicipality: Record<string, number>;
}> {
  const allDrafts = await getAllDrafts();

  const byStatus: Record<DraftStatus, number> = {
    draft: 0,
    pending_review: 0,
    approved: 0,
    rejected: 0,
  };

  const byMunicipality: Record<string, number> = {};

  for (const draft of allDrafts) {
    byStatus[draft.status]++;
    byMunicipality[draft.municipalityId] = (byMunicipality[draft.municipalityId] || 0) + 1;
  }

  return {
    total: allDrafts.length,
    byStatus,
    byMunicipality,
  };
}
