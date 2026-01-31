/**
 * 高岡市西条地区のごみ収集日を調べるテストスクリプト
 * Usage: npx tsx scripts/test-takaoka-nishijo.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { extractTextFromPdf, convertPdfToImages } from '../lib/pdf/pdf-to-images';
import { extractTextFromImages } from '../lib/pdf/vision-ocr';

async function extractGarbageSchedule() {
  // 高岡市のごみカレンダーPDF
  const url = 'https://www.city.takaoka.toyama.jp/material/files/group/25/2025getsumoku.pdf';

  console.log(`\n=== 高岡市西条地区 ごみ収集日調査 ===`);
  console.log(`URL: ${url}\n`);

  try {
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
    console.log(`PDF size: ${(buffer.byteLength / 1024).toFixed(2)} KB`);

    // テキスト抽出を試みる
    console.log('\n1. Trying text extraction...');
    const textResult = await extractTextFromPdf(buffer, { maxPages: 10 });

    let fullText = '';

    if (textResult.isTextBased && textResult.text.trim().length > 100) {
      console.log('   Text-based PDF detected');
      fullText = textResult.text;
    } else {
      // 画像ベースPDF - OCRを実行
      console.log('   Image-based PDF, running OCR...');
      const imageResult = await convertPdfToImages(buffer, {
        scale: 2.5, // より高解像度で
        maxPages: 10,
        format: 'png',
      });

      if (imageResult.error || imageResult.images.length === 0) {
        console.error(`   Image conversion error: ${imageResult.error}`);
        return;
      }

      console.log(`   Converted ${imageResult.images.length} pages to images`);

      const ocrResult = await extractTextFromImages(imageResult.images);

      if (!ocrResult.success) {
        console.error(`   OCR error: ${ocrResult.error}`);
        return;
      }

      fullText = ocrResult.text;
    }

    console.log(`\n=== 全文 (${fullText.length} chars) ===\n`);
    console.log(fullText);

    // 西条に関する情報を抽出
    console.log('\n\n=== 西条地区の情報を抽出 ===\n');

    const lines = fullText.split('\n');
    let inNishijoSection = false;
    const nishijoInfo: string[] = [];

    for (const line of lines) {
      if (line.includes('西条')) {
        inNishijoSection = true;
        nishijoInfo.push(line);
      } else if (inNishijoSection) {
        // 次の地区名が出てきたら終了
        if (line.match(/^\s*(川原|二上|熊町|野村|木津|国吉|太田|福岡|西五位|赤丸|守山|定塚|下関|博労|平米|福田|小勢|中田|東五位|横田|伏木|成美|塚|牧野|戸出|立野|石堤|山王|大滝|五位山|古府|佐野)\s*$/)) {
          break;
        }
        nishijoInfo.push(line);
      }
    }

    if (nishijoInfo.length > 0) {
      console.log('西条関連の行:');
      for (const info of nishijoInfo) {
        console.log(`  ${info}`);
      }
    } else {
      console.log('西条という文字列が見つかりませんでした。');
      console.log('燃やせないごみの表を確認します...');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

extractGarbageSchedule();
