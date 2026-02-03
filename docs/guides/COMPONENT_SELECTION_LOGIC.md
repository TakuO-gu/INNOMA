# コンポーネント選択ロジック

このドキュメントは、LLMが Content Item のコンテンツを生成する際に、適切なコンポーネント（ブロックタイプ）を選択するためのロジックを定義します。

## 設計方針

1. **LLMが直接生成**: LLMが情報を取得する際に、適切なコンポーネントを選んでJSON出力
2. **既存ブロックタイプを維持**: INNOMAの既存スキーマを活かしつつ、DADSコンポーネントにマッピング
3. **重視項目**:
   - ステップ・手順の可視化
   - 必要書類の明確化
4. **リッチなコンポーネント許容**: アコーディオン、テーブル、カード等を積極活用

---

## 情報タイプ → ブロックタイプ マッピング

### 1. 手続きの流れ・ステップ

| 情報の特徴 | 推奨ブロック | 理由 |
|-----------|-------------|------|
| 明確な順序がある手順（3ステップ以上） | `StepNavigation` | 進行状況が視覚的に分かる |
| 簡単な手順（2ステップ以下） | `RichText` (ordered list) | ステップナビは過剰 |
| 手順内に分岐がある | `Accordion` + `RichText` | 条件ごとに展開できる |

**判定ロジック**:
```
IF 手順の数 >= 3 AND 各ステップに詳細説明がある:
  → StepNavigation
ELSE IF 手順の数 >= 3 AND シンプルなリスト:
  → RichText (ordered list)
ELSE:
  → RichText (paragraph or list)
```

### 2. 必要書類・持ち物

| 情報の特徴 | 推奨ブロック | 理由 |
|-----------|-------------|------|
| 書類リスト（条件分岐なし） | `Section` + `RichText` (unordered list) | シンプルで読みやすい |
| 書類リスト（条件あり：本人/代理人等で書類が異なる） | `Table` (label-value両方に値あり) または `Accordion` | 条件ごとに整理 |
| 書類に補足説明が多い | `Accordion` | 詳細は展開して表示 |
| 届出人リスト（資格者の列挙） | `Section` + `RichText` (unordered list) | 単純な列挙 |

**判定ロジック**:
```
IF 条件分岐あり（本人/代理人で「必要な書類が異なる」場合）:
  IF テーブル形式が適切（2-4条件、かつlabelとvalue両方に意味がある）:
    → Table (label: 条件, value: その条件での書類リスト)
  ELSE:
    → Accordion (各条件をセクションに)
ELSE IF 単純なリスト（書類名の列挙、資格者の列挙等）:
  → Section + RichText (unordered list)
ELSE:
  → RichText (unordered list with callout for important items)
```

**注意**: Tableはlabel-valueのペアとして意味がある場合のみ使用すること。
- ❌ NG: `{label: "書類A", value: ""}` - valueが空ならTableを使うべきではない
- ❌ NG: `{label: "本人", value: ""}` - これは単なるリストなのでTableは不適切
- ✅ OK: `{label: "本人", value: "本人確認書類"}` - label-valueに対応関係がある
- ✅ OK: `{label: "届出場所", value: "市役所1階市民課"}` - key-value情報

### 3. 費用・料金

| 情報の特徴 | 推奨ブロック | 理由 |
|-----------|-------------|------|
| 単一の金額 | `RichText` (paragraph) | 強調テキストで表示 |
| 複数の料金体系 | `Table` | 比較しやすい |
| 条件による料金差 | `Table` | 条件と金額を対応付け |

**判定ロジック**:
```
IF 料金パターン >= 2:
  → Table (label: 区分/条件, value: 金額)
ELSE:
  → RichText (paragraph with bold amount)
```

### 4. 対象者・条件

| 情報の特徴 | 推奨ブロック | 理由 |
|-----------|-------------|------|
| シンプルな条件リスト | `RichText` (unordered list) | 読みやすい |
| 複雑な条件（AND/OR） | `RichText` with callout | 注意を引く |
| 対象/対象外の区別 | `Table` または `Accordion` | 明確に区別 |

### 5. 問い合わせ先・窓口

| 情報の特徴 | 推奨ブロック | 理由 |
|-----------|-------------|------|
| 単一窓口 | `Contact` または `ContactCard` | 専用コンポーネント |
| 複数窓口 | `DirectoryList` | リスト形式 |
| 窓口情報 + 受付時間等 | `Table` | 情報を整理 |

### 6. 注意事項・警告

