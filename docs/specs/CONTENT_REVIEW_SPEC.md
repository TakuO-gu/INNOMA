# コンテンツレビューシステム 設計書

**作成日**: 2026-02-04
**最終更新**: 2026-02-04

---

## 1. 概要

自治体Webサイトが更新された際に、INNOMAのコンテンツが古い情報を表示し続けることを防ぐシステム。

**基本動作**:
1. 各変数のソースURL（sourceUrl）のコンテンツハッシュを保存
2. 定期的にソースURLを再取得してハッシュを比較
3. 変更が検出された場合、その変数を使用しているページを「レビュー待ち」状態にする
4. 管理者がレビューして承認するまで、市民向けページでは非公開

---

## 2. データ構造

### 2.1 変数値の拡張（VariableValue）

`{municipality}/variables/*.json`

```typescript
interface VariableValue {
  value: string | null;
  source: "llm" | "manual" | "default";
  sourceUrl?: string;
  confidence?: number;
  updatedAt: string;

  // 新規追加: ソース変更検知用
  sourceContentHash?: string;      // ソースURLのコンテンツハッシュ（SHA-256）
  lastSourceCheckAt?: string;      // 最後にソースを確認した日時
  sourceChanged?: boolean;         // ソースが変更されたか（レビュー待ち）
  sourceChangedAt?: string;        // 変更が検出された日時
}
```

### 2.2 ページレビュー状態

`{municipality}/page-reviews.json`（新規）

ページ単位でレビュー状態を管理。

```typescript
interface PageReviewStore {
  [pagePath: string]: PageReviewStatus;
}

interface PageReviewStatus {
  status: "published" | "review_required" | "under_review";
  changedVariables: string[];      // 変更が検出された変数名リスト
  detectedAt: string;              // 変更検出日時
  reviewStartedAt?: string;        // レビュー開始日時
  reviewedAt?: string;             // レビュー完了日時
  reviewedBy?: string;             // レビュアー
}
```

### 2.3 ソースチェック結果

`_source-checks/{municipality}/latest.json`（新規）

最新のソースチェック結果を保存。

```typescript
interface SourceCheckResult {
  municipalityId: string;
  checkedAt: string;
  totalVariables: number;          // チェック対象の変数数
  changedVariables: SourceChange[]; // 変更が検出された変数
  errors: SourceCheckError[];       // チェック時のエラー
}

interface SourceChange {
  variableName: string;
  sourceUrl: string;
  oldHash: string;
  newHash: string;
  affectedPages: string[];         // この変数を使用しているページ
}

interface SourceCheckError {
  variableName: string;
  sourceUrl: string;
  error: string;
}
```

---

## 3. 変更検知フロー

```
1. 定期実行（Cron: 毎日 or 毎週）
   └─ /api/cron/check-source-changes

2. 対象変数の選定
   └─ sourceUrl があり、lastSourceCheckAt から一定期間経過した変数

3. ソースURL取得
   └─ page-fetcher.ts を使用（既存機能）
   └─ 取得したコンテンツのSHA-256ハッシュを計算

4. ハッシュ比較
   └─ sourceContentHash と新ハッシュを比較
   └─ 異なる場合は変更あり

5. 変更があった場合
   └─ 変数の sourceChanged = true に設定
   └─ この変数を使用しているページを特定
   └─ page-reviews.json に "review_required" として記録
   └─ 通知を送信

6. 管理者がレビュー
   └─ 既存の下書き詳細画面を流用
   └─ 新しい情報を取得して下書きを作成
   └─ 承認すると変数値が更新され、sourceChanged = false

7. ページ公開状態の復帰
   └─ 全ての changedVariables が解決されたらページを公開
```

---

## 4. 市民向けページのフィルタリング

### 4.1 フィルタリングロジック

`app/[municipality]/[[...path]]/page.tsx` で拡張。

```typescript
async function shouldShowPage(
  municipalityId: string,
  pagePath: string
): Promise<boolean> {
  // 1. 自治体が公開中かチェック
  const meta = await getMunicipalityMeta(municipalityId);
  if (meta.status !== "published") {
    return false;
  }

  // 2. ページがレビュー待ちかチェック
  const pageReview = await getPageReviewStatus(municipalityId, pagePath);
  if (pageReview?.status === "review_required" ||
      pageReview?.status === "under_review") {
    return false;
  }

  return true;
}
```

### 4.2 非公開ページの表示

