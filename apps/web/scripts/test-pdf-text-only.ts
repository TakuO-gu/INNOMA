/**
 * PDFテキスト抽出テストスクリプト（テキストベースPDFのみ）
 * Usage: npx tsx scripts/test-pdf-text-only.ts
 */

import { extractTextFromPdf } from '../lib/pdf/pdf-to-images';

async function testPdfTextExtraction() {
  // テスト用URL - テキストベースのPDF（予想）
  const urls = [
    'https://www.city.takaoka.toyama.jp/material/files/group/25/2025getsumoku.pdf',
    // 他のテスト用PDFがあれば追加
  ];

  for (const url of urls) {
    console.log(`\n=== Testing: ${url} ===\n`);

    try {
      console.log('Fetching PDF...');
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; INNOMA/1.0; +https://innoma.jp)',
        },
      });

      if (!response.ok) {
        console.error(`Failed to fetch: ${response.status} ${response.statusText}`);
        continue;
      }

      const buffer = await response.arrayBuffer();
      console.log(`PDF size: ${(buffer.byteLength / 1024).toFixed(2)} KB`);

      console.log('Extracting text...');
      const result = await extractTextFromPdf(buffer, { maxPages: 10 });

      console.log(`\nResult:`);
      console.log(`  Page count: ${result.pageCount}`);
      console.log(`  Is text-based: ${result.isTextBased}`);
      console.log(`  Text length: ${result.text.length} chars`);
      console.log(`  Error: ${result.error || 'None'}`);

      if (result.text.length > 0) {
        console.log(`\n=== First 3000 chars ===\n`);
        console.log(result.text.substring(0, 3000));
      }
    } catch (error) {
      console.error('Test failed:', error);
    }
  }
}

testPdfTextExtraction();
