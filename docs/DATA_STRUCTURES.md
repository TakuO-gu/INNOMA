# データ構造定義

**最終更新**: 2026-01-20

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
│   ├── topics/
│   └── services/
├── _drafts/              # 下書き
│   └── {municipality}/
│       └── {service}.json
└── {municipality}/       # 各自治体のデータ
    ├── meta.json         # メタデータ
    ├── variables.json    # 変数値
    ├── index.json        # トップページ
    ├── topics/
    └── services/
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

`{municipality}/variables.json`

全変数の現在の値を保存。

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

## 5. ジョブキュー

`_jobs/queue.json`

非同期処理のキュー（LLM取得など）。

```typescript
interface JobQueue {
  jobs: Job[];
}

interface Job {
  id: string;                    // "fetch-123"
  type: JobType;
  municipalityId: string;
  status: JobStatus;

  // パラメータ
  params: {
    services?: string[];         // 対象サービス
    force?: boolean;             // 強制再取得
  };

  // 進捗
  progress: {
    current: number;
    total: number;
    currentService: string | null;
  };

  // タイムスタンプ
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;

  // 結果
  result: JobResult | null;
}

type JobType = "fetch" | "validate" | "export";

type JobStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed";

interface JobResult {
  success: boolean;
  draftsCreated: number;
  variablesFetched: number;
  errors: string[];
}
```

---

## 6. 設定

`_config/settings.json`

グローバル設定。

```typescript
interface Settings {
  // LLM設定
  llm: {
    provider: "gemini";
    model: string;               // "gemini-2.0-flash"
    maxRetries: number;
  };

  // 検索設定
  search: {
    provider: "google";
    maxResults: number;
  };

  // 更新設定
  fetch: {
    defaultInterval: FetchInterval;
    priorityVariables: string[]; // 優先取得する変数
  };
}
```

---

## TypeScript型定義ファイル

上記の型定義は以下のファイルに配置:

```
apps/web/lib/
├── types/
│   ├── municipality.ts    # MunicipalityMeta, MunicipalityStatus
│   ├── variables.ts       # VariablesStore, VariableValue
│   ├── drafts.ts          # Draft, DraftChange
│   └── jobs.ts            # Job, JobQueue
└── schema/
    ├── municipality.ts    # Zodスキーマ
    ├── variables.ts
    ├── drafts.ts
    └── jobs.ts
```

---

## バリデーション

全データはZodスキーマで検証。

```typescript
// 例: municipality.ts
import { z } from "zod";

export const MunicipalityMetaSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  prefecture: z.string().min(1),
  officialUrl: z.string().url().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  lastFetchAt: z.string().datetime().nullable(),
  status: z.enum(["published", "draft", "processing", "error"]),
  settings: z.object({
    autoPublish: z.boolean(),
    fetchInterval: z.enum(["manual", "daily", "weekly", "monthly"]),
  }),
});

export type MunicipalityMeta = z.infer<typeof MunicipalityMetaSchema>;
```
