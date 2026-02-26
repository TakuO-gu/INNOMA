/**
 * ヘッダー行から「指定避難所」列のX座標を特定する
 * ヘッダー画像を横に細かくスキャンして列位置を確認
 */

import { writeFile } from 'fs/promises';
import { mkdirSync } from 'fs';
import { join } from 'path';

async function main() {
  const inputPath = '/tmp/pdf-check-tobetsu-r19/page-1.png';
  const outputDir = '/tmp/pdf-check-tobetsu-xcol';
  mkdirSync(outputDir, { recursive: true });

  const sharp = (await import('sharp')).default;
  const metadata = await sharp(inputPath).metadata();

  // ヘッダー全体（y=290〜470）を左右200pxずつのスライスで確認
  const headerTop = 290;
  const headerH = 110;

  // 右半分を細かく確認（x=1400〜2550）
  // 100px刻みで確認
  for (let x = 1400; x < 2550; x += 200) {
    const w = Math.min(200, 2550 - x);
    await sharp(inputPath)
      .extract({ left: x, top: headerTop, width: w, height: headerH })
      .toFile(join(outputDir, `header-x${x}.png`));
  }

  // 全体のヘッダー行（行1のみ）
  await sharp(inputPath)
    .extract({ left: 1300, top: headerTop, width: 1250, height: headerH })
    .toFile(join(outputDir, 'header-right.png'));

  console.log('Done');
}

main().catch(console.error);
