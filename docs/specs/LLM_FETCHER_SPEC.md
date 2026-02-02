# LLM情報取得システム 詳細仕様

**作成日**: 2026-01-20
**最終更新**: 2026-02-02

---

## 1. 概要

テンプレートの変数（電話番号、料金、手続き情報等）を、LLMとWeb検索APIを組み合わせて自治体公式サイトから自動取得するシステム。

---

## 2. アーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│                    LLM Fetcher System                        │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Variable   │───▶│    Query     │───▶│   Google     │  │
│  │  Definitions │    │   Generator  │    │   Custom     │  │
│  │   (説明付き)  │    │   (LLM)      │    │   Search     │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                                                │             │
│                                                ▼             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Draft      │◀───│   Extractor  │◀───│   Page       │  │
│  │   Storage    │    │   (LLM)      │    │   Fetcher    │  │
│  │   (下書き)    │    │   (情報抽出)  │    │ (HTML/PDF)   │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│        │                                        │           │
│        ▼                                        ▼           │
│  ┌──────────────┐                        ┌──────────────┐  │
│  │   Job        │                        │   Vision API │  │
│  │   Storage    │                        │   (PDF OCR)  │  │
│  │  (進捗管理)   │                        │   + Cache    │  │
│  └──────────────┘                        └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. 取得対象情報

### 3.1 連絡先情報
| 変数名 | 説明 | 例 |
|--------|------|-----|
| `{{department}}` | 担当課名 | 市民課、保険年金課 |
| `{{phone}}` | 電話番号 | 03-1234-5678 |
| `{{email}}` | メールアドレス | kokuho@city.example.lg.jp |
| `{{address}}` | 住所 | 〒100-0001 東京都○○区... |
| `{{office_hours}}` | 受付時間 | 平日8:30-17:15 |

### 3.2 料金・費用
| 変数名 | 説明 | 例 |
|--------|------|-----|
| `{{fee}}` | 手数料 | 300円 |
| `{{premium_rate}}` | 保険料率 | 所得割8.5% |
| `{{subsidy_amount}}` | 補助金額 | 最大10万円 |

### 3.3 手続き情報
| 変数名 | 説明 | 例 |
|--------|------|-----|
| `{{required_documents}}` | 必要書類 | 本人確認書類、印鑑 |
| `{{application_method}}` | 申請方法 | 窓口、郵送、オンライン |
| `{{online_available}}` | オンライン申請可否 | true/false |
| `{{processing_time}}` | 処理期間 | 約2週間 |

### 3.4 施設情報
| 変数名 | 説明 | 例 |
|--------|------|-----|
| `{{location}}` | 窓口の場所 | 本庁舎1階 |
| `{{access}}` | アクセス方法 | ○○駅から徒歩5分 |
| `{{parking}}` | 駐車場情報 | 無料駐車場あり |

---

## 4. 処理フロー

### 4.1 情報取得フロー

```
1. サービス選択
   └─ 管理画面から取得対象サービスを選択
   └─ 未取得のみ / 全て再取得 / 個別選択

2. ジョブ開始
   └─ _jobs/{municipalityId}/latest.json にジョブ状態を保存
   └─ サービスごとに進捗を追跡

3. 検索クエリ生成（LLM）
   └─ 変数説明を参照して最適なクエリを生成
   └─ 例: 変数「moeru_gomi_dashikata」→ 説明「燃やせるごみの出し方」

4. Google Custom Search実行
   └─ クエリを実行
   └─ 上位N件の結果を取得（スニペット + URL）

5. ページ取得
   └─ HTMLページ: テキスト抽出
   └─ PDFファイル: Vision APIでOCR（キャッシュあり）
   └─ 画像ファイル: Vision APIでOCR

6. 情報抽出（LLM）
   └─ 入力: ページ内容 + 変数定義（説明・例）
   └─ 出力: 構造化された変数値
   └─ 取得できなかった変数をmissingVariablesに記録

7. 下書き保存
   └─ _drafts/{municipality}/{service}.json に保存
   └─ 取得元URL、信頼度スコア、検索試行回数も記録

8. ジョブ完了
   └─ ジョブ状態を更新
   └─ 通知システムに登録

9. 中断時
   └─ ジョブ状態が保存されているため再開可能
   └─ 完了済みサービスをスキップして続行
```

### 4.2 定期更新時

```
1. 更新対象の特定
   └─ 前回更新から一定期間経過した自治体

2. 差分検出
   └─ 同じクエリで再検索
   └─ 前回の取得値と比較

3. 差分があれば下書き更新
   └─ 変更箇所をハイライト
   └─ 管理者に通知
```

---

## 5. 技術仕様

### 5.1 使用API

#### Web検索API（デュアルプロバイダー対応）

| API | 用途 | 無料枠 | 有料価格 |
|-----|------|--------|----------|
| **Brave Search** (推奨) | Web検索 | 2,000クエリ/月 | $5/1,000クエリ |
| Google Custom Search | Web検索（フォールバック） | 100クエリ/日 | $5/1,000クエリ |

