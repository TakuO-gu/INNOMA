# API リファレンス

**最終更新**: 2026-01-20

---

## 概要

INNOMA管理画面で使用するAPI一覧。
全てのAPIは `/api/admin/` 配下に配置。

---

## 認証

管理画面および `/api/admin/*` は認証必須。

**方式（現行）**:
- `Authorization: Basic <ADMIN_BASIC_AUTH>`

**補足**:
- `ADMIN_BASIC_AUTH` は `user:pass` のBase64文字列。
- 認証未設定の場合は 500 を返す。

---

## 自治体 API

### GET /api/admin/municipalities

自治体一覧を取得。

**レスポンス**:
```json
{
  "municipalities": [
    {
      "id": "aogashima",
      "name": "青ヶ島村",
      "prefecture": "東京都",
      "officialUrl": "https://www.vill.aogashima.tokyo.jp/",
      "status": "published",
      "createdAt": "2026-01-15T00:00:00Z",
      "updatedAt": "2026-01-20T10:30:00Z",
      "variableStats": {
        "total": 353,
        "filled": 280,
        "missing": 73
      },
      "pendingDrafts": 2
    }
  ],
  "total": 1
}
```

**ステータス値**:
- `published`: 公開中
- `draft`: 下書きあり
- `processing`: LLM取得中
- `error`: エラーあり

---

### POST /api/admin/municipalities

新規自治体を追加。

**リクエスト**:
```json
{
  "id": "aogashima",
  "name": "青ヶ島村",
  "prefecture": "東京都",
  "officialUrl": "https://www.vill.aogashima.tokyo.jp/",
  "startFetch": true
}
```

**レスポンス**:
```json
{
  "success": true,
  "municipality": {
    "id": "aogashima",
    "name": "青ヶ島村",
    "status": "processing"
  }
}
```

**処理フロー**:
1. テンプレート（_templates/）を複製
2. 基本変数（municipality_name等）を置換
3. `startFetch: true` ならLLM情報取得をキュー登録

---

### GET /api/admin/municipalities/[id]

自治体詳細を取得。

**レスポンス**:
```json
{
  "municipality": {
    "id": "aogashima",
    "name": "青ヶ島村",
    "prefecture": "東京都",
    "officialUrl": "https://www.vill.aogashima.tokyo.jp/",
    "status": "published",
    "createdAt": "2026-01-15T00:00:00Z",
    "updatedAt": "2026-01-20T10:30:00Z",
    "lastFetchAt": "2026-01-20T10:00:00Z",
    "settings": {
      "autoPublish": false,
      "fetchInterval": "weekly"
    }
  },
  "variables": {
    "city_hall_phone": {
      "value": "04996-9-0111",
      "source": "llm",
      "sourceUrl": "https://...",
      "confidence": 0.98,
      "updatedAt": "2026-01-20T10:00:00Z"
    },
    "juminhyo_fee": {
      "value": "300円",
      "source": "manual",
      "updatedAt": "2026-01-18T15:00:00Z"
    }
  },
  "variableStats": {
    "total": 353,
    "filled": 280,
    "missing": 73,
    "bySource": {
      "llm": 250,
      "manual": 30
    }
  }
}
```

---

### PUT /api/admin/municipalities/[id]

自治体情報を更新。

**リクエスト**:
```json
{
  "name": "青ヶ島村",
  "officialUrl": "https://www.vill.aogashima.tokyo.jp/",
  "settings": {
    "autoPublish": true
  }
}
```

**レスポンス**:
```json
{
  "success": true,
  "municipality": { ... }
}
```

---

### DELETE /api/admin/municipalities/[id]

自治体を削除。

**レスポンス**:
```json
{
  "success": true,
  "deletedId": "aogashima"
}
```

---

### POST /api/admin/municipalities/[id]/fetch

LLM情報取得を実行。

**リクエスト**:
```json
{
  "services": ["kokuho", "juminhyo"],  // 省略時は全サービス
  "force": false  // true: 既存値も再取得
}
```

**レスポンス**:
```json
{
  "success": true,
  "jobId": "fetch-123",
  "status": "queued",
  "estimatedTime": 60
}
```

---

## 変数 API

### PUT /api/admin/variables/[municipality]/[variable]

変数値を手動更新。

**リクエスト**:
```json
{
  "value": "04996-9-0111"
}
```

**レスポンス**:
```json
{
  "success": true,
  "variable": {
    "name": "city_hall_phone",
    "value": "04996-9-0111",
    "source": "manual",
    "updatedAt": "2026-01-20T15:00:00Z"
  }
}
```

