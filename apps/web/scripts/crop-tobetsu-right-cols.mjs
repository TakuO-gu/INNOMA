import { writeFile } from 'fs/promises';
import { mkdirSync } from 'fs';
import { join } from 'path';

async function main() {
  const inputPath = '/tmp/pdf-check-tobetsu-r19/page-1.png';
  const outputDir = '/tmp/pdf-check-tobetsu-r19-cols';
  mkdirSync(outputDir, { recursive: true });

  const sharp = (await import('sharp')).default;
  const metadata = await sharp(inputPath).metadata();
  console.log(`Image size: ${metadata.width}x${metadata.height}`);

  // 右側の列部分（指定緊急避難場所・指定避難所の列）
  // 全体の右35%あたりが列
  const rightStart = Math.floor(metadata.width * 0.65);
  const rightWidth = metadata.width - rightStart;
  const thirdHeight = Math.floor(metadata.height / 3);

  // 縦3分割
  await sharp(inputPath)
    .extract({ left: rightStart, top: 0, width: rightWidth, height: thirdHeight })
    .toFile(join(outputDir, 'right-top.png'));

  await sharp(inputPath)
    .extract({ left: rightStart, top: thirdHeight, width: rightWidth, height: thirdHeight })
    .toFile(join(outputDir, 'right-mid.png'));

  await sharp(inputPath)
    .extract({ left: rightStart, top: thirdHeight * 2, width: rightWidth, height: metadata.height - thirdHeight * 2 })
    .toFile(join(outputDir, 'right-bot.png'));

  console.log('Done');
}

main().catch(console.error);