**プロバイダー選択ロジック:**
1. `SEARCH_PROVIDER=brave` → Brave優先、Google フォールバック
2. `SEARCH_PROVIDER=google` → Google優先、Braveフォールバック
3. 未設定（auto） → 利用可能なAPIキーから自動選択（Brave優先）

**フォールバック動作:**
- プライマリプロバイダーで結果0件 → フォールバックプロバイダーで再検索
- プライマリプロバイダーでエラー → フォールバックプロバイダーで再検索
- 両方失敗 → エラーを返す

#### その他のAPI

| API | 用途 | 無料枠 |
|-----|------|--------|
| Google Gemini | クエリ生成、情報抽出 | 15リクエスト/分、1500/日 |
| Google Vision API | PDF/画像OCR | 1000リクエスト/月 |

### 5.2 環境変数

```bash
# Web検索API（少なくとも1つは必須）
BRAVE_SEARCH_API_KEY=your_brave_api_key          # 推奨
GOOGLE_CUSTOM_SEARCH_API_KEY=your_google_api_key # フォールバック用
GOOGLE_CUSTOM_SEARCH_ENGINE_ID=your_engine_id    # Google使用時は必須

# プロバイダー選択（オプション）
SEARCH_PROVIDER=auto  # 'brave' | 'google' | 'auto'

# LLM・OCR
GOOGLE_GEMINI_API_KEY=your_gemini_api_key
```

### 5.3 無料枠モード

CLIで無料枠内に制限して実行可能:

```bash
npx tsx scripts/pipeline.ts run --id takaoka --name 高岡市 --prefecture 富山県 --free-tier
```

| 設定 | デフォルト | 保守的 |
|------|-----------|--------|
| 検索API（Brave） | 2,000/月 | 100/月 |
| 検索API（Google） | 100/日 | 10/日 |
| Gemini | 1500/日 | 50/日 |
| Vision | 1000/月 | 100/月 |
| ページ取得/サービス | 5 | 2 |

### 5.4 エラーハンドリング

| エラー種別 | 対応 |
|-----------|------|
| 検索結果0件 | missingVariablesに記録、下書きには保存 |
| ページ取得失敗 | 3回リトライ後、スキップしてエラー記録 |
| PDF OCR失敗 | エラーを記録、他のURLを試行 |
| LLM抽出失敗 | 別のプロンプトで再試行、失敗なら通知 |
| 中断（ユーザー操作） | ジョブ状態を保存、再開可能 |
| レート制限 | サービス間に2秒の待機を挿入 |

---

## 6. データ構造

### 6.1 下書きファイル構造

```json
{
  "municipality_id": "aogashima",
  "service": "kokuho",
  "status": "draft",
  "created_at": "2026-01-20T10:00:00Z",
  "updated_at": "2026-01-20T10:00:00Z",
  "variables": {
    "department": {
      "value": "住民課",
      "source_url": "https://www.vill.aogashima.tokyo.jp/...",
      "confidence": 0.95,
      "extracted_at": "2026-01-20T10:00:00Z"
    },
    "phone": {
      "value": "04996-9-0111",
      "source_url": "https://www.vill.aogashima.tokyo.jp/...",
      "confidence": 0.98,
      "extracted_at": "2026-01-20T10:00:00Z"
    }
  },
  "missing_variables": ["premium_rate", "online_available"],
  "errors": []
}
```

### 6.2 通知データ

```json
{
  "type": "new_draft",
  "municipality_id": "aogashima",
  "service": "kokuho",
  "filled_count": 8,
  "missing_count": 2,
  "missing_variables": ["premium_rate", "online_available"],
  "created_at": "2026-01-20T10:00:00Z"
}
```

---

## 7. プロンプト設計

### 7.1 検索クエリ生成

```
あなたは日本の自治体サービス情報を検索するアシスタントです。

以下の情報を取得するための最適なGoogle検索クエリを生成してください。

自治体名: {{municipality_name}}
サービス: {{service_name}}
取得したい情報:
- 担当課の電話番号
- 担当課の住所
- 受付時間

出力形式: 検索クエリのみ（1行）
```

### 7.2 情報抽出

```
以下のWebページから、指定された情報を抽出してください。

【Webページ内容】
{{page_content}}

【抽出する情報】
- department: 担当課名
- phone: 電話番号
- address: 住所
- office_hours: 受付時間

【出力形式】
JSON形式で出力してください。
情報が見つからない場合は null としてください。

{
  "department": "...",
  "phone": "...",
  ...
}
```

---

## 8. 検証ロジック

### 8.1 形式検証

| 変数タイプ | 検証ルール |
|-----------|-----------|
| 電話番号 | `^\d{2,4}-\d{2,4}-\d{4}$` |
| メール | `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$` |
| URL | `^https?://` |
| 金額 | `^\d+円$` または `^\d+,\d+円$` |

