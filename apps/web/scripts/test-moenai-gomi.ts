/**
 * 高岡市の燃えないごみ収集日（moenai_gomi_shushuhi）取得テスト
 * 管理画面と同じfetchServiceVariablesを使用
 * Usage: npx tsx scripts/test-moenai-gomi.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { fetchServiceVariables } from '../lib/llm/fetcher';

async function main() {
  console.log('=== 高岡市 moenai_gomi_shushuhi 取得テスト ===\n');
  console.log('fetchServiceVariables("高岡市", "environment", "https://www.city.takaoka.toyama.jp/") を実行中...\n');

  const startTime = Date.now();

  try {
    const result = await fetchServiceVariables(
      '高岡市',
      'environment',
      'https://www.city.takaoka.toyama.jp/'
    );

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n実行時間: ${elapsed}秒\n`);

    console.log('=== 取得結果 ===\n');
    console.log(`成功: ${result.success}`);
    console.log(`取得した変数数: ${result.variables.filter(v => v.value).length}`);
    console.log(`エラー数: ${result.errors.length}`);

    console.log('\n--- 変数一覧 ---\n');
    for (const v of result.variables) {
      if (v.value) {
        console.log(`✓ ${v.variableName}:`);
        console.log(`    値: ${v.value}`);
        console.log(`    確信度: ${(v.confidence * 100).toFixed(0)}%`);
        console.log(`    ソース: ${v.sourceUrl}`);
        console.log('');
      }
    }

    // moenai_gomi_shushuhi を特別に確認
    const moenaiGomi = result.variables.find(v => v.variableName === 'moenai_gomi_shushuhi');
    console.log('\n=== moenai_gomi_shushuhi 詳細 ===\n');
    if (moenaiGomi?.value) {
      console.log(`値: ${moenaiGomi.value}`);
      console.log(`確信度: ${(moenaiGomi.confidence * 100).toFixed(0)}%`);
      console.log(`ソースURL: ${moenaiGomi.sourceUrl}`);
      console.log(`抽出時刻: ${moenaiGomi.extractedAt}`);
    } else {
      console.log('取得できませんでした');
      if (result.searchAttempts?.moenai_gomi_shushuhi) {
        console.log('\n検索試行履歴:');
        for (const attempt of result.searchAttempts.moenai_gomi_shushuhi) {
          console.log(`  クエリ: ${attempt.query}`);
          console.log(`  結果: ${attempt.reason}`);
          console.log(`  URL数: ${attempt.resultsCount}`);
          if (attempt.urls) {
            console.log(`  URL例:`);
            for (const url of attempt.urls.slice(0, 3)) {
              console.log(`    - ${url}`);
            }
          }
          console.log('');
        }
      }
    }

    // 未取得変数を表示
    const missingVars = result.variables.filter(v => !v.value);
    if (missingVars.length > 0) {
      console.log('\n--- 未取得変数 ---\n');
      for (const v of missingVars) {
        console.log(`✗ ${v.variableName}`);
      }
    }

    // エラーを表示
    if (result.errors.length > 0) {
      console.log('\n--- エラー ---\n');
      for (const e of result.errors) {
        console.log(`${e.code}: ${e.message}`);
        if (e.variableName) {
          console.log(`  変数: ${e.variableName}`);
        }
      }
    }

  } catch (error) {
    console.error('エラーが発生しました:', error);
  }
}

main().catch(console.error);