レビュー待ちページにアクセスした場合の表示:

```
┌─────────────────────────────────────────────────────────┐
│ このページは現在更新中です                               │
│                                                         │
│ 自治体公式サイトの情報が更新された可能性があるため、     │
│ 内容を確認中です。                                       │
│                                                         │
│ 最新の情報は自治体公式サイトをご確認ください。           │
│ [公式サイトを開く]                                       │
│                                                         │
│ [トップページに戻る]                                     │
└─────────────────────────────────────────────────────────┘
```

---

## 5. 管理画面

### 5.1 レビュー待ちページ一覧

`/admin/reviews`（新規）

```
┌─────────────────────────────────────────────────────────────┐
│ ← 戻る    レビュー待ちページ一覧                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ソース変更が検出され、レビューが必要なページ                │
│                                                              │
│  ┌────────┬─────────────────┬───────────┬────────┬───────┐ │
│  │ 自治体  │ ページ          │ 変更変数数 │ 検出日  │ 操作  │ │
│  ├────────┼─────────────────┼───────────┼────────┼───────┤ │
│  │ 青ヶ島村│ /services/health│ 3件       │ 02/04  │ [確認]│ │
│  │ 三笠市  │ /services/tax   │ 1件       │ 02/03  │ [確認]│ │
│  └────────┴─────────────────┴───────────┴────────┴───────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 レビュー詳細画面

既存の下書き詳細画面（`/admin/drafts/[municipalityId]/[service]`）の3分割ビューを流用。

追加要素:
- 変更が検出されたソースURLの差分表示
- 「情報を再取得」ボタン
- 「変更なし（誤検知）」ボタン

### 5.3 自治体詳細での表示

`/admin/municipalities/[id]` にレビュー待ちページのサマリーを追加。

```
┌───────────────────────────────────────────────────────────┐
│ レビュー待ちページ: 2件                                    │
│ ┌──────────────────┬───────────┬────────────────────────┐│
│ │ /services/health │ 3変数     │ city_hall_phone 他    ││
│ │ /services/tax    │ 1変数     │ tax_office_hours      ││
│ └──────────────────┴───────────┴────────────────────────┘│
│ [すべてレビュー]                                          │
└───────────────────────────────────────────────────────────┘
```

---

## 6. API設計

### 6.1 新規エンドポイント

| メソッド | パス | 説明 |
|---------|------|------|
| GET | `/api/admin/reviews` | レビュー待ちページ一覧 |
| GET | `/api/admin/reviews/[municipalityId]` | 自治体のレビュー待ちページ |
| GET | `/api/admin/reviews/[municipalityId]/[...pagePath]` | ページのレビュー詳細 |
| POST | `/api/admin/reviews/[municipalityId]/[...pagePath]/refetch` | 情報再取得 |
| PUT | `/api/admin/reviews/[municipalityId]/[...pagePath]/approve` | レビュー承認 |
| PUT | `/api/admin/reviews/[municipalityId]/[...pagePath]/dismiss` | 誤検知として却下 |
| POST | `/api/cron/check-source-changes` | ソース変更チェック（Cron） |

### 6.2 レスポンス例

**GET /api/admin/reviews**

```json
{
  "reviews": [
    {
      "municipalityId": "aogashima",
      "municipalityName": "青ヶ島村",
      "pagePath": "services/health/kokuho",
      "pageTitle": "国民健康保険",
      "status": "review_required",
      "changedVariables": [
        {
          "name": "kokuho_phone",
          "sourceUrl": "https://...",
          "detectedAt": "2026-02-04T10:00:00Z"
        }
      ],
      "detectedAt": "2026-02-04T10:00:00Z"
    }
  ],
  "total": 1
}
```

---

## 7. 通知

### 7.1 新規通知タイプ

```typescript
type NotificationType =
  | // 既存...
  | "source_changed"      // ソース変更検出
  | "review_approved"     // レビュー承認
  | "review_dismissed";   // レビュー却下（誤検知）
```

### 7.2 通知内容

**source_changed**:
- 重要度: warning
- タイトル: 「ソース変更を検出」
- メッセージ: 「{自治体名}の{ページ名}で使用している情報のソースに変更がありました。確認してください。」

---

## 8. Cron設定

### 8.1 ソース変更チェック

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/check-source-changes",
      "schedule": "0 4 * * *"  // 毎日 4:00 AM
    }
  ]
}
```

### 8.2 チェック間隔の設定

