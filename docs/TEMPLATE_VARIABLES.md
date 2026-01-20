# テンプレート変数定義書

**作成日**: 2026-01-20
**総変数数**: 353個

---

## 1. 概要

テンプレートで使用される変数（`{{variable_name}}`）の定義。
LLM情報取得システムが自動で埋める対象となる。

---

## 2. 変数カテゴリ

### 2.1 基本情報（必須）

自治体の基本的な情報。全ページで使用される。

| 変数名 | 説明 | 例 | LLM取得 |
|--------|------|-----|---------|
| `municipality_name` | 自治体名 | 青ヶ島村 | ❌ 手動 |
| `prefecture_name` | 都道府県名 | 東京都 | ❌ 手動 |
| `city_hall_address` | 役所住所 | 〒100-1701 東京都... | ✅ |
| `city_hall_hours` | 開庁時間 | 平日8:30-17:15 | ✅ |
| `city_hall_phone` | 代表電話 | 04996-9-0111 | ✅ |
| `city_hall_email` | 代表メール | info@vill.aogashima... | ✅ |
| `generated_at` | 生成日時 | 2026-01-20 | ❌ 自動 |

---

### 2.2 部署連絡先

各サービスの担当部署情報。`{prefix}_department`, `{prefix}_phone`, `{prefix}_email` の3点セット。

#### 2.2.1 住民・戸籍系
| プレフィックス | 担当分野 |
|---------------|---------|
| `shimin` | 市民課（総合） |
| `registration` | 届出・登録 |
| `koseki` | 戸籍 |
| `resident` | 住民票 |
| `mynumber` | マイナンバー |

#### 2.2.2 税・保険系
| プレフィックス | 担当分野 |
|---------------|---------|
| `tax` | 税務（総合） |
| `zeimu` | 税務課 |
| `shisanzei` | 資産税 |
| `kokuho` | 国民健康保険 |
| `kouki` | 後期高齢者医療 |
| `nenkin` | 年金 |

#### 2.2.3 福祉・子育て系
| プレフィックス | 担当分野 |
|---------------|---------|
| `welfare` | 福祉（総合） |
| `childcare` | 子育て支援 |
| `kosodate` | 子育て |
| `boshi` | 母子保健 |
| `nursery` | 保育所 |
| `nursery_apply` | 保育所申込 |
| `koureisha` | 高齢者 |
| `kaigo` | 介護 |
| `shogai` / `disability` | 障害福祉 |
| `seikatsu_hogo` | 生活保護 |

#### 2.2.4 健康・医療系
| プレフィックス | 担当分野 |
|---------------|---------|
| `health` | 健康（総合） |
| `kenshin` | 健診 |
| `yobosesshu` | 予防接種 |
| `houkatsu` | 地域包括支援 |

#### 2.2.5 環境・生活系
| プレフィックス | 担当分野 |
|---------------|---------|
| `environment` | 環境 |
| `bosai` | 防災 |
| `disaster` | 災害対策 |

#### 2.2.6 住宅・都市計画系
| プレフィックス | 担当分野 |
|---------------|---------|
| `housing` | 住宅 |
| `building` | 建築 |
| `urban_planning` | 都市計画 |
| `development` | 開発 |
| `land` | 土地 |

#### 2.2.7 産業・農林水産系
| プレフィックス | 担当分野 |
|---------------|---------|
| `business` | 商工業 |
| `agriculture` | 農業 |
| `forestry` | 林業 |
| `fishery` | 水産業 |
| `wildlife` | 鳥獣対策 |

#### 2.2.8 その他
| プレフィックス | 担当分野 |
|---------------|---------|
| `employment` | 雇用・就労 |
| `driving` | 運転・車両 |
| `nationality` | 国籍・在留 |
| `multicultural` | 多文化共生 |
| `civic` | 市民参加 |
| `election_commission` | 選挙管理委員会 |
| `audit_commission` | 監査委員会 |
| `agricultural_commission` | 農業委員会 |
| `disclosure` | 情報公開 |
| `privacy` | 個人情報保護 |
| `legal` | 法務 |
| `victim_support` | 犯罪被害者支援 |
| `benefits` | 給付金 |
| `planning` | 企画 |

