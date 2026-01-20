# ベースArtifactテンプレート

日本全国で共通の制度・手続きについて、テンプレートとなるArtifactを格納するディレクトリです。

## 目的

- 全国共通の制度情報を一元管理
- 新しい自治体追加時の効率化
- 品質の一貫性確保

## 使い方

### 1. テンプレートの複製

```bash
# 例: 高岡市用のArtifactを作成
cp -r _base/services/health/kokuho*.json ../takaoka/services/health/
```

### 2. 変数の置換

テンプレート内の `{{変数名}}` を自治体固有の値に置換します。

```javascript
// 例: 置換スクリプト
const variables = {
  "{{municipality_id}}": "takaoka",
  "{{municipality_name}}": "高岡市",
  "{{kokuho_phone}}": "0766-20-1234",
  "{{kokuho_department}}": "市民課 国保年金係",
  "{{kokuho_address}}": "高岡市役所 1階",
  "{{kokuho_hours}}": "平日 8:30〜17:15",
  // ...
};
```

## テンプレート一覧

### 国民健康保険 (`services/health/kokuho*.json`)

| ファイル | content_type | 説明 |
|---------|-------------|------|
| `kokuho.json` | service | 国保のトップページ（ハブ） |
| `kokuho-join.json` | guide | 加入手続き |
| `kokuho-leave.json` | guide | 脱退手続き |
| `kokuho-premium.json` | guide | 保険料について |
| `kokuho-benefits.json` | guide | 給付内容 |
| `kokuho-reduction.json` | guide | 減免制度 |

## 変数リファレンス

### 共通変数

| 変数 | 説明 | 例 |
|-----|------|-----|
| `{{municipality_id}}` | 自治体ID | `takaoka` |
| `{{municipality_name}}` | 自治体名 | `高岡市` |
| `{{generated_at}}` | 生成日時 | `2026-01-15T00:00:00.000Z` |

### 国保固有変数

| 変数 | 説明 | 例 |
|-----|------|-----|
| `{{kokuho_department}}` | 担当課 | `市民課 国保年金係` |
| `{{kokuho_phone}}` | 電話番号 | `0766-20-1234` |
| `{{kokuho_address}}` | 窓口所在地 | `高岡市役所 1階` |
| `{{kokuho_hours}}` | 窓口時間 | `平日 8:30〜17:15` |
| `{{kokuho_email}}` | メールアドレス | `kokuho@city.takaoka.lg.jp` |
| `{{fiscal_year}}` | 年度 | `令和7` |
| `{{medical_shotokuwari_rate}}` | 医療分所得割率 | `7.50%` |
| `{{medical_kintowarari_amount}}` | 医療分均等割額 | `28,000円` |
| `{{medical_byodowari_amount}}` | 医療分平等割額 | `20,000円` |
| `{{medical_limit}}` | 医療分賦課限度額 | `67万円` |
| `{{shien_shotokuwari_rate}}` | 後期支援分所得割率 | `2.50%` |
| `{{shien_kintowarari_amount}}` | 後期支援分均等割額 | `9,500円` |
| `{{shien_byodowari_amount}}` | 後期支援分平等割額 | `7,000円` |
| `{{shien_limit}}` | 後期支援分賦課限度額 | `26万円` |
| `{{kaigo_shotokuwari_rate}}` | 介護分所得割率 | `2.00%` |
| `{{kaigo_kintowarari_amount}}` | 介護分均等割額 | `12,000円` |
| `{{kaigo_byodowari_amount}}` | 介護分平等割額 | `6,000円` |
| `{{kaigo_limit}}` | 介護分賦課限度額 | `17万円` |
| `{{total_limit}}` | 合計賦課限度額 | `110万円` |
| `{{payment_due_dates}}` | 納期 | `6月〜翌年3月（年10回）` |
| `{{sousaihi_amount}}` | 葬祭費 | `5万円` |
| `{{shussan_ichijikin_amount}}` | 出産育児一時金 | `50万円` |
| `{{online_application_available}}` | オンライン申請 | `マイナポータルから可能` |
| `{{branch_offices}}` | 支所・出張所 | `各支所で受付可能` |
| `{{mail_application}}` | 郵送届出 | `一部届出のみ可能` |
| `{{local_reduction_programs}}` | 独自減免制度 | `多子世帯減免制度あり` |

## 自治体固有セクション

各テンプレートの `_template_meta.municipality_specific_sections` に、自治体ごとにスクレイピングが必要な項目がリストされています。

### 国保で自治体固有の主な項目

1. **保険料率** - 所得割率・均等割額・平等割額（自治体により大きく異なる）
2. **問い合わせ先** - 電話番号・住所・窓口時間
3. **葬祭費の金額** - 3万円〜7万円程度（自治体により異なる）
4. **独自の減免制度** - 多子世帯減免など
5. **オンライン申請の可否**
6. **納期（納付期限）**

## 全国共通事項

`_template_meta.national_standard` に記載されている項目は、法律で定められた全国共通の内容です。

### 国保の全国共通事項

- 届出期限: 14日以内
- 自己負担割合: 3割（義務教育就学後〜69歳）
- 法定軽減: 7割・5割・2割軽減の基準
- 高額療養費の自己負担限度額
- 出産育児一時金: 50万円
- 非自発的失業者軽減の計算方法
