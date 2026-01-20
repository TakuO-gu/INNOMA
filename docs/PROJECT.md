# INNOMA プロジェクト概要

**最終更新**: 2026-01-20

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
│       │   ├── admin/            # 管理画面（これから実装）
│       │   └── api/              # API Routes
│       ├── components/
│       │   ├── blocks/           # DADSブロックコンポーネント
│       │   └── admin/            # 管理画面コンポーネント（これから実装）
│       ├── lib/
│       │   ├── artifact/         # Artifact読み込み（実装済み）
│       │   ├── llm/              # LLM情報取得（これから実装）
│       │   └── template/         # テンプレート処理（これから実装）
│       └── data/
│           └── artifacts/
│               ├── _templates/   # ベーステンプレート（これから整理）
│               ├── _drafts/      # 下書き保存（これから実装）
│               └── sample/       # サンプル自治体（実装済み）
├── packages/
│   └── schema/                   # 共通スキーマ定義
├── docs/                         # 詳細ドキュメント
│   ├── PROJECT.md                # このファイル
│   ├── REQUIREMENTS.md           # 要件定義書
│   ├── LLM_FETCHER_SPEC.md       # LLM情報取得仕様
│   ├── TEMPLATE_VARIABLES.md     # テンプレート変数定義
│   ├── ADMIN_PANEL_SPEC.md       # 管理画面設計
│   ├── API_REFERENCE.md          # API仕様
│   ├── DATA_STRUCTURES.md        # データ構造定義
│   └── IMPLEMENTATION_PLAN.md    # 実装計画
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
| デプロイ | Vercel |

---

## 実装状況

### ✅ 実装済み
- 市民向けフロントエンド（/[municipality]/*）
- DADSブロックコンポーネント
- Artifact読み込み・レンダリング
- 全文検索
- sampleテンプレート（15トピック、約110ページ）

### 🚧 これから実装
1. **管理画面** → [ADMIN_PANEL_SPEC.md](ADMIN_PANEL_SPEC.md)
2. **LLM情報取得** → [LLM_FETCHER_SPEC.md](LLM_FETCHER_SPEC.md)
3. **テンプレートシステム** → [TEMPLATE_VARIABLES.md](TEMPLATE_VARIABLES.md)

---

## 主要ファイル

### Artifact関連
- `apps/web/lib/artifact/index.ts` - Artifact読み込みのエントリーポイント
- `apps/web/lib/artifact/schema.ts` - Zodスキーマ定義
- `apps/web/lib/artifact/types.ts` - TypeScript型定義

### コンポーネント
- `apps/web/components/blocks/BlockRenderer.tsx` - ブロックレンダラー
- `apps/web/components/blocks/dads/` - DA-DS準拠コンポーネント

### データ
- `apps/web/data/artifacts/sample/` - サンプルテンプレート
- `apps/web/data/artifacts/sample/index.json` - トップページ
- `apps/web/data/artifacts/sample/topics/` - 15トピックハブページ
- `apps/web/data/artifacts/sample/services/` - サービス詳細ページ

---

## 環境変数

```env
# LLM
GEMINI_API_KEY=xxx

# Web検索
GOOGLE_CUSTOM_SEARCH_API_KEY=xxx
GOOGLE_CUSTOM_SEARCH_ENGINE_ID=xxx

# オプション
ARTIFACT_STORAGE_PATH=./data/artifacts
```

---

## テンプレート変数

テンプレートでは `{{variable_name}}` 形式の変数を使用。
全353変数の定義は [TEMPLATE_VARIABLES.md](TEMPLATE_VARIABLES.md) を参照。

### 主要な変数カテゴリ
- 基本情報: `municipality_name`, `city_hall_*`
- 部署連絡先: `{prefix}_department`, `{prefix}_phone`, `{prefix}_email`
- 料金: `juminhyo_fee`, `koseki_fee`, etc.
- URL: `*_url`

---

## LLM情報取得フロー

```
1. 検索クエリ生成（Gemini）
   └─ 「青ヶ島村 国民健康保険 電話番号」

2. Google Custom Search実行
   └─ スニペット + URL取得

3. 判断（Gemini）
   └─ スニペットで十分か、ページ取得必要か

4. 情報抽出（Gemini）
   └─ 構造化データとして抽出

5. 下書き保存
   └─ _drafts/{municipality}/{service}.json

6. 管理者が承認
   └─ 本番Artifactに反映
```

詳細は [LLM_FETCHER_SPEC.md](LLM_FETCHER_SPEC.md) を参照。

---

## 管理画面

### 画面構成
```
/admin
├── /                     # ダッシュボード（自治体一覧）
├── /municipalities/new   # 新規自治体追加
├── /municipalities/[id]  # 自治体詳細・編集
├── /drafts               # 下書き一覧
└── /drafts/[id]          # 下書き承認
```

### API
```
GET/POST  /api/admin/municipalities
GET/PUT   /api/admin/municipalities/[id]
POST      /api/admin/municipalities/[id]/fetch
GET       /api/admin/drafts
POST      /api/admin/drafts/[id]/approve
```

詳細は [ADMIN_PANEL_SPEC.md](ADMIN_PANEL_SPEC.md) を参照。

---

## 注意事項

### アーカイブ済みコード
`archive/` ディレクトリにはスクレイピングパイプライン関連のコードが保存されています。
現在はテンプレートベース運用に移行したため**参照不要**です。

### 変数の検証
LLMが取得した値は以下のルールで検証:
- 電話番号: `^\d{2,5}-\d{2,4}-\d{4}$`
- メール: `^[\w.-]+@[\w.-]+\.[a-z]{2,}$`
- URL: `^https?://`
- 金額: `^[\d,]+円$`
