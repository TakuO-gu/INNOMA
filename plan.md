# INNOMA コンテンツ修正プラン

## 概要
テンプレートJSON (`apps/web/data/artifacts/_templates/services/`) の修正を5カテゴリに分けて実施する。

---

## フェーズ1: 避難所・避難場所（disaster）

### 1-1. hinanjo.json - 避難所検索のドロワー対応
- **問題**: 避難所検索がドロワー（DistrictSelector）で選択できるはずだが未対応の部分がある
- **対応**: `ShelterList` ブロックが既に存在するか確認し、`DistrictSelector` と連携が取れていない場合は修正。既存の `ShelterList` ブロックのpropsに `districtDependent` 設定を確認・追加

### 1-2. hazard-map.json - ハザードマップ別CTAの設置
- **問題**: 各種ハザードマップ（洪水、土砂災害、津波、地震等）へ飛ぶためのCTAが不足
- **対応**: 各ハザードマップ種別ごとに `TaskButton` を設置し、`{{flood_hazard_map_url}}`、`{{landslide_hazard_map_url}}`、`{{tsunami_hazard_map_url}}`、`{{earthquake_hazard_map_url}}` 等の変数でリンク先を設定

### 1-3. bosai-mail.json - 防災メール/災害通知サービスの必須化
- **問題**: このitemは必須ではないが、各自治体に災害通知サービスがあるはず
- **対応**: 防災メール/防災アプリ/緊急速報メール等、少なくとも1つの受動的通知サービスへのリンクを含むよう修正。`{{bosai_mail_url}}` 等の変数を活用し、NotificationBannerで登録を促す

---

## フェーズ2: 引っ越し（registration）

### 2-1. tennyu.json - パンくずリンクの修正
- **問題**: `/kusatsu/tennyu` のパンくず「届出・申請・証明書」→ `/registration` が、実際は「車検・自動車登録」ページへ飛ぶ
- **原因**: テンプレートのパンくず href が `/registration` だが、kusatsuではこのパスが「車検・自動車登録」のページに使われている
- **対応**: パンくずの中間リンクを `/todokede` または `/procedures` に変更し、page-registryにも対応するトピックページを確認。もしくは、カテゴリラベルを「届出・証明」→ href `/todokede` に統一

### 2-2. tenshutsu.json - 関連リンクがページ下部に来ていない
- **問題**: RelatedLinksブロックの位置が適切でない（ページ下部の Contact より前にあるべき）
- **対応**: `related-links-1` ブロックを `contact-1` の直前（ただし自動付加セクションの前）に移動。ブロック順序を `...コンテンツ → RelatedLinks → Contact → Sources` に修正

### 2-3. tenkyo.json - 同上、関連リンクの位置修正
- **対応**: tenshutsu同様、RelatedLinksの位置をContactの直前に修正

### 2-4. 住民課の住所と電話番号の参照元の表し方
- **問題**: Contact ブロック内の `{{shimin_department}}`、`{{shimin_phone}}`、`{{city_hall_address}}` の参照元（sourceRef）が規定どおりでない
- **対応**: Contact ブロックは `replaceVariablesWithSourceRefs()` で自動的に参照番号が付与される仕組み。変数自体の `sourceUrl` がvariables JSONに正しく設定されているか確認。テンプレート側での対応は不要（ランタイムで処理されるため）

---

## フェーズ3: 子育て・出産（childcare / health）

### 3-1. boshi.json - 母子保健の届出場所が変数のまま
- **問題**: `{{boshi_madoguchi}}` が変数のまま表示される可能性
- **対応**: 変数名は正しい。これはLLMフェッチ時に自治体ごとの値が入る想定。テンプレートとしては問題ないが、フォールバック表示テキストを追加することを検討

### 3-2. boshi.json - 「助成回数：14回」の確認
- **問題**: 妊婦健康診査の助成回数14回は全国共通の標準値
- **対応**: 実際には自治体によって異なる場合があるため、`{{ninpu_kenshin_kaisu}}` 変数化するか、注釈として「標準14回（自治体により異なる場合があります）」と追記

### 3-3. boshi.json - 出産・子育て応援給付金の内容確認
- **問題**: 金額（出産応援5万円+子育て応援5万円）は国の制度として全国共通
- **対応**: 自治体独自の上乗せがある場合を考慮し、金額を変数化 `{{shussan_ouen_kyufukin}}`、`{{kosodate_ouen_kyufukin}}` とする

### 3-4. boshi.json - 産後ケア事業の内容確認
- **問題**: 産後ケアの種類（宿泊型・デイサービス型・訪問型）は標準的だが、自治体により提供内容が異なる
- **対応**: 利用料は既に `{{sango_care_fee}}` で変数化済み。提供タイプも変数化を検討 `{{sango_care_types}}`

### 3-5. boshi.json - 乳幼児健康診査は別ページが必要
- **問題**: 母子保健のdirectoryページ内に乳幼児健診の詳細が含まれているが、別の content-item ページとして切り出すべき
- **対応**: 新規ファイル `nyuyoji-kenshin.json` を作成し、母子保健ページからはリンクのみとする

