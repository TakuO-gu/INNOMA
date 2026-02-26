/**
 * 当別町資料19の「指定避難所」列（x≈2170〜2290）の○を数える
 * テーブル: y=380〜2905, 65行
 */

import { writeFile } from 'fs/promises';
import { mkdirSync } from 'fs';
import { join } from 'path';

async function main() {
  const inputPath = '/tmp/pdf-check-tobetsu-r19/page-1.png';
  const outputDir = '/tmp/pdf-check-tobetsu-shitei';
  mkdirSync(outputDir, { recursive: true });

  const sharp = (await import('sharp')).default;
  const metadata = await sharp(inputPath).metadata();
  console.log(`Image size: ${metadata.width}x${metadata.height}`);

  // テーブルデータ開始（ヘッダー2行の後）: y≈470
  // テーブルデータ終了: y≈2905
  const tableTop = 470;
  const tableBottom = 2905;
  const tableHeight = tableBottom - tableTop;
  const rowCount = 65;
  const rowHeight = tableHeight / rowCount;
  console.log(`Row height: ${rowHeight.toFixed(1)}px`);

  // 指定避難所列: x≈2170〜2290 (幅120px)
  const shiteiX = 2165;
  const shiteiW = 130;

  // 全体を1枚で縦長に確認
  await sharp(inputPath)
    .extract({ left: shiteiX, top: tableTop, width: shiteiW, height: tableHeight })
    .toFile(join(outputDir, 'shitei-full.png'));

  // No.列(x≈335-390)と指定避難所列を並べた確認用画像
  // No.列幅: 55px, 名称列一部 + 指定避難所列
  const noX = 330;
  const noW = 65;

  // No.列と指定避難所列を横に並べるため、両方含む範囲を切り出す
  // No.列中心と指定避難所列を含む全幅
  await sharp(inputPath)
    .extract({ left: noX, top: tableTop, width: noW + 10, height: tableHeight })
    .toFile(join(outputDir, 'no-col-full.png'));

  // 縦に5分割して確認
  const segH = Math.floor(tableHeight / 5);
  for (let i = 0; i < 5; i++) {
    const y = tableTop + segH * i;
    const h = i < 4 ? segH : tableHeight - segH * 4;
    await sharp(inputPath)
      .extract({ left: noX - 5, top: y, width: noW + shiteiW + (shiteiX - noX - noW) + 15, height: h })
      .toFile(join(outputDir, `combined-seg${i+1}.png`));
  }

  console.log('Done');
}

main().catch(console.error);
