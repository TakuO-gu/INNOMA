/**
 * テーブルの特定行を全幅で切り出してX座標を確認
 */

import { writeFile } from 'fs/promises';
import { mkdirSync } from 'fs';
import { join } from 'path';

async function main() {
  const inputPath = '/tmp/pdf-check-tobetsu-r19/page-1.png';
  const outputDir = '/tmp/pdf-check-tobetsu-fullrow';
  mkdirSync(outputDir, { recursive: true });

  const sharp = (await import('sharp')).default;
  const metadata = await sharp(inputPath).metadata();
  console.log(`Image size: ${metadata.width}x${metadata.height}`);

  // No.1行（当別町総合体育館）の全幅
  // y=470から1行目: 470 + 37.5 = 507.5 → y=470〜508
  await sharp(inputPath)
    .extract({ left: 0, top: 470, width: metadata.width, height: 40 })
    .toFile(join(outputDir, 'row1.png'));

  // No.2行（当別町白樺コミュニティーセンター）
  await sharp(inputPath)
    .extract({ left: 0, top: 510, width: metadata.width, height: 40 })
    .toFile(join(outputDir, 'row2.png'));

  // No.10行（旧当別小学校）: y ≈ 470 + 9*37.5 = 807.5
  await sharp(inputPath)
    .extract({ left: 0, top: 805, width: metadata.width, height: 40 })
    .toFile(join(outputDir, 'row10.png'));

  // 右端300pxの列を全行分抽出
  await sharp(inputPath)
    .extract({ left: metadata.width - 300, top: 470, width: 300, height: 2435 })
    .toFile(join(outputDir, 'rightmost-300px-full.png'));

  console.log('Done');
}

main().catch(console.error);
