/**
 * PDF Processing Module
 *
 * pdfjs-distを使用してPDFからテキスト抽出、または画像に変換してOCR
 */

// Node.js環境でpdfjs-distを動作させるためのpolyfill
if (typeof globalThis.DOMMatrix === 'undefined') {
  // Simple DOMMatrix polyfill for Node.js (pdfjs-dist requirement)
  class DOMMatrixPolyfill {
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
    m11 = 1; m12 = 0; m13 = 0; m14 = 0;
    m21 = 0; m22 = 1; m23 = 0; m24 = 0;
    m31 = 0; m32 = 0; m33 = 1; m34 = 0;
    m41 = 0; m42 = 0; m43 = 0; m44 = 1;
    is2D = true;
    isIdentity = true;

    constructor(init?: string | number[]) {
      if (Array.isArray(init) && init.length >= 6) {
        [this.a, this.b, this.c, this.d, this.e, this.f] = init;
        this.m11 = this.a; this.m12 = this.b;
        this.m21 = this.c; this.m22 = this.d;
        this.m41 = this.e; this.m42 = this.f;
      }
    }

    multiply() { return new DOMMatrixPolyfill(); }
    translate() { return new DOMMatrixPolyfill(); }
    scale() { return new DOMMatrixPolyfill(); }
    rotate() { return new DOMMatrixPolyfill(); }
    inverse() { return new DOMMatrixPolyfill(); }
    transformPoint(point: { x: number; y: number }) { return point; }
    toFloat32Array() { return new Float32Array(16); }
    toFloat64Array() { return new Float64Array(16); }
  }
  // @ts-expect-error - Assigning polyfill to global
  globalThis.DOMMatrix = DOMMatrixPolyfill;
}

if (typeof globalThis.Path2D === 'undefined') {
  class Path2DPolyfill {
    moveTo() {}
    lineTo() {}
    bezierCurveTo() {}
    quadraticCurveTo() {}
    arc() {}
    arcTo() {}
    ellipse() {}
    rect() {}
    closePath() {}
    addPath() {}
  }
  // @ts-expect-error - Assigning polyfill to global
  globalThis.Path2D = Path2DPolyfill;
}

if (typeof globalThis.ImageData === 'undefined') {
  class ImageDataPolyfill {
    data: Uint8ClampedArray;
    width: number;
    height: number;
    colorSpace: string = 'srgb';

    constructor(sw: number | Uint8ClampedArray, sh?: number, settings?: { colorSpace?: string }) {
      if (typeof sw === 'number') {
        this.width = sw;
        this.height = sh || 0;
        this.data = new Uint8ClampedArray(sw * (sh || 0) * 4);
      } else {
        this.data = sw;
        this.width = sh || 0;
        this.height = Math.floor(sw.length / 4 / (sh || 1));
      }
      if (settings?.colorSpace) {
        this.colorSpace = settings.colorSpace;
      }
    }
  }
  // @ts-expect-error - Assigning polyfill to global
  globalThis.ImageData = ImageDataPolyfill;
}

/**
 * PDFバイナリから画像のBase64配列を生成
 * poppler (pdftoppm) を使用してPDFをPNG画像に変換
 * @param pdfBuffer PDFファイルのバイナリ
 * @param options オプション
 * @returns Base64エンコードされた画像の配列
 */
