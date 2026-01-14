# INNOMA LLM Transformer

自治体サイトのクロールデータを構造化JSONに変換するLLMベースのトランスフォーマー

## 概要

INNOMAパイプラインの第2ステップとして、クローラーが収集した生データをLLM(GPT-4o/Claude)を使って構造化されたJSONに変換します。

## 処理フロー

```
Crawler Output (JSON/Markdown) → LLM Transformer → Structured JSON → UI Mapper
```

## 主な機能

### 📊 自治体情報の構造化抽出
- **ニュース・お知らせ**: タイトル、日付、カテゴリ、本文、重要度
- **イベント情報**: イベント名、開催日時、場所、申込方法、詳細
- **手続き・サービス**: 手続き名、必要書類、窓口、オンライン対応状況
- **施設情報**: 施設名、住所、電話番号、開館時間、休館日
- **連絡先**: 部署名、電話番号、FAX、メールアドレス、担当時間
- **緊急情報**: 災害情報、警報、避難所情報

### 🎯 LLMによるインテリジェント抽出
- 複雑なレイアウトからの情報抽出
- 日付表現の正規化（"令和6年"→"2024年"等）
- カテゴリの自動分類
- 重要度の自動判定
- 関連情報のリンク抽出

### 🔄 出力フォーマット
- **Zod Schema準拠**: 型安全な構造化データ
- **JSONスキーマバリデーション**: データ品質保証
- **メタデータ付与**: ソースURL、抽出日時、信頼度スコア

## 技術スタック

- **TypeScript**: 型安全な実装
- **LangChain**: LLMオーケストレーション
- **OpenAI GPT-4o / Anthropic Claude**: LLMエンジン
- **Zod**: スキーマバリデーション
- **LiteLLM**: マルチLLMサポート

## インストール

```bash
cd apps/transformer
npm install
```

## 環境変数

```bash
OPENAI_API_KEY=your_openai_key
# または
ANTHROPIC_API_KEY=your_anthropic_key

# オプション
LLM_MODEL=gpt-4o  # or claude-3-5-sonnet-20241022
```

## 使用方法

### CLI

```bash
# 単一ファイルの変換
npm run transform -- --input crawler-output/crawl-results.json --output structured-data.json

# ディレクトリ一括変換
npm run transform -- --input-dir crawler-output/ --output-dir structured-output/

# 詳細ログ付き
npm run transform -- --input data.json --output result.json --verbose
```

### プログラマティック使用

```typescript
import { MunicipalDataTransformer } from '@innoma/transformer';

const transformer = new MunicipalDataTransformer({
  model: 'gpt-4o',
  temperature: 0.1,
});

const crawledData = await readJSON('crawler-output.json');
const structuredData = await transformer.transform(crawledData);

console.log(structuredData.news); // 構造化されたニュース一覧
console.log(structuredData.events); // 構造化されたイベント一覧
```

## 出力JSONスキーマ

```typescript
interface MunicipalStructuredData {
  metadata: {
    sourceUrl: string;
    extractedAt: string;
    municipality: string;
    confidence: number;
  };
  news: NewsItem[];
  events: EventItem[];
  procedures: ProcedureItem[];
  facilities: FacilityItem[];
  contacts: ContactItem[];
  emergencyInfo: EmergencyItem[];
}
```

## ライセンス

MIT License