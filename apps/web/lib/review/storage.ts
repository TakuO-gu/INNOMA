/**
 * ページレビューストレージ
 *
 * ページのレビュー状態を管理
 */

import { promises as fs } from "fs";
import path from "path";
import {
  PageReview,
  PageReviewStore,
  SourceCheckResult,
  ReviewPendingPage,
} from "./types";
import { getMunicipalityMeta } from "../template/storage";

const ARTIFACTS_PATH =
  process.env.STORAGE_BASE_PATH || "./data/artifacts";

/**
 * ページレビューストアのパスを取得
 */
function getPageReviewsPath(municipalityId: string): string {
  return path.join(ARTIFACTS_PATH, municipalityId, "page-reviews.json");
}

/**
 * ソースチェック結果のパスを取得
 */
function getSourceCheckPath(municipalityId: string): string {
  return path.join(ARTIFACTS_PATH, "_source-checks", municipalityId, "latest.json");
}

/**
 * ページレビューストアを読み込む
 */
export async function getPageReviews(
  municipalityId: string
): Promise<PageReviewStore> {
  const filePath = getPageReviewsPath(municipalityId);

  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content) as PageReviewStore;
  } catch {
    // ファイルがない場合は空のストアを返す
    return {};
  }
}

/**
 * ページレビューストアを保存
 */
export async function savePageReviews(
  municipalityId: string,
  reviews: PageReviewStore
): Promise<void> {
  const filePath = getPageReviewsPath(municipalityId);

  // ディレクトリが存在しない場合は作成
  await fs.mkdir(path.dirname(filePath), { recursive: true });

  await fs.writeFile(filePath, JSON.stringify(reviews, null, 2), "utf-8");
}

/**
 * 特定ページのレビュー状態を取得
 */
export async function getPageReviewStatus(
  municipalityId: string,
  pagePath: string
): Promise<PageReview | null> {
  const reviews = await getPageReviews(municipalityId);
  return reviews[pagePath] || null;
}

/**
 * ページをレビュー待ち状態にする
 */
export async function markPageForReview(
  municipalityId: string,
  pagePath: string,
  changedVariables: string[]
): Promise<void> {
  const reviews = await getPageReviews(municipalityId);

  const existingReview = reviews[pagePath];

  if (existingReview && existingReview.status !== "published") {
    // 既にレビュー待ちの場合は変数を追加
    const existingVars = new Set(existingReview.changedVariables);
    for (const v of changedVariables) {
      existingVars.add(v);
    }
    existingReview.changedVariables = Array.from(existingVars);
  } else {
    // 新規にレビュー待ちを作成
    reviews[pagePath] = {
      status: "review_required",
      changedVariables,
      detectedAt: new Date().toISOString(),
    };
  }

  await savePageReviews(municipalityId, reviews);
}

/**
 * ページのレビューを承認（公開状態に戻す）
 */
export async function approvePageReview(
  municipalityId: string,
  pagePath: string,
  reviewedBy?: string
): Promise<void> {
  const reviews = await getPageReviews(municipalityId);

  if (reviews[pagePath]) {
    reviews[pagePath] = {
      ...reviews[pagePath],
      status: "published",
      reviewedAt: new Date().toISOString(),
      reviewedBy,
      changedVariables: [],
    };
  }

  await savePageReviews(municipalityId, reviews);
}

/**
 * ページのレビューを却下（誤検知として公開状態に戻す）
 */
export async function dismissPageReview(
  municipalityId: string,
  pagePath: string,
  reviewedBy?: string
): Promise<void> {
  // 実装は承認と同じ（公開状態に戻す）
  await approvePageReview(municipalityId, pagePath, reviewedBy);
}

/**
 * レビュー待ちページの一覧を取得
 */
export async function getReviewPendingPages(): Promise<ReviewPendingPage[]> {
  const pendingPages: ReviewPendingPage[] = [];

  // 全自治体のディレクトリを取得
  try {
    const entries = await fs.readdir(ARTIFACTS_PATH, { withFileTypes: true });

    for (const entry of entries) {
      // _で始まるディレクトリはスキップ
      if (!entry.isDirectory() || entry.name.startsWith("_")) {
        continue;
      }

      const municipalityId = entry.name;

      try {
        const meta = await getMunicipalityMeta(municipalityId);
        if (!meta) continue;

        const reviews = await getPageReviews(municipalityId);

        for (const [pagePath, review] of Object.entries(reviews)) {
          if (review.status === "review_required" || review.status === "under_review") {
            pendingPages.push({
              municipalityId,
              municipalityName: meta.name,
              pagePath,
              pageTitle: pagePath.split("/").pop() || pagePath,
              status: review.status,
              changedVariables: review.changedVariables.map((name) => ({
                name,
                sourceUrl: "", // 詳細取得時に設定
                detectedAt: review.detectedAt,
              })),
              detectedAt: review.detectedAt,
            });
          }
        }
      } catch {
        // 自治体のメタデータがない場合はスキップ
        continue;
      }
    }
  } catch {
    // ディレクトリがない場合は空配列を返す
  }

  // 検出日時でソート（新しい順）
  pendingPages.sort(
    (a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime()
  );

  return pendingPages;
}

/**
 * ソースチェック結果を保存
 */
export async function saveSourceCheckResult(
  result: SourceCheckResult
): Promise<void> {
  const filePath = getSourceCheckPath(result.municipalityId);

  // ディレクトリが存在しない場合は作成
  await fs.mkdir(path.dirname(filePath), { recursive: true });

  await fs.writeFile(filePath, JSON.stringify(result, null, 2), "utf-8");
}

/**
 * 最新のソースチェック結果を取得
 */
export async function getLatestSourceCheckResult(
  municipalityId: string
): Promise<SourceCheckResult | null> {
  const filePath = getSourceCheckPath(municipalityId);

  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content) as SourceCheckResult;
  } catch {
    return null;
  }
}

/**
 * ページがレビュー待ちかどうかをチェック
 */
export async function isPagePendingReview(
  municipalityId: string,
  pagePath: string
): Promise<boolean> {
  const review = await getPageReviewStatus(municipalityId, pagePath);
  return review !== null && review.status !== "published";
}
