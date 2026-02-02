# 都留市 変数データ レポート

作成日: 2026-01-29

## 概要

| 項目 | 件数 |
|------|------|
| テンプレート変数総数 | 357 |
| 都留市で埋めた変数 | 228 |
| 未入力変数 | 174 |
| カバー率 | 63.9% |

※ 一部の変数はテンプレートと都留市で両方に存在するが名前が異なる場合があり、実質的なカバー率はこれより高い可能性がある。

---

## 未入力変数の分類と理由

### 1. 都留市に該当サービス・制度がない（推定45件）

以下の変数は、都留市では該当するサービスや制度が存在しない、または情報が公開されていないと考えられる。

#### 自転車駐輪場関連
| 変数名 | 理由 |
|--------|------|
| `bicycle_parking_daily` | 市営駐輪場の料金情報が見つからない（駅周辺に無料駐輪場のみの可能性） |
| `bicycle_parking_monthly` | 同上 |
| `municipal_parking_info` | 市営駐車場の情報が見つからない |

#### 漁業・林業関連
| 変数名 | 理由 |
|--------|------|
| `fishery_department` | 都留市は内陸部で漁業課を持たない |
| `fishery_email` | 同上 |
| `fishery_phone` | 同上 |
| `forestry_department` | 農林産業課に統合されており、単独の林業課がない |
| `forestry_email` | 同上 |
| `forestry_phone` | 同上 |

#### 国際交流協会関連
| 変数名 | 理由 |
|--------|------|
| `international_association` | 都留市国際交流協会の詳細情報が見つからない |
| `international_association_address` | 同上 |
| `international_association_email` | 同上 |
| `international_association_phone` | 同上 |
| `japanese_class_application` | 日本語教室の詳細情報が公開されていない |
| `japanese_class_fee` | 同上 |
| `japanese_class_location` | 同上 |
| `japanese_class_schedule` | 同上 |

#### 大規模都市向けサービス
| 変数名 | 理由 |
|--------|------|
| `transport_branch` | 山梨運輸支局は甲府にあり、都留市固有の情報ではない |
| `transport_branch_address` | 同上（広域情報として取得可能だが、市固有データではない） |
| `transport_branch_phone` | 同上 |
| `labor_bureau` | 山梨労働局は甲府にあり、都留市固有の情報ではない |
| `labor_bureau_address` | 同上 |
| `labor_bureau_phone` | 同上 |
| `labor_standards_office` | 大月労働基準監督署が管轄だが、詳細情報が見つからない |
| `labor_standards_office_address` | 同上 |
| `labor_standards_office_phone` | 同上 |

---

### 2. 情報が公開されていない / 詳細情報が見つからない（推定50件）

以下の変数は、公式サイトで情報が見つからなかった、または詳細が公開されていない。

#### 防災関連
| 変数名 | 理由 |
|--------|------|
| `bosai_mail_address` | 防災メール登録は確認できたが、具体的なアドレスが見つからない |
| `bosai_mail_touroku_url` | 登録用URLが見つからない |
| `bosai_telephone` | 防災専用電話番号が見つからない |
| `hinanjo_count` | 避難所の総数が明記されていない |
| `hinanjo_status_url` | 避難所開設状況のリアルタイム確認URLが見つからない |
| `kinkyu_hinanbasho_count` | 緊急避難場所の総数が明記されていない |
| `shitei_hinanjo_count` | 指定避難所の総数が明記されていない |
| `dosha_hazard_map_url` | 土砂災害ハザードマップの直接URLが見つからない |
| `jishin_hazard_map_url` | 地震ハザードマップの直接URLが見つからない |
| `kozui_hazard_map_url` | 洪水ハザードマップの直接URLが見つからない |
| `kozui_soutei_uryou` | 想定雨量が明記されていない |

