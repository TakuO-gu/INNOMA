# INNOMA プロジェクト概要

**最終更新**: 2026-01-27

---

## 概要

INNOMAは、自治体WebサイトをDA-DS（デジタル庁デザインシステム）準拠でリニューアルするための基盤。

**コアコンセプト**:
- テンプレートベースで自治体サイトを生成
- LLM + Web検索APIで自治体固有情報を自動取得
- 統一されたUIで市民が迷わず情報にアクセス

---

## アーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│                     apps/web (Next.js 15)                    │
├─────────────────────────────────────────────────────────────┤
│  /[municipality]/*    │  /admin/*        │  /api/*          │
│  (市民向けページ)      │  (管理画面)       │  (API Routes)    │
├─────────────────────────────────────────────────────────────┤
│                        lib/                                  │
│  artifact/  │  llm/  │  template/  │  storage/              │
├─────────────────────────────────────────────────────────────┤
│                    data/artifacts/                           │
│  _templates/  │  _drafts/  │  {municipality}/               │
└─────────────────────────────────────────────────────────────┘
```

---

## ディレクトリ構造

```
INNOMA/
├── CLAUDE.md                     # Claude Code設定
├── apps/
│   └── web/                      # Next.js アプリ（唯一のアクティブアプリ）
│       ├── app/
│       │   ├── [municipality]/   # 市民向け動的ルート
│       │   │   ├── layout.tsx    # 共通ヘッダー付きレイアウト
│       │   │   ├── search/       # 自治体内検索
│       │   │   └── [[...path]]/  # ページ表示
│       │   ├── admin/            # 管理画面
│       │   │   ├── municipalities/  # 自治体管理
│       │   │   ├── drafts/       # 下書き管理
│       │   │   └── notifications/   # 通知一覧
│       │   └── api/
│       │       └── admin/        # 管理用API
│       ├── components/
│       │   ├── blocks/           # BlockRenderer（DADSコンポーネント統合済み）
│       │   ├── dads/             # DADSコンポーネント（Tailwind版）
│       │   └── layout/           # レイアウトコンポーネント
│       ├── lib/
│       │   ├── artifact/         # Artifact読み込み・変数置換
│       │   ├── llm/              # LLM情報取得システム
│       │   ├── template/         # テンプレート複製・変数管理
│       │   ├── drafts/           # 下書き管理
│       │   ├── jobs/             # ジョブ状態管理
│       │   ├── history/          # 編集履歴
│       │   ├── notification/     # 通知システム
│       │   ├── search/           # 自治体内検索
│       │   └── pdf/              # PDF OCR（Vision API）
│       └── data/
│           └── artifacts/
│               ├── _templates/   # ベーステンプレート
│               ├── _drafts/      # 下書き保存
│               ├── _jobs/        # ジョブ状態
│               ├── sample/       # サンプル自治体
│               └── {municipality}/ # 各自治体データ
├── docs/                         # 詳細ドキュメント
│   ├── PROJECT.md                # このファイル
│   ├── REQUIREMENTS.md           # 要件定義書
│   ├── LLM_FETCHER_SPEC.md       # LLM情報取得仕様
│   ├── TEMPLATE_VARIABLES.md     # テンプレート変数定義
│   ├── ADMIN_PANEL_SPEC.md       # 管理画面設計
│   ├── API_REFERENCE.md          # API仕様
│   ├── DATA_STRUCTURES.md        # データ構造定義
│   ├── UI_SPEC.md                # UI・CSS仕様
│   ├── IMPLEMENTATION_PLAN.md    # 実装計画
│   └── updates/                  # 更新履歴
└── archive/                      # アーカイブ済みコード（参照不要）
```

---

## 技術スタック

| カテゴリ | 技術 |
|----------|------|
| フレームワーク | Next.js 15 (App Router) |
| 言語 | TypeScript |
| スタイリング | Tailwind CSS + DA-DS Tokens |
| スキーマ検証 | Zod |
| LLM | Google Gemini |
| Web検索 | Google Custom Search API |
| PDF OCR | Google Vision API |
| デプロイ | Vercel |

---

## 実装状況

### ✅ Phase 1: 基盤整備（完了）
- テンプレートシステム（複製・変数置換）
- 管理画面基本UI（ダッシュボード、自治体一覧、詳細）
- 新規自治体追加フォーム

### ✅ Phase 2: LLM情報取得（完了）
- Google Custom Search + Gemini による自動取得
- 下書きシステム（作成・承認・却下）
- 検索クエリ生成・情報抽出プロンプト
- PDF/画像 OCR（Google Vision API）
- 情報取得リカバリー機能（中断・再開）

### ✅ Phase 3: 運用機能（完了）
- 承認ワークフロー + ISR再検証
- 変数の手動編集
- 編集履歴記録
- 通知システム（ベル + 一覧ページ）
- 定期更新（Vercel Cron）

### ✅ Phase 4: 市民向け機能（完了）
- 共通ヘッダー（INNOMA ロゴ、自治体名、検索バー）
- 自治体内検索
- 公開状態フィルタリング
- 変数の動的置換（表示時）

### ✅ Phase 5: UI/UX改善（完了）
- 下書き3分割ビュー（変数・サンプル・ソース）
- サービス単位での取得選択
- 取得状況サマリー表示
- DADSコンポーネントTailwind統一
- StepNavigation・NotificationBanner DADS準拠

### 🚧 今後の課題
- 認証機能（Vercel Password Protection等）
- 多言語対応
- 一括操作UI

---

## 主要ファイル

### Artifact関連
- `lib/artifact/index.ts` - Artifact読み込み・変数動的置換
- `lib/artifact/loader.ts` - 内部ローダー（variables.json参照）
- `lib/artifact/schema.ts` - Zodスキーマ定義

### テンプレート関連
- `lib/template/clone.ts` - テンプレート複製・変数抽出
- `lib/template/replace.ts` - 変数置換（JSONエスケープ対応）
- `lib/template/storage.ts` - 自治体データ操作

### LLM情報取得
- `lib/llm/fetcher.ts` - メイン取得ロジック
- `lib/llm/google-search.ts` - Custom Search APIクライアント
- `lib/llm/gemini.ts` - Gemini APIクライアント
- `lib/llm/page-fetcher.ts` - ページ取得・PDF OCR統合
- `lib/llm/variable-priority.ts` - 変数定義・説明（約200変数）

### PDF OCR
- `lib/pdf/vision-ocr.ts` - Google Vision API OCR
- `lib/pdf/cache.ts` - OCR結果キャッシュ

### 下書き・ジョブ管理
- `lib/drafts/storage.ts` - 下書き保存・読み込み
- `lib/jobs/storage.ts` - ジョブ状態管理（中断・再開）

### 履歴・通知
- `lib/history/storage.ts` - 編集履歴記録
- `lib/notification/storage.ts` - 通知管理

### コンポーネント
- `components/blocks/BlockRenderer.tsx` - ブロックレンダラー（全機能統合）
- `components/dads/` - DADSコンポーネント（Tailwind版）
- `components/layout/MunicipalityHeader.tsx` - 共通ヘッダー

### 管理画面
- `app/admin/municipalities/[id]/` - 自治体詳細（FetchButton, PublishButton等）
- `app/admin/drafts/[municipalityId]/[service]/` - 下書き詳細（3分割ビュー）
- `app/admin/notifications/` - 通知一覧

---

## 環境変数

```env
# Google APIs
GOOGLE_GEMINI_API_KEY=xxx          # Gemini API（LLM用）
GOOGLE_CUSTOM_SEARCH_API_KEY=xxx   # Custom Search API（ウェブ検索用）
GOOGLE_VISION_API_KEY=xxx          # Vision API（PDF OCR用）

# オプション
STORAGE_TYPE=local                 # local または s3
STORAGE_BASE_PATH=./data/artifacts
```

---

## テンプレート変数

テンプレートでは `{{variable_name}}` 形式の変数を使用。
変数総数は343個（テンプレートから動的に計算）。
全変数の定義は [TEMPLATE_VARIABLES.md](TEMPLATE_VARIABLES.md) を参照。

### サービス別変数（15カテゴリ）
| カテゴリ | 日本語名 | 変数数 |
|---------|---------|--------|
| registration | 届出・申請・証明書 | 29 |
| tax | 税金 | 13 |
| health | 健康・医療 | 37 |
| childcare | 子育て・保育 | 33 |
| welfare | 福祉 | 21 |
| environment | 環境・ごみ | 18 |
| disaster | 防災 | 20 |
| housing | 住宅・建築 | 20 |
| employment | 雇用・労働 | 21 |
| driving | 運転・車 | 17 |
| business | 事業・産業 | 13 |
| land | 土地・農林水産 | 29 |
| nationality | 外国人・国籍 | 29 |
| civic | 市民参加・選挙 | 28 |
| benefits | 年金・給付 | 6 |

---

## LLM情報取得フロー

```
1. 検索クエリ生成（Gemini）
   └─ 変数説明を参照して最適なクエリを生成

2. Google Custom Search実行
   └─ スニペット + URL取得

3. ページ取得
   └─ HTMLページ → テキスト抽出
   └─ PDF/画像 → Vision APIでOCR（キャッシュあり）

4. 情報抽出（Gemini）
   └─ 変数定義・例を参照して構造化抽出

5. 下書き保存
   └─ _drafts/{municipality}/{service}.json
   └─ 取得できなかった変数はmissingVariablesに記録

6. 管理者が承認
   └─ 本番Artifactに反映 + ISR再検証
```

### リカバリー機能
- 取得中断時はジョブ状態を`_jobs/{municipalityId}/latest.json`に保存
- 中断後にページを開くと「続きから再開」オプションを表示
- 完了済みサービスをスキップして再開可能

詳細は [LLM_FETCHER_SPEC.md](LLM_FETCHER_SPEC.md) を参照。

---

## 管理画面

### 画面構成
```
/admin
├── /                              # ダッシュボード
├── /municipalities                # 自治体一覧
├── /municipalities/new            # 新規追加
├── /municipalities/[id]           # 自治体詳細
│   ├── FetchButton                # 情報取得（サービス選択可）
│   ├── PublishButton              # 公開/非公開切替
│   ├── VariableTable              # 変数一覧（インライン編集）
│   ├── ServiceVariableStats       # サービス別進捗
│   └── HistoryTable               # 編集履歴
├── /drafts                        # 下書き一覧
├── /drafts/[municipalityId]/[service]  # 下書き詳細（3分割ビュー）
└── /notifications                 # 通知一覧
```

### API
```
GET/POST  /api/admin/municipalities
GET/PUT/DELETE  /api/admin/municipalities/[id]
POST      /api/admin/municipalities/[id]/fetch
GET       /api/admin/municipalities/[id]/fetch/status
PUT       /api/admin/municipalities/[id]/variables
GET       /api/admin/municipalities/[id]/history
GET       /api/admin/drafts
GET/PUT/DELETE  /api/admin/drafts/[municipalityId]/[service]
GET       /api/admin/notifications
```

詳細は [ADMIN_PANEL_SPEC.md](ADMIN_PANEL_SPEC.md) を参照。

---

## 注意事項

### アーカイブ済みコード
`archive/` ディレクトリにはスクレイピングパイプライン関連のコードが保存されています。
現在はテンプレートベース運用に移行したため**参照不要**です。

### 変数の検証
LLMが取得した値は以下のルールで検証（`lib/llm/validators.ts`）:
- 電話番号: `^\d{2,5}-\d{2,4}-\d{4}$`
- メール: `^[\w.-]+@[\w.-]+\.[a-z]{2,}$`
- URL: `^https?://`
- 金額: `^[\d,]+円$`
- 郵便番号: `^〒?\d{3}-\d{4}$`
- 日付: `^\d{4}年\d{1,2}月\d{1,2}日$`
- 時刻: `^\d{1,2}:\d{2}$`

### CSS戦略
- `@digital-go-jp/design-tokens` でデザイントークンを読み込み
- `@digital-go-jp/tailwind-theme-plugin` でTailwindに統合
- `components/dads/` は全てTailwindユーティリティクラスで実装
- HTML版DADS CSSは廃止済み（globals.cssから削除）

### 変数の動的置換
- ページ表示時に`variables.json`から変数値を取得
- JSONパース前にテキストレベルで置換（改行等はエスケープ）
- 未置換変数があればコンソールにログ出力
