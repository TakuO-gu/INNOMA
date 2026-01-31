# INNOMA システムフローチャート

**最終更新**: 2026-01-29

非プログラマー向けのシステム概要図です。Mermaid記法で記述しています。

---

## 1. システム全体図

```mermaid
flowchart LR
    A["テンプレート<br/>（ページのひな形）"] --> B["AI情報収集<br/>（自動で情報を集める）"] --> C["公開サイト<br/>（市民が閲覧）"]
```

**INNOMAとは**: 自治体のWebサイトを自動的に作成・更新するシステムです。AIが自治体の情報（電話番号、住所、手続き方法など）をインターネットから自動で集めてきて、統一されたデザインのWebサイトを作ります。

---

## 1.1 用語説明

### システム全体の用語

| 用語 | 説明 | 例 |
|------|------|-----|
| **テンプレート** | 全自治体共通のページのひな形。変数（`{{変数名}}`）が埋め込まれている | `_templates/services/environment/gomi.json` |
| **Artifact** | 各自治体のページデータ（テンプレートから複製されたもの） | `takaoka/services/environment/gomi.json` |
| **変数（Variable）** | 自治体ごとに異なる情報を入れる場所 | `{{city_hall_phone}}` → `0766-20-1234` |
| **下書き（Draft）** | AIが収集した情報の一時保存。承認後に`variables.json`に反映 | `_drafts/takaoka/environment.json` |

### 市民向けサイト（`/[自治体ID]/*`）の用語

| 用語 | 説明 | パス例 |
|------|------|--------|
| **自治体トップ** | 自治体のトップページ。大カテゴリ（トピック）の一覧を表示 | `/takaoka/` |
| **トピック一覧** | 大カテゴリ一覧ページ（自治体トップと同様の内容） | `/takaoka/topics` |
| **トピックページ** | 大カテゴリ内のサービス一覧ページ | `/takaoka/topics/environment` |
| **サービスページ** | 具体的な手続き・サービスの詳細ページ | `/takaoka/services/environment/gomi` |

### 管理画面（`/admin/*`）の用語

| 用語 | 説明 | パス例 |
|------|------|--------|
| **ダッシュボード** | 管理画面のトップ。自治体一覧と通知を表示 | `/admin` |
| **自治体一覧** | 登録されている自治体の一覧 | `/admin/municipalities` |
| **自治体詳細** | 特定自治体の変数編集・情報取得画面 | `/admin/municipalities/takaoka` |
| **下書き一覧** | 承認待ちの下書き一覧 | `/admin/drafts` |
| **下書き詳細** | 下書きの確認・承認画面（3分割ビュー） | `/admin/drafts/takaoka/environment` |
| **通知一覧** | システム通知の一覧 | `/admin/notifications` |

### 市民向けサイトのページ階層図

```
/takaoka/                       自治体トップ（大カテゴリ一覧）
├── /takaoka/topics             トピック一覧（大カテゴリ一覧）
│   ├── /takaoka/topics/environment     トピックページ（環境・ごみカテゴリのサービス一覧）
│   ├── /takaoka/topics/childcare       トピックページ（子育てカテゴリのサービス一覧）
│   └── ...
└── /takaoka/services           サービスページ群
    ├── /takaoka/services/environment/gomi      サービスページ（ごみの出し方）
    ├── /takaoka/services/childcare/nursery     サービスページ（保育所）
    └── ...
```

---

## 2. AI情報収集の流れ

```mermaid
flowchart TD
    Start([開始]) --> Q1["① 検索キーワード作成<br/>Gemini AI"]
    Q1 --> Q2["② ネット検索<br/>Google検索API"]
    Q2 --> Q3["③ ページを読み込む<br/>HTML/PDF取得"]
    Q3 --> Q4["④ 情報を抜き出す<br/>Gemini AI"]
    Q4 --> Q5["⑤ 下書き保存<br/>Draft"]
    Q5 --> End([完了])

    style Q1 fill:#e3f2fd
    style Q2 fill:#fff3e0
    style Q3 fill:#f3e5f5
    style Q4 fill:#e3f2fd
    style Q5 fill:#e8f5e9
```