### 8.2 信頼度スコア

| 条件 | スコア |
|------|--------|
| 公式ドメイン(.lg.jp等)から取得 | +0.2 |
| 複数ソースで一致 | +0.1 |
| 形式検証パス | +0.1 |
| 最近のページ（1年以内） | +0.05 |

---

## 9. PDF/画像OCR機能

### 9.1 対応形式

| 形式 | 検出方法 | 処理 |
|------|---------|------|
| PDF | URL末尾が`.pdf` | Vision APIでOCR |
| 画像 | URL末尾が`.png`, `.jpg`, `.jpeg`, `.gif`, `.webp` | Vision APIでOCR |

### 9.2 キャッシュ

- OCR結果は`data/pdf-cache/`にキャッシュ
- URLのSHA256ハッシュをファイル名として使用
- キャッシュがあれば再OCRをスキップ

### 9.3 API

```
POST /api/admin/pdf/ocr
  body: { url: string, force?: boolean }
  response: { text: string, cached: boolean }

GET /api/admin/pdf/ocr?url=...
  response: { cached: boolean }
```

---

## 10. 変数説明システム

### 10.1 概要

LLMが正しい情報を抽出できるよう、各変数に説明と例を定義。

### 10.2 データ構造

```typescript
interface VariableDefinition {
  description: string;      // 日本語説明
  examples?: string[];      // 期待する値の例
  validationType?: string;  // phone, email, url, fee等
}
```

### 10.3 カバレッジ

約200変数に説明を定義済み（`lib/llm/variable-priority.ts`）:

| カテゴリ | 変数数 |
|---------|--------|
| 環境・ごみ | 18 |
| 防災 | 20 |
| 住宅・建築 | 20 |
| 雇用・労働 | 21 |
| 運転・車 | 17 |
| 事業・産業 | 13 |
| 土地・農林水産 | 29 |
| 外国人・国籍 | 29 |
| 市民参加・選挙 | 28 |
| 年金・給付 | 6 |

---

## 11. リカバリー機能

### 11.1 ジョブ状態管理

```
data/artifacts/_jobs/{municipalityId}/latest.json
```

### 11.2 状態

| status | 説明 |
|--------|------|
| running | 実行中 |
| completed | 正常完了 |
| interrupted | 中断（ユーザー操作） |
| failed | エラー終了 |

### 11.3 再開フロー

1. ページを開くと`/fetch/status`APIでジョブ状態を確認
2. `interrupted`または`failed`なら通知を表示
3. 「続きから再開」で`resume=true`パラメータ付きで取得開始
4. 完了済みサービスをスキップして続行

---

## 12. Playwrightクローラー

### 12.1 概要

JavaScriptで動的に生成されるページに対応するため、Playwrightでブラウザを自動操作して情報を取得。

### 12.2 処理フロー

```
1. 通常の取得で変数が取得できない場合に発動
2. Playwrightでページを開く
3. ページ内のリンクをLLMで評価（関連性スコア）
4. 高スコアのリンクをクリックして遷移
5. 各ページでExtractorを実行
6. 最大3ページまで横断探索
```

### 12.3 設定オプション

```typescript
interface CrawlerOptions {
  maxPages?: number;        // 最大探索ページ数（デフォルト: 3）
  maxLinksPerPage?: number; // ページあたりの最大リンク評価数（デフォルト: 5）
  timeout?: number;         // ページ読み込みタイムアウト（デフォルト: 30000ms）
  headed?: boolean;         // ブラウザ表示（デバッグ用）
  officialUrl?: string;     // 公式サイトURL（ドメイン判定用）
}
```

### 12.4 ファイル

- `lib/llm/playwright-crawler.ts` - メインクローラー実装
- `lib/llm/deep-search.ts` - 値の具体性判定

---

## 13. 値の具体性判定

### 13.1 概要

LLMが抽出した値が具体的かどうかを判定。曖昧な値は除外する。

### 13.2 判定ルール

```typescript
// 曖昧な表現のパターン（除外対象）
const vaguePatterns = [
  /^詳細は/,
  /^お問い合わせ/,
  /による$/,
  /^要確認/,
  /^未定/,
  /参照$/,
  /をご確認/,
  /によって異なる/,
];

// 手数料: 金額が含まれているか
if (variableName.includes('fee')) {
  return /\d+円/.test(value) || /無料/.test(value);
}

// 電話番号: フォーマットチェック
if (variableName.includes('phone')) {
  return /\d{2,5}-\d{2,4}-\d{4}/.test(value);
}
```

---

## 14. 今後の検討事項

- [x] PDF内の情報取得対応 ✅
- [x] キャッシュ戦略の最適化 ✅（PDF OCRキャッシュ）
- [x] 検索API抽象化レイヤー ✅（Brave/Googleデュアルプロバイダー）
- [x] JS重いサイト対応 ✅（Playwrightクローラー）
- [ ] 多言語ページ対応
- [ ] 複数LLMプロバイダー対応
