/**
 * 当別町の避難所PDFから画像を生成するスクリプト
 */

import { writeFile, readFile, readdir, unlink, mkdir, rmdir } from 'fs/promises';
import { mkdirSync } from 'fs';
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
  return response.arrayBuffer();
}

async function convertPdfToImages(pdfBuffer, outputDir, prefix) {
  const tempDir = join(tmpdir(), `pdf-extract-${randomUUID()}`);
  const pdfPath = join(tempDir, 'input.pdf');
  const outputPrefix = join(tempDir, 'page');

  try {
    await mkdir(tempDir, { recursive: true });
    await writeFile(pdfPath, Buffer.from(pdfBuffer));

    const command = `pdftoppm -png -r 150 -l 10 "${pdfPath}" "${outputPrefix}"`;
    execSync(command, { stdio: 'pipe' });

    const files = await readdir(tempDir);
    const imageFiles = files
      .filter(f => f.startsWith('page-') && f.endsWith('.png'))
      .sort();

    mkdirSync(outputDir, { recursive: true });
    for (const file of imageFiles) {
      const src = join(tempDir, file);
      const dst = join(outputDir, `${prefix}-${file}`);
      const buf = await readFile(src);
      await writeFile(dst, buf);
    }

    console.log(`  Generated ${imageFiles.length} images → ${outputDir}`);

    // cleanup
    for (const file of await readdir(tempDir).catch(() => [])) {
      await unlink(join(tempDir, file)).catch(() => {});
    }
    await rmdir(tempDir).catch(() => {});
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function main() {
  const baseUrl = 'https://www.town.tobetsu.hokkaido.jp';
  const outputDir = '/tmp/pdf-check-tobetsu';

  // 避難所一覧が含まれるとされるPDF（p42-43）
  const pdfs = [
    { path: '/uploaded/attachment/22881.pdf', prefix: 'tobetsu-p40-back' }, // 40ページ〜裏表紙（p42-43含む）
    { path: '/uploaded/attachment/22879.pdf', prefix: 'tobetsu-hinanjo' },   // 避難所一覧PDF
  ];

  for (const pdf of pdfs) {
    try {
      const buffer = await fetchPdf(baseUrl + pdf.path);
      console.log(`  PDF size: ${buffer.byteLength} bytes`);
      await convertPdfToImages(buffer, outputDir, pdf.prefix);
    } catch (error) {
      console.error(`  Failed: ${error.message}`);
    }
  }
}

main().catch(console.error);