### 3-6. boshi.json - 予防接種スケジュールリンクの修正
- **問題**: 「予防接種スケジュールを見る」→ `/yobosesshu` は予防接種のガイドページであり、スケジュール専用ページではない
- **対応**: リンク先は `/yobosesshu` のままでよいが、ボタンラベルを「予防接種について詳しく見る」に変更

### 3-7. boshi.json - 相談・教室、訪問事業の内容確認
- **問題**: 育児相談、両親学級、離乳食教室、こんにちは赤ちゃん訪問、養育支援訪問の内容が全国共通で正しいか
- **対応**: これらは母子保健法に基づく全国共通事業。ただし日時・場所・予約方法は変数化済み。内容の静的テキストは問題なし

### 3-8. boshi.json - 「対象となる方」が空欄
- **問題**: `section-対象-1769919363148` の内容が「詳細は担当課にお問い合わせください。」のみ
- **対応**: 母子保健の対象を明記。「妊娠中の方、産後1年以内の方、乳幼児（就学前のお子さん）とその保護者」と記載

### 3-9. jidou-teate.json - 金額の確認
- **問題**: 令和6年10月制度改正後の金額が正しいか
- **対応**: 現在の金額（3歳未満第1・2子 15,000円、第3子以降 30,000円、3歳〜高校生 第1・2子 10,000円、第3子以降 30,000円）は正確。問題なし

### 3-10. jidou-teate.json - 「届出が必要なとき」のheading問題
- **問題**: `section-egu57kx3i` の heading が「届出が必要なとき」だが、level指定が2のまま。問題は、前セクション「申請手続き」→「認定請求（新規申請）」→「申請に必要なもの」がすべて level 3 なのに、「届出が必要なとき」がlevel 2に戻っている構造的問題の可能性
- **対応**: 確認の結果、これは「申請手続き」セクションの配下ではなく独立セクション。heading自体は問題ないが、「届出が必要なとき」の前に `Section` (level 2, heading のみ) がないため構造を確認

### 3-11. nursery.json - 保育施設一覧が空欄
- **問題**: `{{nursery_count}}`, `{{kodomoen_count}}`, `{{kindergarten_count}}`, `{{small_nursery_count}}` が変数のまま
- **対応**: 変数化は正しいが、保育施設の具体的なリスト（名前・住所・電話等）がない。各自治体の保育施設リストを表示する仕組みが必要。`{{nursery_list}}` 変数を追加するか、DirectoryList コンポーネントを使用して施設データを表示

### 3-12. nursery-apply.json - 不要な自治体への対応
- **問題**: 保育施設の少ない自治体では不要なページ
- **対応**: テンプレートとしては維持し、page-registryの設定で各自治体ごとに表示/非表示を制御する方針とする（テンプレート変更不要）

### 3-13. yobosesshu.json - パンくずリンクが「健康・医療」
- **問題**: 予防接種は子育て・出産から移動したはずだが、パンくずが `健康・医療 → /health` のまま
- **対応**: パンくずの中間リンクを `子育て・教育 → /childcare` に変更

### 3-14. koureisha.json - 配下の content-item ページが必要
- **問題**: 高齢者福祉は directory ページのみで、配下の各サービス（配食サービス、緊急通報、介護予防教室等）の個別ページがない
- **対応**: 以下の content-item ページを新規作成:
  - `haishoku.json` (配食サービス)
  - `kinkyu-tsuho.json` (緊急通報システム)
  - `kaigo-yobo.json` (介護予防教室)
  - `keirou.json` (敬老祝金)
  - `koureisha-idou.json` (高齢者移動支援)
  - `silver-housing.json` (シルバーハウジング)
  - koureisha.json から各ページへの CardGrid リンクを設置

---

## フェーズ4: ゴミ・リサイクル（environment）

### 4-1. gomi.json - ドロワーボックスの設置
- **問題**: 地区別のごみ収集情報がドロワーで選択できるようにする
- **対応**: 既に `DistrictSelector` ブロック (`district-selector-1`) が存在。ただし、各分別カテゴリの収集日も地区セレクタに連動するよう、変数を `districtDependent` 形式に対応させる

### 4-2. gomi.json - ゴミ分別アプリの条件付き表示
- **問題**: ゴミ分別アプリがない自治体もある
- **対応**: `gomi_app_description` 変数が null の場合にセクションごと非表示になるよう、条件付き表示の仕組みを追加。変数 `{{gomi_app_name}}` と `{{gomi_app_url}}` を追加し、値がない場合はセクションを非表示にする注記を追加

### 4-3. sodaigomi.json - 指定引取場所への案内
- **問題**: 粗大ゴミの指定引取場所の案内がない
- **対応**: 自己搬入先の情報を追加。`{{sodaigomi_jiko_hannyu_basho}}` 変数でクリーンセンター等の情報を表示。住所・電話・受付時間を含むセクションを追加

