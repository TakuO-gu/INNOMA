import { getAllServiceVariables } from '../lib/llm/variable-priority';
import * as fs from 'fs';
import * as path from 'path';

const artifactsDir = './data/artifacts';
const dirs = fs.readdirSync(artifactsDir).filter(d => {
  const stat = fs.statSync(path.join(artifactsDir, d));
  return stat.isDirectory() && !d.startsWith('_') && d !== 'sample';
});

const allVariables = getAllServiceVariables();
const totalVariables = allVariables.length;

console.log('Total variables defined:', totalVariables);
console.log('');

interface Result {
  dir: string;
  status: string;
  filledCount: number;
  totalVariables: number;
  percentage: number;
}

const results: Result[] = [];

for (const dir of dirs) {
  const metaPath = path.join(artifactsDir, dir, 'meta.json');
  const variablesPath = path.join(artifactsDir, dir, 'variables.json');

  let status = 'unknown';
  let filledCount = 0;

  if (fs.existsSync(metaPath)) {
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    status = meta.status || 'unknown';
  }

  // 変数を読み込み（単一ファイルと分割ファイルの両方に対応）
  let variables: Record<string, { value?: string }> = {};

  // 1. 単一ファイル（後方互換性）
  if (fs.existsSync(variablesPath)) {
    variables = JSON.parse(fs.readFileSync(variablesPath, 'utf-8'));
  }

  // 2. 分割ファイル（variables/ディレクトリ）
  const variablesDir = path.join(artifactsDir, dir, 'variables');
  if (fs.existsSync(variablesDir)) {
    const files = fs.readdirSync(variablesDir).filter(f => f.endsWith('.json'));
    for (const file of files) {
      const filePath = path.join(variablesDir, file);
      const partial = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      variables = { ...variables, ...partial };
    }
  }

  filledCount = allVariables.filter(name =>
    variables[name]?.value && variables[name].value.trim() !== ''
  ).length;

  const percentage = Math.round((filledCount / totalVariables) * 100);
  results.push({ dir, status, filledCount, totalVariables, percentage });
}

// パーセンテージで降順ソート
results.sort((a, b) => b.percentage - a.percentage);

for (const r of results) {
  const shouldPublish = r.percentage >= 80 ? '✓' : ' ';
  const dirStr = r.dir.padEnd(20);
  const statusStr = r.status.padEnd(15);
  console.log(`${shouldPublish} ${dirStr} ${statusStr} ${r.filledCount}/${r.totalVariables} (${r.percentage}%)`);
}