### 各ステップの説明

| ステップ | 処理内容 | 使用技術 |
|---------|---------|---------|
| ① | AIが検索キーワードを考える | Gemini AI |
| ② | Google検索で関連ページを探す | Google Custom Search API |
| ③ | 見つかったページの内容を取得（PDFも画像認識で読み取り） | HTML Parser / Vision API |
| ④ | AIが必要な情報を抽出 | Gemini AI |
| ⑤ | 人間がチェックするまで一時保存 | JSON ファイル |

---

## 3. 管理者の作業フロー

```mermaid
flowchart TD
    Admin["管理者<br/>（市役所担当者）"] --> Access["管理画面にアクセス<br/>/admin"]

    Access --> Branch{何をする？}

    Branch -->|新規追加| Add["新規自治体を追加<br/>/admin/municipalities/new"]
    Branch -->|確認・承認| Check["下書きを確認<br/>/admin/drafts"]
    Branch -->|変数編集| Edit2["変数を手動編集<br/>/admin/municipalities/[id]"]

    Add --> Fetch["情報取得ボタン押下"]
    Fetch --> AI["AIが自動で情報収集<br/>（サービス単位で取得）"]
    AI --> Draft["下書きとして保存<br/>_drafts/{id}/{service}.json"]

    Draft --> Check
    Check --> Review["AIが集めた情報を確認<br/>（3分割ビュー）"]
    Review --> Decision{正しい？}

    Decision -->|はい| Approve["承認"]
    Decision -->|いいえ| Edit["手動で修正"]
    Edit --> Approve

    Approve --> Publish["本番サイトに反映！<br/>（ISR再検証）"]

    style Admin fill:#ffeb3b
    style Publish fill:#4caf50,color:#fff
```

**注意**: 現在は認証機能なし（開発中）。将来的にVercel Password Protection等を導入予定。

---

## 4. データの保存場所

```mermaid
flowchart TB
    subgraph Storage["data/artifacts/"]
        direction TB
        T["📁 _templates/<br/>テンプレート<br/>（全自治体共通）"]
        D["📁 _drafts/<br/>下書き<br/>（AI収集・未承認）"]
        J["📁 _jobs/<br/>ジョブ状態<br/>（取得の進捗）"]
        M1["📁 takaoka/<br/>高岡市の本番データ"]
        M2["📁 tsuru/<br/>都留市の本番データ"]
    end

    style T fill:#fff9c4
    style D fill:#ffe0b2
    style J fill:#e1f5fe
    style M1 fill:#c8e6c9
    style M2 fill:#c8e6c9
```

**注意**: ディレクトリ名は日本語名ではなく、英語ID（`takaoka`, `tsuru`等）を使用します。

### ディレクトリ構造

```
data/artifacts/
├── _templates/            ← テンプレート（全自治体共通のひな形）
│   ├── index.json         ← トップページテンプレート
│   ├── topics.json        ← トピック一覧
│   ├── topics/            ← トピックページ（カテゴリ別）
│   │   ├── environment.json
│   │   ├── childcare.json
│   │   └── ...
│   └── services/          ← サービスページ（具体的な手続き）
│       ├── environment/
│       │   └── gomi.json
│       ├── childcare/
│       │   ├── nursery.json
│       │   └── boshi.json
│       └── ...
├── _drafts/               ← 下書き（AIが集めた未承認の変数）
│   └── takaoka/           ← 自治体ID（英語）
│       ├── environment.json  ← サービス単位で保存
│       ├── childcare.json
│       └── ...
├── _jobs/                 ← ジョブ状態（取得の進捗管理）
│   └── takaoka/
│       └── latest.json
├── takaoka/               ← 高岡市の本番データ
│   ├── meta.json          ← 自治体メタデータ
│   ├── variables.json     ← 変数値ストア（全変数の現在値）
│   ├── districts.json     ← 地区情報（オプション）
│   ├── history/           ← 編集履歴
│   │   └── 2026-01.json
│   ├── index.json         ← トップページ
│   ├── topics.json        ← トピック一覧
│   ├── topics/            ← トピックページ
│   └── services/          ← サービスページ
└── tsuru/                 ← 都留市の本番データ
    └── ...
```

