/**
 * PDF OCRキャッシュ管理
 *
 * OCR結果をファイルシステムにキャッシュして再利用
 */

import { readFile, writeFile, mkdir } from "fs/promises";
import { join, dirname } from "path";
import { createHash } from "crypto";

const CACHE_DIR = join(process.cwd(), "data/pdf-cache");

/**
 * キャッシュエントリの型
 */
export interface PdfCacheEntry {
  url: string;
  urlHash: string;
  text: string;
  cachedAt: string;
  pageCount?: number;
}

/**
 * URLからハッシュを生成
 */
function hashUrl(url: string): string {
  return createHash("sha256").update(url).digest("hex").slice(0, 16);
}

/**
 * キャッシュファイルのパスを取得
 */
function getCachePath(url: string): string {
  const hash = hashUrl(url);
  // ハッシュの最初の2文字でサブディレクトリを作成（ファイル数を分散）
  const subDir = hash.slice(0, 2);
  return join(CACHE_DIR, subDir, `${hash}.json`);
}

/**
 * キャッシュからOCR結果を取得
 */
export async function getCachedOcr(url: string): Promise<PdfCacheEntry | null> {
  try {
    const cachePath = getCachePath(url);
    const content = await readFile(cachePath, "utf-8");
    const entry: PdfCacheEntry = JSON.parse(content);

    // URLが一致するか確認（ハッシュ衝突対策）
    if (entry.url !== url) {
      return null;
    }

    return entry;
  } catch {
    return null;
  }
}

/**
 * OCR結果をキャッシュに保存
 */
export async function setCachedOcr(
  url: string,
  text: string,
  pageCount?: number
): Promise<void> {
  const cachePath = getCachePath(url);
  const entry: PdfCacheEntry = {
    url,
    urlHash: hashUrl(url),
    text,
    cachedAt: new Date().toISOString(),
    pageCount,
  };

  // ディレクトリを作成
  await mkdir(dirname(cachePath), { recursive: true });

  // キャッシュを書き込み
  await writeFile(cachePath, JSON.stringify(entry, null, 2), "utf-8");
}

/**
 * キャッシュを削除
 */
export async function deleteCachedOcr(url: string): Promise<boolean> {
  try {
    const { unlink } = await import("fs/promises");
    const cachePath = getCachePath(url);
    await unlink(cachePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * キャッシュの存在確認
 */
export async function hasCachedOcr(url: string): Promise<boolean> {
  const entry = await getCachedOcr(url);
  return entry !== null;
}
