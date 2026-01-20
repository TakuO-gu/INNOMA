#!/usr/bin/env npx tsx
/**
 * INNOMA Pipeline CLI
 *
 * 使用方法:
 *   npx tsx scripts/pipeline.ts --help
 *   npx tsx scripts/pipeline.ts create --id takaoka --name 高岡市 --prefecture 富山県
 *   npx tsx scripts/pipeline.ts fetch --id takaoka --services shimin,kokuho
 *   npx tsx scripts/pipeline.ts run --id takaoka --name 高岡市 --prefecture 富山県 --auto-approve
 */

import { runPipeline } from '../lib/pipeline';
import { getMunicipalities, getMunicipalityMeta } from '../lib/template/storage';
import { serviceDefinitions } from '../lib/llm/variable-priority';
import type { PipelineConfig, PipelineEvent } from '../lib/pipeline/types';

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color = colors.reset): void {
  console.log(`${color}${message}${colors.reset}`);
}

function logStep(emoji: string, message: string): void {
  console.log(`\n${emoji} ${colors.bold}${message}${colors.reset}`);
}

function logDetail(label: string, value: string): void {
  console.log(`   ${colors.dim}${label}:${colors.reset} ${value}`);
}

function logProgress(progress: number, message: string): void {
  const bar = '█'.repeat(Math.floor(progress / 5)) + '░'.repeat(20 - Math.floor(progress / 5));
  process.stdout.write(`\r   [${bar}] ${progress}% ${message}                    `);
}

/**
 * コマンドライン引数をパース
 */
function parseArgs(args: string[]): { command: string; options: Record<string, string | boolean> } {
  const command = args[0] || 'help';
  const options: Record<string, string | boolean> = {};

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const nextArg = args[i + 1];

      if (!nextArg || nextArg.startsWith('--')) {
        options[key] = true;
      } else {
        options[key] = nextArg;
        i++;
      }
    }
  }

  return { command, options };
}

/**
 * ヘルプを表示
 */
function showHelp(): void {
  console.log(`
${colors.bold}INNOMA Pipeline CLI${colors.reset}

${colors.cyan}使用方法:${colors.reset}
  npx tsx scripts/pipeline.ts <command> [options]

${colors.cyan}コマンド:${colors.reset}
  ${colors.bold}run${colors.reset}        パイプライン全体を実行（作成→取得→確認→適用）
  ${colors.bold}create${colors.reset}     自治体を作成
  ${colors.bold}fetch${colors.reset}      情報を取得
  ${colors.bold}list${colors.reset}       登録済み自治体を一覧表示
  ${colors.bold}services${colors.reset}   利用可能なサービス一覧を表示
  ${colors.bold}help${colors.reset}       このヘルプを表示

${colors.cyan}オプション:${colors.reset}
  --id <id>              自治体ID（必須）
  --name <name>          自治体名（作成時必須）
  --prefecture <name>    都道府県（作成時必須）
  --url <url>            公式サイトURL
  --services <ids>       取得するサービス（カンマ区切り）
  --auto-approve         信頼度が高い変数を自動承認
  --threshold <n>        自動承認の信頼度閾値（デフォルト: 0.8）
  --dry-run              実際の変更を行わない
  --free-tier            無料枠モード（API使用量を制限）
  --search-limit <n>     検索API制限（デフォルト: 10）
  --gemini-limit <n>     Gemini API制限（デフォルト: 50）

${colors.cyan}例:${colors.reset}
  # 高岡市を作成して情報を取得
  npx tsx scripts/pipeline.ts run --id takaoka --name 高岡市 --prefecture 富山県 --url https://www.city.takaoka.toyama.jp/

  # 市民課サービスのみ取得
  npx tsx scripts/pipeline.ts fetch --id takaoka --services shimin

  # 自動承認で実行
  npx tsx scripts/pipeline.ts run --id takaoka --name 高岡市 --prefecture 富山県 --auto-approve --threshold 0.9

  # 無料枠モードで実行（API使用量を制限）
  npx tsx scripts/pipeline.ts run --id takaoka --name 高岡市 --prefecture 富山県 --free-tier

  # 無料枠モードでカスタム制限
  npx tsx scripts/pipeline.ts run --id takaoka --name 高岡市 --prefecture 富山県 --free-tier --search-limit 5 --gemini-limit 20
`);
}

/**
 * 自治体一覧を表示
 */
async function listMunicipalities(): Promise<void> {
  logStep('📋', '登録済み自治体一覧');

  const municipalities = await getMunicipalities();

  if (municipalities.length === 0) {
    log('  自治体が登録されていません', colors.dim);
    return;
  }

  console.log();
  console.log(`  ${colors.dim}${'ID'.padEnd(15)} ${'名前'.padEnd(10)} ${'都道府県'.padEnd(8)} ${'ステータス'.padEnd(10)} 変数${colors.reset}`);
  console.log(`  ${'-'.repeat(60)}`);

  for (const m of municipalities) {
    const status = m.status === 'published' ? colors.green + '公開' : colors.yellow + '下書き';
    const vars = `${m.variableStats.filled}/${m.variableStats.total}`;
    console.log(`  ${m.id.padEnd(15)} ${m.name.padEnd(10)} ${m.prefecture.padEnd(8)} ${status}${colors.reset.padEnd(10)} ${vars}`);
  }

  console.log();
}

