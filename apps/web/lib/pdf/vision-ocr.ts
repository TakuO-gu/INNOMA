/**
 * Google Vision API を使用したPDF OCR機能
 *
 * PDFファイルからテキストを抽出するためのモジュール
 * Google Cloud Vision API の Document Text Detection を使用
 */

const VISION_API_URL = "https://vision.googleapis.com/v1/images:annotate";

/**
 * Vision API のレスポンス型
 */
interface VisionAnnotateResponse {
  responses?: Array<{
    fullTextAnnotation?: {
      text: string;
      pages?: Array<{
        width: number;
        height: number;
      }>;
    };
    textAnnotations?: Array<{
      description: string;
      locale?: string;
    }>;
    error?: {
      code: number;
      message: string;
    };
  }>;
  error?: {
    code: number;
    message: string;
    status: string;
  };
}

/**
 * PDFページのOCR結果
 */
export interface PdfPageText {
  pageNumber: number;
  text: string;
}

/**
 * PDF OCRの結果
 */
export interface PdfOcrResult {
  success: boolean;
  text: string;
  pages?: PdfPageText[];
  error?: string;
}

/**
 * Base64エンコードされた画像からテキストを抽出
 */
async function extractTextFromImage(
  imageBase64: string,
  apiKey: string
): Promise<string> {
  const body = {
    requests: [
      {
        image: {
          content: imageBase64,
        },
        features: [
          {
            type: "DOCUMENT_TEXT_DETECTION",
            maxResults: 1,
          },
        ],
        imageContext: {
          languageHints: ["ja", "en"],
        },
      },
    ],
  };

  const response = await fetch(`${VISION_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data: VisionAnnotateResponse = await response.json();

  if (data.error) {
    throw new Error(`Vision API Error: ${data.error.message}`);
  }

  if (!data.responses || data.responses.length === 0) {
    return "";
  }

  const result = data.responses[0];

  if (result.error) {
    throw new Error(`Vision API Error: ${result.error.message}`);
  }

  // fullTextAnnotation が最も完全なテキストを含む
  if (result.fullTextAnnotation?.text) {
    return result.fullTextAnnotation.text;
  }

  // フォールバック: textAnnotations の最初の要素
  if (result.textAnnotations && result.textAnnotations.length > 0) {
    return result.textAnnotations[0].description;
  }

  return "";
}

/**
 * URLからPDFを取得してテキストを抽出
 *
 * Google Vision APIはPDFを直接処理できないため、
 * PDFの各ページを画像に変換してからOCRを実行する必要がある。
 *
 * 注意: この関数はPDFを画像に変換する機能を含まないため、
 * 画像形式のURLまたはBase64エンコードされた画像に対してのみ動作する。
 * PDFの場合は別途PDF→画像変換が必要。
 */
export async function extractTextFromPdfUrl(url: string): Promise<PdfOcrResult> {
  const apiKey = process.env.GOOGLE_VISION_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      text: "",
      error: "GOOGLE_VISION_API_KEY is not set",
    };
  }

  try {
    // URLから画像を取得
    const response = await fetch(url);

    if (!response.ok) {
      return {
        success: false,
        text: "",
        error: `Failed to fetch URL: ${response.status} ${response.statusText}`,
      };
    }

    const contentType = response.headers.get("content-type") || "";

    // PDFの場合は注意メッセージ
    if (contentType.includes("pdf")) {
      // Vision APIでPDFを直接処理（Cloud Storage経由でなければできない）
      // ここでは一旦エラーを返す
      return {
        success: false,
        text: "",
        error:
          "Direct PDF processing requires Cloud Storage. Use extractTextFromPdfBase64 for base64 encoded images.",
      };
    }

    // 画像をBase64エンコード
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    const text = await extractTextFromImage(base64, apiKey);

    return {
      success: true,
      text,
    };
  } catch (error) {
    return {
      success: false,
      text: "",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Base64エンコードされた画像からテキストを抽出
 */
export async function extractTextFromBase64Image(
  base64: string
): Promise<PdfOcrResult> {
  const apiKey = process.env.GOOGLE_VISION_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      text: "",
      error: "GOOGLE_VISION_API_KEY is not set",
    };
  }

  try {
    // data:image/...;base64, プレフィックスを除去
    const cleanBase64 = base64.replace(/^data:[^;]+;base64,/, "");

    const text = await extractTextFromImage(cleanBase64, apiKey);

    return {
      success: true,
      text,
    };
  } catch (error) {
    return {
      success: false,
      text: "",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * 複数の画像（PDFの各ページ）からテキストを抽出
 */
export async function extractTextFromImages(
  images: string[]
): Promise<PdfOcrResult> {
  const apiKey = process.env.GOOGLE_VISION_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      text: "",
      error: "GOOGLE_VISION_API_KEY is not set",
    };
  }

  try {
    const pages: PdfPageText[] = [];
    const textParts: string[] = [];

    for (let i = 0; i < images.length; i++) {
      const cleanBase64 = images[i].replace(/^data:[^;]+;base64,/, "");
      const text = await extractTextFromImage(cleanBase64, apiKey);

      pages.push({
        pageNumber: i + 1,
        text,
      });
      textParts.push(text);
    }

    return {
      success: true,
      text: textParts.join("\n\n--- Page Break ---\n\n"),
      pages,
    };
  } catch (error) {
    return {
      success: false,
      text: "",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Google Cloud Storage のPDFをVision APIで処理（非同期OCR）
 *
 * 大きなPDFファイルの場合、Cloud Storageにアップロードして
 * 非同期OCRを使用することを推奨
 *
 * @param gcsUri - Cloud Storage URI (gs://bucket/path/to/file.pdf)
 * @param outputGcsUri - 出力先のCloud Storage URI (gs://bucket/output/)
 */
export async function extractTextFromGcsPdf(
  _gcsUri: string,
  _outputGcsUri: string
): Promise<PdfOcrResult> {
  const apiKey = process.env.GOOGLE_VISION_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      text: "",
      error: "GOOGLE_VISION_API_KEY is not set",
    };
  }

  // 注意: 非同期OCRは別途実装が必要
  // ここでは基本的な構造のみ提供
  return {
    success: false,
    text: "",
    error: "Async PDF OCR not implemented. Use extractTextFromImages for page images.",
  };
}
