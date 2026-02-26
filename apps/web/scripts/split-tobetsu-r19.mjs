import { writeFile, readFile } from 'fs/promises';
import { mkdirSync } from 'fs';
import { join } from 'path';

async function main() {
  const inputPath = '/tmp/pdf-check-tobetsu-r19/page-1.png';
  const outputDir = '/tmp/pdf-check-tobetsu-r19-split';
  mkdirSync(outputDir, { recursive: true });

  const sharp = (await import('sharp')).default;
  const metadata = await sharp(inputPath).metadata();
  console.log(`Image size: ${metadata.width}x${metadata.height}`);

  const halfWidth = Math.floor(metadata.width / 2);

  // 上部（タイトル含む全体の上部分）
  await sharp(inputPath)
    .extract({ left: 0, top: 0, width: halfWidth, height: metadata.height })
    .toFile(join(outputDir, 'left.png'));
  console.log('Saved left');

  await sharp(inputPath)
    .extract({ left: halfWidth, top: 0, width: metadata.width - halfWidth, height: metadata.height })
    .toFile(join(outputDir, 'right.png'));
  console.log('Saved right');

  // 下部分（福祉避難所テーブル）
  const bottomY = Math.floor(metadata.height * 0.85);
  await sharp(inputPath)
    .extract({ left: 0, top: bottomY, width: metadata.width, height: metadata.height - bottomY })
    .toFile(join(outputDir, 'bottom.png'));
  console.log('Saved bottom');
}

main().catch(console.error);