---

### 2.3 外部機関

自治体外の関連機関の情報。

| 変数名パターン | 機関 |
|---------------|------|
| `hello_work_*` | ハローワーク |
| `pension_office_*` | 年金事務所 |
| `tax_office_*` | 税務署 |
| `legal_affairs_bureau_*` | 法務局 |
| `labor_bureau_*` | 労働局 |
| `labor_standards_office_*` | 労働基準監督署 |
| `police_station_*` | 警察署 |
| `driver_license_center_*` | 運転免許センター |
| `transport_branch_*` | 運輸支局 |
| `passport_office_*` | パスポートセンター |
| `immigration_bureau_*` | 入国管理局 |
| `international_association_*` | 国際交流協会 |
| `silver_center_*` | シルバー人材センター |

---

### 2.4 料金・手数料

#### 2.4.1 証明書手数料
| 変数名 | 説明 | 一般的な値 |
|--------|------|-----------|
| `juminhyo_fee` | 住民票 | 300円 |
| `juminhyo_convenience_fee` | 住民票（コンビニ） | 200円 |
| `juminhyo_kisai_fee` | 住民票記載事項証明 | 300円 |
| `koseki_fee` | 戸籍謄本 | 450円 |
| `kaisei_koseki_fee` | 改製原戸籍 | 750円 |
| `jokoseki_fee` | 除籍謄本 | 750円 |
| `inkan_touroku_fee` | 印鑑登録 | 300円 |
| `inkan_shomei_fee` | 印鑑証明 | 300円 |
| `inkan_shomei_convenience_fee` | 印鑑証明（コンビニ） | 200円 |
| `fuhyo_fee` | 附票 | 300円 |

#### 2.4.2 健診・予防接種
| 変数名 | 説明 |
|--------|------|
| `tokutei_kenshin_fee` | 特定健診自己負担 |
| `kouki_kenshin_fee` | 後期高齢者健診自己負担 |
| `gan_i_xray_fee` | 胃がん検診（X線） |
| `gan_i_naishikyo_fee` | 胃がん検診（内視鏡） |
| `gan_hai_fee` | 肺がん検診 |
| `gan_daicho_fee` | 大腸がん検診 |
| `gan_nyu_fee` | 乳がん検診 |
| `gan_shikyukei_fee` | 子宮頸がん検診 |
| `influenza_fee` | インフルエンザ接種 |

#### 2.4.3 ごみ処理
| 変数名 | 説明 |
|--------|------|
| `sodaigomi_fee_small` | 粗大ごみ（小） |
| `sodaigomi_fee_medium` | 粗大ごみ（中） |
| `sodaigomi_fee_large` | 粗大ごみ（大） |
| `sodaigomi_fee_xlarge` | 粗大ごみ（特大） |

#### 2.4.4 保険料率
| 変数名 | 説明 |
|--------|------|
| `kouki_shotoku_wari_rate` | 後期高齢者 所得割率 |
| `kouki_kinto_wari` | 後期高齢者 均等割額 |
| `kouki_sousaihi` | 後期高齢者 葬祭費 |

#### 2.4.5 補助金・助成
| 変数名 | 説明 |
|--------|------|
| `reform_subsidy_max` | リフォーム補助上限 |
| `reform_subsidy_rate` | リフォーム補助率 |
| `seismic_diagnosis_max` | 耐震診断補助上限 |
| `seismic_diagnosis_rate` | 耐震診断補助率 |
| `seismic_retrofit_max` | 耐震改修補助上限 |
| `seismic_retrofit_rate` | 耐震改修補助率 |
| `vacant_house_subsidy_max` | 空き家改修補助上限 |
| `vacant_house_subsidy_rate` | 空き家改修補助率 |
| `housing_benefit_single` | 住居確保給付金（単身） |
| `housing_benefit_couple` | 住居確保給付金（2人） |

---

### 2.5 期限・スケジュール

