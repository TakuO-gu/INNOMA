import { writeFile } from 'fs/promises';
import { mkdirSync } from 'fs';
import { join } from 'path';

async function main() {
  const inputPath = '/tmp/pdf-check-tobetsu-r19/page-1.png';
  const outputDir = '/tmp/pdf-check-tobetsu-header';
  mkdirSync(outputDir, { recursive: true });

  const sharp = (await import('sharp')).default;
  const metadata = await sharp(inputPath).metadata();

  // ヘッダー行全体（y=300〜470）
  await sharp(inputPath)
    .extract({ left: 0, top: 290, width: metadata.width, height: 180 })
    .toFile(join(outputDir, 'header-full.png'));

  console.log('Done');
}

main().catch(console.error);