#### 保育園関連（詳細情報）
| 変数名 | 理由 |
|--------|------|
| `nursery_apply_deadline` | 具体的な申込締切日が見つからない（年度により変動） |
| `nursery_apply_month` | 同上 |
| `nursery_apply_notice` | 申込に関する通知内容が見つからない |
| `nursery_apply_period` | 同上 |
| `nursery_apply_year` | 同上 |
| `nursery_count` | 保育園の総数が明記されていない |
| `nursery_form_application_url` | 申請書類のダウンロードURLが見つからない |
| `nursery_form_criteria_url` | 同上 |
| `nursery_form_employment_url` | 同上 |
| `nursery_form_guide_url` | 同上 |
| `nursery_online_apply_url` | オンライン申請URLが見つからない |
| `nursery_result_notice` | 結果通知に関する情報が見つからない |

#### 補助金・助成金の詳細
| 変数名 | 理由 |
|--------|------|
| `childseat_subsidy_description` | チャイルドシート補助の詳細が見つからない |
| `housing_benefit_couple` | 住居確保給付金の具体的金額が見つからない |
| `housing_benefit_single` | 同上 |
| `reform_application_period` | リフォーム補助の申請期間が見つからない |
| `reform_general_eligible` | リフォーム補助の対象条件詳細が見つからない |
| `reform_subsidy_max` | リフォーム補助の上限額が見つからない |
| `reform_subsidy_rate` | リフォーム補助率が見つからない |
| `seismic_diagnosis_rate` | 耐震診断補助率が見つからない |
| `seismic_retrofit_rate` | 耐震改修補助率が見つからない |
| `vacant_house_subsidy_max` | 空き家補助の上限額が見つからない |
| `vacant_house_subsidy_rate` | 空き家補助率が見つからない |
| `local_business_subsidy_description` | 地域商業補助の詳細が見つからない |
| `new_farmer_support_program` | 新規就農支援の詳細が見つからない |

---

### 3. 年度・時期によって変動する情報（推定25件）

以下の変数は、年度や時期によって変わるため、固定値として設定できない。

#### 税金納期限
| 変数名 | 理由 |
|--------|------|
| `juminzei_kigen_1` | 住民税の納期限は年度により変動 |
| `juminzei_kigen_2` | 同上 |
| `juminzei_kigen_3` | 同上 |
| `juminzei_kigen_4` | 同上 |
| `kotei_kigen_1` | 固定資産税の納期限は年度により変動 |
| `kotei_kigen_2` | 同上 |
| `kotei_kigen_3` | 同上 |
| `kotei_kigen_4` | 同上 |
| `keijidosha_kigen` | 軽自動車税の納期限は年度により変動 |

#### 健診・予防接種期間
| 変数名 | 理由 |
|--------|------|
| `kenshin_period` | 健診実施期間は年度により変動 |
| `influenza_period` | インフルエンザ予防接種期間は年度により変動 |
| `public_housing_schedule` | 公営住宅募集スケジュールは随時変動 |

---

### 4. 問い合わせが必要な情報（推定20件）

以下の変数は、公式サイトには「お問い合わせください」としか記載がなく、具体的な値が公開されていない。

| 変数名 | 理由 |
|--------|------|
| `wildlife_fence_subsidy_rate` | 鳥獣害フェンス補助率は要問合せ |
| `wildlife_fence_application_period` | 申請期間は要問合せ |
| `new_farmer_consultation` | 新規就農相談は要問合せ |
| `legal_consultation_reservation` | 法律相談予約方法は要問合せ |
| `legal_consultation_schedule` | 法律相談日程は要問合せ |
| `ikuji_sodan_yoyaku` | 育児相談予約方法は要問合せ |
| `sango_care_fee` | 産後ケア費用は要問合せ |
| `ninpu_kenshin_josei` | 妊婦健診助成詳細は要問合せ |

---

### 5. 組織構造が異なるため該当しない（推定15件）

都留市の組織構造が他市と異なり、該当する部署・担当がない。

