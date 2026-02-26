/**
 * 当別町資料19の列位置を特定するため、横断的なスライスを確認
 */

import { writeFile } from 'fs/promises';
import { mkdirSync } from 'fs';
import { join } from 'path';

async function main() {
  const inputPath = '/tmp/pdf-check-tobetsu-r19/page-1.png';
  const outputDir = '/tmp/pdf-check-tobetsu-cols2';
  mkdirSync(outputDir, { recursive: true });

  const sharp = (await import('sharp')).default;
  const metadata = await sharp(inputPath).metadata();
  console.log(`Image size: ${metadata.width}x${metadata.height}`);

  // テーブルヘッダー行だけを横断的に確認（指定避難所列の位置を特定）
  // ヘッダーは約y=400-480あたり
  await sharp(inputPath)
    .extract({ left: 0, top: 380, width: metadata.width, height: 120 })
    .toFile(join(outputDir, 'header-row.png'));

  // テーブル全体の右半分（指定緊急避難場所・指定避難所列がある側）
  const rightHalf = Math.floor(metadata.width * 0.55);
  const tableTop = 470;
  const tableBottom = 2900;

  await sharp(inputPath)
    .extract({ left: rightHalf, top: tableTop, width: metadata.width - rightHalf, height: Math.floor((tableBottom - tableTop) / 3) })
    .toFile(join(outputDir, 'right-cols-top.png'));

  await sharp(inputPath)
    .extract({ left: rightHalf, top: tableTop + Math.floor((tableBottom - tableTop) / 3), width: metadata.width - rightHalf, height: Math.floor((tableBottom - tableTop) / 3) })
    .toFile(join(outputDir, 'right-cols-mid.png'));

  await sharp(inputPath)
    .extract({ left: rightHalf, top: tableTop + Math.floor((tableBottom - tableTop) * 2 / 3), width: metadata.width - rightHalf, height: tableBottom - tableTop - Math.floor((tableBottom - tableTop) * 2 / 3) })
    .toFile(join(outputDir, 'right-cols-bot.png'));

  console.log('Done');
}

main().catch(console.error);
