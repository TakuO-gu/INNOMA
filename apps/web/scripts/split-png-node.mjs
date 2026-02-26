/**
 * Node.js のみで PNG を左右分割する（sharp を使用）
 */

import { join } from 'path';
import { mkdirSync } from 'fs';

async function main() {
  const inputPath = '/tmp/pdf-check-tobetsu-split/page-1.png';
  const outputDir = '/tmp/pdf-check-tobetsu-split2';
  mkdirSync(outputDir, { recursive: true });

  try {
    // sharp を試す
    const sharp = (await import('sharp')).default;
    const metadata = await sharp(inputPath).metadata();
    console.log(`Image size: ${metadata.width}x${metadata.height}`);

    const halfWidth = Math.floor(metadata.width / 2);

    // 左半分
    await sharp(inputPath)
      .extract({ left: 0, top: 0, width: halfWidth, height: metadata.height })
      .toFile(join(outputDir, 'left.png'));
    console.log(`Saved left half`);

    // 右半分
    await sharp(inputPath)
      .extract({ left: halfWidth, top: 0, width: metadata.width - halfWidth, height: metadata.height })
      .toFile(join(outputDir, 'right.png'));
    console.log(`Saved right half`);

  } catch (e) {
    console.error('sharp failed:', e.message);

    // フォールバック: Python PIL を試す
    try {
      const { execSync } = await import('child_process');
      const pythonScript = `
import PIL.Image
img = PIL.Image.open("${inputPath}")
w, h = img.size
print(f"Size: {w}x{h}")
half = w // 2
img.crop((0, 0, half, h)).save("${outputDir}/left.png")
img.crop((half, 0, w, h)).save("${outputDir}/right.png")
print("Done")
`;
      execSync(`python3 -c '${pythonScript}'`, { encoding: 'utf8', stdio: 'pipe' });
      console.log('Python PIL succeeded');
    } catch (e2) {
      console.error('Python PIL also failed:', e2.message);

      // sips (macOS 組み込み) を試す
      try {
        const { execSync } = await import('child_process');
        // sips でサイズ確認
        const result = execSync(`sips -g pixelWidth -g pixelHeight "${inputPath}"`, { encoding: 'utf8' });
        console.log('sips info:', result);
      } catch (e3) {
        console.error('sips failed:', e3.message);
      }
    }
  }
}

main().catch(console.error);
