/**
 * PDF処理モジュール
 *
 * Vision APIを使用したPDFテキスト抽出機能を提供
 */

export {
  extractTextFromPdfUrl,
  extractTextFromBase64Image,
  extractTextFromImages,
  extractTextFromGcsPdf,
  type PdfOcrResult,
  type PdfPageText,
} from "./vision-ocr";

export {
  getCachedOcr,
  setCachedOcr,
  deleteCachedOcr,
  hasCachedOcr,
  type PdfCacheEntry,
} from "./cache";