export async function convertPdfToImages(
  pdfBuffer: ArrayBuffer,
  options: {
    scale?: number;
    maxPages?: number;
    format?: 'png' | 'jpeg';
  } = {}
): Promise<{ images: string[]; pageCount: number; error?: string }> {
  const { scale = 2.0, maxPages = 10 } = options;
  // DPI計算: scale 2.0 = 144dpi (標準72dpi × 2)
  const dpi = Math.round(72 * scale);

  const { writeFile, readFile, readdir, unlink, mkdir, rmdir } = await import('fs/promises');
  const { execSync } = await import('child_process');
  const { join } = await import('path');
  const { tmpdir } = await import('os');
  const { randomUUID } = await import('crypto');

  // 一時ディレクトリを作成
  const tempDir = join(tmpdir(), `pdf-convert-${randomUUID()}`);
  const pdfPath = join(tempDir, 'input.pdf');
  const outputPrefix = join(tempDir, 'page');

  try {
    await mkdir(tempDir, { recursive: true });

    // PDFを一時ファイルに保存
    await writeFile(pdfPath, Buffer.from(pdfBuffer));

    // pdftoppm でPNG画像に変換
    // -png: PNG形式
    // -r: 解像度(DPI)
    // -l: 最後のページ番号
    const command = `pdftoppm -png -r ${dpi} -l ${maxPages} "${pdfPath}" "${outputPrefix}"`;
    execSync(command, { stdio: 'pipe' });

    // 生成された画像ファイルを読み込み
    const files = await readdir(tempDir);
    const imageFiles = files
      .filter(f => f.startsWith('page-') && f.endsWith('.png'))
      .sort(); // ページ順にソート

    const images: string[] = [];
    for (const file of imageFiles) {
      const imagePath = join(tempDir, file);
      const imageBuffer = await readFile(imagePath);
      const base64 = imageBuffer.toString('base64');
      images.push(base64);
    }

    // 一時ファイルをクリーンアップ
    for (const file of await readdir(tempDir)) {
      await unlink(join(tempDir, file));
    }
    await rmdir(tempDir);

    return {
      images,
      pageCount: images.length,
    };
  } catch (error) {
    // エラー時もクリーンアップを試みる
    try {
      const files = await readdir(tempDir).catch(() => []);
      for (const file of files) {
        await unlink(join(tempDir, file)).catch(() => {});
      }
      await rmdir(tempDir).catch(() => {});
    } catch {
      // クリーンアップ失敗は無視
    }

    console.error('PDF to image conversion error:', error);
    return {
      images: [],
      pageCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error during PDF conversion',
    };
  }
}

/**
 * PDFからテキストを直接抽出（OCRなし）
 * pdf-parseパッケージを使用（Node.js環境で安定動作）
 * @param pdfBuffer PDFファイルのバイナリ
 * @param options オプション
 * @returns 抽出されたテキスト
 */
export async function extractTextFromPdf(
  pdfBuffer: ArrayBuffer,
  options: {
    maxPages?: number;
  } = {}
): Promise<{ text: string; pageCount: number; isTextBased: boolean; error?: string }> {
  const { maxPages = 10 } = options;

  try {
    // pdf-parse v2はNode.js環境で安定して動作
    const { PDFParse } = await import('pdf-parse');

    // Bufferから直接読み込み
    const parser = new PDFParse({ data: Buffer.from(pdfBuffer) });
    const result = await parser.getText();

    const text = result.text || '';
    // maxPagesの適用: ページ数を制限
    const pages = result.pages || [];
    const actualPageCount = Math.min(pages.length, maxPages);

    // ページごとのテキストを取得（textプロパティを使用）
    let truncatedText = text;
    if (actualPageCount < pages.length && pages.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      truncatedText = pages.slice(0, actualPageCount).map((p: any) => p.text || '').join('\n');
    }

    const totalChars = truncatedText.replace(/\s/g, '').length;

    // テキストが十分に含まれているかチェック
    // 1ページあたり平均100文字以上あればテキストベースと判断
    const isTextBased = actualPageCount > 0 && totalChars > actualPageCount * 100;

    return {
      text: truncatedText,
      pageCount: actualPageCount,
      isTextBased,
    };
  } catch (error) {
    console.error('PDF text extraction error:', error);
    return {
      text: '',
      pageCount: 0,
      isTextBased: false,
      error: error instanceof Error ? error.message : 'Unknown error during PDF text extraction',
    };
  }
}

/**
 * URLからPDFを取得して画像に変換
 * @param url PDFのURL
 * @param options オプション
 * @returns Base64エンコードされた画像の配列
 */
export async function fetchPdfAsImages(
  url: string,
  options: {
    scale?: number;
    maxPages?: number;
    format?: 'png' | 'jpeg';
  } = {}
): Promise<{ images: string[]; pageCount: number; error?: string }> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; INNOMA/1.0; +https://innoma.jp)',
      },
    });

    if (!response.ok) {
      return {
        images: [],
        pageCount: 0,
        error: `Failed to fetch PDF: ${response.status} ${response.statusText}`,
      };
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('pdf')) {
      return {
        images: [],
        pageCount: 0,
        error: `URL does not point to a PDF file (Content-Type: ${contentType})`,
      };
    }

    const buffer = await response.arrayBuffer();
    return convertPdfToImages(buffer, options);
  } catch (error) {
    return {
      images: [],
      pageCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error fetching PDF',
    };
  }
}
