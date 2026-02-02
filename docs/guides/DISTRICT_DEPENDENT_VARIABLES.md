# 地区依存変数（District-Dependent Variables）

## 概要

日本の自治体では、同じ市区町村内でも**地区（町丁目）ごとに値が異なる**変数があります。
これらの変数は単一の値として保存・表示することができず、ユーザーが自分の地区を選択して正しい情報を表示する必要があります。

## 地区依存変数一覧

### 環境・ごみ（environment）

| 変数名 | 説明 | 地区依存の理由 | 例（高岡市） |
|--------|------|----------------|--------------|
| `moeru_gomi_shushuhi` | 燃やせるごみの収集日 | 収集エリアごとに曜日が異なる | 月木エリア：月・木、火金エリア：火・金 |
| `moenai_gomi_shushuhi` | 燃やせないごみの収集日 | 収集エリアごとに曜日が異なる | 月木エリア：第1・3月曜日、火金エリア：第1・3火曜日 |
| `shigen_gomi_shushuhi` | 資源ごみの収集日 | 収集エリアごとに曜日が異なる | 地区ごとに異なる |
| `gomi_shushu_area` | ごみ収集エリア名 | 地区を特定するための変数 | 「月・木曜日収集地区」「火・金曜日収集地区」 |

### 防災（disaster）

| 変数名 | 説明 | 地区依存の理由 | 例 |
|--------|------|----------------|-----|
| `hinanjo_nearest` | 最寄りの避難所 | 居住地により異なる | 地区ごとの指定避難所 |
| `hinanjo_area` | 避難所担当エリア | 自治会・町内会単位で指定 | 町内会ごとの避難所割り当て |
| `kinkyu_hinanbasho_nearest` | 最寄りの緊急避難場所 | 居住地により異なる | 地区ごとの指定緊急避難場所 |

### 選挙・投票（civic）

| 変数名 | 説明 | 地区依存の理由 | 例 |
|--------|------|----------------|-----|
| `toubyousho` | 投票所 | 投票区ごとに指定される | ○○小学校体育館、○○公民館 |
| `toubyoku` | 投票区 | 住所により割り当て | 第1投票区、第2投票区 |

### 教育・学区（education）※将来追加予定

| 変数名 | 説明 | 地区依存の理由 | 例 |
|--------|------|----------------|-----|
| `shogakko_gakku` | 小学校学区 | 住所により指定学区が決まる | ○○小学校区 |
| `chugakko_gakku` | 中学校学区 | 住所により指定学区が決まる | ○○中学校区 |
| `tsuugaku_shogakko` | 通学指定小学校 | 住所により指定 | ○○市立○○小学校 |
| `tsuugaku_chugakko` | 通学指定中学校 | 住所により指定 | ○○市立○○中学校 |

### 福祉（welfare）

| 変数名 | 説明 | 地区依存の理由 | 例 |
|--------|------|----------------|-----|
| `houkatsu_tantou` | 担当地域包括支援センター | 地区ごとに担当が分かれる | ○○地域包括支援センター |
| `minsei_iin` | 担当民生委員 | 地区単位で任命される | 各地区の民生委員連絡先 |

### 水道・下水道（utilities）※将来追加予定

| 変数名 | 説明 | 地区依存の理由 | 例 |
|--------|------|----------------|-----|
| `suidou_kyuusuiku` | 水道給水区域 | 上水道・簡易水道の区分 | 市営水道区域、組合水道区域 |
| `gesuidou_shori_kuiki` | 下水道処理区域 | 下水道整備状況により異なる | 公共下水道区域、農業集落排水区域、合併浄化槽区域 |
| `suidou_office` | 担当水道事務所 | 区域により管轄が異なる | ○○水道事務所 |

### 自治会・地域活動

| 変数名 | 説明 | 地区依存の理由 | 例 |
|--------|------|----------------|-----|
| `jichikai` | 所属自治会・町内会 | 住所により決まる | ○○町内会 |
| `kouminkan` | 担当公民館 | 地区により担当が異なる | ○○公民館 |

## データ構造

地区依存変数は、以下の形式でデータを保存します：

```typescript
interface DistrictDependentVariable {
  // 変数名
  variableName: string;

  // 地区リスト（選択肢）
  districts: District[];

  // デフォルト値（地区未選択時に表示）
  defaultValue?: string;

  // 地区選択を促すメッセージ
  selectPrompt: string;
}

interface District {
  // 地区ID（一意識別子）
  id: string;

  // 地区名（表示用）
  name: string;

  // この地区での値
  value: string;

  // 含まれる町名（検索・マッチング用）
  areas: string[];
}
```

