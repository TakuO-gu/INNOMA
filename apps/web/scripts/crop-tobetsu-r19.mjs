import { writeFile } from 'fs/promises';
import { mkdirSync } from 'fs';
import { join } from 'path';

async function main() {
  const inputPath = '/tmp/pdf-check-tobetsu-r19/page-1.png';
  const outputDir = '/tmp/pdf-check-tobetsu-r19-crop';
  mkdirSync(outputDir, { recursive: true });

  const sharp = (await import('sharp')).default;
  const metadata = await sharp(inputPath).metadata();
  console.log(`Image size: ${metadata.width}x${metadata.height}`);

  // No列が含まれる左端部分（全体の最初の35%）を縦に3分割
  const leftWidth = Math.floor(metadata.width * 0.35);
  const thirdHeight = Math.floor(metadata.height / 3);

  await sharp(inputPath)
    .extract({ left: 0, top: 0, width: leftWidth, height: thirdHeight })
    .toFile(join(outputDir, 'left-top.png'));

  await sharp(inputPath)
    .extract({ left: 0, top: thirdHeight, width: leftWidth, height: thirdHeight })
    .toFile(join(outputDir, 'left-mid.png'));

  await sharp(inputPath)
    .extract({ left: 0, top: thirdHeight * 2, width: leftWidth, height: metadata.height - thirdHeight * 2 })
    .toFile(join(outputDir, 'left-bot.png'));

  console.log('Done');
}

main().catch(console.error);
