/**
 * PDFテキスト抽出テストスクリプト
 * Usage: npx tsx scripts/test-pdf-extract.ts
 */

import { extractTextFromPdf } from '../lib/pdf/pdf-to-images';

async function testPdfExtraction() {
  const url = 'https://www.city.takaoka.toyama.jp/material/files/group/25/2025getsumoku.pdf';

  console.log(`\n=== PDF Extraction Test ===`);
  console.log(`URL: ${url}\n`);

  try {
    // PDFをフェッチ
    console.log('Fetching PDF...');
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; INNOMA/1.0; +https://innoma.jp)',
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch: ${response.status} ${response.statusText}`);
      return;
    }

    const contentType = response.headers.get('content-type');
    console.log(`Content-Type: ${contentType}`);

    const buffer = await response.arrayBuffer();
    console.log(`PDF size: ${(buffer.byteLength / 1024).toFixed(2)} KB\n`);

    // テキスト抽出
    console.log('Extracting text...');
    const result = await extractTextFromPdf(buffer, { maxPages: 10 });

    console.log(`\n=== Result ===`);
    console.log(`Page count: ${result.pageCount}`);
    console.log(`Is text-based: ${result.isTextBased}`);
    console.log(`Error: ${result.error || 'None'}`);
    console.log(`\n=== Extracted Text (first 5000 chars) ===\n`);
    console.log(result.text.substring(0, 5000));

    if (result.text.length > 5000) {
      console.log(`\n... [truncated, total ${result.text.length} chars]`);
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testPdfExtraction();
