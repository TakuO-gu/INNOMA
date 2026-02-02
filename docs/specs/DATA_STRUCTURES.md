# データ構造定義

**最終更新**: 2026-02-02

---

## 概要

INNOMAで使用するデータ構造の定義。
全てJSONファイルとしてファイルシステムに保存。

---

## ディレクトリ構造

```
apps/web/data/artifacts/
├── _templates/           # ベーステンプレート
│   ├── index.json
│   ├── variables/        # テンプレート変数定義（カテゴリ別）
│   │   ├── core.json
│   │   ├── health.json
│   │   └── ...
│   ├── topics/
│   └── services/
├── _drafts/              # 下書き
│   └── {municipality}/
│       └── {service}.json
├── _jobs/                # ジョブ状態
│   └── {municipality}/
│       └── latest.json
└── {municipality}/       # 各自治体のデータ
    ├── meta.json         # メタデータ
    ├── variables/        # 変数値（カテゴリ別）
    │   ├── core.json     # 基本変数
    │   ├── health.json   # 健康・医療
    │   ├── tax.json      # 税金
    │   └── ...
    ├── history/          # 編集履歴
    │   └── {year-month}.json
    ├── index.json        # トップページ
    ├── topics/
    └── services/

apps/web/data/
├── notifications/        # 通知
│   └── notifications.json
└── pdf-cache/            # PDF OCRキャッシュ
    └── {hash}.json
```

---

## 1. 自治体メタデータ

`{municipality}/meta.json`

自治体の基本情報と設定を保存。

```typescript
interface MunicipalityMeta {
  // 基本情報
  id: string;                    // "aogashima"
  name: string;                  // "青ヶ島村"
  prefecture: string;            // "東京都"
  officialUrl: string | null;    // "https://www.vill.aogashima.tokyo.jp/"

  // タイムスタンプ
  createdAt: string;             // ISO 8601
  updatedAt: string;             // ISO 8601
  lastFetchAt: string | null;    // 最後のLLM取得日時

  // ステータス
  status: MunicipalityStatus;

  // 設定
  settings: {
    autoPublish: boolean;        // LLM取得結果を自動公開
    fetchInterval: FetchInterval; // 更新頻度
  };
}

type MunicipalityStatus =
  | "published"   // 公開中
  | "draft"       // 下書きあり
  | "processing"  // LLM取得中
  | "error";      // エラー

type FetchInterval =
  | "manual"      // 手動のみ
  | "daily"       // 毎日
  | "weekly"      // 毎週
  | "monthly";    // 毎月
```

**例**:
```json
{
  "id": "aogashima",
  "name": "青ヶ島村",
  "prefecture": "東京都",
  "officialUrl": "https://www.vill.aogashima.tokyo.jp/",
  "createdAt": "2026-01-15T00:00:00Z",
  "updatedAt": "2026-01-20T10:30:00Z",
  "lastFetchAt": "2026-01-20T10:00:00Z",
  "status": "published",
  "settings": {
    "autoPublish": false,
    "fetchInterval": "weekly"
  }
}
```

---

## 2. 変数値ストア

`{municipality}/variables/*.json`

全変数の現在の値をカテゴリ別に保存。
（後方互換性のため `variables.json` 単体ファイルもサポート）

```typescript
interface VariablesStore {
  [variableName: string]: VariableValue;
}

interface VariableValue {
  value: string | null;          // 変数の値
  source: VariableSource;        // 取得元
  sourceUrl: string | null;      // LLM取得時のソースURL
  confidence: number | null;     // LLM取得時の信頼度 (0-1)
  updatedAt: string;             // 最終更新日時
}

type VariableSource =
  | "llm"      // LLMが自動取得
  | "manual"   // 手動入力
  | "default"; // デフォルト値
```

**例**:
```json
{
  "municipality_name": {
    "value": "青ヶ島村",
    "source": "manual",
    "sourceUrl": null,
    "confidence": null,
    "updatedAt": "2026-01-15T00:00:00Z"
  },
  "city_hall_phone": {
    "value": "04996-9-0111",
    "source": "llm",
    "sourceUrl": "https://www.vill.aogashima.tokyo.jp/contact/",
    "confidence": 0.98,
    "updatedAt": "2026-01-20T10:00:00Z"
  },
  "kokuho_phone": {
    "value": null,
    "source": "default",
    "sourceUrl": null,
    "confidence": null,
    "updatedAt": "2026-01-15T00:00:00Z"
  }
}
```

---

## 3. 下書き

`_drafts/{municipality}/{service}.json`

LLMが取得した情報の下書き。承認後に`variables.json`に反映。

```typescript
interface Draft {
  id: string;                    // "draft-123"
  municipalityId: string;        // "aogashima"
  service: string;               // "kokuho"
  status: DraftStatus;
  createdAt: string;
  updatedAt: string;

  // 変更内容
  changes: DraftChange[];

  // 取得できなかった変数
  missingVariables: string[];

  // エラー情報
  errors: DraftError[];
}

interface DraftChange {
  variable: string;              // 変数名
  currentValue: string | null;   // 現在の値
  newValue: string;              // 新しい値
  sourceUrl: string;             // 取得元URL
  confidence: number;            // 信頼度
}

interface DraftError {
  variable: string;
  error: string;
  timestamp: string;
}

type DraftStatus =
  | "pending"    // 承認待ち
  | "approved"   // 承認済み
  | "rejected";  // 却下
```

