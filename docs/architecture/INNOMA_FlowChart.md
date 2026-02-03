# INNOMA 実装フローチャート

## 目次
1. [メインデータフロー概要](#1-メインデータフロー概要)
2. [ページレンダリングフロー](#2-ページレンダリングフロー)
3. [LLM情報取得フロー](#3-llm情報取得フロー)
4. [ドラフト管理フロー](#4-ドラフト管理フロー)
5. [テンプレート・変数システム](#5-テンプレート変数システム)
6. [管理画面フロー](#6-管理画面フロー)
7. [ストレージ抽象化層](#7-ストレージ抽象化層)
8. [コンポーネント階層](#8-コンポーネント階層)
9. [認証・ミドルウェア](#9-認証ミドルウェア)
10. [未使用・参照用コード](#10-未使用参照用コード)

---

## 1. メインデータフロー概要

```mermaid
flowchart TB
    subgraph User["ユーザーフロー"]
        U1[ユーザーアクセス]
        U2[ページ閲覧]
        U3[検索]
    end

    subgraph Admin["管理者フロー"]
        A1[管理画面ログイン]
        A2[自治体作成]
        A3[情報取得開始]
        A4[ドラフトレビュー]
        A5[承認・公開]
    end

    subgraph Core["コアシステム"]
        C1[(テンプレート)]
        C2[(変数ストア)]
        C3[(アーティファクト)]
        C4[LLM Fetcher]
        C5[ドラフト管理]
    end

    subgraph External["外部サービス"]
        E1[Google Gemini]
        E2[Google Custom Search]
        E3[Google Vision OCR]
        E4[自治体Webサイト]
    end

    U1 --> C3
    C3 --> U2

    A1 --> A2
    A2 --> C1
    C1 --> C2
    A3 --> C4
    C4 --> E1
    C4 --> E2
    C4 --> E4
    E4 --> E3
    C4 --> C5
    C5 --> A4
    A4 --> A5
    A5 --> C2
    C2 --> C3
```

---

## 2. ページレンダリングフロー

### 2.1 GOV.UK方式 URL解決フロー

INNOMAはGOV.UK方式のフラットURLを採用しています。URLとファイル構造が独立しており、
`page-registry.json`でマッピングを管理します。

```mermaid
flowchart TD
    subgraph URL["ユーザーリクエスト"]
        U1["/takaoka/kokuho"]
        U2["/takaoka/topics/health"]
        U3["/takaoka/"]
    end

    subgraph Resolve["URL解決 - lib/artifact/page-registry.ts"]
        R1["resolveArtifactPath(pathSegments)"]
        R2{"パスの種類?"}
        R3["getPageRegistry()<br/>page-registry.json読込"]
        R4["resolvePagePath(slug)<br/>スラッグ→ファイルパス"]
    end

    subgraph Registry["ページレジストリ"]
        REG["page-registry.json<br/>106エントリ"]
        REG1["kokuho → services/health/kokuho"]
        REG2["juminhyo → services/registration/juminhyo"]
        REG3["gomi → services/environment/gomi"]
    end

    subgraph Output["アーティファクトキー"]
        O1["takaoka/services/health/kokuho.json"]
        O2["takaoka/topics/health.json"]
        O3["takaoka/index.json"]
    end

    U1 --> R1
    U2 --> R1
    U3 --> R1
    R1 --> R2
    R2 -->|"フラットURL (/kokuho)"| R3
    R2 -->|"/topics/*"| O2
    R2 -->|"/"| O3
    R3 --> R4
    R4 --> REG
    REG --> REG1
    REG --> REG2
    REG --> REG3
    REG1 --> O1
```

**URL構造の比較:**

| パターン | 旧URL | 新URL (GOV.UK方式) |
|---------|-------|-------------------|
| Content Item | `/takaoka/services/health/kokuho` | `/takaoka/kokuho` |
| トピックページ | `/takaoka/topics/health` | `/takaoka/topics/health` (変更なし) |
| ホームページ | `/takaoka/` | `/takaoka/` (変更なし) |

### 2.2 メインレンダリングパイプライン

```mermaid
flowchart TD
    subgraph Entry["エントリーポイント"]
        P1["app/[municipality]/[[...path]]/page.tsx<br/>ArtifactPage()"]
    end

    subgraph URLResolve["URL解決（GOV.UK方式）"]
        UR1["buildArtifactKey(municipality, path)"]
        UR2["resolveArtifactPath(pathSegments)<br/>lib/artifact/page-registry.ts"]
        UR3["page-registry.json参照"]
    end

    subgraph ArtifactLoading["アーティファクト読込"]
        AL2["loadArtifact()<br/>lib/artifact/index.ts"]
        AL3["loadArtifactInternal()<br/>lib/artifact/loader.ts"]
        AL4["getFromCache()<br/>lib/artifact/cache.ts"]
        AL5["getDefaultStorageAdapter().get()<br/>lib/storage/index.ts"]
        AL6["getVariableStore()<br/>lib/template/storage.ts"]
        AL7["replaceVariablesWithSources()<br/>lib/template/replace.ts"]
        AL8["safeValidateArtifact()<br/>lib/artifact/schema.ts"]
        AL9["setInCache()<br/>lib/artifact/cache.ts"]
    end

    subgraph Rendering["レンダリング"]
        R1["getCompletedPages()<br/>lib/artifact/loader.ts"]
        R2["BlockRenderer<br/>components/blocks/BlockRenderer.tsx"]
        R3["MunicipalityProvider<br/>components/blocks/MunicipalityContext.tsx"]
        R4["各Blockコンポーネント<br/>components/blocks/components/"]
    end

    P1 --> UR1
    UR1 --> UR2
    UR2 --> UR3
    UR3 --> AL2
    AL2 --> AL3
    AL3 --> AL4
    AL4 -->|キャッシュヒット| AL9
    AL4 -->|キャッシュミス| AL5
    AL5 --> AL6
    AL6 --> AL7
    AL7 --> AL8
    AL8 --> AL9
    AL9 --> R1
    R1 --> R2
    R2 --> R3
    R3 --> R4
```

### 2.2 変数置換処理

```mermaid
flowchart LR
    subgraph Input["入力"]
        I1["アーティファクトJSON<br/>{{variable_name}}を含む"]
        I2["変数ストア<br/>variables.json"]
    end

    subgraph Replace["置換処理 - lib/template/replace.ts"]
        RP1["replaceVariables()"]
        RP2["replaceVariablesWithSources()"]
        RP3["extractVariables()<br/>正規表現マッチ"]
        RP4["hasUnreplacedVariables()<br/>未置換チェック"]
    end

    subgraph Output["出力"]
        O1["置換済みアーティファクト"]
        O2["ソース情報<br/>sources配列"]
        O3["未置換変数リスト"]
    end

    I1 --> RP1
    I2 --> RP1
    RP1 --> RP2
    RP2 --> RP3
    RP3 --> RP4
    RP4 --> O1
    RP4 --> O2
    RP4 --> O3
```

### 2.3 キャッシュ管理

```mermaid
flowchart TD
    subgraph CacheLayer["キャッシュ層 - lib/artifact/cache.ts"]
        C1["getFromCache(key)"]
        C2["setInCache(key, value, ttl)"]
        C3["invalidateCache(key)"]
        C4["invalidateCacheByPrefix(prefix)"]
    end

    subgraph TTL["TTL計算"]
        T1["通常コンテンツ: 300秒"]
        T2["緊急コンテンツ: 60秒"]
    end

    subgraph ReactCache["React Server Cache"]
        RC1["React.cache()<br/>リクエスト単位キャッシュ"]
    end

    C1 --> T1
    C1 --> T2
    C2 --> T1
    C2 --> T2
    RC1 --> C1
```

---

## 3. LLM情報取得フロー

### 3.1 メイン取得オーケストレーション

```mermaid
flowchart TD
    subgraph API["API - app/api/admin/municipalities/[id]/fetch/route.ts"]
        A1["POST /fetch<br/>SSEストリーミング"]
        A2["getLatestJob()<br/>ジョブ状態確認"]
        A3["createFetchJob()<br/>ジョブ作成"]
    end

    subgraph Fetcher["取得処理 - lib/llm/fetcher.ts"]
        F1["fetchServiceVariables()"]
        F2["getServiceDefinition()<br/>lib/llm/variable-priority.ts"]
        F3["generateSearchQuery()<br/>lib/llm/prompts/query-generator.ts"]
        F4["searchMunicipalitySite()<br/>lib/llm/google-search.ts"]
        F5["extractFromSnippets()<br/>lib/llm/prompts/extractor.ts"]
        F6["fetchPageWithPdfs()<br/>lib/llm/page-fetcher.ts"]
        F7["extractVariables()<br/>lib/llm/prompts/extractor.ts"]
        F8["validateVariable()<br/>lib/llm/validators.ts"]
    end

    subgraph DeepSearch["ディープサーチ - lib/llm/deep-search.ts"]
        D1["isConcreteValue()<br/>値の妥当性チェック"]
        D2["深掘り検索ロジック"]
    end

    subgraph Crawler["Playwrightクローラー - lib/llm/playwright-crawler.ts"]
        CR1["crawlForVariables()<br/>JS重いサイト対応"]
    end

    subgraph Draft["ドラフト保存 - lib/drafts/storage.ts"]
        DR1["saveDraft()"]
    end

    A1 --> A2
    A2 --> A3
    A3 --> F1
    F1 --> F2
    F2 --> F3
    F3 --> F4
    F4 --> F5
    F5 -->|不十分| F6
    F5 -->|十分| F8
    F6 --> F7
    F7 --> F8
    F8 -->|失敗| D1
    D1 --> D2
    D2 -->|JSサイト| CR1
    F8 -->|成功| DR1
    CR1 --> DR1
```

### 3.2 検索処理

```mermaid
flowchart LR
    subgraph Query["クエリ生成 - lib/llm/prompts/query-generator.ts"]
        Q1["generateSearchQuery()"]
        Q2["generateServiceSearchQueries()"]
    end

    subgraph Gemini["Gemini API - lib/llm/gemini.ts"]
        G1["generateContent()"]
        G2["generateJSON()"]
    end

    subgraph Search["検索 - lib/llm/google-search.ts"]
        S1["googleSearch()<br/>Raw API呼出"]
        S2["searchMunicipalitySite()<br/>サイト限定検索"]
        S3["searchServiceInfo()<br/>サービス検索"]
        S4["isOfficialDomain()<br/>公式ドメイン判定"]
        S5["calculateUrlCredibility()<br/>信頼度スコア計算"]
    end

    subgraph BraveSearch["Brave Search - lib/llm/brave-search.ts"]
        B1["braveSearch()<br/>フォールバック"]
    end

    Q1 --> G1
    Q2 --> G1
    G1 --> S1
    S1 --> S2
    S2 --> S3
    S3 --> S4
    S4 --> S5
    S1 -->|失敗時| B1
```

### 3.3 コンテンツ取得・抽出

```mermaid
flowchart TD
    subgraph PageFetch["ページ取得 - lib/llm/page-fetcher.ts"]
        PF1["fetchPage(url)"]
        PF2["fetchPages(urls)<br/>並列取得"]
        PF3["fetchPageWithPdfs(url)"]
        PF4["isUsefulUrl(url)<br/>有用性判定"]
    end

    subgraph PDF["PDF処理 - lib/pdf/"]
        PDF1["extractTextFromPdf()<br/>pdf-to-images.ts"]
        PDF2["convertPdfToImages()<br/>pdf-to-images.ts"]
        PDF3["performVisionOcr()<br/>vision-ocr.ts"]
        PDF4["extractTextFromBase64Image()<br/>vision-ocr.ts"]
        PDF5["getCachedOcr() / setCachedOcr()<br/>cache.ts"]
    end

    subgraph Extract["抽出 - lib/llm/prompts/extractor.ts"]
        E1["extractVariables()"]
        E2["extractFromSnippets()"]
        E3["extractContactInfo()"]
        E4["extractFeeInfo()"]
    end

    subgraph Validate["検証 - lib/llm/validators.ts"]
        V1["validateVariable()<br/>自動判別"]
        V2["getValidator()<br/>バリデータ取得"]
        V3["calculateValidationConfidence()"]
        V4["個別バリデータ<br/>Phone/Email/Url/Fee<br/>Date/Time/PostalCode/Percent"]
    end

    PF1 --> PF4
    PF2 --> PF4
    PF3 --> PDF1
    PDF1 -->|画像ベースPDF| PDF2
    PDF2 --> PDF3
    PDF3 --> PDF4
    PDF4 --> PDF5
    PF4 --> E1
    PDF5 --> E1
    E1 --> E3
    E1 --> E4
    E2 --> V1
    E1 --> V1
    V1 --> V4
    V2 --> V3
```

### 3.4 変数定義・優先度

```mermaid
flowchart LR
    subgraph Priority["変数優先度 - lib/llm/variable-priority.ts"]
        P1["highPriorityVariables[]"]
        P2["serviceDefinitions[]"]
        P3["getServiceDefinition()"]
        P4["getVariableDefinition()"]
        P5["districtDependentVariables[]"]
        P6["isDistrictDependentVariable()"]
    end

    subgraph Services["15サービスカテゴリ"]
        S["registration / tax / health<br/>childcare / welfare / disaster<br/>housing / employment / driving<br/>business / land / nationality<br/>civic / benefits / environment"]
    end

    P1 --> P3
    P2 --> P3
    P3 --> S
    P5 --> P6
```

---

## 4. ドラフト管理フロー

### 4.1 ドラフトライフサイクル

```mermaid
flowchart TD
    subgraph Create["ドラフト作成"]
        C1["LLM Fetcher完了"]
        C2["saveDraft()<br/>lib/drafts/storage.ts"]
        C3["createDraft()<br/>lib/drafts/storage.ts"]
    end

    subgraph Storage["ストレージ - lib/drafts/storage.ts"]
        S1["getAllDrafts()"]
        S2["getMunicipalityDrafts()"]
        S3["getDraft()"]
        S4["updateDraftStatus()"]
        S5["updateDraftVariables()"]
        S6["deleteDraft()"]
        S7["getDraftsByStatus()"]
        S8["getDraftStatistics()"]
    end

    subgraph Review["レビュー"]
        R1["管理画面: ドラフト詳細"]
        R2["3分割ビュー表示"]
    end

    subgraph Diff["差分比較 - lib/drafts/diff.ts"]
        D1["compareDraftWithStore()"]
        D2["getDraftComparison()"]
        D3["getChangedVariables()"]
        D4["generateDiffSummary()"]
        D5["hasSignificantChanges()"]
    end

    subgraph Apply["適用"]
        A1["applyDraftToStore()<br/>lib/drafts/diff.ts"]
        A2["updateVariableStore()<br/>lib/template/storage.ts"]
        A3["recordVariableUpdate()<br/>lib/history/storage.ts"]
    end

    subgraph Status["ステータス"]
        ST1["pending_review<br/>レビュー待ち"]
        ST2["approved<br/>承認済み"]
        ST3["rejected<br/>却下"]
    end

    C1 --> C2
    C2 --> C3
    C3 --> ST1
    ST1 --> R1
    R1 --> R2
    R2 --> D1
    D1 --> D2
    D2 --> D3
    D3 --> D4
    D4 --> D5
    D5 -->|承認| A1
    D5 -->|却下| ST3
    A1 --> A2
    A2 --> A3
    A3 --> ST2
    S1 --> R1
    S2 --> R1
    S3 --> R2
    S4 --> ST1
    S4 --> ST2
    S4 --> ST3
```

### 4.2 ドラフトデータ構造

```mermaid
flowchart LR
    subgraph Draft["Draftオブジェクト"]
        D1["municipalityId: string"]
        D2["service: string"]
        D3["status: DraftStatus"]
        D4["variables: DraftVariableEntry[]"]
        D5["searchAttempts: Record"]
        D6["missingSuggestions: Record"]
        D7["createdAt: ISO8601"]
        D8["approvedAt?: ISO8601"]
    end

    subgraph Entry["DraftVariableEntry"]
        E1["name: string"]
        E2["value: string"]
        E3["confidence: 0-1"]
        E4["sourceUrl?: string"]
        E5["sourceSnippet?: string"]
    end

    subgraph Status["DraftStatus"]
        S1["pending_review"]
        S2["approved"]
        S3["rejected"]
    end

    D4 --> E1
    D4 --> E2
    D4 --> E3
    D4 --> E4
    D4 --> E5
    D3 --> S1
    D3 --> S2
    D3 --> S3
```

---

## 5. テンプレート・変数システム

### 5.1 ページレジストリ（GOV.UK方式タクソノミー）

URLとコンテンツ分類を分離するため、`page-registry.json`でマッピングを管理します。

```mermaid
flowchart LR
    subgraph Registry["page-registry.json"]
        R1["ページスラッグ → ファイルパス"]
        R2["カテゴリ情報（タクソノミー）"]
    end

    subgraph Entry["エントリ例"]
        E1["kokuho:<br/>filePath: services/health/kokuho<br/>categories: [health]"]
        E2["juminhyo:<br/>filePath: services/registration/juminhyo<br/>categories: [registration]"]
        E3["gomi:<br/>filePath: services/environment/gomi<br/>categories: [environment]"]
    end

    subgraph Functions["lib/artifact/page-registry.ts"]
        F1["getPageRegistry()<br/>レジストリ読込（キャッシュ）"]
        F2["resolvePagePath(slug)<br/>スラッグ→パス解決"]
        F3["isRegisteredPage(slug)<br/>存在確認"]
        F4["getPageCategories(slug)<br/>カテゴリ取得"]
        F5["getSlugFromFilePath(path)<br/>逆引き"]
        F6["resolveArtifactPath(segments)<br/>URL→ファイルパス"]
    end

    R1 --> E1
    R1 --> E2
    R1 --> E3
    R2 --> E1
    F1 --> R1
    F2 --> F1
    F3 --> F1
    F4 --> R2
    F5 --> R1
    F6 --> F2
```

**GOV.UK方式の特徴:**

| 項目 | 説明 |
|------|------|
| **フラットURL** | `/takaoka/kokuho`（階層を含まない） |
| **タクソノミー分離** | URLに分類情報を含めず、メタデータで管理 |
| **複数カテゴリ対応** | 1ページが複数カテゴリに属することが可能 |
| **後方互換性** | 旧形式（`/services/category/page`）もサポート |

### 5.2 テンプレートクローン処理

```mermaid
flowchart TD
    subgraph API["API - app/api/admin/municipalities/route.ts"]
        A1["POST /api/admin/municipalities"]
    end

    subgraph Clone["クローン処理 - lib/template/clone.ts"]
        C1["cloneTemplate(input, options)"]
        C2["getAllFiles(templateDir)<br/>再帰取得"]
        C3["replaceVariables()<br/>各ファイル置換"]
        C4["mkdir + writeFile<br/>ファイル作成"]
        C5["extractTemplateVariables()"]
        C6["getMunicipalityPageCount()"]
        C7["deleteMunicipality()"]
        C8["getTotalVariableCount()"]
    end

    subgraph Output["出力"]
        O1["meta.json<br/>自治体メタデータ"]
        O2["variables.json<br/>変数ストア"]
        O3["services/**/*.json<br/>Content Item"]
    end

    A1 --> C1
    C1 --> C2
    C2 --> C3
    C3 --> C4
    C4 --> O1
    C4 --> O2
    C4 --> O3
    C5 --> C1
    C6 --> C1
```

### 5.2 自治体データ管理

```mermaid
flowchart LR
    subgraph Storage["ストレージ操作 - lib/template/storage.ts"]
        S1["getMunicipalities()<br/>一覧取得"]
        S2["getMunicipality(id)<br/>単体取得"]
        S3["getMunicipalityMeta(id)<br/>メタ読込"]
        S4["getVariableStore(id)<br/>変数読込"]
        S5["updateVariableStore(id, vars)<br/>変数更新"]
        S6["updateMunicipalityMeta(id, meta)<br/>メタ更新"]
        S7["updateMunicipalityStatus(id, status)<br/>ステータス変更"]
    end

    subgraph District["地区依存変数 - lib/template/district-variables.ts"]
        D1["getDistrictVariables()"]
        D2["isDistrictDependentVariable()"]
    end

    subgraph Files["ファイル構造"]
        F1["data/artifacts/{id}/meta.json"]
        F2["data/artifacts/{id}/variables/*.json"]
        F3["data/artifacts/{id}/services/**/*.json"]
    end

    S1 --> F1
    S3 --> F1
    S4 --> F2
    S5 --> F2
    S6 --> F1
    D1 --> F2
```

---

## 6. 管理画面フロー

### 6.1 ページ構成

```mermaid
flowchart TD
    subgraph Layout["レイアウト"]
        L1["app/admin/layout.tsx<br/>認証保護"]
    end

    subgraph Pages["ページ"]
        P1["app/admin/page.tsx<br/>ダッシュボード"]
        P2["app/admin/municipalities/page.tsx<br/>自治体一覧"]
        P3["app/admin/municipalities/new/page.tsx<br/>新規作成"]
        P4["app/admin/municipalities/[id]/page.tsx<br/>詳細・編集"]
        P5["app/admin/drafts/page.tsx<br/>ドラフト一覧"]
        P6["app/admin/drafts/[municipalityId]/[service]/page.tsx<br/>ドラフト詳細"]
        P7["app/admin/notifications/page.tsx<br/>通知一覧"]
    end

    subgraph Components["コンポーネント"]
        C1["FetchButton<br/>情報取得開始"]
        C2["PublishButton<br/>公開切替"]
        C3["VariableTable<br/>変数編集"]
        C4["ServiceVariableStats<br/>統計表示"]
        C5["HistoryTable<br/>履歴表示"]
        C6["VariableContextViewer<br/>コンテキスト"]
        C7["TemplatePreview<br/>プレビュー"]
        C8["SourceViewer<br/>ソース表示"]
        C9["DraftActions<br/>承認/却下"]
    end

    L1 --> P1
    L1 --> P2
    L1 --> P3
    L1 --> P4
    L1 --> P5
    L1 --> P6
    L1 --> P7
    P4 --> C1
    P4 --> C2
    P4 --> C3
    P4 --> C4
    P4 --> C5
    P6 --> C6
    P6 --> C7
    P6 --> C8
    P6 --> C9
```

### 6.2 管理API

```mermaid
flowchart LR
    subgraph Municipality["自治体API"]
        M1["POST /api/admin/municipalities<br/>作成"]
        M2["GET /api/admin/municipalities<br/>一覧"]
        M3["GET /api/admin/municipalities/[id]<br/>詳細"]
        M4["PUT /api/admin/municipalities/[id]<br/>更新"]
        M5["DELETE /api/admin/municipalities/[id]<br/>削除"]
    end

    subgraph Fetch["取得API"]
        F1["POST /api/admin/municipalities/[id]/fetch<br/>取得開始(SSE)"]
        F2["GET /api/admin/municipalities/[id]/fetch/status<br/>ステータス"]
    end

    subgraph Variables["変数API"]
        V1["PUT /api/admin/municipalities/[id]/variables<br/>変数更新"]
    end

    subgraph History["履歴API"]
        H1["GET /api/admin/municipalities/[id]/history<br/>履歴取得"]
    end

    subgraph Drafts["ドラフトAPI"]
        D1["GET /api/admin/drafts<br/>一覧"]
        D2["GET /api/admin/drafts/[municipalityId]/[service]<br/>詳細"]
        D3["PUT /api/admin/drafts/[municipalityId]/[service]<br/>更新"]
        D4["DELETE /api/admin/drafts/[municipalityId]/[service]<br/>削除"]
        D5["GET .../template<br/>テンプレートプレビュー"]
        D6["GET .../source<br/>ソースドキュメント"]
    end

    subgraph Utils["ユーティリティAPI"]
        U1["POST /api/admin/pdf/ocr<br/>PDF OCR"]
        U2["GET /api/admin/notifications<br/>通知一覧"]
    end
```

---

## 7. ストレージ抽象化層

```mermaid
flowchart TD
    subgraph Factory["ファクトリ - lib/storage/index.ts"]
        F1["createStorageAdapter(config)"]
        F2["getDefaultStorageAdapter()<br/>シングルトン"]
    end

    subgraph Interface["インターフェース - lib/storage/types.ts"]
        I1["ArtifactStorageAdapter"]
        I2["get(key): Promise<string>"]
        I3["put(key, value): Promise<void>"]
        I4["delete(key): Promise<void>"]
        I5["list(prefix): Promise<string[]>"]
    end

    subgraph Adapters["アダプタ実装"]
        A1["LocalAdapter<br/>lib/storage/local-adapter.ts"]
        A2["S3Adapter<br/>lib/storage/s3-adapter.ts"]
    end

    subgraph Config["設定"]
        C1["ARTIFACT_STORAGE_TYPE=local"]
        C2["ARTIFACT_STORAGE_TYPE=s3"]
        C3["ARTIFACT_STORAGE_TYPE=r2"]
    end

    F1 --> I1
    F2 --> F1
    I1 --> I2
    I1 --> I3
    I1 --> I4
    I1 --> I5
    I1 --> A1
    I1 --> A2
    C1 --> A1
    C2 --> A2
    C3 --> A2
```

---

## 8. コンポーネント階層

### 8.1 Blockレンダリング

```mermaid
flowchart TD
    subgraph Renderer["メインレンダラー"]
        BR1["BlockRenderer.tsx"]
        BR2["MunicipalityContext.tsx"]
    end

    subgraph Blocks["ブロックカテゴリ"]
        B1["ContentBlocks.tsx<br/>Title/Summary/RichText<br/>Table/Accordion/Section"]
        B2["NavigationBlocks.tsx<br/>Breadcrumbs/ResourceList<br/>RelatedLinks"]
        B3["InteractiveBlocks.tsx<br/>Contact/ActionButton<br/>TaskButton/StepNavigation<br/>DirectoryList"]
        B4["NotificationBlocks.tsx<br/>NotificationBanner<br/>EmergencyBanner"]
        B5["HomePageBlocks.tsx<br/>Hero/TopicGrid/TopicList<br/>QuickLinks/NewsList"]
    end

    subgraph Special["特殊ブロック"]
        S1["DistrictSelector / HazardMapViewer"]
        S2["ShelterList / InfoCard / CardGrid"]
        S3["Attachments / Sources"]
    end

    subgraph Utils["ユーティリティ"]
        U1["RichTextRenderer.tsx"]
        U2["BudouX.tsx"]
    end

    BR1 --> BR2
    BR2 --> Blocks
    BR2 --> Special
    B1 --> U1
    U1 --> U2
```

### 8.2 DADSコンポーネント

```mermaid
flowchart LR
    subgraph DADS["components/dads/index.ts - 50+コンポーネント"]
        L["レイアウト<br/>Accordion/Breadcrumbs/Disclosure<br/>Divider/Dl/Ol/Ul/Blockquote/Slot"]
        F["フォーム<br/>Input/Textarea/Select<br/>Checkbox/Radio/DatePicker"]
        B["ボタン<br/>Button/HamburgerMenuButton<br/>UtilityLink"]
        I["情報表示<br/>Label/Legend/ErrorText/SupportText<br/>StatusBadge/RequirementBadge<br/>ResourceList/NotificationBanner<br/>EmergencyBanner/Carousel"]
        N["ナビゲーション<br/>LanguageSelector/StepNavigation"]
    end
```

---

## 9. 認証・ミドルウェア

```mermaid
flowchart TD
    subgraph Middleware["middleware.ts"]
        M1["リクエスト受信"]
        M2["パスチェック"]
        M3["Basic認証チェック"]
        M4["Bearer認証チェック"]
        M5["認証成功"]
        M6["401 Unauthorized"]
    end

    subgraph Routes["保護ルート"]
        R1["/admin/*"]
        R2["/api/admin/*"]
        R3["/api/cron/update-municipalities"]
    end

    subgraph Auth["認証方式"]
        A1["Basic Auth<br/>ADMIN_BASIC_AUTH"]
        A2["Bearer Token<br/>CRON_SECRET"]
    end

    M1 --> M2
    M2 -->|/admin| R1
    M2 -->|/api/admin| R2
    M2 -->|/api/cron| R3
    R1 --> M3
    R2 --> M3
    R3 --> M4
    M3 -->|有効| M5
    M3 -->|無効| M6
    M4 -->|有効| M5
    M4 -->|無効| M6
    A1 --> M3
    A2 --> M4
```

---

## 10. 未使用・参照用コード

### 10.1 アーカイブ（使用禁止）

```mermaid
flowchart LR
    subgraph Archive["archive/ - 使用禁止"]
        A1["archive/docs/<br/>古いドキュメント"]
        A2["archive/scrapers/<br/>旧スクレイピングパイプライン"]
        A3["archive/processors/<br/>旧データ処理"]
    end

    subgraph Warning["警告"]
        W1["CLAUDE.mdで参照禁止"]
        W2["レガシーコード"]
        W3["互換性なし"]
    end

    A1 --> W1
    A2 --> W2
    A3 --> W3
```

### 10.2 開発・テスト用（本番未使用）

| カテゴリ | パス | 用途 |
|---------|------|------|
| 開発ルート | `app/dev/dads/` | DADSコンポーネントショーケース |
| | `app/dev/review/` | コンテンツレビューUI |
| | `app/dev/structure/` | 構造検査 |
| スクリプト | `scripts/test-*.ts` | 各種テストスクリプト |
| | `scripts/validate-artifacts.ts` | スキーマ検証 |
| | `scripts/build-search-index.ts` | 検索インデックス構築 |
| 参照用関数 | `lib/llm/prompts/content-structurer.ts` | COMPONENT_SELECTION_RULES |
| | `lib/llm/prompts/missing-variable-suggester.ts` | 不足変数提案 |

### 10.3 ジョブ管理（内部使用）

| 関数 | 役割 |
|------|------|
| `createFetchJob()` | ジョブ作成 |
| `saveJob()` | 状態保存 |
| `getLatestJob()` | 最新取得 |
| `updateServiceStatus()` | 進捗更新 |
| `recordJobError()` | エラー記録 |
| `completeJob()` | 完了処理 |

- **ストレージ**: `data/artifacts/_jobs/{id}/latest.json`
- **用途**: 長時間実行タスクの再開、進捗トラッキング、エラー復旧

### 10.4 履歴・通知（補助機能）

| モジュール | 関数 | 用途 |
|-----------|------|------|
| `lib/history/storage.ts` | `addHistoryEntry()` | 監査証跡 |
| | `recordVariableUpdate()` | 変更追跡 |
| | `recordBulkVariableUpdate()` | 変更追跡 |
| | `recordDraftApproval()` | 監査証跡 |
| | `recordDraftRejection()` | 監査証跡 |
| | `getHistoryList()` | 監査証跡 |
| | `getHistoryStats()` | 監査証跡 |
| `lib/notification/storage.ts` | `createNotification()` | 管理者通知 |
| | `getNotifications()` | 管理者通知 |
| | `deleteNotification()` | 管理者通知 |

---

## 付録: ファイル一覧と主要エクスポート

### コアライブラリ

| ファイルパス | 主要エクスポート | 役割 |
|-------------|-----------------|------|
| `lib/artifact/index.ts` | `loadArtifact`, `loadArtifacts`, `getCompletedPages` | アーティファクト読込インターフェース |
| `lib/artifact/loader.ts` | `loadArtifactInternal` | キャッシュ付き読込実装 |
| `lib/artifact/schema.ts` | `validateArtifact`, `safeValidateArtifact` | Zodスキーマ検証 |
| `lib/artifact/cache.ts` | `getFromCache`, `setInCache`, `invalidateCache` | インメモリキャッシュ |
| `lib/artifact/page-registry.ts` | `resolveArtifactPath`, `resolvePagePath`, `getPageCategories` | GOV.UK方式URL解決 |
| `lib/template/clone.ts` | `cloneTemplate`, `deleteMunicipality` | テンプレート複製 |
| `lib/template/replace.ts` | `replaceVariables`, `replaceVariablesWithSources` | 変数置換 |
| `lib/template/storage.ts` | `getMunicipalities`, `getVariableStore`, `updateVariableStore` | 自治体データCRUD |
| `lib/llm/fetcher.ts` | `fetchServiceVariables` | LLM取得オーケストレーション |
| `lib/llm/gemini.ts` | `generateContent`, `generateJSON` | Gemini APIクライアント |
| `lib/llm/google-search.ts` | `googleSearch`, `searchMunicipalitySite` | Google検索 |
| `lib/llm/page-fetcher.ts` | `fetchPage`, `fetchPageWithPdfs` | コンテンツ取得 |
| `lib/llm/validators.ts` | `validateVariable`, `validatePhone`, etc. | 値検証 |
| `lib/drafts/storage.ts` | `getAllDrafts`, `getDraft`, `saveDraft` | ドラフトCRUD |
| `lib/drafts/diff.ts` | `compareDraftWithStore`, `applyDraftToStore` | 差分比較・適用 |
| `lib/storage/index.ts` | `createStorageAdapter`, `getDefaultStorageAdapter` | ストレージファクトリ |

### コンポーネント

| ファイルパス | 主要エクスポート | 役割 |
|-------------|-----------------|------|
| `components/blocks/BlockRenderer.tsx` | `BlockRenderer` | ブロック振り分け |
| `components/blocks/MunicipalityContext.tsx` | `MunicipalityProvider`, `useMunicipality` | コンテキスト |
| `components/blocks/RichTextRenderer.tsx` | `RichTextRenderer` | リッチテキスト解析 |
| `components/dads/index.ts` | 50+コンポーネント | DADSライブラリ |

---

*このドキュメントは2026-02-03に更新されました。（GOV.UK方式フラットURL対応を追加）*
