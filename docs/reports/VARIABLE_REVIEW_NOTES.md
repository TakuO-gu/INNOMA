# 変数データ レビューメモ

高岡市の変数データ（`apps/web/data/artifacts/takaoka/variables.json`）について、自信がない・調べきれなかった項目の一覧。

作成日: 2026-01-29

---

## 信頼度 0.7（要確認）

ほぼ全てがメールアドレス。公式サイトにメールが明記されていないため、ドメインルール（`@city.takaoka.lg.jp`）から推測。

| 変数名 | 値 | 備考 |
|--------|-----|------|
| `city_hall_email` | somu@city.takaoka.lg.jp | |
| `shimin_email` | shimin@city.takaoka.lg.jp | |
| `kokuho_email` | hokennenkin@city.takaoka.lg.jp | |
| `environment_email` | kankyoseisaku@city.takaoka.lg.jp | |
| `kosodate_email` | kosodate@city.takaoka.lg.jp | |
| `childcare_email` | kosodate@city.takaoka.lg.jp | |
| `nursery_email` | kosodate@city.takaoka.lg.jp | |
| `nursery_apply_email` | kosodate@city.takaoka.lg.jp | |
| `welfare_email` | shakaifukushi@city.takaoka.lg.jp | |
| `kaigo_email` | chojufukushi@city.takaoka.lg.jp | |
| `koureisha_email` | chojufukushi@city.takaoka.lg.jp | |
| `health_email` | kenkozoshin@city.takaoka.lg.jp | |
| `kenshin_email` | kenkozoshin@city.takaoka.lg.jp | |
| `yobosesshu_email` | kenkozoshin@city.takaoka.lg.jp | |
| `boshi_email` | kenkozoshin@city.takaoka.lg.jp | |
| `tax_email` | shiminzei@city.takaoka.lg.jp | |
| `zeimu_email` | shiminzei@city.takaoka.lg.jp | |
| `shisanzei_email` | shisanzei@city.takaoka.lg.jp | |
| `housing_email` | kenchikuseisaku@city.takaoka.lg.jp | |
| `urban_planning_email` | toshikeikaku@city.takaoka.lg.jp | |
| `building_email` | kenchikuseisaku@city.takaoka.lg.jp | |
| `shogai_email` | shakaifukushi@city.takaoka.lg.jp | |
| `disability_email` | shakaifukushi@city.takaoka.lg.jp | |
| `seikatsu_hogo_email` | shakaifukushi@city.takaoka.lg.jp | |
| `nenkin_email` | hokennenkin@city.takaoka.lg.jp | |
| `kouki_email` | hokennenkin@city.takaoka.lg.jp | |
| `election_commission_email` | senkyo@city.takaoka.lg.jp | |
| `driving_email` | kikikanri@city.takaoka.lg.jp | |
| `business_email` | sangyo@city.takaoka.lg.jp | |
| `agriculture_email` | nogyosuisan@city.takaoka.lg.jp | |
| `multicultural_email` | bunkakokusai@city.takaoka.lg.jp | |
| `mynumber_email` | shimin@city.takaoka.lg.jp | |
| `disaster_email` | kikikanri@city.takaoka.lg.jp | |
| `employment_email` | sangyo@city.takaoka.lg.jp | |
| `registration_email` | shimin@city.takaoka.lg.jp | |
| `koseki_email` | shimin@city.takaoka.lg.jp | |

**対策**: 公式サイトのお問い合わせフォームを使う方が確実。メールアドレスを表示せず、問い合わせフォームへのリンクを案内する方法も検討。

---

## 信頼度 0.8（やや不確か）

電話番号・担当部署など。公式サイトで要確認。

| 変数名 | 値 | 理由 |
|--------|-----|------|
| `city_hall_department` | 総務課 | 代表問い合わせ先として適切か不明確 |
| `shisanzei_phone` | 0766-20-1265 | 課の代表電話を特定できず |
| `urban_planning_phone` | 0766-20-1407 | 同上 |
| `election_commission_phone` | 0766-20-1544 | 同上 |
| `hazard_map_haifu_basho` | 危機管理課、各地域交流センター | 配布場所の最新情報を確認できず |
| `hinanjo_count` | 市内各所（詳細は公式サイト参照） | 具体的な数値を特定できず |
| `driving_department` | 危機管理課（交通安全） | 交通安全担当課が別にある可能性 |
| `driving_phone` | 0766-20-1229 | 同上 |
| `business_phone` | 0766-20-1221 | 課の代表電話を特定できず |
| `agriculture_phone` | 0766-20-1306 | 同上 |
| `agricultural_commission_phone` | 0766-20-1303 | 同上 |
| `employment_phone` | 0766-20-1221 | 同上 |
| `transport_branch_phone` | 050-5540-2044 | ナビダイヤルの可能性あり、直通番号かどうか不明 |

---

## 信頼度 0.9（概ね正しいが要確認）

補助金額・期間など。年度更新時に要確認。

| 変数名 | 値 | 理由 |
|--------|-----|------|
| `hello_work_address` | 富山県高岡市向野町3丁目43-4 | 郵便番号が取得できなかった |
| `jishin_hazard_map_url` | （ハザードマップ一覧URL） | 地震専用ハザードマップページが見つからず、一覧ページで代替 |
| `sodaigomi_fee_medium` | 10kgごとに100円＋木質家具100円加算 | 加算額が品目によって変わる可能性 |
| `sodaigomi_fee_large` | 10kgごとに100円＋特殊処理300円加算 | 同上 |
| `reform_subsidy_max` | 20万円（居住誘導区域内） | 年度によって変更の可能性 |
| `reform_subsidy_rate` | 対象工事費の1/3 | 同上 |
| `vacant_house_subsidy_max` | 20万円 | 同上 |
| `vacant_house_subsidy_rate` | 取得費の5% | 同上 |
| `nursery_apply_period` | 4月入園は例年秋頃… | 年度によって変更の可能性 |
| `international_association_phone` | 0766-20-1236 | 文化国際課の番号を代用、協会直通番号が見つからず |
| `transport_branch_address` | 〒930-0992 富山市新庄町馬場82 | 移転情報の確認が必要 |
| `shogai_department` | 社会福祉課 障がい福祉係 | 係名まで正確か不明 |
| `disability_department` | 社会福祉課 障がい福祉係 | 同上 |
| `seikatsu_hogo_department` | 社会福祉課 保護係 | 同上 |

---

## まとめ

| 信頼度 | 件数 | 対策 |
|--------|------|------|
| **0.7** | 36件 | ほぼ全てがメールアドレス。問い合わせフォームへの誘導が安全 |
| **0.8** | 13件 | 電話番号・担当部署。公式サイトで要確認 |
| **0.9** | 12件 | 補助金額・期間など。年度更新時に要確認 |
| **0.95** | 残り全て | 公式ソースから取得。信頼性高い |

---

## 特に注意が必要な項目

1. **メールアドレス全般** - 公式に公開されていないため推測。問い合わせフォームへの誘導が安全
2. **補助金関連** - 年度によって金額・条件が変わる可能性あり
3. **避難所数** - 具体的な数値を取得できなかった（福祉避難所29か所のみ確認）

---

## TODO

- [ ] 公式サイトで電話番号を再確認
- [ ] メールアドレスの扱いを検討（問い合わせフォームへのリンクに置き換え？）
- [ ] 補助金関連の年度更新確認フローを作成
- [ ] 避難所の総数を確認
