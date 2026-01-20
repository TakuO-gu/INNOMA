/**
 * 編集履歴 ストレージ操作
 */

import { readFile, writeFile, mkdir, readdir, stat } from "fs/promises";
import { join } from "path";
import type {
  HistoryEntry,
  HistorySummary,
  ChangeType,
  ChangeSource,
  VariableChange,
} from "./types";

const ARTIFACTS_DIR = join(process.cwd(), "data/artifacts");

/**
 * ディレクトリが存在するか確認
 */
async function exists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * 履歴ディレクトリのパスを取得
 */
function getHistoryDir(municipalityId: string): string {
  return join(ARTIFACTS_DIR, municipalityId, "history");
}

/**
 * 履歴ファイルのパスを取得（年月別）
 */
function getHistoryFilePath(municipalityId: string, date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return join(getHistoryDir(municipalityId), `${year}-${month}.json`);
}

/**
 * 一意のIDを生成
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 履歴を読み込む（月別ファイル）
 */
async function loadHistoryFile(filePath: string): Promise<HistoryEntry[]> {
  if (!(await exists(filePath))) {
    return [];
  }

  try {
    const content = await readFile(filePath, "utf-8");
    return JSON.parse(content) as HistoryEntry[];
  } catch {
    return [];
  }
}

/**
 * 履歴を保存する（月別ファイル）
 */
async function saveHistoryFile(
  filePath: string,
  entries: HistoryEntry[]
): Promise<void> {
  const dir = join(filePath, "..");
  if (!(await exists(dir))) {
    await mkdir(dir, { recursive: true });
  }
  await writeFile(filePath, JSON.stringify(entries, null, 2));
}

/**
 * 編集履歴を追加
 */
export async function addHistoryEntry(
  municipalityId: string,
  type: ChangeType,
  source: ChangeSource,
  changes: VariableChange[],
  changedBy: string,
  options?: {
    serviceId?: string;
    comment?: string;
  }
): Promise<HistoryEntry> {
  const now = new Date();
  const entry: HistoryEntry = {
    id: generateId(),
    municipalityId,
    type,
    source,
    changes,
    changedBy,
    changedAt: now.toISOString(),
    serviceId: options?.serviceId,
    comment: options?.comment,
  };

  const filePath = getHistoryFilePath(municipalityId, now);
  const entries = await loadHistoryFile(filePath);
  entries.push(entry);
  await saveHistoryFile(filePath, entries);

  return entry;
}

/**
 * 変数更新の履歴を追加
 */
export async function recordVariableUpdate(
  municipalityId: string,
  variableName: string,
  oldValue: string | undefined,
  newValue: string,
  source: ChangeSource,
  changedBy: string
): Promise<HistoryEntry> {
  const changes: VariableChange[] = [
    {
      variableName,
      oldValue,
      newValue,
    },
  ];

  return addHistoryEntry(
    municipalityId,
    oldValue === undefined ? "create" : "update",
    source,
    changes,
    changedBy
  );
}

/**
 * 複数の変数更新の履歴を追加
 */
export async function recordBulkVariableUpdate(
  municipalityId: string,
  changes: VariableChange[],
  source: ChangeSource,
  changedBy: string,
  options?: {
    serviceId?: string;
    comment?: string;
  }
): Promise<HistoryEntry> {
  return addHistoryEntry(
    municipalityId,
    "update",
    source,
    changes,
    changedBy,
    options
  );
}

/**
 * 下書き承認の履歴を追加
 */
export async function recordDraftApproval(
  municipalityId: string,
  serviceId: string,
  changes: VariableChange[],
  changedBy: string
): Promise<HistoryEntry> {
  return addHistoryEntry(municipalityId, "approve", "llm", changes, changedBy, {
    serviceId,
    comment: `サービス「${serviceId}」の下書きを承認`,
  });
}

/**
 * 下書き却下の履歴を追加
 */
export async function recordDraftRejection(
  municipalityId: string,
  serviceId: string,
  changedBy: string,
  reason?: string
): Promise<HistoryEntry> {
  return addHistoryEntry(municipalityId, "reject", "llm", [], changedBy, {
    serviceId,
    comment: reason || `サービス「${serviceId}」の下書きを却下`,
  });
}

/**
 * 自治体の履歴一覧を取得
 */
export async function getHistoryList(
  municipalityId: string,
  options?: {
    limit?: number;
    offset?: number;
  }
): Promise<HistorySummary[]> {
  const historyDir = getHistoryDir(municipalityId);
  if (!(await exists(historyDir))) {
    return [];
  }

  const files = await readdir(historyDir);
  const jsonFiles = files
    .filter((f) => f.endsWith(".json"))
    .sort()
    .reverse(); // 新しい順

  const allEntries: HistoryEntry[] = [];

  for (const file of jsonFiles) {
    const entries = await loadHistoryFile(join(historyDir, file));
    allEntries.push(...entries);

    // limit + offsetを超えたら読み込み終了
    if (options?.limit && allEntries.length >= (options.limit + (options.offset || 0))) {
      break;
    }
  }

  // 日時で降順ソート
  allEntries.sort(
    (a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()
  );

  // ページネーション
  const offset = options?.offset || 0;
  const limit = options?.limit || 50;
  const pagedEntries = allEntries.slice(offset, offset + limit);

  // サマリーに変換
  return pagedEntries.map((entry) => ({
    id: entry.id,
    type: entry.type,
    source: entry.source,
    changeCount: entry.changes.length,
    changedBy: entry.changedBy,
    changedAt: entry.changedAt,
    comment: entry.comment,
  }));
}

/**
 * 特定の履歴エントリを取得
 */
export async function getHistoryEntry(
  municipalityId: string,
  entryId: string
): Promise<HistoryEntry | null> {
  const historyDir = getHistoryDir(municipalityId);
  if (!(await exists(historyDir))) {
    return null;
  }

  const files = await readdir(historyDir);

  for (const file of files) {
    if (!file.endsWith(".json")) continue;

    const entries = await loadHistoryFile(join(historyDir, file));
    const found = entries.find((e) => e.id === entryId);
    if (found) {
      return found;
    }
  }

  return null;
}

/**
 * 履歴の統計を取得
 */
export async function getHistoryStats(
  municipalityId: string
): Promise<{
  totalChanges: number;
  manualChanges: number;
  llmChanges: number;
  lastChangedAt?: string;
}> {
  const historyDir = getHistoryDir(municipalityId);
  if (!(await exists(historyDir))) {
    return {
      totalChanges: 0,
      manualChanges: 0,
      llmChanges: 0,
    };
  }

  const files = await readdir(historyDir);
  let totalChanges = 0;
  let manualChanges = 0;
  let llmChanges = 0;
  let lastChangedAt: string | undefined;

  for (const file of files) {
    if (!file.endsWith(".json")) continue;

    const entries = await loadHistoryFile(join(historyDir, file));
    for (const entry of entries) {
      totalChanges += entry.changes.length;
      if (entry.source === "manual") {
        manualChanges += entry.changes.length;
      } else if (entry.source === "llm") {
        llmChanges += entry.changes.length;
      }
      if (!lastChangedAt || entry.changedAt > lastChangedAt) {
        lastChangedAt = entry.changedAt;
      }
    }
  }

  return {
    totalChanges,
    manualChanges,
    llmChanges,
    lastChangedAt,
  };
}