**例**:
```json
{
  "id": "draft-123",
  "municipalityId": "aogashima",
  "service": "kokuho",
  "status": "pending",
  "createdAt": "2026-01-20T10:00:00Z",
  "updatedAt": "2026-01-20T10:00:00Z",
  "changes": [
    {
      "variable": "kokuho_phone",
      "currentValue": null,
      "newValue": "04996-9-0111",
      "sourceUrl": "https://www.vill.aogashima.tokyo.jp/kurashi/kokuho/",
      "confidence": 0.95
    },
    {
      "variable": "kokuho_hours",
      "currentValue": "平日9:00-17:00",
      "newValue": "平日8:30-17:15",
      "sourceUrl": "https://www.vill.aogashima.tokyo.jp/kurashi/kokuho/",
      "confidence": 0.90
    }
  ],
  "missingVariables": [
    "kokuho_premium_rate",
    "kokuho_online_available"
  ],
  "errors": []
}
```

---

## 4. Artifact（ページデータ）

`{municipality}/{path}.json`

各ページのコンテンツ。既存のスキーマを使用。

```typescript
interface Artifact {
  // メタデータ
  municipality_id: string;
  path: string;
  title: string;
  content_type: ContentType;
  service_category: ServiceCategory;

  // コンテンツ
  blocks: Block[];

  // 検索用
  search_fields: SearchFields;

  // パイプライン情報
  source: SourceInfo;
  pipeline: PipelineInfo;
}

type ContentType =
  | "guide"
  | "transaction"
  | "contact"
  | "step_by_step"
  | "news";

type ServiceCategory =
  | "welfare"
  | "health"
  | "children"
  | "housing"
  | "environment"
  | "business"
  | "community"
  | "safety"
  | "government"
  | "other";
```

**詳細は** `packages/schema/innoma-artifact-schema.v2.ts` を参照。

---

## 5. ジョブ状態

`_jobs/{municipality}/latest.json`

情報取得の進捗状態を保存。中断後の再開に使用。

```typescript
interface FetchJob {
  id: string;                    // "fetch-takaoka-1234567890"
  municipalityId: string;
  status: FetchJobStatus;

  // 進捗
  totalServices: number;
  completedServices: string[];   // 完了したサービスID
  currentService: string | null;

  // タイムスタンプ
  startedAt: string;
  updatedAt: string;
  completedAt: string | null;

  // エラー情報
  errors: FetchJobError[];
}

type FetchJobStatus =
  | "running"      // 実行中
  | "completed"    // 正常完了
  | "interrupted"  // 中断（ユーザー操作）
  | "failed";      // エラー終了

interface FetchJobError {
  service: string;
  message: string;
  timestamp: string;
}
```

**例**:
```json
{
  "id": "fetch-takaoka-1706345678901",
  "municipalityId": "takaoka",
  "status": "interrupted",
  "totalServices": 15,
  "completedServices": ["registration", "tax", "health"],
  "currentService": "childcare",
  "startedAt": "2026-01-20T10:00:00Z",
  "updatedAt": "2026-01-20T10:15:00Z",
  "completedAt": null,
  "errors": []
}
```

---

## 6. 編集履歴

`{municipality}/history/{year-month}.json`

変数の編集履歴を月別に保存。

```typescript
interface HistoryFile {
  municipalityId: string;
  month: string;               // "2026-01"
  entries: HistoryEntry[];
}

interface HistoryEntry {
  id: string;
  timestamp: string;
  type: HistoryType;
  source: HistorySource;
  changes: VariableChange[];
  metadata?: {
    service?: string;          // 下書き承認時のサービス名
    actor?: string;            // 操作者
  };
}

type HistoryType =
  | "variable_update"          // 変数更新（手動）
  | "bulk_variable_update"     // 一括更新
  | "draft_approval"           // 下書き承認
  | "draft_rejection";         // 下書き却下

type HistorySource =
  | "manual"                   // 手動編集
  | "draft"                    // 下書き承認
  | "cron";                    // 定期更新

interface VariableChange {
  variable: string;
  oldValue: string | null;
  newValue: string | null;
}
```

---

## 7. 通知

`data/notifications/notifications.json`

システム全体の通知を管理。

```typescript
interface NotificationFile {
  notifications: Notification[];
}

interface Notification {
  id: string;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  message: string;
  municipalityId?: string;
  service?: string;
  read: boolean;
  createdAt: string;
  readAt?: string;
}

type NotificationType =
  | "draft_created"            // 下書き作成
  | "draft_approved"           // 下書き承認
  | "draft_rejected"           // 下書き却下
  | "variable_updated"         // 変数更新
  | "cron_completed"           // 定期更新完了
  | "cron_failed"              // 定期更新失敗
  | "fetch_completed"          // 情報取得完了
  | "fetch_failed";            // 情報取得失敗

type NotificationSeverity =
  | "info"
  | "success"
  | "warning"
  | "error";
```