| 変数名 | 理由 |
|--------|------|
| `benefits_department` | 給付金専門部署がない（福祉課などに統合） |
| `benefits_email` | 同上 |
| `benefits_phone` | 同上 |
| `civic_department` | 市民課の中の細分化された部署がない |
| `civic_email` | 同上 |
| `civic_phone` | 同上 |
| `development_department` | 開発専門部署がない（都市計画課に統合） |
| `development_email` | 同上 |
| `development_phone` | 同上 |
| `disclosure_department` | 情報公開専門部署がない（総務課に統合） |
| `disclosure_email` | 同上 |
| `disclosure_phone` | 同上 |
| `privacy_department` | 個人情報保護専門部署がない（総務課に統合） |
| `privacy_email` | 同上 |
| `privacy_phone` | 同上 |
| `planning_department` | 企画課は存在するが、変数名と一致しない |
| `planning_email` | 同上 |
| `planning_phone` | 同上 |
| `audit_commission` | 監査委員会の詳細情報が見つからない |
| `audit_commission_email` | 同上 |
| `audit_commission_phone` | 同上 |

---

### 6. 地区依存変数（District-Dependent）（19件）

以下の変数は地区（町丁目）によって値が異なるため、単一の値として設定できない。これらは別途 `districts.json` で管理する必要がある。

| 変数名 | 説明 |
|--------|------|
| `moenai_gomi_shushuhi` | 燃やせないごみ収集日（地区により異なる） |
| `moeru_gomi_dashikata` | 燃やせるごみの出し方 |
| `moenai_gomi_dashikata` | 燃やせないごみの出し方 |
| `shigen_gomi_shushuhi` | 資源ごみ収集日（地区により異なる） |

**注**: これらの変数は都留市の `districts.json` を別途作成する必要がある。

---

## 特記事項

### メールアドレスについて

都留市の公式サイトでは、ほとんどの課のメールアドレスが公開されていない。ドメインは `@city.tsuru.yamanashi.jp` だが、各課のローカルパートは推測が困難。

**推奨対応**:
- メールアドレスを表示する代わりに、問い合わせフォームへのリンクを使用する
- または「お問い合わせは電話にて」と案内する

### 小規模自治体の特徴

都留市は人口約3万人の小規模自治体であり、以下の特徴がある：

1. **部署の統合**: 大都市にある専門部署が、複数の業務を統合した課になっている
2. **サービスの限定**: 大都市では提供されているサービスが存在しない場合がある
3. **情報公開の範囲**: オンラインで公開されている情報が限られている

---

## 対策と推奨事項

### 短期的対策

1. **必須変数の優先確認**: 最も使用頻度の高い変数（電話番号、住所など）を優先的に確認
2. **問い合わせフォームの活用**: メールアドレスの代わりに問い合わせフォームURLを使用
3. **「要問合せ」表示**: 具体的な値がない場合は「詳細はお問い合わせください」と表示

### 中期的対策

1. **電話での確認**: 公式サイトで見つからない情報は、直接電話で確認
2. **districts.json の作成**: 地区依存変数用のデータファイルを作成
3. **年度更新フローの確立**: 毎年度変わる情報の更新手順を確立

### 長期的対策

1. **自治体との連携**: 都留市と連携し、必要なデータ提供を依頼
2. **テンプレート変数の見直し**: 小規模自治体には不要な変数をオプション化

---

## 比較参考

| 自治体 | 変数数 | カバー率 | 備考 |
|--------|--------|----------|------|
| 高岡市 | 206 | 57.7% | 中規模都市（人口約17万） |
| 都留市 | 228 | 63.9% | 小規模都市（人口約3万） |

都留市の方がカバー率が高いのは、今回の調査で積極的にデータ収集を行ったため。

---

## 次のステップ

1. [ ] 都留市役所への電話確認（未公開情報の取得）
2. [ ] `districts.json` の作成（地区依存変数用）
3. [ ] 年度更新が必要な変数のリスト作成
4. [ ] テンプレート変数の必須/オプション分類の見直し
