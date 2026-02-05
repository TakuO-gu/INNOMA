/**
 * 複数の自治体に対してfetchを順次実行するスクリプト
 */
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const ARTIFACTS_DIR = './data/artifacts';

// 対象自治体（takaoka, tsuru以外で80%未満の自治体）
const TARGET_MUNICIPALITIES = [
  // 'tsuru', // 処理済み
  'tobetsu',
  'utashinai',
  'sotogahama',
  'choshi',
  'kawasaki-miyagi',
  'yoshimi',
  'kawachi',
  'nanmoku',
  'nosegawa',
  'toyono',
  'hakone',
  'hayakawa',
  'kanna',
  'kitagawa',
  'kusatsu',
  'otaki',
  'atami',
  'higashiyoshino',
  'ide',
  'kamikitayama',
  'shimoichi',
  'yoshino',
];

async function main() {
  for (const id of TARGET_MUNICIPALITIES) {
    const metaPath = path.join(ARTIFACTS_DIR, id, 'meta.json');

    if (!fs.existsSync(metaPath)) {
      console.log(`SKIP: ${id} (no meta.json)`);
      continue;
    }

    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    const name = meta.name || id;
    const prefecture = meta.prefecture || '';

    if (!name || !prefecture) {
      console.log(`SKIP: ${id} (incomplete meta)`);
      continue;
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`PROCESSING: ${id} (${name}, ${prefecture})`);
    console.log('='.repeat(60));

    try {
      // パイプライン実行（auto-approve有効、閾値0.5）
      execSync(
        `npx tsx scripts/pipeline.ts run --id "${id}" --name "${name}" --prefecture "${prefecture}" --auto-approve --threshold 0.5`,
        {
          stdio: 'inherit',
          timeout: 600000, // 10分タイムアウト
        }
      );
      console.log(`SUCCESS: ${id}`);
    } catch (error) {
      console.error(`FAILED: ${id}`, error);
    }
  }

  console.log('\n\nBatch fetch completed!');
}

main().catch(console.error);
