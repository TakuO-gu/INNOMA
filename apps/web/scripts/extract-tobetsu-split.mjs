/**
 * 当別町の避難所PDF を高DPIで変換し、左右に分割する
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
  const url = 'https://www.town.tobetsu.hokkaido.jp/uploaded/attachment/22879.pdf';
  const outputDir = '/tmp/pdf-check-tobetsu-split';

  console.log('Fetching PDF...');
  const buffer = await fetchPdf(url);

  const tempDir = join(tmpdir(), `pdf-split-${randomUUID()}`);
  const pdfPath = join(tempDir, 'input.pdf');
  const outputPrefix = join(tempDir, 'page');

  await mkdir(tempDir, { recursive: true });
  await writeFile(pdfPath, Buffer.from(buffer));

  // 400DPIで変換
  const command = `pdftoppm -png -r 400 "${pdfPath}" "${outputPrefix}"`;
  execSync(command, { stdio: 'pipe' });

  const files = await readdir(tempDir);
  const imageFiles = files.filter(f => f.startsWith('page-') && f.endsWith('.png')).sort();

  mkdirSync(outputDir, { recursive: true });

  for (const file of imageFiles) {
    const src = join(tempDir, file);
    const buf = await readFile(src);
    const outPath = join(outputDir, file);
    await writeFile(outPath, buf);
    console.log(`Saved: ${file} (${buf.length} bytes)`);

    // ImageMagick で左半分と右半分に分割
    try {
      // 画像サイズを取得
      const identify = execSync(`identify -format "%wx%h" "${outPath}"`, { encoding: 'utf8' });
      const [width, height] = identify.split('x').map(Number);
      const halfWidth = Math.floor(width / 2);
      console.log(`  Image size: ${width}x${height}, half: ${halfWidth}`);

      // 左半分
      const leftPath = join(outputDir, file.replace('.png', '-left.png'));
      execSync(`convert "${outPath}" -crop ${halfWidth}x${height}+0+0 "${leftPath}"`);
      console.log(`  Saved left half: ${leftPath}`);

      // 右半分
      const rightPath = join(outputDir, file.replace('.png', '-right.png'));
      execSync(`convert "${outPath}" -crop ${halfWidth}x${height}+${halfWidth}+0 "${rightPath}"`);
      console.log(`  Saved right half: ${rightPath}`);
    } catch (e) {
      console.log(`  ImageMagick split failed: ${e.message}`);
    }
  }

  for (const file of await readdir(tempDir).catch(() => [])) {
    await unlink(join(tempDir, file)).catch(() => {});
  }
  await rmdir(tempDir).catch(() => {});
}

main().catch(console.error);