### 高岡市のごみ収集日の例

```json
{
  "variableName": "moenai_gomi_shushuhi",
  "districts": [
    {
      "id": "getsu-moku",
      "name": "月・木曜日収集地区",
      "value": "第1・3月曜日",
      "areas": ["定塚町", "下関町", "博労町", "平米町", "福田六家", "小勢町", "..."]
    },
    {
      "id": "ka-kin",
      "name": "火・金曜日収集地区",
      "value": "第1・3火曜日",
      "areas": ["西条", "川原町", "二上町", "熊町", "野村", "木津", "..."]
    }
  ],
  "defaultValue": "地区により異なります（下記から地区を選択してください）",
  "selectPrompt": "お住まいの地区を選択してください"
}
```

## テンプレートでの使用方法

### 1. 地区セレクター コンポーネント

地区依存変数を含むページでは、`DistrictSelector` コンポーネントを使用します：

```json
{
  "id": "district-selector-1",
  "type": "DistrictSelector",
  "props": {
    "variableGroup": "gomi_shushu",
    "label": "お住まいの地区を選択",
    "placeholder": "地区を選択してください",
    "searchable": true
  }
}
```

### 2. 変数の参照

地区依存変数は通常の変数と同じ `{{variable_name}}` 構文で参照できます。
地区が選択されている場合はその地区の値が、未選択の場合は `defaultValue` が表示されます。

```json
{
  "type": "paragraph",
  "runs": [
    {
      "text": "収集日：{{moenai_gomi_shushuhi}}"
    }
  ]
}
```

### 3. 地区選択の永続化

ユーザーが選択した地区は `localStorage` に保存され、次回アクセス時に自動的に適用されます。

## 管理画面での扱い

### ドラフト編集画面

地区依存変数は、通常のテキスト入力ではなく、地区別の値を編集できるUIを表示します：

1. 「地区依存変数」セクションを設ける
2. 各地区の値を個別に編集可能
3. 地区の追加・削除が可能
4. CSVインポート機能（地区名と値のペア）

### LLM取得

地区依存変数は、LLMによる自動取得の対象外とし、手動入力または構造化データのインポートで取得します。
理由：単一の検索クエリで全地区の情報を正確に取得することが困難なため。

## 実装ファイル

- `apps/web/lib/llm/types.ts` - 型定義
- `apps/web/lib/template/district-variables.ts` - 地区変数の処理ロジック
- `apps/web/components/DistrictSelector.tsx` - 地区選択UIコンポーネント
- `apps/web/data/artifacts/{municipality}/districts.json` - 自治体ごとの地区データ

## 変数定義の更新

`apps/web/lib/llm/variable-priority.ts` で地区依存変数にフラグを設定：

```typescript
/**
 * 地区依存変数のリスト
 * これらの変数は同一自治体内でも地区（町丁目）によって値が異なる
 */
export const districtDependentVariables: string[] = [
  // 環境・ごみ
  'moeru_gomi_shushuhi',
  'moenai_gomi_shushuhi',
  'shigen_gomi_shushuhi',
  'gomi_shushu_area',

  // 防災
  'hinanjo_nearest',
  'hinanjo_area',
  'kinkyu_hinanbasho_nearest',

  // 選挙・投票
  'toubyousho',
  'toubyoku',

  // 教育・学区
  'shogakko_gakku',
  'chugakko_gakku',
  'tsuugaku_shogakko',
  'tsuugaku_chugakko',

  // 福祉
  'houkatsu_tantou',
  'minsei_iin',

  // 水道・下水道
  'suidou_kyuusuiku',
  'gesuidou_shori_kuiki',
  'suidou_office',

  // 自治会・地域活動
  'jichikai',
  'kouminkan',
];
```

## 注意事項

1. **全ての自治体で地区依存とは限らない**
   - 小規模な自治体では全域同一の収集日の場合もある
   - その場合は通常の変数として単一値を保存

2. **地区名の表記揺れ**
   - 「町」「丁目」の有無
   - 漢数字とアラビア数字
   - 旧町名と新町名
   → 検索時に正規化して照合

3. **地区の粒度**
   - 町丁目単位が基本
   - 必要に応じて番地レベルまで対応
