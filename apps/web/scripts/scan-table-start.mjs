/**
 * テーブル開始Y座標を正確に特定する
 */

import { writeFile } from 'fs/promises';
import { mkdirSync } from 'fs';
import { join } from 'path';

async function main() {
  const inputPath = '/tmp/pdf-check-tobetsu-r19/page-1.png';
  const outputDir = '/tmp/pdf-check-tobetsu-tablestart';
  mkdirSync(outputDir, { recursive: true });

  const sharp = (await import('sharp')).default;
  const metadata = await sharp(inputPath).metadata();

  // y=350〜600の範囲を全幅で確認（テーブルヘッダーとデータ開始部分）
  await sharp(inputPath)
    .extract({ left: 0, top: 350, width: metadata.width, height: 250 })
    .toFile(join(outputDir, 'table-start-area.png'));

  console.log('Done');
}

main().catch(console.error);
