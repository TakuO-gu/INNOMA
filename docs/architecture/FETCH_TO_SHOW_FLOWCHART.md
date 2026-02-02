
```mermaid
flowchart TB
    subgraph 初期設定["1. 初期設定（手動）"]
        A1[自治体ID・名前・都道府県を設定] --> A2[公式サイトURLを設定]
        A2 --> A3["pipeline.ts create 実行"] 
        A3 --> A4[テンプレートからartifactsをコピー]
        A4 --> A5[variables/*.json を初期化]
    end

    subgraph 情報取得["2. LLM情報取得システム"]
        B1["pipeline.ts fetch 開始"] --> B2[サービス・変数定義を読み込み]
        B2 --> B3{変数の種類}
        
        B3 -->|LLM取得対象| B4["Query Generator<br/>(Gemini LLM)<br/>簡素化プロンプト"]
        B4 --> B5["Web Search<br/>Brave（推奨）/Google（フォールバック）"]
        B5 --> B6{結果タイプ}
        
        B6 -->|HTML| B7[テキスト抽出]
        B6 -->|PDF/画像| B8["Vision API OCR<br/>（キャッシュ有）"]
        
        B7 --> B9["Extractor<br/>(Gemini LLM)<br/>簡素化プロンプト"]
        B8 --> B9

        B9 --> B9a{変数取得成功?}
        B9a -->|Yes| B10[信頼度スコア計算]
        B9a -->|No/曖昧| B9b["Playwright Link Crawler<br/>(playwright-crawler.ts)"]
        B9b --> B9c["最大3ページ横断探索<br/>・関連リンクをLLMで評価<br/>・クリックして遷移<br/>・各ページでExtractor実行"]
        B9c --> B9d{変数取得成功?}
        B9d -->|Yes| B10
        B9d -->|No| B10a

        B10 --> B10a{未取得変数あり?}
        B10a -->|Yes| B10b["個別変数ごとに追加検索<br/>（変数専用クエリで再検索）"]
        B10b --> B10c{それでも未取得?}
        B10c -->|Yes| B10d["Missing Variable Suggester<br/>(Gemini LLM)"]
        B10d --> B10e["代替案を生成<br/>・理由（なぜ見つからないか）<br/>・代替値（フォームURL等）<br/>・関連PDF/URL"]
        B10e --> B11
        B10c -->|No| B11
        B10a -->|No| B11

        B11["下書き保存<br/>_drafts/{municipality}/{service}.json"]
        
        B3 -->|手動入力| B12[管理画面で入力]
        B3 -->|自動生成| B13[システムが自動設定]
    end

    subgraph 検証["3. バリデーション"]
        C1["validate-artifacts.ts"] --> C2{形式検証}
        C2 -->|電話番号| C3["^\\d{2,5}-\\d{2,4}-\\d{4}$"]
        C2 -->|メール| C4["^[\\w.-]+@[\\w.-]+"]
        C2 -->|URL| C5["^https?://"]
        C2 -->|金額| C6["^[\\d,]+円$"]
        
        C7["template-validity-checker<br/>エージェント"] --> C8[10自治体のWebサイトと比較]
        C8 --> C9{静的コンテンツ検証}
        C9 -->|NG| C10[修正が必要な項目をレポート]
        C9 -->|OK| C11[検証パス]
    end

    subgraph 品質分析["4. auto-update-bot 品質分析"]
        D1["auto-update-bot.ts analyze"] --> D2[Playwright でページ表示]
        D2 --> D3[スクリーンショット取得]
        
        D3 --> D4[読みやすさ分析<br/>・長文検出<br/>・受動態多用<br/>・否定表現]
        D3 --> D5[用語分析<br/>・難解な行政用語<br/>・説明有無確認]
        D3 --> D6[完全性分析<br/>・必須セクション<br/>・申請方法記載]
        D3 --> D7[認知構造分析<br/>・セクション順序<br/>・見出し具体性]
        
        D4 --> D8[スコア算出<br/>0-100点]
        D5 --> D8
        D6 --> D8
        D7 --> D8
        
        D8 --> D9{スコア判定}
        D9 -->|問題あり| D10["auto-update-bot.ts improve<br/>自動修正"]
        D9 -->|OK| D11[分析レポート生成]
    end

    subgraph レビュー["5. レビュー・承認"]
        E1[管理画面で下書き確認] --> E2{信頼度判定}
        E2 -->|高い（≥0.8）| E3["--auto-approve で自動承認"]
        E2 -->|低い| E4[手動確認・修正]

        E1 --> E6{未取得変数あり?}
        E6 -->|Yes| E7["代替案を確認<br/>・提案値を採用<br/>・手動入力<br/>・スキップ"]
        E6 -->|No| E2
        E7 --> E4

        E3 --> E5[variables/*.json に反映]
        E4 --> E5
    end

    subgraph 公開["6. ビルド・公開"]
        F1["npm run check<br/>(lint + test + build)"] --> F2{チェック結果}
        F2 -->|失敗| F3[エラー修正]
        F3 --> F1
        F2 -->|成功| F4[ページ公開]
        F4 --> F5["docs/updates/YYYY-MM-DD.md<br/>更新履歴記録"]
    end

    初期設定 --> 情報取得
    情報取得 --> 検証
    検証 --> 品質分析
    品質分析 --> レビュー
    レビュー --> 公開

    subgraph 定期更新["定期更新サイクル"]
        G1[更新対象の特定<br/>前回更新から一定期間経過] --> G2[同じクエリで再検索]
        G2 --> G3{差分検出}
        G3 -->|変更あり| G4[下書き更新・管理者通知]
        G3 -->|変更なし| G5[スキップ]
    end

    公開 -.-> 定期更新
    定期更新 -.-> 情報取得

    style 初期設定 fill:#e1f5fe
    style 情報取得 fill:#fff3e0
    style 検証 fill:#f3e5f5
    style 品質分析 fill:#e8f5e9
    style レビュー fill:#fff8e1
    style 公開 fill:#fce4ec
    style 定期更新 fill:#f5f5f5
```

