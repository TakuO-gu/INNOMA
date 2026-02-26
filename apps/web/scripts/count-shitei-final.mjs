/**
 * 当別町資料19「指定避難所」列 (x≈2080, w≈160) の○を全行数える
 */

import { writeFile } from 'fs/promises';
import { mkdirSync } from 'fs';
import { join } from 'path';

async function main() {
  const inputPath = '/tmp/pdf-check-tobetsu-r19/page-1.png';
  const outputDir = '/tmp/pdf-check-tobetsu-shitei-final';
  mkdirSync(outputDir, { recursive: true });

  const sharp = (await import('sharp')).default;

  // テーブルデータ行: y=470〜2905, 65行
  const tableTop = 470;
  const tableBottom = 2905;
  const tableHeight = tableBottom - tableTop;

  // 指定避難所列: x=2080, w=160
  const colX = 2075;
  const colW = 165;

  // 全体を縦4分割して確認
  const segCount = 4;
  const segH = Math.floor(tableHeight / segCount);

  for (let i = 0; i < segCount; i++) {
    const y = tableTop + segH * i;
    const h = i < segCount - 1 ? segH : tableHeight - segH * (segCount - 1);
    await sharp(inputPath)
      .extract({ left: colX, top: y, width: colW, height: h })
      .toFile(join(outputDir, `shitei-seg${i + 1}.png`));
    console.log(`Saved seg${i + 1}: y=${y}, h=${h}`);
  }

  // No.列(x=335,w=55)と指定避難所列(x=2075,w=165)を横に並べた確認用
  // No.列のデータ
  await sharp(inputPath)
    .extract({ left: 330, top: tableTop, width: 55, height: tableHeight })
    .toFile(join(outputDir, 'no-col.png'));

  console.log('Done');
}

main().catch(console.error);
