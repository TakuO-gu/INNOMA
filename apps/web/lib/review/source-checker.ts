/**
 * ソース変更検知
 *
 * 変数のソースURLを監視し、コンテンツの変更を検知
 */

import crypto from "crypto";
import {
  SourceCheckError,
  SourceCheckResult,
} from "./types";
import { getVariablePageMap } from "./variable-page-map";
import { markPageForReview, saveSourceCheckResult } from "./storage";
import { fetchPage } from "../llm/page-fetcher";
import {
  getVariableStore,
  updateVariableStore,
} from "../template/storage";
import { VariableValue } from "../template/types";
import { addNotification } from "../notification/storage";

/**
 * コンテンツのハッシュを計算
 * 空白・改行を正規化してから計算
 */
export function calculateContentHash(content: string): string {
  const normalized = content.replace(/\s+/g, " ").trim();
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

/**
 * ソースURLの内容を取得してハッシュを計算
 */
async function fetchSourceAndHash(
  url: string
): Promise<{ hash: string; error?: string }> {
  try {
    const page = await fetchPage(url);

    if (page.error) {
      return { hash: "", error: page.error };
    }

    const hash = calculateContentHash(page.content);
    return { hash };
  } catch (error) {
    return {
      hash: "",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * 単一の自治体のソース変更をチェック
 */
export async function checkSourceChanges(
  municipalityId: string,
  options: {
    /** 並列処理数 */
    concurrency?: number;
    /** リクエスト間の遅延（ms） */
    delayMs?: number;
    /** 通知を送信するか */
    sendNotifications?: boolean;
  } = {}
): Promise<SourceCheckResult> {
  const { concurrency = 3, delayMs = 500, sendNotifications = true } = options;

  const result: SourceCheckResult = {
    municipalityId,
    checkedAt: new Date().toISOString(),
    totalVariables: 0,
    changedVariables: [],
    errors: [],
  };

  // 変数ストアを取得
  const variableStore = await getVariableStore(municipalityId);
  const variablePageMap = await getVariablePageMap();

  // sourceUrlがある変数を抽出
  const variablesWithSource: Array<{
    name: string;
    value: VariableValue;
  }> = [];

  for (const [name, value] of Object.entries(variableStore)) {
    if (value.sourceUrl) {
      variablesWithSource.push({ name, value });
    }
  }

  result.totalVariables = variablesWithSource.length;

  if (variablesWithSource.length === 0) {
    return result;
  }

  // バッチ処理でソースをチェック
  for (let i = 0; i < variablesWithSource.length; i += concurrency) {
    const batch = variablesWithSource.slice(i, i + concurrency);

    const batchResults = await Promise.all(
      batch.map(async ({ name, value }) => {
        const { hash, error } = await fetchSourceAndHash(value.sourceUrl!);

        if (error) {
          return {
            name,
            sourceUrl: value.sourceUrl!,
            error,
          };
        }

        // ハッシュの比較
        const oldHash = value.sourceContentHash || "";
        const changed = oldHash !== "" && oldHash !== hash;

        return {
          name,
          sourceUrl: value.sourceUrl!,
          oldHash,
          newHash: hash,
          changed,
        };
      })
    );

    // 結果を処理
    for (const batchResult of batchResults) {
      if ("error" in batchResult && batchResult.error) {
        result.errors.push({
          variableName: batchResult.name,
          sourceUrl: batchResult.sourceUrl,
          error: batchResult.error,
        } as SourceCheckError);
      } else if ("changed" in batchResult) {
        // 変数ストアを更新（ハッシュと最終チェック日時）
        variableStore[batchResult.name] = {
          ...variableStore[batchResult.name],
          sourceContentHash: batchResult.newHash,
          lastSourceCheckAt: new Date().toISOString(),
          sourceChanged: batchResult.changed
            ? true
            : variableStore[batchResult.name].sourceChanged,
          sourceChangedAt: batchResult.changed
            ? new Date().toISOString()
            : variableStore[batchResult.name].sourceChangedAt,
        };

        if (batchResult.changed) {
          // 影響を受けるページを特定
          const affectedPages = variablePageMap[batchResult.name] || [];

          result.changedVariables.push({
            variableName: batchResult.name,
            sourceUrl: batchResult.sourceUrl,
            oldHash: batchResult.oldHash,
            newHash: batchResult.newHash,
            affectedPages,
          });

          // 影響を受けるページをレビュー待ちにする
          for (const pagePath of affectedPages) {
            await markPageForReview(municipalityId, pagePath, [batchResult.name]);
          }
        }
      }
    }

    // レート制限
    if (i + concurrency < variablesWithSource.length) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  // 変数ストアを保存
  await updateVariableStore(municipalityId, variableStore);

  // ソースチェック結果を保存
  await saveSourceCheckResult(result);

  // 変更があった場合は通知を送信
  if (sendNotifications && result.changedVariables.length > 0) {
    await addNotification(
      "source_changed",
      "ソース変更を検出",
      `${municipalityId}で${result.changedVariables.length}件の変数のソースに変更がありました。確認してください。`,
      {
        severity: "warning",
        municipalityId,
        data: {
          changedCount: result.changedVariables.length,
          variables: result.changedVariables.map((v) => v.variableName),
        },
      }
    );
  }

  return result;
}

/**
 * 変数のソース変更フラグをクリア
 */
export async function clearSourceChangedFlag(
  municipalityId: string,
  variableName: string
): Promise<void> {
  const variableStore = await getVariableStore(municipalityId);

  if (variableStore[variableName]) {
    const update = {
      [variableName]: {
        ...variableStore[variableName],
        sourceChanged: false,
        sourceChangedAt: undefined,
      },
    };

    await updateVariableStore(municipalityId, update);
  }
}

/**
 * 初回ハッシュを設定（既存の変数にハッシュがない場合に実行）
 */
export async function initializeSourceHashes(
  municipalityId: string,
  options: {
    concurrency?: number;
    delayMs?: number;
  } = {}
): Promise<{ success: number; errors: number }> {
  const { concurrency = 3, delayMs = 500 } = options;

  const variableStore = await getVariableStore(municipalityId);
  let success = 0;
  let errors = 0;

  // sourceUrlがあり、sourceContentHashがない変数を抽出
  const variablesNeedingHash: Array<{
    name: string;
    value: VariableValue;
  }> = [];

  for (const [name, value] of Object.entries(variableStore)) {
    if (value.sourceUrl && !value.sourceContentHash) {
      variablesNeedingHash.push({ name, value });
    }
  }

  // バッチ処理
  for (let i = 0; i < variablesNeedingHash.length; i += concurrency) {
    const batch = variablesNeedingHash.slice(i, i + concurrency);

    const batchResults = await Promise.all(
      batch.map(async ({ name, value }) => {
        const { hash, error } = await fetchSourceAndHash(value.sourceUrl!);
        return { name, hash, error };
      })
    );

    const updates: Record<string, VariableValue> = {};

    for (const { name, hash, error } of batchResults) {
      if (error) {
        errors++;
      } else {
        updates[name] = {
          ...variableStore[name],
          sourceContentHash: hash,
          lastSourceCheckAt: new Date().toISOString(),
        };
        success++;
      }
    }

    // 変数ストアを更新
    if (Object.keys(updates).length > 0) {
      await updateVariableStore(municipalityId, updates);
    }

    // レート制限
    if (i + concurrency < variablesNeedingHash.length) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return { success, errors };
}