---

## ブロックレンダラー フローチャート

```mermaid
flowchart TB
    subgraph URLリクエスト["1. URLリクエスト"]
        A1["ユーザーがURLにアクセス<br/>/[municipality]/[[...path]]"] --> A2["Next.js ルーティング<br/>page.tsx"]
    end

    subgraph データ読み込み["2. Artifact読み込み"]
        B1["loadArtifact()"] --> B2["ストレージからJSON取得<br/>getDefaultStorageAdapter()"]
        B2 --> B3["キャッシュチェック<br/>TTLベース"]
        B3 --> B4["変数ストア読み込み<br/>getVariableStore(municipalityId)"]
        B4 --> B5["変数置換<br/>replaceVariablesWithSources()"]
        B5 --> B6["{{VAR_NAME}} → 実際の値"]
        B6 --> B7["Zodスキーマ検証<br/>InnomaArtifactSchema"]
        B7 --> B8{検証結果}
        B8 -->|失敗| B9["404ページ"]
        B8 -->|成功| B10["artifact, sources,<br/>unreplacedVariables を返却"]
    end

    subgraph ページコンポーネント["3. ページコンポーネント"]
        C1["page.tsx"] --> C2{未置換変数あり?}
        C2 -->|多数| C3["404ページ<br/>（非公開扱い）"]
        C2 -->|なし/少数| C4["BlockRenderer呼び出し"]
    end

    subgraph BlockRenderer["4. BlockRenderer"]
        D1["<MunicipalityProvider>"] --> D2["municipalityId<br/>completedPages<br/>をContextに設定"]
        D2 --> D3["blocks.map()"]
        D3 --> D4["各ブロックをループ"]
        D4 --> D5["blockRegistry[block.type]<br/>からコンポーネント取得"]
        D5 --> D7["コンポーネントをレンダリング<br/><Component props={block.props} sources={sources} /><br/>（各コンポーネントが自身のmt-*を持つ）"]
    end

    subgraph blockRegistry["5. Block Registry (28種類)"]
        E1["Navigation"]
        E1a["Breadcrumbs"]
        E1b["ResourceList"]
        E1c["RelatedLinks"]

        E2["Content"]
        E2a["Title / Summary"]
        E2b["RichText"]
        E2c["Table / Accordion"]
        E2d["Section / DescriptionList"]

        E3["Notification"]
        E3a["NotificationBanner"]
        E3b["EmergencyBanner"]

        E4["Interactive"]
        E4a["Contact / ContactCard"]
        E4b["StepNavigation"]
        E4c["ActionButton / TaskButton"]
        E4d["DirectoryList"]

        E5["HomePage"]
        E5a["Hero / TopicGrid"]
        E5b["QuickLinks / NewsList"]

        E6["Other"]
        E6a["Sources"]
        E6b["DistrictSelector"]
        E6c["ShelterList / HazardMapViewer"]
        E6d["CardGrid / InfoCard"]
    end

    subgraph RichTextRenderer["6. RichTextRenderer"]
        F0["RichText content受信"] --> F0a{content形式}
        F0a -->|Array| F1["renderNodes()"]
        F0a -->|String JSON| F0b["JSON.parse()"]
        F0a -->|Plain String| F0c["改行で分割<br/>→ <p>タグ"]
        F0b --> F1

        F1 --> F2{ノードタイプ判定<br/>node.type}

        %% heading処理
        F2 -->|heading| F3["getHeadingSizeClass(level)"]
        F3 --> F3a{"level"}
        F3a -->|1| F3b["text-std-45B-140<br/><h1>"]
        F3a -->|2| F3c["text-std-32B-150<br/><h2>"]
        F3a -->|3| F3d["text-std-24B-150<br/><h3>"]
        F3a -->|4-6| F3e["text-std-20B or 17B<br/><h4>-<h6>"]
        F3b & F3c & F3d & F3e --> F3f["sourceRef あれば<br/>上付き[n]参照追加"]

        %% paragraph処理
        F2 -->|paragraph| F4["nodeContainsUnresolvedVariable()"]
        F4 --> F4a{未解決変数あり?}
        F4a -->|Yes| F4b["null（非表示）"]
        F4a -->|No| F4c["renderRun() で<br/>各runを処理"]

        %% runs処理の詳細
        F4c --> F8{run属性判定}
        F8 -->|link.external| F9a["<Link href target=_blank>"]
        F8 -->|link.internal| F9b["<NextLink href=<br/>/municipalityId/path>"]
        F8 -->|bold| F10["<strong>テキスト</strong>"]
        F8 -->|text| F11["budouxParse()<br/>日本語改行最適化"]
        F8 -->|sourceRef| F12["<sup>[n]</sup><br/>href=#source-n"]

        %% list処理
        F2 -->|list| F5{ordered?}
        F5 -->|Yes| F5a["<ol class='list-decimal'>"]
        F5 -->|No| F5b["<ul class='list-disc'>"]
        F5a & F5b --> F5c["未解決変数のアイテム<br/>をフィルタ"]
        F5c --> F5d{フィルタ後0件?}
        F5d -->|Yes| F5e["null（非表示）"]
        F5d -->|No| F5f["items.map()<br/>再帰的にrenderNode()"]

        %% divider処理
        F2 -->|divider| F7["<hr class='border-t<br/>border-solid-gray-300'>"]
    end

    subgraph スペーシング["7. スペーシングルール（各コンポーネント内蔵）"]
        G1["各コンポーネントが自身のmt-*を持つ"]
        G2["Breadcrumbs, Hero → mt-0"]
        G3["Title, Summary → mt-6"]
        G4["RichText, Table, Accordion → mt-12"]
        G5["Section → mt-24"]
        G6["Contact, Sources → mt-16"]
        G7["Notification → mt-6"]
    end

    subgraph MunicipalityContext["8. MunicipalityContext"]
        H1["municipalityId"] --> H2["内部リンクのプレフィックス"]
        H3["completedPages"] --> H4["未完成ページへのリンク制御"]
        H5["isPageCompleted(path)"] --> H6["ActionButton表示/非表示"]
    end

    subgraph 最終出力["9. 最終出力"]
        I1["HTML/React コンポーネント"] --> I2["DADSスタイリング適用"]
        I2 --> I3["ブラウザに表示"]
    end

    URLリクエスト --> データ読み込み
    データ読み込み --> ページコンポーネント
    ページコンポーネント --> BlockRenderer
    BlockRenderer --> blockRegistry
    blockRegistry --> スペーシング
    blockRegistry --> RichTextRenderer
    BlockRenderer --> MunicipalityContext
    RichTextRenderer --> 最終出力
    MunicipalityContext --> 最終出力

    style URLリクエスト fill:#e3f2fd
    style データ読み込み fill:#fff3e0
    style ページコンポーネント fill:#e8f5e9
    style BlockRenderer fill:#f3e5f5
    style blockRegistry fill:#fce4ec
    style RichTextRenderer fill:#fff8e1
    style スペーシング fill:#e0f2f1
    style MunicipalityContext fill:#fbe9e7
    style 最終出力 fill:#f5f5f5
```