---

### GET /api/admin/variables/[municipality]

自治体の全変数を取得。

**クエリパラメータ**:
- `status`: `filled` | `missing` | `all`（デフォルト: `all`）
- `source`: `llm` | `manual` | `all`（デフォルト: `all`）
- `category`: 変数カテゴリでフィルタ

**レスポンス**:
```json
{
  "variables": [
    {
      "name": "city_hall_phone",
      "value": "04996-9-0111",
      "source": "llm",
      "category": "basic",
      "updatedAt": "2026-01-20T10:00:00Z"
    }
  ],
  "total": 353,
  "filtered": 280
}
```

---

## 下書き API

### GET /api/admin/drafts

下書き一覧を取得。

**クエリパラメータ**:
- `municipality`: 自治体IDでフィルタ
- `status`: `pending` | `approved` | `rejected`

**レスポンス**:
```json
{
  "drafts": [
    {
      "id": "draft-123",
      "municipalityId": "aogashima",
      "municipalityName": "青ヶ島村",
      "service": "kokuho",
      "status": "pending",
      "createdAt": "2026-01-20T10:00:00Z",
      "changeCount": 5,
      "missingCount": 2
    }
  ],
  "total": 3
}
```

---

### GET /api/admin/drafts/[id]

下書き詳細を取得。

**レスポンス**:
```json
{
  "draft": {
    "id": "draft-123",
    "municipalityId": "aogashima",
    "municipalityName": "青ヶ島村",
    "service": "kokuho",
    "status": "pending",
    "createdAt": "2026-01-20T10:00:00Z",
    "changes": [
      {
        "variable": "kokuho_phone",
        "currentValue": null,
        "newValue": "04996-9-0111",
        "sourceUrl": "https://...",
        "confidence": 0.95
      },
      {
        "variable": "kokuho_hours",
        "currentValue": "平日9:00-17:00",
        "newValue": "平日8:30-17:15",
        "sourceUrl": "https://...",
        "confidence": 0.90
      }
    ],
    "missingVariables": [
      "kokuho_premium_rate",
      "kokuho_online_available"
    ]
  }
}
```

---

### POST /api/admin/drafts/[id]/approve

下書きを承認。

**リクエスト**:
```json
{
  "modifications": {
    "kokuho_hours": "平日8:30-17:00"  // 修正して承認
  }
}
```

**レスポンス**:
```json
{
  "success": true,
  "appliedChanges": 5,
  "updatedVariables": [
    "kokuho_phone",
    "kokuho_address",
    "kokuho_email",
    "kokuho_department",
    "kokuho_hours"
  ]
}
```

---

### POST /api/admin/drafts/[id]/reject

下書きを却下。

**リクエスト**:
```json
{
  "reason": "情報が古い可能性がある"
}
```

**レスポンス**:
```json
{
  "success": true,
  "rejectedId": "draft-123"
}
```

---

## ジョブ API

### GET /api/admin/jobs/[id]

非同期ジョブの状態を取得。

**レスポンス**:
```json
{
  "job": {
    "id": "fetch-123",
    "type": "fetch",
    "municipalityId": "aogashima",
    "status": "running",
    "progress": {
      "current": 5,
      "total": 15,
      "currentService": "kokuho"
    },
    "startedAt": "2026-01-20T10:00:00Z",
    "estimatedCompletion": "2026-01-20T10:02:00Z"
  }
}
```

**ステータス値**:
- `queued`: キュー待ち
- `running`: 実行中
- `completed`: 完了
- `failed`: 失敗

---

## エラーレスポンス

全てのAPIで共通のエラー形式。

```json
{
  "error": {
    "code": "MUNICIPALITY_NOT_FOUND",
    "message": "Municipality 'unknown' not found",
    "details": {}
  }
}
```

**エラーコード**:
- `MUNICIPALITY_NOT_FOUND`: 自治体が見つからない
- `DRAFT_NOT_FOUND`: 下書きが見つからない
- `VALIDATION_ERROR`: バリデーションエラー
- `FETCH_IN_PROGRESS`: 既に取得処理中
- `RATE_LIMIT_EXCEEDED`: レート制限超過
- `INTERNAL_ERROR`: 内部エラー

---

## レート制限

| API | 制限 |
|-----|------|
| GET系 | 100リクエスト/分 |
| POST/PUT/DELETE | 30リクエスト/分 |
| /fetch | 10リクエスト/分 |

制限超過時は `429 Too Many Requests` を返却。