### ファイルの役割

| ファイル | 説明 |
|---------|------|
| `meta.json` | 自治体の基本情報（名前、公式URL、ステータス等） |
| `variables.json` | 全変数の現在値（電話番号、料金、URLなど） |
| `index.json` | 自治体トップページのコンテンツ |
| `topics.json` | トピック（カテゴリ）一覧 |
| `topics/*.json` | 各トピックページ |
| `services/**/*.json` | 各サービスページ |

---

## 5. 市民がページを見るまでの流れ

```mermaid
flowchart TD
    User["市民がアクセス<br/>例: /takaoka/services/environment/gomi"]

    User --> Load1["① Artifactを読み込み<br/>takaoka/services/environment/gomi.json"]
    Load1 --> Load2["② 変数ストアを読み込み<br/>takaoka/variables.json"]
    Load2 --> Replace["③ 変数を置き換え<br/>｛｛gomi_dashijikan｝｝ → 朝8:30まで"]
    Replace --> Display["④ ページとして表示"]

    subgraph Result["表示結果"]
        Page["🗑️ ごみの出し方<br/>━━━━━━━━━━<br/>出す時間: 朝8:30まで<br/>お問い合わせ: 0766-22-2144"]
    end

    Display --> Result

    style User fill:#e3f2fd
    style Result fill:#e8f5e9
```

### 変数置換の仕組み

1. **Artifactの読み込み**: 自治体IDとパスからJSONファイルを特定
2. **変数ストアの読み込み**: `variables.json`から変数名→値のマッピングを取得
3. **変数の置換**: `{{variable_name}}`形式の文字列を実際の値に置換
4. **未置換変数の処理**: 値がない変数は空白のまま表示（または警告）

---

## 6. 主要な部品の関係

```mermaid
flowchart TB
    subgraph UI["ユーザーインターフェース"]
        Admin["管理画面<br/>Admin Panel"]
        Public["市民向けサイト<br/>Public Site"]
    end

    subgraph API["API（窓口）"]
        Routes["・データ取得<br/>・データ保存<br/>・AI呼び出し"]
    end

    subgraph Backend["バックエンド"]
        AI["AI<br/>Gemini<br/>Google検索"]
        Data["データ<br/>ストレージ<br/>JSONファイル"]
        Template["テンプレート<br/>ページのひな形"]
    end

    Admin --> API
    Public --> API
    API --> AI
    API --> Data
    API --> Template

    style Admin fill:#bbdefb
    style Public fill:#c8e6c9
    style AI fill:#fff9c4
    style Data fill:#ffe0b2
    style Template fill:#f3e5f5
```

---

## 7. 下書き承認フロー（詳細）