| 情報の特徴 | 推奨ブロック | 理由 |
|-----------|-------------|------|
| 重要な注意 | `NotificationBanner` (warning) | 目立つ |
| 緊急情報 | `NotificationBanner` (danger) | 最も目立つ |
| 補足的な注意 | `RichText` with callout | 本文中に配置 |

### 7. 関連リンク・参考情報

| 情報の特徴 | 推奨ブロック | 理由 |
|-----------|-------------|------|
| シンプルなリンクのリスト（テキストのみ、説明なし） | `RelatedLinks` | 軽量なリンク集 |
| 説明付きのリソース一覧（タイトル・説明・リンク） | `ResourceList` | 詳細情報付きリンク |
| アクション誘導（申請開始等） | `ActionButton` | 目立つCTA |

**RelatedLinks vs ResourceList の使い分け**:
```
RelatedLinks（シンプルなリンク集）:
- 「関連ページ」「このページを見た人はこちらも」
- テキストリンクのみ、説明文なし
- 例: [住民票の写し] [印鑑登録] [戸籍証明書]

ResourceList（詳細説明付きリソース一覧）:
- 「申請に必要な書類」「関連する制度の詳細」
- タイトル + 説明文 + リンク
- 例:
  - 申請書（様式A）: 窓口で記入するか、こちらからダウンロード
  - 委任状: 代理人が申請する場合に必要です
```

### 8. FAQ・よくある質問

| 情報の特徴 | 推奨ブロック | 理由 |
|-----------|-------------|------|
| Q&A形式 | `Accordion` | 展開/折畳みで整理 |

### 9. 一覧・グリッド表示（カード）

| 情報の特徴 | 推奨ブロック | 理由 |
|-----------|-------------|------|
| コンテンツの一覧表示（比較・分析不要） | `CardGrid` | 視覚的に選択しやすい |
| 画像+テキストのグループ化 | `CardGrid` | 視認性が高い |
| 関連サービス・記事のリスト | `CardGrid` | 同等の選択肢を並列提示 |
| データの比較・分析が必要 | `Table` | カードは比較に不向き |

**判定ロジック**:
```
IF 一覧形式でコンテンツを並べて提示 AND データ比較・分析は不要:
  IF 画像を含む場合:
    → CardGrid (variant: "media" - 画像+テキスト)
  ELSE IF シンプルなリンクリスト:
    → CardGrid (variant: "link" - タイトル+説明+リンク)
  ELSE:
    → CardGrid (variant: "info" - アイコン+タイトル+説明)
ELSE IF データ比較・分析が必要:
  → Table
```

**使用例**:
- 関連手続きの一覧 → `CardGrid`
- 施設・サービスの選択肢 → `CardGrid`
- 料金プランの比較 → `Table`（比較が目的のため）
- 書類の条件別リスト → `Table` または `Accordion`

