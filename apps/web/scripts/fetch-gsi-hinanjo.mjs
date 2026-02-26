/**
 * 国土地理院の避難所データから各自治体の件数を取得
 */

async function fetchCsv(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; INNOMA/1.0)' },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  return response.text();
}

async function searchGsiData(municipalityName) {
  // 国土地理院の指定緊急避難場所データ
  // 全国データをダウンロードして検索
  const kinkyuUrl = 'https://hinanmap.gsi.go.jp/hinanjocp/hinanbasho/koukai_csv/01.zip'; // 北海道

  console.log(`Searching for: ${municipalityName}`);
  // ZIP形式なのでcurlで取得してunzip
  const { execSync } = await import('child_process');
  const { writeFile, readFile, readdir, unlink, mkdir, rmdir } = await import('fs/promises');
  const { join } = await import('path');
  const { tmpdir } = await import('os');
  const { randomUUID } = await import('crypto');

  const tempDir = join(tmpdir(), `gsi-${randomUUID()}`);
  await mkdir(tempDir, { recursive: true });

  try {
    // 北海道の指定緊急避難場所データ
    const zipUrl01 = 'https://hinanmap.gsi.go.jp/hinanjocp/hinanbasho/koukai_csv/01.zip';
    // 北海道の指定避難所データ
    const zipUrl01s = 'https://hinanmap.gsi.go.jp/hinanjocp/hinanbasho/kj_koukai_csv/01.zip';

    for (const [label, url] of [['指定緊急避難場所', zipUrl01], ['指定避難所', zipUrl01s]]) {
      try {
        console.log(`Fetching ${label}: ${url}`);
        const response = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; INNOMA/1.0)' },
        });
        if (!response.ok) {
          console.log(`  HTTP ${response.status}`);
          continue;
        }
        const buffer = await response.arrayBuffer();
        const zipPath = join(tempDir, `data.zip`);
        await writeFile(zipPath, Buffer.from(buffer));
        execSync(`unzip -o "${zipPath}" -d "${tempDir}"`, { stdio: 'pipe' });

        const files = await readdir(tempDir);
        const csvFiles = files.filter(f => f.endsWith('.csv'));
        console.log(`  CSV files: ${csvFiles.join(', ')}`);

        for (const csvFile of csvFiles) {
          const content = await readFile(join(tempDir, csvFile), 'utf8');
          const lines = content.split('\n');
          const matching = lines.filter(line => line.includes(municipalityName));
          console.log(`  ${csvFile}: ${matching.length} lines matching "${municipalityName}"`);
          if (matching.length > 0 && matching.length < 100) {
            matching.slice(0, 5).forEach(l => console.log(`    ${l.substring(0, 120)}`));
          }
        }
      } catch (e) {
        console.log(`  Error: ${e.message}`);
      }
    }
  } finally {
    const files = await readdir(tempDir).catch(() => []);
    for (const file of files) await unlink(join(tempDir, file)).catch(() => {});
    await rmdir(tempDir).catch(() => {});
  }
}

// 当別町を検索
await searchGsiData('当別町');