---

## ブロックレンダラー詳細フロー

```mermaid
flowchart LR
    subgraph 入力["入力"]
        A1["artifact.blocks[]<br/>BaseBlock配列"]
        A2["sources[]<br/>参照情報"]
        A3["municipalityId"]
        A4["completedPages"]
    end

    subgraph BlockRenderer処理["BlockRenderer処理"]
        B1["MunicipalityProvider<br/>Context設定"]
        B2["blocks.map((block) => ...)"]

        subgraph ブロック処理["各ブロック処理"]
            C1["block.type 取得"]
            C2["blockRegistry[type]<br/>コンポーネント検索"]
            C3{存在する?}
            C3 -->|Yes| C4["コンポーネント取得"]
            C3 -->|No| C5["null（スキップ）"]

            C4 --> C8["<Component<br/>  props={block.props}<br/>  sources={sources}<br/>/><br/>※コンポーネント自身がmt-*を持つ"]
        end
    end

    subgraph 出力["出力"]
        D1["<div data-block-type={type}>"]
        D2["レンダリング済みコンポーネント<br/>（自身のmt-*スタイル適用済み）"]
        D3["</div>"]
    end

    入力 --> BlockRenderer処理
    BlockRenderer処理 --> 出力

    style 入力 fill:#e3f2fd
    style BlockRenderer処理 fill:#f3e5f5
    style ブロック処理 fill:#fff3e0
    style 出力 fill:#e8f5e9
```