/**
 * サービス一覧を表示
 */
function listServices(): void {
  logStep('🔧', '利用可能なサービス一覧');

  console.log();
  console.log(`  ${colors.dim}${'ID'.padEnd(15)} ${'名前'.padEnd(20)} 変数数${colors.reset}`);
  console.log(`  ${'-'.repeat(45)}`);

  for (const s of serviceDefinitions) {
    console.log(`  ${s.id.padEnd(15)} ${s.nameJa.padEnd(20)} ${s.variables.length}`);
  }

  console.log();
}

/**
 * イベントハンドラ
 */
function createEventHandler(): (event: PipelineEvent) => void {
  return (event: PipelineEvent) => {
    switch (event.type) {
      case 'step_start':
        if (event.step) {
          const stepEmojis: Record<string, string> = {
            create: '🏗️',
            fetch: '🔍',
            review: '📝',
            apply: '✅',
            validate: '🔒',
          };
          logStep(stepEmojis[event.step] || '▶️', event.message);
        }
        break;

      case 'step_complete':
        if (event.data) {
          for (const [key, value] of Object.entries(event.data)) {
            logDetail(key, String(value));
          }
        }
        break;

      case 'progress':
        if (event.progress !== undefined) {
          logProgress(event.progress, event.message);
        }
        break;

      case 'error':
        log(`\n   ❌ ${event.message}`, colors.red);
        break;

      case 'complete':
        console.log('\n');
        if (event.data) {
          const d = event.data as Record<string, number>;
          log('📊 サマリー', colors.bold);
          logDetail('取得変数', `${d.fetchedVariables}/${d.totalVariables}`);
          logDetail('適用変数', String(d.appliedVariables));
          if (d.errors > 0) {
            logDetail('エラー', String(d.errors));
          }
        }
        break;
    }
  };
}

/**
 * パイプラインを実行
 */
async function runCommand(options: Record<string, string | boolean>): Promise<void> {
  const id = options.id as string;
  const name = options.name as string;
  const prefecture = options.prefecture as string;

  if (!id) {
    log('エラー: --id オプションが必要です', colors.red);
    process.exit(1);
  }

  // 既存の自治体を確認
  const existing = await getMunicipalityMeta(id);
  if (!existing && (!name || !prefecture)) {
    log('エラー: 新規自治体には --name と --prefecture が必要です', colors.red);
    process.exit(1);
  }

  const config: PipelineConfig = {
    municipalityId: id,
    municipalityName: name || existing?.name || id,
    prefecture: prefecture || existing?.prefecture || '',
    officialUrl: options.url as string | undefined,
    services: options.services ? (options.services as string).split(',') : undefined,
    autoApprove: !!options['auto-approve'],
    autoApproveThreshold: options.threshold ? parseFloat(options.threshold as string) : 0.8,
    enableDeepSearch: true,
    dryRun: !!options['dry-run'],
    freeTierMode: !!options['free-tier'],
    freeTierLimits: options['free-tier'] ? {
      googleSearchQueries: options['search-limit'] ? parseInt(options['search-limit'] as string, 10) : undefined,
      geminiRequestsPerDay: options['gemini-limit'] ? parseInt(options['gemini-limit'] as string, 10) : undefined,
    } : undefined,
  };

  console.log(`
${colors.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}
${colors.bold}  INNOMA Pipeline${colors.reset}
${colors.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}
`);

  logDetail('自治体', `${config.municipalityName} (${config.municipalityId})`);
  logDetail('都道府県', config.prefecture);
  if (config.officialUrl) {
    logDetail('公式URL', config.officialUrl);
  }
  if (config.services) {
    logDetail('サービス', config.services.join(', '));
  }
  logDetail('自動承認', config.autoApprove ? `有効 (閾値: ${config.autoApproveThreshold})` : '無効');
  if (config.freeTierMode) {
    const limits = config.freeTierLimits || {};
    log('\n   💰 無料枠モード: API使用量を制限します', colors.cyan);
    logDetail('検索API制限', `${limits.googleSearchQueries || 10}回/日`);
    logDetail('Gemini API制限', `${limits.geminiRequestsPerDay || 50}回/日`);
  }
  if (config.dryRun) {
    log('\n   ⚠️  ドライランモード: 実際の変更は行いません', colors.yellow);
  }

  const result = await runPipeline(config, createEventHandler());

  console.log(`
${colors.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}
`);

  if (result.status === 'completed') {
    log('✅ パイプライン完了', colors.green);
  } else if (result.status === 'failed') {
    log('❌ パイプライン失敗', colors.red);
    process.exit(1);
  }
}

/**
 * メイン
 */
async function main(): Promise<void> {
  const { command, options } = parseArgs(process.argv.slice(2));

  switch (command) {
    case 'run':
      await runCommand(options);
      break;

    case 'create':
      // createのみ実行
      options.services = '';
      await runCommand(options);
      break;

    case 'fetch':
      // 既存自治体に対してfetchのみ
      await runCommand(options);
      break;

    case 'list':
      await listMunicipalities();
      break;

    case 'services':
      listServices();
      break;

    case 'help':
    default:
      showHelp();
      break;
  }
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
