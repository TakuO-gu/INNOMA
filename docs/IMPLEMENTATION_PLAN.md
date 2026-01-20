# 実装計画

**作成日**: 2026-01-20

---

## 概要

INNOMAの残り実装タスクを優先度順に整理。

---

## Phase 1: 基盤整備

### 1.1 テンプレートシステム整備

**目的**: sampleテンプレートを_templatesに移動し、変数管理の基盤を作る

**タスク**:
- [x] `data/artifacts/_templates/` ディレクトリ作成
- [x] `data/artifacts/sample/` を `_templates/` にコピー
- [x] 変数値ストア構造を定義 (`variables.json`)
- [x] テンプレート複製関数の実装 (`lib/template/clone.ts`)
- [x] 変数置換関数の実装 (`lib/template/replace.ts`)

**ファイル**:
```
apps/web/
├── lib/
│   └── template/
│       ├── index.ts
│       ├── clone.ts      # テンプレート複製
│       ├── replace.ts    # 変数置換
│       └── types.ts
└── data/artifacts/
    └── _templates/       # ベーステンプレート
```

---

### 1.2 管理画面 - 基本UI

**目的**: 自治体一覧と基本操作ができる管理画面

**タスク**:
- [x] `/admin` レイアウト作成
- [x] ダッシュボード（自治体一覧）
- [x] 新規自治体追加フォーム
- [x] 自治体詳細（変数一覧表示）

**ファイル**:
```
apps/web/app/admin/
├── layout.tsx
├── page.tsx                    # ダッシュボード
├── municipalities/
│   ├── page.tsx                # 一覧
│   ├── new/page.tsx            # 新規追加
│   └── [id]/page.tsx           # 詳細
└── components/
    ├── AdminHeader.tsx
    ├── MunicipalityTable.tsx
    ├── MunicipalityForm.tsx
    └── VariableTable.tsx
```

**API**:
```
apps/web/app/api/admin/
├── municipalities/
│   ├── route.ts               # GET: 一覧, POST: 追加
│   └── [id]/
│       └── route.ts           # GET: 詳細, PUT: 更新, DELETE: 削除
```

---

## Phase 2: LLM情報取得

### 2.1 LLM Fetcher 基盤

**目的**: Google Custom Search + Gemini で情報を取得する基盤

**タスク**:
- [x] Google Custom Search クライアント実装
- [x] Gemini クライアント実装
- [x] 検索クエリ生成プロンプト
- [x] 情報抽出プロンプト
- [x] 検証ロジック（電話番号、メール等）

**ファイル**:
```
apps/web/lib/llm/
├── index.ts
├── google-search.ts    # Custom Search API
├── gemini.ts           # Gemini API
├── prompts/
│   ├── query-generator.ts
│   └── extractor.ts
├── validators.ts       # 形式検証
└── types.ts
```

---

### 2.2 情報取得フロー

**目的**: 自治体追加時に情報を自動取得

**タスク**:
- [x] 取得対象変数の優先度リスト作成
- [x] サービス別の検索クエリテンプレート
- [x] 取得→下書き保存フロー
- [x] エラーハンドリング・リトライ

**ファイル**:
```
apps/web/lib/llm/
├── fetcher.ts          # メインの取得ロジック
├── variable-priority.ts # 優先度リスト
└── query-templates.ts  # サービス別クエリ
```

---

### 2.3 下書きシステム

**目的**: LLM取得結果を下書きとして保存・管理

**タスク**:
- [x] 下書きデータ構造定義
- [x] 下書き保存・読み込み
- [x] 差分検出ロジック
- [x] 管理画面での下書き表示

**ファイル**:
```
apps/web/
├── lib/
│   └── drafts/
│       ├── index.ts
│       ├── storage.ts
│       └── diff.ts
├── app/admin/
│   └── drafts/
│       ├── page.tsx            # 一覧
│       └── [id]/page.tsx       # 詳細・承認
└── data/artifacts/
    └── _drafts/                # 下書き保存
```

---

## Phase 3: 運用機能

### 3.1 承認ワークフロー

**タスク**:
- [x] 承認/却下API
- [x] 承認時のArtifact更新
- [x] ISR再検証トリガー

### 3.2 手動編集

**タスク**:
- [x] 変数値の直接編集UI
- [x] 編集履歴の記録

### 3.3 定期更新

**タスク**:
- [x] Vercel Cron設定
- [x] 更新対象の自動判定
- [x] 差分通知

---

## 実装順序

```
Week 1: Phase 1.1 (テンプレートシステム)
        ↓
Week 2: Phase 1.2 (管理画面基本UI)
        ↓
Week 3: Phase 2.1 (LLM Fetcher基盤)
        ↓
Week 4: Phase 2.2 + 2.3 (取得フロー + 下書き)
        ↓
Week 5: Phase 3 (運用機能)
```

---

## 各フェーズの完了条件

### Phase 1 完了条件
- [x] 管理画面で自治体一覧が表示される
- [x] 新規自治体を追加できる（テンプレート複製）
- [x] 自治体の変数一覧が表示される

### Phase 2 完了条件
- [x] 自治体追加時にLLMが情報を取得する
- [x] 取得結果が下書きとして保存される
- [x] 下書きを確認・承認できる

### Phase 3 完了条件
- [x] 変数を手動で編集できる
- [x] 定期的に情報が更新される
- [x] 変更があれば通知される

---

## 技術的な決定事項

| 項目 | 決定 |
|------|------|
| 状態管理 | React Server Components + Server Actions |
| フォーム | React Hook Form は不使用、Server Actions |
| スタイリング | Tailwind CSS（DA-DS tokens使用） |
| API | Route Handlers |
| データ保存 | ファイルシステム（JSON） |
| 認証 | 開発中は認証なし |

---

## 注意事項

### API キー管理
- `GEMINI_API_KEY` と `GOOGLE_CUSTOM_SEARCH_API_KEY` は `.env.local` で管理
- Vercelにも環境変数として設定

### レート制限
- Google Custom Search: 100クエリ/日（無料枠）
- Gemini: 60リクエスト/分
- 大量取得時はキューイング必要

### テスト
- 各フェーズでユニットテスト追加
- LLM部分はモック可能な設計に