---

## コンポーネント選択ロジック（DADS準拠）

```mermaid
flowchart TD
    A[コンテンツタイプ判定] --> B{何を表示する?}

    %% ===== ページ構造 =====
    B -->|ページタイトル| T1["Title"]
    B -->|概要・要約| T2["Summary"]
    B -->|セクション見出し| T3{レベル}
    T3 -->|h2| T3a["Section<br/>(level: 2)"]
    T3 -->|h3/h4| T3b["RichText<br/>(heading node)"]

    %% ===== ナビゲーション =====
    B -->|パンくず| N1["Breadcrumbs"]
    B -->|関連リンク| N2{表示形式}
    N2 -->|リスト| N2a["RelatedLinks"]
    N2 -->|カード| N2b["ResourceList"]
    B -->|クイックアクセス| N3["QuickLinks"]

    %% ===== 手順・フロー =====
    B -->|手順| C{ステップ数}
    C -->|3以上| C1["StepNavigation"]
    C -->|1〜2| C2["RichText<br/>(ordered list)"]
    C -->|1のみ| C3["RichText<br/>(paragraph)"]

    %% ===== リスト・データ =====
    B -->|リスト| D{データ構造}
    D -->|条件分岐あり| D1{折りたたみ必要?}
    D1 -->|Yes| D1a["Accordion"]
    D1 -->|No| D1b["Table"]
    D -->|シンプル| D2["RichText<br/>(unordered list)"]
    D -->|定義リスト| D3["DescriptionList"]

    B -->|キー・バリュー| E{値の状態}
    E -->|値あり| E1["Table"]
    E -->|値なし/空| E2["RichText<br/>(段落)"]

    B -->|Q&A・FAQ| F["Accordion"]

    %% ===== 通知・警告 =====
    B -->|重要な注意| G{重要度}
    G -->|緊急| G0["EmergencyBanner"]
    G -->|高| G1["NotificationBanner<br/>(danger)"]
    G -->|中| G2["NotificationBanner<br/>(warning)"]
    G -->|低/情報| G3["NotificationBanner<br/>(info)"]
    G -->|成功| G4["NotificationBanner<br/>(success)"]

    %% ===== 連絡先・施設 =====
    B -->|連絡先| H{件数}
    H -->|1件| H1["Contact"]
    H -->|複数| H2["DirectoryList"]

    B -->|避難所| H3["ShelterList"]
    B -->|ハザードマップ| H4["HazardMapViewer"]

    %% ===== カード・グリッド =====
    B -->|カード表示| I{用途}
    I -->|比較・詳細表示| I1["Table"]
    I -->|一覧・選択| I2{バリエーション}
    I2 -->|画像+テキスト| I2a["CardGrid<br/>(variant: media)"]
    I2 -->|リンクカード| I2b["CardGrid<br/>(variant: link)"]
    I2 -->|アイコン+説明| I2c["CardGrid<br/>(variant: info)"]
    I -->|統計・数値| I3["InfoCardGrid"]
    I -->|単体情報| I4["InfoCard"]

    %% ===== トピック・ニュース =====
    B -->|トピック一覧| K{表示形式}
    K -->|グリッド| K1["TopicGrid"]
    K -->|リスト| K2["TopicList"]

    B -->|ニュース| L{表示形式}
    L -->|一覧| L1["NewsList"]
    L -->|メタ情報| L2["NewsMeta"]

    %% ===== アクション =====
    B -->|CTAボタン| M{重要度}
    M -->|主要アクション| M1["ActionButton"]
    M -->|補助アクション| M2["TaskButton"]

    B -->|添付ファイル| M3["Attachments"]

    %% ===== 地区・変数 =====
    B -->|地区選択UI| O["DistrictSelector"]

    %% ===== テキスト・引用 =====
    B -->|本文| P["RichText"]
    B -->|引用| Q["Blockquote"]
    B -->|ステータス| R["StatusBadge"]

    %% ===== ホームページ =====
    B -->|ヒーローセクション| S["Hero"]

    %% ===== 参照 =====
    B -->|参照元・出典| J["Sources<br/>(Wikipedia形式)"]

    %% ===== スタイリング =====
    style A fill:#e3f2fd

    %% ページ構造（青系）
    style T1 fill:#bbdefb
    style T2 fill:#bbdefb
    style T3a fill:#bbdefb
    style T3b fill:#bbdefb

    %% ナビゲーション（紫系）
    style N1 fill:#e1bee7
    style N2a fill:#e1bee7
    style N2b fill:#e1bee7
    style N3 fill:#e1bee7

    %% 手順（緑系）
    style C1 fill:#c8e6c9
    style C2 fill:#c8e6c9
    style C3 fill:#c8e6c9

    %% データ（緑系）
    style D1a fill:#c8e6c9
    style D1b fill:#c8e6c9
    style D2 fill:#c8e6c9
    style D3 fill:#c8e6c9
    style E1 fill:#c8e6c9
    style E2 fill:#c8e6c9
    style F fill:#c8e6c9

    %% 通知（赤/オレンジ/青系）
    style G0 fill:#ef9a9a
    style G1 fill:#ffcdd2
    style G2 fill:#ffe0b2
    style G3 fill:#bbdefb
    style G4 fill:#c8e6c9

    %% 連絡先・施設（シアン系）
    style H1 fill:#b2ebf2
    style H2 fill:#b2ebf2
    style H3 fill:#b2ebf2
    style H4 fill:#b2ebf2

    %% カード（ピンク系）
    style I1 fill:#f8bbd9
    style I2a fill:#f8bbd9
    style I2b fill:#f8bbd9
    style I2c fill:#f8bbd9
    style I3 fill:#f8bbd9
    style I4 fill:#f8bbd9

    %% トピック・ニュース（黄系）
    style K1 fill:#fff9c4
    style K2 fill:#fff9c4
    style L1 fill:#fff9c4
    style L2 fill:#fff9c4

    %% アクション（オレンジ系）
    style M1 fill:#ffcc80
    style M2 fill:#ffcc80
    style M3 fill:#ffcc80

    %% 地区選択（茶系）
    style O fill:#d7ccc8

    %% テキスト（グレー系）
    style P fill:#cfd8dc
    style Q fill:#cfd8dc
    style R fill:#cfd8dc

    %% ホームページ（深緑系）
    style S fill:#a5d6a7

    %% 参照（グレー系）
    style J fill:#e0e0e0
```

