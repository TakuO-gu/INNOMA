#!/usr/bin/env npx tsx
/**
 * LLMプロンプト比較テスト
 * 現在のプロンプトと簡潔版を比較（複数パターン）
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// .env.local を読み込む
config({ path: resolve(__dirname, '../.env.local') });

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const MODEL = 'gemini-2.0-flash';

interface TestResult {
  name: string;
  prompt: string;
  promptLength: number;
  response: string;
  responseTime: number;
  success: boolean;
}

async function callGemini(prompt: string, temperature = 0.3): Promise<{ text: string; time: number }> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_GEMINI_API_KEY is not set');

  const url = `${GEMINI_API_URL}/${MODEL}:generateContent?key=${apiKey}`;
  const start = Date.now();

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature, maxOutputTokens: 2048 },
    }),
  });

  const data = await response.json();
  const time = Date.now() - start;

  if (data.error) throw new Error(data.error.message);
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  return { text, time };
}

// ============================================================================
// テストケース定義
// ============================================================================

interface TestCase {
  name: string;
  category: string;
  currentPrompt: string;
  simplePrompt: string;
}

const testCases: TestCase[] = [
  // テスト1: 検索クエリ生成（国民健康保険）
  {
    name: '国民健康保険',
    category: '検索クエリ生成',
    currentPrompt: `あなたは日本の自治体サービス情報を検索するアシスタントです。

以下の情報を取得するための最適なGoogle検索クエリを生成してください。

自治体名: 高岡市
サービス: 国民健康保険
取得したい情報:
- 担当課の電話番号
- 担当課の住所
- 保険料の上限額

要件:
- 検索クエリは1行のみ出力
- 公式サイトが見つかりやすいキーワードを使用
- 一般的な表現を使用（専門用語は避ける）
- 「site:」指定は含めない

出力: 検索クエリのみ（説明不要）`,
    simplePrompt: `高岡市 国民健康保険の公式情報を検索するクエリを生成。
取得対象: 担当課の電話番号, 担当課の住所, 保険料の上限額
出力: 検索クエリのみ（1行）`,
  },

  // テスト2: 検索クエリ生成（住民票）
  {
    name: '住民票の写し',
    category: '検索クエリ生成',
    currentPrompt: `あなたは日本の自治体サービス情報を検索するアシスタントです。

以下の情報を取得するための最適なGoogle検索クエリを生成してください。

自治体名: 横浜市
サービス: 住民票の写し
取得したい情報:
- 手数料
- 必要書類
- 受付時間

要件:
- 検索クエリは1行のみ出力
- 公式サイトが見つかりやすいキーワードを使用
- 一般的な表現を使用（専門用語は避ける）
- 「site:」指定は含めない

出力: 検索クエリのみ（説明不要）`,
    simplePrompt: `横浜市 住民票の写しの公式情報を検索するクエリを生成。
取得対象: 手数料, 必要書類, 受付時間
出力: 検索クエリのみ（1行）`,
  },

  // テスト3: 検索クエリ生成（児童手当）
  {
    name: '児童手当',
    category: '検索クエリ生成',
    currentPrompt: `あなたは日本の自治体サービス情報を検索するアシスタントです。

以下の情報を取得するための最適なGoogle検索クエリを生成してください。

自治体名: 大阪市
サービス: 児童手当
取得したい情報:
- 支給額
- 所得制限
- 申請方法

要件:
- 検索クエリは1行のみ出力
- 公式サイトが見つかりやすいキーワードを使用
- 一般的な表現を使用（専門用語は避ける）
- 「site:」指定は含めない

出力: 検索クエリのみ（説明不要）`,
    simplePrompt: `大阪市 児童手当の公式情報を検索するクエリを生成。
取得対象: 支給額, 所得制限, 申請方法
出力: 検索クエリのみ（1行）`,
  },

  // テスト4: 情報抽出（国民健康保険）
  {
    name: '国民健康保険',
    category: '情報抽出',
    currentPrompt: `以下のWebページから、指定された情報を抽出してください。

【Webページ内容】
国民健康保険のご案内

お問い合わせ先
保険年金課 国保係
電話：0766-20-1234
FAX：0766-20-1235
〒933-8601 富山県高岡市広小路7番50号

令和6年度の保険料について
医療分の賦課限度額：65万円
後期高齢者支援金分の賦課限度額：22万円
介護分の賦課限度額：17万円

受付時間
平日8:30〜17:15（土日祝日を除く）

【抽出する情報】
- kokuho_department: 担当課・部署名 (例: 市民課, 保険年金課)
- kokuho_phone: 電話番号 (形式: XX-XXXX-XXXX)
- kokuho_limit_medical: 医療分上限額

【出力形式】
JSON形式で出力してください。
情報が見つからない場合は null としてください。
値は正確に抽出し、余分な説明は含めないでください。

{
  "kokuho_department": "値またはnull",
  "kokuho_phone": "値またはnull",
  "kokuho_limit_medical": "値またはnull"
}`,
    simplePrompt: `ページから以下を抽出しJSON出力。見つからなければnull。
- kokuho_department: 担当課名
- kokuho_phone: 電話番号
- kokuho_limit_medical: 医療分上限額

ページ:
国民健康保険のご案内

お問い合わせ先
保険年金課 国保係
電話：0766-20-1234
FAX：0766-20-1235
〒933-8601 富山県高岡市広小路7番50号

令和6年度の保険料について
医療分の賦課限度額：65万円
後期高齢者支援金分の賦課限度額：22万円
介護分の賦課限度額：17万円

受付時間
平日8:30〜17:15（土日祝日を除く）`,
  },

  // テスト5: 情報抽出（住民票）
  {
    name: '住民票の写し',
    category: '情報抽出',
    currentPrompt: `以下のWebページから、指定された情報を抽出してください。

【Webページ内容】
住民票の写しの交付

交付手数料
住民票の写し（1通）：300円
住民票記載事項証明書（1通）：300円

必要なもの
・本人確認書類（運転免許証、マイナンバーカード等）
・印鑑（認印可）

届出窓口
市民課 住民係
電話：045-123-4567
受付時間：月〜金 8:30-17:00

【抽出する情報】
- juminhyo_fee: 住民票の写しの手数料
- juminhyo_documents: 必要書類
- juminhyo_department: 担当課名

【出力形式】
JSON形式で出力してください。
情報が見つからない場合は null としてください。
値は正確に抽出し、余分な説明は含めないでください。

{
  "juminhyo_fee": "値またはnull",
  "juminhyo_documents": "値またはnull",
  "juminhyo_department": "値またはnull"
}`,
    simplePrompt: `ページから以下を抽出しJSON出力。見つからなければnull。
- juminhyo_fee: 住民票の写しの手数料
- juminhyo_documents: 必要書類
- juminhyo_department: 担当課名

ページ:
住民票の写しの交付

交付手数料
住民票の写し（1通）：300円
住民票記載事項証明書（1通）：300円

必要なもの
・本人確認書類（運転免許証、マイナンバーカード等）
・印鑑（認印可）

届出窓口
市民課 住民係
電話：045-123-4567
受付時間：月〜金 8:30-17:00`,
  },

  // テスト6: 情報抽出（ゴミ収集）
  {
    name: 'ゴミ収集',
    category: '情報抽出',
    currentPrompt: `以下のWebページから、指定された情報を抽出してください。

【Webページ内容】
家庭ごみの出し方

燃えるごみ
収集日：毎週月・木曜日
出す時間：朝8時まで
指定袋：市指定の黄色い袋（45リットル 10枚入り 400円）

燃えないごみ
収集日：毎月第2・第4水曜日
出す時間：朝8時まで
指定袋：市指定の青い袋

お問い合わせ
環境政策課 廃棄物対策係
電話：03-9876-5432

【抽出する情報】
- gomi_moeru_day: 燃えるごみの収集日
- gomi_bag_price: 指定袋の価格
- gomi_department: 担当課名

【出力形式】
JSON形式で出力してください。
情報が見つからない場合は null としてください。
値は正確に抽出し、余分な説明は含めないでください。

{
  "gomi_moeru_day": "値またはnull",
  "gomi_bag_price": "値またはnull",
  "gomi_department": "値またはnull"
}`,
    simplePrompt: `ページから以下を抽出しJSON出力。見つからなければnull。
- gomi_moeru_day: 燃えるごみの収集日
- gomi_bag_price: 指定袋の価格
- gomi_department: 担当課名

ページ:
家庭ごみの出し方

燃えるごみ
収集日：毎週月・木曜日
出す時間：朝8時まで
指定袋：市指定の黄色い袋（45リットル 10枚入り 400円）

燃えないごみ
収集日：毎月第2・第4水曜日
出す時間：朝8時まで
指定袋：市指定の青い袋

お問い合わせ
環境政策課 廃棄物対策係
電話：03-9876-5432`,
  },
];

// ============================================================================
// 実行
// ============================================================================

async function runTest(name: string, prompt: string): Promise<TestResult> {
  try {
    const { text, time } = await callGemini(prompt);
    return {
      name,
      prompt,
      promptLength: prompt.length,
      response: text.trim(),
      responseTime: time,
      success: true,
    };
  } catch (error) {
    return {
      name,
      prompt,
      promptLength: prompt.length,
      response: String(error),
      responseTime: 0,
      success: false,
    };
  }
}

async function main() {
  console.log('='.repeat(80));
  console.log('LLMプロンプト比較テスト（複数パターン）');
  console.log('='.repeat(80));

  const results: {
    testCase: TestCase;
    current: TestResult;
    simple: TestResult;
  }[] = [];

  for (const testCase of testCases) {
    console.log(`\n## ${testCase.category}: ${testCase.name}\n`);

    const current = await runTest('現在のプロンプト', testCase.currentPrompt);
    console.log(`【現在のプロンプト】`);
    console.log(`プロンプト長: ${current.promptLength}文字`);
    console.log(`応答時間: ${current.responseTime}ms`);
    console.log(`結果: ${current.response.slice(0, 200)}${current.response.length > 200 ? '...' : ''}`);
    console.log();

    await new Promise((r) => setTimeout(r, 1000)); // レート制限対策

    const simple = await runTest('簡潔版プロンプト', testCase.simplePrompt);
    console.log(`【簡潔版プロンプト】`);
    console.log(`プロンプト長: ${simple.promptLength}文字`);
    console.log(`応答時間: ${simple.responseTime}ms`);
    console.log(`結果: ${simple.response.slice(0, 200)}${simple.response.length > 200 ? '...' : ''}`);
    console.log();

    results.push({ testCase, current, simple });

    await new Promise((r) => setTimeout(r, 1000)); // レート制限対策
  }

  // サマリー
  console.log('='.repeat(80));
  console.log('## 総合サマリー');
  console.log('='.repeat(80));

  // カテゴリ別集計
  const queryResults = results.filter((r) => r.testCase.category === '検索クエリ生成');
  const extractResults = results.filter((r) => r.testCase.category === '情報抽出');

  console.log('\n### 検索クエリ生成');
  console.log(`| テスト | 現在(文字) | 簡潔版(文字) | 削減率 | 現在(ms) | 簡潔版(ms) |`);
  console.log(`|--------|-----------|-------------|--------|----------|-----------|`);
  for (const r of queryResults) {
    const reduction = Math.round((1 - r.simple.promptLength / r.current.promptLength) * 100);
    console.log(
      `| ${r.testCase.name} | ${r.current.promptLength} | ${r.simple.promptLength} | ${reduction}% | ${r.current.responseTime} | ${r.simple.responseTime} |`
    );
  }
  const avgQueryReduction =
    Math.round(
      (queryResults.reduce((sum, r) => sum + (1 - r.simple.promptLength / r.current.promptLength), 0) /
        queryResults.length) *
        100
    );
  console.log(`| **平均** | - | - | **${avgQueryReduction}%** | - | - |`);

  console.log('\n### 情報抽出');
  console.log(`| テスト | 現在(文字) | 簡潔版(文字) | 削減率 | 現在(ms) | 簡潔版(ms) |`);
  console.log(`|--------|-----------|-------------|--------|----------|-----------|`);
  for (const r of extractResults) {
    const reduction = Math.round((1 - r.simple.promptLength / r.current.promptLength) * 100);
    console.log(
      `| ${r.testCase.name} | ${r.current.promptLength} | ${r.simple.promptLength} | ${reduction}% | ${r.current.responseTime} | ${r.simple.responseTime} |`
    );
  }
  const avgExtractReduction =
    Math.round(
      (extractResults.reduce((sum, r) => sum + (1 - r.simple.promptLength / r.current.promptLength), 0) /
        extractResults.length) *
        100
    );
  console.log(`| **平均** | - | - | **${avgExtractReduction}%** | - | - |`);

  console.log('\n### 品質比較（目視確認用）');
  for (const r of results) {
    console.log(`\n#### ${r.testCase.category}: ${r.testCase.name}`);
    console.log(`現在版: ${r.current.response.slice(0, 150)}`);
    console.log(`簡潔版: ${r.simple.response.slice(0, 150)}`);
  }
}

main().catch(console.error);
