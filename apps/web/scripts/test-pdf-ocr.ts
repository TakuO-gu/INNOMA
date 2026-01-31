/**
 * PDF OCRテストスクリプト
 * テキスト抽出ができない画像ベースPDFの場合にOCRを実行
 * Usage: npx tsx scripts/test-pdf-ocr.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { extractTextFromPdf, convertPdfToImages } from '../lib/pdf/pdf-to-images';
import { extractTextFromImages } from '../lib/pdf/vision-ocr';

async function testPdfOcr() {
  const url = 'https://www.city.takaoka.toyama.jp/material/files/group/25/2025getsumoku.pdf';

  console.log(`\n=== PDF OCR Test ===`);
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

    const buffer = await response.arrayBuffer();
    console.log(`PDF size: ${(buffer.byteLength / 1024).toFixed(2)} KB\n`);

    // まずテキスト抽出を試みる
    console.log('1. Trying text extraction...');
    const textResult = await extractTextFromPdf(buffer, { maxPages: 5 });

    console.log(`   Page count: ${textResult.pageCount}`);
    console.log(`   Is text-based: ${textResult.isTextBased}`);
    console.log(`   Text length: ${textResult.text.length} chars`);

    if (textResult.isTextBased && textResult.text.trim().length > 100) {
      console.log('\n=== Text-based PDF - No OCR needed ===');
      console.log(textResult.text.substring(0, 2000));
      return;
    }

    // テキストが少ない場合はOCRを実行
    console.log('\n2. Text insufficient, converting to images for OCR...');

    const imageResult = await convertPdfToImages(buffer, {
      scale: 2.0,
      maxPages: 3,
      format: 'png',
    });

    if (imageResult.error) {
      console.error(`   Image conversion error: ${imageResult.error}`);
      return;
    }

    console.log(`   Converted ${imageResult.images.length} pages to images`);

    // OCRを実行
    console.log('\n3. Running OCR on images...');
    const ocrResult = await extractTextFromImages(imageResult.images);

    if (!ocrResult.success) {
      console.error(`   OCR error: ${ocrResult.error}`);
      return;
    }

    console.log(`\n=== OCR Result ===`);
    console.log(`Success: ${ocrResult.success}`);
    console.log(`Pages: ${ocrResult.pages?.length || 0}`);
    console.log(`Text length: ${ocrResult.text.length} chars`);
    console.log(`\n=== Extracted Text (first 5000 chars) ===\n`);
    console.log(ocrResult.text.substring(0, 5000));

    if (ocrResult.text.length > 5000) {
      console.log(`\n... [truncated, total ${ocrResult.text.length} chars]`);
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testPdfOcr();