### 4-4. kaden-recycle.json - 指定引取場所への案内の充実
- **問題**: 近隣の指定引取場所の案内が `{{kaden_hikitori_basho}}` 変数のみ
- **対応**: 指定引取場所の住所・電話・営業時間を含むよう拡充。`{{kaden_hikitori_address}}`、`{{kaden_hikitori_phone}}`、`{{kaden_hikitori_hours}}` 変数を追加し、Tableで表示

---

## フェーズ5: 税金（tax）

### 5-1. kotei.json - カード/ステップコンポーネントの活用
- **問題**: テキストとTableのみで構成されており、視覚的にわかりにくい
- **対応**:
  - 「課税対象」セクション → CardGrid (info variant) で土地・家屋・償却資産をカード表示
  - 「主な軽減措置」→ Accordion で各措置を展開形式に
  - 「届出が必要なとき」→ 各イベントにアイコン付きの InfoCardGrid を使用

### 5-2. keijidosha.json - 情報構造の整理
- **問題**: 情報構造がめちゃくちゃ
- **対応**:
  - ブロック順序を規定順序に並べ替え: 概要 → 対象者 → 税額 → 軽減措置 → 納付方法 → 届出 → 車検証明書 → RelatedLinks → Contact
  - 3つの税額テーブル（原付・軽四輪・二輪）を統合または Accordion で整理
  - グリーン化特例をNotificationBannerまたは InfoCard で強調

### 5-3. nouzei.json - 各税の支払い方法の明確化
- **問題**: 各納付方法でどの税が支払えるかが不明確
- **対応**: Table に「対象税目」列を追加。または DescriptionList の各項目に対象税目を追記（例: 「口座振替 - 住民税・固定資産税・軽自動車税・国民健康保険税」）

### 5-4. zeishoumei.json - 重複した抜け殻セクションの削除
- **問題**: ページ上部にきちんとした説明があるのに、下部に自動生成された空の「対象となる方」「必要なもの」「手続き方法」セクションが重複
- **対応**: `section-対象-1769919363219`、`section-必要-1769919363219`、`section-方法-1769919363219` を削除（上部に同等以上の情報がある）

### 5-5. furusato.json - 適切なリンクの導入
- **問題**: ふるさと納税サイトへの適切なリンクがない
- **対応**:
  - 総務省ふるさと納税ポータルサイトへのリンクを追加
  - 控除額シミュレーションへのリンクを追加
  - 下部の自動生成セクション（対象者・必要なもの・手続き方法）を削除

---

## フェーズ6: 共通修正

### 6-1. 全テンプレートの自動生成セクション整理
多くのテンプレートに、意味のない自動生成セクション（「〜の対象となる方: 詳細は担当課にお問い合わせください」「〜に必要なもの: 本人確認書類、印鑑」「〜の手続き方法: 1.準備 2.記入 3.提出」）が含まれている。

上部のコンテンツで同等以上の情報が提供されている場合は、これらの重複セクションを削除する。

対象ファイル: zeishoumei.json, furusato.json, nouzei.json, koureisha.json, yobosesshu.json, nursery-apply.json, keijidosha.json, tenshutsu.json, tenkyo.json

---

## 実施順序

1. **フェーズ6** (共通修正 - 重複セクション削除) ← 全ファイルに影響、最初に実施
2. **フェーズ2** (引っ越し) ← パンくず修正は影響が大きいため早めに
3. **フェーズ3** (子育て・出産) ← 最も修正項目が多い
4. **フェーズ5** (税金) ← 構造改善が中心
5. **フェーズ4** (ゴミ・リサイクル) ← 変数追加と構造改善
6. **フェーズ1** (避難所) ← CTA追加と変数対応

## 対象ファイル一覧（テンプレートのみ）

- `_templates/services/disaster/hinanjo.json`
- `_templates/services/disaster/hazard-map.json`
- `_templates/services/disaster/bosai-mail.json`
- `_templates/services/registration/tennyu.json`
- `_templates/services/registration/tenshutsu.json`
- `_templates/services/registration/tenkyo.json`
- `_templates/services/childcare/boshi.json`
- `_templates/services/childcare/jidou-teate.json`
- `_templates/services/childcare/nursery.json`
- `_templates/services/childcare/nursery-apply.json`
- `_templates/services/health/yobosesshu.json`
- `_templates/services/welfare/koureisha.json`
- `_templates/services/environment/gomi.json`
- `_templates/services/environment/sodaigomi.json`
- `_templates/services/environment/kaden-recycle.json`
- `_templates/services/tax/kotei.json`
- `_templates/services/tax/keijidosha.json`
- `_templates/services/tax/nouzei.json`
- `_templates/services/tax/zeishoumei.json`
- `_templates/services/tax/furusato.json`
- 新規: `_templates/services/childcare/nyuyoji-kenshin.json`
- 新規: `_templates/services/welfare/haishoku.json` (他5ファイル)

## 注意事項

- テンプレート修正後、`page-registry.json` の更新が必要な場合あり
- 新規ファイル作成時は `CONTENT_ITEM_CREATION.md` のチェックリストに従う
- 完了後 `npm run check` でLint + テスト + ビルド確認
- `docs/updates/2026-02-25.md` に変更履歴を記録