---

## ブロックタイプ一覧（32種類）

| カテゴリ | ブロックタイプ | 用途 |
|---------|---------------|------|
| **ページ構造** | Title | ページタイトル（h1） |
| | Summary | ページ概要 |
| | Section | セクション見出し+コンテンツ |
| **ナビゲーション** | Breadcrumbs | パンくずリスト |
| | RelatedLinks | 関連リンク（シンプル） |
| | ResourceList | リソースリンク（詳細付き） |
| | QuickLinks | クイックアクセスリンク |
| **コンテンツ** | RichText | 構造化テキスト（heading/paragraph/list/divider） |
| | Table | キー・バリュー表 |
| | Accordion | 折りたたみ（Q&A、条件分岐） |
| | DescriptionList | 定義リスト（dt/dd） |
| | Blockquote | 引用 |
| | StatusBadge | ステータス表示 |
| **通知** | NotificationBanner | 注意・警告・情報（severity: info/warning/danger/success） |
| | EmergencyBanner | 緊急通知 |
| **インタラクティブ** | Contact | 連絡先（単体） |
| | DirectoryList | 施設・連絡先一覧 |
| | StepNavigation | 手順ナビゲーション |
| | ActionButton | 主要CTAボタン |
| | TaskButton | 補助アクションボタン |
| | NewsMeta | ニュースメタ情報 |
| **カード** | CardGrid | カードグリッド（media/link/info） |
| | Card | 単体カード |
| | InfoCard | 情報カード（統計・数値） |
| | InfoCardGrid | 情報カードグリッド |
| **トピック** | TopicGrid | トピックグリッド |
| | TopicList | トピックリスト |
| | NewsList | ニュース一覧 |
| **ホームページ** | Hero | ヒーローセクション |
| **地区・災害** | DistrictSelector | 地区選択UI |
| | ShelterList | 避難所リスト |
| | HazardMapViewer | ハザードマップビューア |
| **ファイル** | Attachments | 添付ファイル（PDF等） |
| **参照** | Sources | 出典・参照元（Wikipedia形式） |

