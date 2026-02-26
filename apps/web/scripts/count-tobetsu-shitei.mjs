/**
 * 当別町資料19の「指定避難所」列の○の数を中央部分から確認
 * No.列と指定避難所列を並べて表示
 */

import { writeFile } from 'fs/promises';
import { mkdirSync } from 'fs';
import { join } from 'path';

async function main() {
  const inputPath = '/tmp/pdf-check-tobetsu-r19/page-1.png';
  const outputDir = '/tmp/pdf-check-tobetsu-count';
  mkdirSync(outputDir, { recursive: true });

  const sharp = (await import('sharp')).default;
  const metadata = await sharp(inputPath).metadata();
  console.log(`Image size: ${metadata.width}x${metadata.height}`);

  // No.列 + 名称列 + 指定避難所列 の部分を抽出
  // ページ全体: 2550 x 3300
  // テーブル開始: 約y=400, 終わり: 約y=2880
  // No.列: 約x=335〜380
  // 名称列: 約x=380〜1000
  // 指定避難所列: 約x=1930〜2020 （右から2番目）

  // テーブル全体の高さ: 約2480px, 65行 → 1行約38px
  const tableTop = 400;
  const tableBottom = 2880;
  const tableHeight = tableBottom - tableTop;
  const rowHeight = tableHeight / 65;
  console.log(`Row height: ${rowHeight.toFixed(1)}px`);

  // No.列 + 指定避難所列を抽出して縦3分割
  const colWidth = 2550;
  // No.列: x=335, 幅45px
  // 指定避難所列: 約x=1920, 幅100px
  // 合わせた幅でなく、全幅で抽出して2分割
  const thirdH = Math.floor(tableHeight / 3);

  await sharp(inputPath)
    .extract({ left: 330, top: tableTop, width: 700, height: thirdH })
    .toFile(join(outputDir, 'col-top.png'));

  await sharp(inputPath)
    .extract({ left: 330, top: tableTop + thirdH, width: 700, height: thirdH })
    .toFile(join(outputDir, 'col-mid.png'));

  await sharp(inputPath)
    .extract({ left: 330, top: tableTop + thirdH * 2, width: 700, height: tableHeight - thirdH * 2 })
    .toFile(join(outputDir, 'col-bot.png'));

  // 指定避難所列のみ全体
  await sharp(inputPath)
    .extract({ left: 1880, top: tableTop, width: 160, height: tableHeight })
    .toFile(join(outputDir, 'shitei-col-full.png'));

  console.log('Done');
}

main().catch(console.error);