| 変数名 | 説明 |
|--------|------|
| `juminzei_kigen_1` ~ `_4` | 住民税納期（1期〜4期） |
| `kotei_kigen_1` ~ `_4` | 固定資産税納期（1期〜4期） |
| `keijidosha_kigen` | 軽自動車税納期 |
| `influenza_period` | インフルエンザ接種期間 |
| `kenshin_period` | 健診実施期間 |
| `nursery_apply_period` | 保育所申込期間 |
| `nursery_apply_deadline` | 保育所申込締切 |

---

### 2.6 URL・リンク

| 変数名 | 説明 |
|--------|------|
| `inin_form_url` | 委任状ダウンロードURL |
| `jyuminhyo_form_url` | 住民票申請書URL |
| `koseki_form_url` | 戸籍申請書URL |
| `nursery_online_apply_url` | 保育所オンライン申請URL |
| `nursery_form_*_url` | 保育所関連書類URL |
| `gomi_calendar_url` | ごみカレンダーURL |
| `sodaigomi_online_url` | 粗大ごみオンライン予約URL |
| `hazard_map_*_url` | ハザードマップURL |
| `hinanjo_map_url` | 避難所マップURL |
| `hinanjo_status_url` | 避難所開設状況URL |
| `bosai_mail_touroku_url` | 防災メール登録URL |
| `houkatsu_list_url` | 地域包括一覧URL |

---

### 2.7 その他詳細情報

#### 防災関連
| 変数名 | 説明 |
|--------|------|
| `hinanjo_count` | 避難所数 |
| `shitei_hinanjo_count` | 指定避難所数 |
| `kinkyu_hinanbasho_count` | 緊急避難場所数 |
| `fukushi_hinanjo_count` | 福祉避難所数 |
| `kozui_soutei_uryou` | 洪水想定雨量 |

#### 保育関連
| 変数名 | 説明 |
|--------|------|
| `nursery_count` | 保育所数 |
| `nursery_apply_month` | 申込月 |
| `nursery_apply_year` | 申込年度 |
| `nursery_apply_notice` | 申込案内文 |
| `nursery_result_notice` | 結果通知時期 |

#### 健診関連
| 変数名 | 説明 |
|--------|------|
| `*_kenshin_basho` | 各種健診会場 |

#### ごみ関連
| 変数名 | 説明 |
|--------|------|
| `moeru_gomi_dashikata` | 燃えるごみ出し方 |
| `moenai_gomi_dashikata` | 燃えないごみ出し方 |
| `moenai_gomi_shushuhi` | 燃えないごみ収集日 |
| `shigen_gomi_shushuhi` | 資源ごみ収集日 |
| `gomi_dashijikan` | ごみ出し時間 |
| `kaden_hikitori_basho` | 家電引取場所 |

---

## 3. 変数の優先度

### 優先度: 高（必須）
自治体追加時に必ず埋める必要がある変数。

- 基本情報（`municipality_name`, `city_hall_*`）
- 主要部署連絡先（`shimin_*`, `tax_*`, `kokuho_*`）
- 証明書手数料（`juminhyo_fee`, `koseki_fee`等）

### 優先度: 中
多くのページで使用される変数。

- 各部署連絡先
- 外部機関情報
- 主要な料金・補助金

### 優先度: 低
特定サービスでのみ使用される詳細変数。

- 健診会場
- 収集日詳細
- 細かい補助金率

---

## 4. LLM取得の対象外

以下の変数はLLM取得の対象外（手動または自動生成）。

| 変数名 | 理由 |
|--------|------|
| `municipality_name` | 初期設定で手動入力 |
| `prefecture_name` | 初期設定で手動入力 |
| `generated_at` | システムが自動生成 |

---

## 5. 検証ルール

| 変数タイプ | 正規表現 |
|-----------|---------|
| 電話番号 | `^\d{2,5}-\d{2,4}-\d{4}$` |
| メール | `^[\w.-]+@[\w.-]+\.[a-z]{2,}$` |
| URL | `^https?://` |
| 金額 | `^[\d,]+円$` |
| 日付 | `^\d{1,2}月\d{1,2}日` |
| 時間 | `^\d{1,2}:\d{2}` |
| パーセント | `^\d+(\.\d+)?%$` |
