/**
 * 当別町地域防災計画 資料19「緊急時退避場所及び指定避難所一覧」を取得
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

async function main() {
  const url = 'https://www.town.tobetsu.hokkaido.jp/uploaded/attachment/28301.pdf';
  const outputDir = '/tmp/pdf-check-tobetsu-r19';

  console.log('Fetching 資料19 PDF...');
  const buffer = await fetchPdf(url);
  console.log(`PDF size: ${buffer.byteLength} bytes`);

  const tempDir = join(tmpdir(), `pdf-r19-${randomUUID()}`);
  const pdfPath = join(tempDir, 'input.pdf');
  const outputPrefix = join(tempDir, 'page');

  await mkdir(tempDir, { recursive: true });
  await writeFile(pdfPath, Buffer.from(buffer));

  // 全ページを300DPIで変換
  const command = `pdftoppm -png -r 300 "${pdfPath}" "${outputPrefix}"`;
  execSync(command, { stdio: 'pipe' });

  const files = await readdir(tempDir);
  const imageFiles = files.filter(f => f.startsWith('page-') && f.endsWith('.png')).sort();
  console.log(`Generated ${imageFiles.length} pages`);

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
