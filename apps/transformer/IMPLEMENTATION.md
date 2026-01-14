# LLM Transformer Implementation Summary

## 実装完了 ✅

INNOMA LLM Transformerの実装が完了しました。

## アーキテクチャ

```
Crawler Output (JSON) → LLM Transformer → Structured Municipal Data (JSON)
```

## 主要コンポーネント

### 1. Zodスキーマ定義 ([schemas.ts](src/schemas.ts))
- NewsItem, EventItem, ProcedureItem, FacilityItem, ContactItem, EmergencyItem
- MunicipalStructuredData（全体のデータ構造）
- 型安全性を保証

### 2. MunicipalDataTransformer ([transformer.ts](src/transformer.ts))
- LLMを使用してクローラー出力を構造化JSONに変換
- OpenAI GPT-4o / Anthropic Claude対応
- 日付正規化、カテゴリ分類、重要度判定を自動実行

### 3. CLI ([cli.ts](src/cli.ts))
- 単一ファイル変換
- ディレクトリ一括変換
- 詳細なログ出力とサマリー表示

## 使用方法

### インストール

```bash
cd apps/transformer
npm install
npm run build
```

### 環境変数設定

```bash
cp .env.example .env
# .envファイルにAPI keyを設定
OPENAI_API_KEY=your_key_here
# または
ANTHROPIC_API_KEY=your_key_here
```

### 実行例

```bash
# Playwrightクローラーの出力を変換
node dist/cli.js -i ../crawler/playwright/crawler-output/crawl-results.json -o structured-utashinai.json -v

# Firecrawlクローラーの出力を一括変換
node dist/cli.js --input-dir ../crawler/firecrowl/outputs/pages --output-dir ./structured-output -v
```

## 出力例

```json
{
  "metadata": {
    "sourceUrl": "https://www.city.utashinai.hokkaido.jp/",
    "extractedAt": "2025-11-25T10:30:00.000Z",
    "municipality": "歌志内市",
    "prefecture": "北海道",
    "confidence": 0.85,
    "llmModel": "gpt-4o",
    "processingTimeMs": 5432
  },
  "news": [
    {
      "title": "市役所年末年始の休業について",
      "date": "2024-12-15",
      "category": "お知らせ",
      "importance": "medium",
      "content": "...",
      "url": "https://..."
    }
  ],
  "events": [...],
  "procedures": [...],
  "facilities": [...],
  "contacts": [...],
  "emergencyInfo": []
}
```

## 技術詳細

### LLMプロンプト設計
- 日本の自治体サイト特化の指示
- 日付正規化ルール（令和→西暦変換）
- カテゴリ自動分類
- 重要度自動判定

### エラーハンドリング
- LLM APIエラー時のリトライ
- JSONパースエラー時のフォールバック
- バッチ処理時の部分的成功対応

### パフォーマンス
- トークン制限対策（20,000文字まで）
- バッチ処理時のレート制限対応（1秒待機）

## 次のステップ

1. **実データでのテスト**: 歌志内市のクローラー出力で変換テスト
2. **UIマッパーの実装**: 構造化JSONをDA-DSコンポーネントにマッピング
3. **APIゲートウェイ統合**: REST API経由でのデータアクセス

## ファイル構成

```
apps/transformer/
├── src/
│   ├── schemas.ts      # Zodスキーマ定義
│   ├── transformer.ts  # コア変換ロジック
│   ├── cli.ts          # CLIインターフェース
│   └── index.ts        # エクスポート
├── dist/               # ビルド出力
├── package.json
├── tsconfig.json
├── README.md
└── IMPLEMENTATION.md   # このファイル
```

## パイプライン統合状態

```
[✅ Crawler] → [✅ Transformer] → [⏳ UI Mapper] → [⏳ Next.js] → [⏳ CDN]
```

実装日: 2025-11-25