---

## 8. PDF OCRキャッシュ

`data/pdf-cache/{hash}.json`

Vision API OCR結果をキャッシュ。

```typescript
interface OcrCache {
  url: string;                 // 元のURL
  text: string;                // 抽出されたテキスト
  createdAt: string;
  metadata?: {
    pages?: number;            // ページ数
    contentType?: string;      // MIME type
  };
}
```

ファイル名はURLのSHA256ハッシュ。

---

## 9. 設定

環境変数で管理（`.env.local`）。

```
# Google APIs
GOOGLE_GEMINI_API_KEY=xxx
GOOGLE_CUSTOM_SEARCH_API_KEY=xxx
GOOGLE_VISION_API_KEY=xxx

# Storage
STORAGE_TYPE=local
STORAGE_BASE_PATH=./data/artifacts

# Cron認証
CRON_SECRET=xxx
```

---

## TypeScript型定義ファイル

上記の型定義は以下のファイルに配置:

```
apps/web/lib/
├── template/
│   └── types.ts           # MunicipalityMeta, VariableStore
├── drafts/
│   └── types.ts           # Draft, DraftVariable, SearchAttempt
├── jobs/
│   └── types.ts           # FetchJob, FetchJobStatus
├── history/
│   └── types.ts           # HistoryEntry, VariableChange
├── notification/
│   └── types.ts           # Notification, NotificationType
└── llm/
    └── types.ts           # DraftVariable（re-export）, VariableDefinition
```

---

## バリデーション

### 変数バリデーション

`lib/llm/validators.ts` でバリデーターを定義。

```typescript
type VariableValidationType =
  | "phone"    // 電話番号
  | "email"    // メールアドレス
  | "url"      // URL
  | "fee"      // 金額（円）
  | "percent"  // パーセント
  | "date"     // 日付
  | "time"     // 時刻
  | "postal"   // 郵便番号
  | "text";    // テキスト（常にtrue）

// 変数定義で明示的に指定可能
interface VariableDefinition {
  description: string;
  examples?: string[];
  validationType?: VariableValidationType;
}
```

### バリデーションパターン

| タイプ | パターン |
|--------|---------|
| phone | `^\d{2,5}-\d{2,4}-\d{4}$` |
| email | `^[\w.-]+@[\w.-]+\.[a-z]{2,}$` |
| url | `^https?://` |
| fee | `^[\d,]+円$` |
| postal | `^〒?\d{3}-\d{4}$` |
| date | `^\d{4}年\d{1,2}月\d{1,2}日$` |
| time | `^\d{1,2}:\d{2}$` |

---

## データ整合性

### 下書きとサービス定義の同期

`lib/llm/variable-priority.ts` でサービス別変数を定義。
下書きの`missingVariables`はサービス定義から動的に計算。

```typescript
// missingCountの計算
const fetchedVariableNames = new Set(Object.keys(draft.variables));
const missingCount = serviceDef.variables.filter(
  (varName) => !fetchedVariableNames.has(varName)
).length;
```

### 変数総数の動的計算

テンプレートファイルから`{{variable_name}}`形式の変数を抽出。
ハードコードせず、`getTotalVariableCount()`で取得。

---

## 10. 地区依存変数

`{municipality}/variables/*.json` 内で地区ごとに異なる値を管理。

```typescript
/**
 * 地区（町丁目）の定義
 */
interface District {
  id: string;          // 地区ID
  name: string;        // 地区名（表示用）
  value: string;       // この地区での値
  areas: string[];     // 含まれる町名・地名
}

/**
 * 地区依存変数のデータ構造
 */
interface DistrictDependentVariable {
  variableName: string;
  districts: District[];
  defaultValue?: string;      // 地区未選択時の値
  selectPrompt: string;       // 選択を促すメッセージ
  sourceUrl?: string;
  updatedAt?: string;
}
```

**例**（ごみ収集センター）:
```json
{
  "sodai_gomi_collection_center": {
    "value": "{{district_dependent}}",
    "source": "llm",
    "districtDependent": {
      "variableName": "sodai_gomi_collection_center",
      "districts": [
        {
          "id": "central",
          "name": "中央地区",
          "value": "中央クリーンセンター（電話: 0766-XX-XXXX）",
          "areas": ["中央町", "本町", "駅前"]
        },
        {
          "id": "north",
          "name": "北部地区",
          "value": "北部環境センター（電話: 0766-YY-YYYY）",
          "areas": ["北町", "緑ヶ丘"]
        }
      ],
      "defaultValue": "お住まいの地区を選択してください",
      "selectPrompt": "お住まいの地区を選択"
    }
  }
}
```

### 地区依存変数の判定

`lib/llm/variable-priority.ts` で定義:

```typescript
const districtDependentVariables = [
  'sodai_gomi_collection_center',
  'hinanjo_list',
  'elementary_school_district',
  // ...
];

function isDistrictDependentVariable(variableName: string): boolean {
  return districtDependentVariables.includes(variableName);
}
```