自治体ごとに設定可能。

```typescript
interface MunicipalityMeta {
  // 既存...
  settings: {
    autoPublish: boolean;
    fetchInterval: FetchInterval;
    sourceCheckInterval: SourceCheckInterval; // 新規追加
  };
}

type SourceCheckInterval =
  | "disabled"    // チェックしない
  | "daily"       // 毎日
  | "weekly"      // 毎週（デフォルト）
  | "monthly";    // 毎月
```

---

## 9. 変数→ページのマッピング

### 9.1 マッピングの生成

テンプレートファイルをスキャンして、各変数がどのページで使用されているかをマッピング。

`_templates/variable-page-map.json`（自動生成）

```json
{
  "kokuho_phone": [
    "services/health/kokuho",
    "services/health/kokuho/application"
  ],
  "city_hall_phone": [
    "services/registration/juminhyo",
    "services/registration/inkan",
    "contact"
  ]
}
```

### 9.2 マッピング更新

テンプレート変更時に自動更新（ビルド時 or 起動時）。

---

## 10. 実装ファイル

### 10.1 新規ファイル

```
apps/web/
├── lib/
│   └── review/
│       ├── index.ts              # エクスポート
│       ├── types.ts              # 型定義
│       ├── storage.ts            # ページレビュー状態の保存・読み込み
│       ├── source-checker.ts     # ソース変更検知ロジック
│       └── variable-page-map.ts  # 変数→ページマッピング
├── app/
│   ├── admin/
│   │   └── reviews/
│   │       ├── page.tsx          # レビュー待ち一覧
│   │       └── [municipalityId]/
│   │           └── [...pagePath]/
│   │               └── page.tsx  # レビュー詳細
│   └── api/
│       ├── admin/
│       │   └── reviews/
│       │       ├── route.ts
│       │       └── [municipalityId]/
│       │           ├── route.ts
│       │           └── [...pagePath]/
│       │               ├── route.ts
│       │               ├── refetch/route.ts
│       │               ├── approve/route.ts
│       │               └── dismiss/route.ts
│       └── cron/
│           └── check-source-changes/
│               └── route.ts
└── data/
    └── artifacts/
        ├── _source-checks/       # ソースチェック結果
        │   └── {municipality}/
        │       └── latest.json
        └── {municipality}/
            └── page-reviews.json # ページレビュー状態
```

### 10.2 既存ファイルの変更

| ファイル | 変更内容 |
|---------|---------|
| `lib/template/types.ts` | `VariableValue`の拡張、`SourceCheckInterval`追加 |
| `lib/notification/types.ts` | 通知タイプ追加 |
| `lib/notification/storage.ts` | 通知関数追加 |
| `app/[municipality]/[[...path]]/page.tsx` | レビュー状態チェック追加 |
| `app/admin/layout.tsx` | ナビゲーションにレビュー追加 |
| `app/admin/municipalities/[id]/page.tsx` | レビュー待ちサマリー追加 |

---

## 11. 実装優先度

### Phase 1: 基盤（必須）
1. データ構造の拡張（types.ts）
2. ソース変更検知ロジック（source-checker.ts）
3. ページレビュー状態管理（storage.ts）
4. 変数→ページマッピング（variable-page-map.ts）

### Phase 2: フロントエンド（必須）
5. 市民向けページのフィルタリング拡張
6. 通知システムの拡張
7. Cron APIの実装

### Phase 3: 管理画面（必須）
8. レビュー待ち一覧ページ
9. レビュー詳細ページ（既存の下書き画面を流用）
10. 自治体詳細でのサマリー表示

### Phase 4: 改善（オプション）
11. 差分表示の改善
12. バッチレビュー機能
13. レビュー履歴

---

## 12. 注意事項

### 12.1 パフォーマンス

- ソースURLの取得は並列処理（最大5並列）
- レート制限を考慮（500ms間隔）
- 失敗したURLは次回のチェックまでスキップ

### 12.2 誤検知対策

- 日付や時刻のみの変更は無視
- CSSやJS変更による誤検知を防ぐため、テキストのみでハッシュ計算
- 管理者が「誤検知」として却下可能

### 12.3 ハッシュ計算

```typescript
function calculateContentHash(content: string): string {
  // 空白・改行を正規化してからハッシュ計算
  const normalized = content
    .replace(/\s+/g, ' ')
    .trim();
  return crypto.createHash('sha256').update(normalized).digest('hex');
}
```