```mermaid
sequenceDiagram
    participant M as 管理者
    participant UI as 管理画面
    participant API as API
    participant AI as Gemini AI
    participant Search as Google検索
    participant DB as JSONファイル

    Note over M,DB: ── 情報取得フェーズ ──
    M->>UI: 情報取得ボタンをクリック<br/>（サービスを選択）
    UI->>API: POST /api/admin/municipalities/[id]/fetch

    loop 各サービスごと
        API->>AI: 検索クエリ生成依頼
        AI-->>API: 「〇〇市 ごみ収集日」
        API->>Search: Google Custom Search実行
        Search-->>API: 検索結果（URL, スニペット）
        API->>API: ページ取得（HTML/PDF）
        API->>AI: 情報抽出依頼
        AI-->>API: 変数値 + 信頼度スコア
        API->>DB: 下書き保存<br/>_drafts/{id}/{service}.json
        API->>DB: ジョブ状態更新<br/>_jobs/{id}/latest.json
    end

    API-->>UI: 完了通知
    UI-->>M: 「下書きができました」

    Note over M,DB: ── 確認・承認フェーズ ──
    M->>UI: 下書きを確認<br/>/admin/drafts/{id}/{service}
    UI->>API: GET /api/admin/drafts/{id}/{service}
    API->>DB: _drafts/{id}/{service}.json読み込み
    DB-->>API: 下書きデータ
    API-->>UI: 3分割ビューで表示

    alt 承認する場合
        M->>UI: 承認ボタンをクリック
        UI->>API: PUT /api/admin/drafts/{id}/{service}<br/>{action: "approve"}
        API->>DB: variables.jsonに反映
        API->>DB: 履歴記録（history/）
        API->>API: ISR再検証（revalidatePath）
        API-->>UI: 完了
        UI-->>M: 「公開されました」
    else 却下する場合
        M->>UI: 却下ボタンをクリック
        UI->>API: PUT /api/admin/drafts/{id}/{service}<br/>{action: "reject", reason: "..."}
        API->>DB: 下書きステータス更新
        API->>DB: 履歴記録
        API-->>UI: 完了
    end
```

### 下書きのデータ構造

下書きには以下の情報が含まれます：

| フィールド | 説明 |
|-----------|------|
| `variables` | 取得できた変数（値、ソースURL、信頼度、検証結果） |
| `missingVariables` | 取得できなかった変数の一覧 |
| `searchAttempts` | 未取得変数の検索試行履歴（デバッグ用） |
| `status` | draft / pending_review / approved / rejected |
| `metadata` | 取得ジョブID、承認者、承認日時など |

---

## 8. 部品の役割まとめ

```mermaid
mindmap
    root((INNOMA))
        テンプレート
            ページの骨格
            全自治体で共通
            _templates/に保存
        Artifact
            自治体別のページデータ
            テンプレートから複製
            {自治体ID}/に保存
        変数
            自治体ごとに変わる情報
            電話番号、住所、曜日など
            variables.jsonに保存
        AI Gemini
            情報を探す
            情報を整理する
            調査員的存在
        下書き
            AIが見つけた情報
            チェック待ちの書類
            _drafts/に保存
        管理画面
            人間が確認・承認
            事務所的存在
        公開サイト
            市民が見るページ
            窓口的存在
```

---

## 部品の役割一覧表

| 部品 | 役割 | 例え | 保存場所 |
|------|------|------|---------|
| **テンプレート** | ページの骨格（全自治体共通） | 履歴書のフォーマット | `_templates/` |
| **Artifact** | 自治体別のページデータ | 記入済みの履歴書 | `{自治体ID}/` |
| **変数** | 自治体ごとに変わる情報 | 名前や住所を書く欄 | `variables.json` |
| **AI（Gemini）** | 情報を探して整理 | 調査員 | - |
| **下書き** | AIが見つけた情報の一時保管 | チェック待ちの書類 | `_drafts/` |
| **管理画面** | 人間が確認・承認する場所 | 事務所 | `/admin/*` |
| **公開サイト** | 市民が見るページ | 窓口 | `/[municipality]/*` |

---

## まとめ

**INNOMAは、AIが自治体の情報を自動で集め、人間がチェックして承認し、市民に公開する一連の流れを効率化するシステムです。**

---

## 表示方法

このドキュメントのMermaid図は以下の環境で表示できます：

- GitHub（自動レンダリング）
- VS Code（Mermaid拡張機能）
- Notion（/mermaid ブロック）
- Obsidian（標準対応）
- その他Mermaid対応エディタ
