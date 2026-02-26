/**
 * PDF から避難所数を抽出するスクリプト
 * Node.js ESM で直接実行
 */

import { createWriteStream, mkdirSync } from 'fs';
import { writeFile, readFile, readdir, unlink, mkdir, rmdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';
import { execSync } from 'child_process';

async function fetchPdf(url) {
  console.log(`Fetching PDF: ${url}`);
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; INNOMA/1.0)',
    },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  const buffer = await response.arrayBuffer();
  return buffer;
}

async function extractTextFromPdf(pdfBuffer) {
  // pdf-parse v2 を使用
  try {
    const { default: pdfParse } = await import('pdf-parse/lib/pdf-parse.js');
    const result = await pdfParse(Buffer.from(pdfBuffer));
    return { text: result.text, numpages: result.numpages };
  } catch (e) {
    console.error('pdf-parse failed:', e.message);
    return null;
  }
}

async function convertPdfToImagesAndOcr(pdfBuffer, pdfName) {
  const tempDir = join(tmpdir(), `pdf-extract-${randomUUID()}`);
  const pdfPath = join(tempDir, 'input.pdf');
  const outputPrefix = join(tempDir, 'page');

  try {
    await mkdir(tempDir, { recursive: true });
    await writeFile(pdfPath, Buffer.from(pdfBuffer));

    // pdftoppm でPNG変換
    const command = `pdftoppm -png -r 150 -l 10 "${pdfPath}" "${outputPrefix}"`;
    execSync(command, { stdio: 'pipe' });

    const files = await readdir(tempDir);
    const imageFiles = files
      .filter(f => f.startsWith('page-') && f.endsWith('.png'))
      .sort();

    console.log(`  Generated ${imageFiles.length} page images`);

    // 各画像を保存（確認用）
    const images = [];
    for (const file of imageFiles) {
      const imagePath = join(tempDir, file);
      const imageBuffer = await readFile(imagePath);
      images.push({ name: file, buffer: imageBuffer });
    }

    return { images, tempDir };
  } catch (error) {
    console.error('PDF to image conversion error:', error.message);
    return { images: [], tempDir };
  }
}

async function cleanupDir(tempDir) {
  try {
    const files = await readdir(tempDir).catch(() => []);
    for (const file of files) {
      await unlink(join(tempDir, file)).catch(() => {});
    }
    await rmdir(tempDir).catch(() => {});
  } catch {}
}

// メイン処理
async function main() {
  const pdfs = [
    {
      name: 'choshi-kinkyu',
      label: '銚子市 指定緊急避難場所一覧',
      url: 'https://www.city.choshi.chiba.jp/content/000017609.pdf',
    },
    {
      name: 'choshi-shitei',
      label: '銚子市 指定避難所一覧',
      url: 'https://www.city.choshi.chiba.jp/content/000058642.pdf',
    },
  ];

  for (const pdf of pdfs) {
    console.log(`\n=== ${pdf.label} ===`);
    try {
      const buffer = await fetchPdf(pdf.url);
      console.log(`  PDF size: ${buffer.byteLength} bytes`);

      // まずテキスト抽出を試みる
      const textResult = await extractTextFromPdf(buffer);
      if (textResult && textResult.text && textResult.text.trim().length > 100) {
        console.log(`  テキスト抽出成功 (${textResult.numpages}ページ)`);
        console.log('--- テキスト (最初の3000文字) ---');
        console.log(textResult.text.substring(0, 3000));
        console.log('--- ここまで ---');
      } else {
        console.log('  テキスト抽出失敗または空 → 画像変換を試みます');
        const { images, tempDir } = await convertPdfToImagesAndOcr(buffer, pdf.name);
        // 画像をファイルに保存して確認
        const outputDir = `/tmp/pdf-check-${pdf.name}`;
        mkdirSync(outputDir, { recursive: true });
        for (const img of images) {
          const outPath = join(outputDir, img.name);
          await writeFile(outPath, img.buffer);
        }
        console.log(`  画像を ${outputDir} に保存しました`);
        await cleanupDir(tempDir);
      }
    } catch (error) {
      console.error(`  エラー: ${error.message}`);
    }
  }
}

main().catch(console.error);
