/**
 * 高岡市西条地区のごみ収集日を全て調べるテストスクリプト
 * 月木曜日と火金曜日の両方のカレンダーを確認
 * Usage: npx tsx scripts/test-takaoka-nishijo-full.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { extractTextFromPdf, convertPdfToImages } from '../lib/pdf/pdf-to-images';
import { extractTextFromImages } from '../lib/pdf/vision-ocr';

async function extractTextFromPdfUrl(url: string): Promise<string> {
  console.log(`\nFetching: ${url}`);
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; INNOMA/1.0; +https://innoma.jp)',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
  }

  const buffer = await response.arrayBuffer();
  console.log(`  PDF size: ${(buffer.byteLength / 1024).toFixed(2)} KB`);

  // テキスト抽出を試みる
  const textResult = await extractTextFromPdf(buffer, { maxPages: 10 });

  if (textResult.isTextBased && textResult.text.trim().length > 100) {
    console.log('  Text-based PDF');
    return textResult.text;
  }

  // 画像ベースPDF - OCRを実行
  console.log('  Image-based PDF, running OCR...');
  const imageResult = await convertPdfToImages(buffer, {
    scale: 2.5,
    maxPages: 10,
    format: 'png',
  });

  if (imageResult.error || imageResult.images.length === 0) {
    throw new Error(`Image conversion error: ${imageResult.error}`);
  }

  console.log(`  Converted ${imageResult.images.length} pages to images`);

  const ocrResult = await extractTextFromImages(imageResult.images);

  if (!ocrResult.success) {
    throw new Error(`OCR error: ${ocrResult.error}`);
  }

  return ocrResult.text;
}

async function main() {
  console.log('=== 高岡市西条地区 ごみ収集日 完全調査 ===\n');

  const pdfs = [
    {
      name: '月・木曜日収集カレンダー',
      url: 'https://www.city.takaoka.toyama.jp/material/files/group/25/2025getsumoku.pdf',
    },
    {
      name: '火・金曜日収集カレンダー',
      url: 'https://www.city.takaoka.toyama.jp/material/files/group/25/2025kakin.pdf',
    },
  ];

  const allTexts: { name: string; text: string }[] = [];

  for (const pdf of pdfs) {
    try {
      console.log(`\n--- ${pdf.name} ---`);
      const text = await extractTextFromPdfUrl(pdf.url);
      allTexts.push({ name: pdf.name, text });
    } catch (error) {
      console.error(`Error processing ${pdf.name}:`, error);
    }
  }

  // 結果を表示
  console.log('\n\n========================================');
  console.log('=== 西条地区のごみ収集日まとめ ===');
  console.log('========================================\n');

  for (const { name, text } of allTexts) {
    console.log(`\n【${name}】`);
    console.log('-'.repeat(40));

    // 全文を表示（西条の情報を見つけやすくするため）
    console.log(text);
  }
}

main().catch(console.error);
