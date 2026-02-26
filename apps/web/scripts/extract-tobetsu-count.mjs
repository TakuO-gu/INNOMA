/**
 * 当別町の避難所PDF p42-43 を高DPIでクロップして数を数えやすくする
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
  // 専用避難所一覧PDF
  const url = 'https://www.town.tobetsu.hokkaido.jp/uploaded/attachment/22879.pdf';
  const outputDir = '/tmp/pdf-check-tobetsu-hinanjo';

  console.log('Fetching hinanjo PDF...');
  const buffer = await fetchPdf(url);
  console.log(`PDF size: ${buffer.byteLength} bytes`);

  const tempDir = join(tmpdir(), `pdf-tobetsu-${randomUUID()}`);
  const pdfPath = join(tempDir, 'input.pdf');
  const outputPrefix = join(tempDir, 'page');

  await mkdir(tempDir, { recursive: true });
  await writeFile(pdfPath, Buffer.from(buffer));

  // 高解像度で変換
  const command = `pdftoppm -png -r 300 "${pdfPath}" "${outputPrefix}"`;
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