**DADSカードコンポーネントの特徴**（[参照](https://design.digital.go.jp/dads/components/card/)）:
- 単一の主題に関するコンテンツをまとめて表示するコンテナ
- アクセシビリティと用途の明確性を重視した設計
- データの詳細比較には不向き（Tableを推奨）

---

## content_type別 デフォルト構成

> **注意**: `Breadcrumbs` はディレクトリ構造から自動生成されるため、コンテンツ構造化では扱わない。
> 以下の構成例には `Breadcrumbs` を含めていないが、実際のページには自動で挿入される。

### service（サービスハブページ）

```
Title
Summary（サービスの概要）
NotificationBanner?（重要なお知らせがあれば）
ResourceList（関連手続きへのリンク - 説明付き）
Contact
RelatedLinks（シンプルな関連リンク）
```

### guide（詳細説明ページ）

```
Title
Summary
NotificationBanner?
Section: 対象者
  → RichText (list) or Table
Section: 必要書類
  → RichText (list) or Table or Accordion
Section: 手続きの流れ
  → StepNavigation or RichText (ordered list)
Section: 費用
  → RichText or Table
Section: 注意事項
  → RichText with callout
Accordion?（FAQ）
Contact
RelatedLinks（シンプルな関連リンク）
Sources
```

### step_by_step（段階的手順ガイド）

```
Title
Summary
StepNavigation（メインコンテンツ）
NotificationBanner?（注意事項）
Contact
RelatedLinks
```

### form（申請・届出ページ）

```
Title
Summary
NotificationBanner?
Table（申請情報まとめ）
ActionButton（申請開始）
ResourceList（関連書類 - 説明付きダウンロードリンク）
Contact
RelatedLinks
```

### contact（問い合わせ窓口ページ）

```
Title
Summary
ContactCard または DirectoryList
Table?（受付時間等）
Accordion?（よくある質問）
RelatedLinks
```

---

## セクション自動生成ルール

LLMが情報を取得した際、以下のルールでセクションを自動構成する：

### 1. 基本セクション（必須）
- **概要**: Summary ブロックとして生成
- **問い合わせ先**: Contact ブロックとして最後に配置

### 2. 条件付きセクション
以下は情報がある場合のみ生成：

| 情報 | セクション見出し | 優先度 |
|-----|-----------------|--------|
| 対象者条件 | 対象となる方 | 高 |
| 必要書類 | 必要なもの | 高 |
| 手続きの流れ | 手続きの流れ | 高 |
| 費用・手数料 | 費用 | 中 |
| 受付時間・場所 | 届出先・受付時間 | 中 |
| 注意事項 | ご注意ください | 中 |
| FAQ | よくある質問 | 低 |
| 関連リンク | 関連情報 | 低 |

### 3. セクション順序
```
1. 概要（Summary）
2. NotificationBanner（重要なお知らせ）
3. 対象となる方
4. 必要なもの
5. 手続きの流れ
6. 費用
7. 届出先・受付時間
8. ご注意ください
9. よくある質問
10. 問い合わせ先（Contact）
11. 関連情報（RelatedLinks）
12. 出典（Sources）
```

---

## LLMプロンプト用 コンポーネント選択ガイド

以下は、LLMがコンテンツを生成する際に使用するガイドラインです：

### コンポーネント選択の決定木

```
情報を分析 →

1. 手順・ステップ情報？
   - YES & 3ステップ以上 → StepNavigation
   - YES & 2ステップ以下 → RichText (ordered list)

2. リスト情報（書類、条件等）？
   - YES & 条件分岐あり（条件ごとに値が異なる） → Table または Accordion
   - YES & 単純なリスト（項目の列挙のみ） → Section + RichText (unordered list)
   ※ Tableを使う場合はlabel-valueに対応関係があること

3. key-value情報（場所、時間、費用等）？
   - YES → Table (labelとvalueの両方に値があること)

4. 比較情報（料金パターン、条件比較）？
   - YES → Table

5. Q&A情報？
   - YES → Accordion

6. 重要な注意？
   - YES & 緊急 → NotificationBanner (danger)
   - YES & 警告 → NotificationBanner (warning)
   - YES & 補足 → RichText with callout

7. 問い合わせ先？
   - YES & 単一 → Contact
   - YES & 複数 → DirectoryList

8. リンク集？
   - YES & 説明付き（タイトル+説明+リンク）→ ResourceList
   - YES & シンプル（テキストリンクのみ）→ RelatedLinks
   - YES & CTA → ActionButton

9. 一覧・グリッド表示？
   - YES & 比較・分析不要 & 画像あり → CardGrid (variant: media)
   - YES & 比較・分析不要 & リンクリスト → CardGrid (variant: link)
   - YES & 比較・分析不要 & アイコン+説明 → CardGrid (variant: info)
   - YES & 比較・分析が必要 → Table

10. その他の説明文 → RichText (paragraph)
```

---

## 実装ノート

### 既存ブロックタイプとDADSコンポーネントの対応

| INNOMAブロック | DADSコンポーネント |
|---------------|-------------------|
| StepNavigation | ステップナビゲーション |
| Accordion | アコーディオン |
| Table | テーブル / 説明リスト |
| NotificationBanner | ノティフィケーションバナー |
| RichText (callout) | ノティフィケーションバナー (inline) |
| Contact / ContactCard | カード |
| CardGrid | カード（グリッド配置） |
| ResourceList | リソースリスト |
| ActionButton | ボタン |
| RichText (list) | リスト (Ol/Ul) |
| Divider | ディバイダー |

### 新規追加を検討すべきブロック

1. **ChecklistBlock**: 必要書類のチェックリスト表示
2. **TimelineBlock**: 時系列の手続き表示
3. **ComparisonTableBlock**: 条件比較用のテーブル

---

## 更新履歴

- 2026-02-01: RelatedLinksとResourceListの使い分けを明確化
- 2026-02-01: Breadcrumbsはディレクトリ構造から自動生成されるため、コンテンツ構造化ルールから除外
- 2026-02-01: CardGridコンポーネントの選択ロジックを追加（一覧・グリッド表示用）
- 2026-02-01: Tableコンポーネントの使用条件を明確化（valueが空の場合はリストを使用すべき）
- 2026-02-01: 初版作成
