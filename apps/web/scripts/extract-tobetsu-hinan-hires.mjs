/**
 * 当別町の避難所PDFを高解像度で画像に変換
 */

import { writeFile, readFile, readdir, unlink, mkdir, rmdir } from 'fs/promises';
import { mkdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';
import { execSync } from 'child_process';

async function fetchPdf(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; INNOMA/1.0)' },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.arrayBuffer();
}

async function convertPdfToImages(pdfBuffer, outputDir, prefix, dpi = 250) {
  const tempDir = join(tmpdir(), `pdf-hires-${randomUUID()}`);
  const pdfPath = join(tempDir, 'input.pdf');
  const outputPrefix = join(tempDir, 'page');

  await mkdir(tempDir, { recursive: true });
  await writeFile(pdfPath, Buffer.from(pdfBuffer));

  const command = `pdftoppm -png -r ${dpi} "${pdfPath}" "${outputPrefix}"`;
  execSync(command, { stdio: 'pipe' });

  const files = await readdir(tempDir);
  const imageFiles = files.filter(f => f.startsWith('page-') && f.endsWith('.png')).sort();

  mkdirSync(outputDir, { recursive: true });
  for (const file of imageFiles) {
    const buf = await readFile(join(tempDir, file));
    await writeFile(join(outputDir, `${prefix}-${file}`), buf);
  }

  console.log(`Generated ${imageFiles.length} images`);

  for (const file of await readdir(tempDir).catch(() => [])) {
    await unlink(join(tempDir, file)).catch(() => {});
  }
  await rmdir(tempDir).catch(() => {});
}

async function main() {
  // 22881.pdfのp3-4（ページ42-43に相当）だけを高解像度で取得
  const url = 'https://www.town.tobetsu.hokkaido.jp/uploaded/attachment/22881.pdf';
  const outputDir = '/tmp/pdf-check-tobetsu-hires';

  console.log('Fetching PDF...');
  const buffer = await fetchPdf(url);
  console.log(`PDF size: ${buffer.byteLength} bytes`);

  // 全ページを高解像度で変換
  const tempDir = join(tmpdir(), `pdf-hires-${randomUUID()}`);
  const pdfPath = join(tempDir, 'input.pdf');
  const outputPrefix = join(tempDir, 'page');

  await mkdir(tempDir, { recursive: true });
  await writeFile(pdfPath, Buffer.from(buffer));

  // ページ3-4のみ変換（-f 3 -l 4）
  const command = `pdftoppm -png -r 250 -f 3 -l 4 "${pdfPath}" "${outputPrefix}"`;
  execSync(command, { stdio: 'pipe' });

  const files = await readdir(tempDir);
  const imageFiles = files.filter(f => f.startsWith('page-') && f.endsWith('.png')).sort();

  mkdirSync(outputDir, { recursive: true });
  for (const file of imageFiles) {
    const buf = await readFile(join(tempDir, file));
    await writeFile(join(outputDir, file), buf);
    console.log(`Saved: ${file}`);
  }

  for (const file of await readdir(tempDir).catch(() => [])) {
    await unlink(join(tempDir, file)).catch(() => {});
  }
  await rmdir(tempDir).catch(() => {});
}

main().catch(console.error);