---

## LLMプロンプト仕様

### Web検索APIプロバイダー

| 優先度 | プロバイダー | 無料枠 | 備考 |
|--------|-------------|--------|------|
| 推奨 | Brave Search | 2,000クエリ/月 | 日本語対応良好 |
| フォールバック | Google Custom Search | 100クエリ/日 | 最も精度が高い |

自動フォールバック: Braveで結果0件またはエラー時にGoogleに切り替え

### Query Generator（検索クエリ生成）

**入力**: 自治体名、サービス名、取得対象変数リスト

**プロンプト**（簡素化版、70%削減）:
```
${municipalityName} ${serviceName}の公式情報を検索するクエリを生成。
取得対象: ${targetInfo.join(', ')}
出力: 検索クエリのみ（1行）
```

**出力例**: `高岡市 国民健康保険 電話番号 住所 保険料 上限額 公式`

### Extractor（情報抽出）

**入力**: Webページコンテンツ、抽出対象変数リスト

**プロンプト**（簡素化版、43%削減）:
```
ページから以下を抽出しJSON出力。見つからなければnull。
- ${variableName}: ${description}
...

ページ:
${truncatedContent}
```

**出力例**:
```json
{
  "kokuho_department": "保険年金課 国保係",
  "kokuho_phone": "0766-20-1234",
  "kokuho_limit_medical": "65万円"
}
```

### プロンプト簡素化の効果

| 項目 | 検索クエリ生成 | 情報抽出 |
|-----|--------------|---------|
| プロンプト削減率 | **70%** | **43%** |
| 応答時間 | 変化なし | 変化なし |
| 品質 | 同等〜向上 | 同等 |
