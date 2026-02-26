/**
 * 当別町資料19「指定避難所」列 (x≈2110, w≈140) の○を全行数える
 * テーブルデータ開始: y=390, 1行=36px, 65行
 */

import { writeFile } from 'fs/promises';
import { mkdirSync } from 'fs';
import { join } from 'path';

async function main() {
  const inputPath = '/tmp/pdf-check-tobetsu-r19/page-1.png';
  const outputDir = '/tmp/pdf-check-tobetsu-shitei-ok';
  mkdirSync(outputDir, { recursive: true });

  const sharp = (await import('sharp')).default;
  const metadata = await sharp(inputPath).metadata();
  console.log(`Image size: ${metadata.width}x${metadata.height}`);

  // 確認: テーブルデータ開始 y=390, 行高36px, 65行
  // テーブル終了: y = 390 + 65*36 = 390 + 2340 = 2730
  const tableTop = 390;
  const rowH = 36;
  const rowCount = 65;
  const tableHeight = rowH * rowCount; // 2340

  // 指定避難所列: x=2110, w=140
  const colX = 2110;
  const colW = 140;

  // 全列を3分割して確認
  const seg = 3;
  const segH = Math.floor(tableHeight / seg);

  for (let i = 0; i < seg; i++) {
    const y = tableTop + segH * i;
    const h = i < seg - 1 ? segH : tableHeight - segH * (seg - 1);
    await sharp(inputPath)
      .extract({ left: colX, top: y, width: colW, height: h })
      .toFile(join(outputDir, `shitei-seg${i + 1}.png`));
    console.log(`Saved seg${i+1}: y=${y}, h=${h}`);
  }

  // No.列(x=335,w=55)と指定避難所列を含む全幅スライス（各行1枚）で検証
  // まず先頭10行を全幅で確認
  await sharp(inputPath)
    .extract({ left: 0, top: tableTop, width: metadata.width, height: rowH * 10 })
    .toFile(join(outputDir, 'rows1-10-fullwidth.png'));

  // 最後の10行を全幅で確認
  const lastStart = tableTop + rowH * 55;
  await sharp(inputPath)
    .extract({ left: 0, top: lastStart, width: metadata.width, height: rowH * 10 })
    .toFile(join(outputDir, 'rows56-65-fullwidth.png'));

  console.log('Done');
}

main().catch(console.error);
