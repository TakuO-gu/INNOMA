# LocalGov Drupal 準拠 UI実装

LocalGov Drupalの3つのページタイプ（Service page、Guide page、Step-by-step page）に準拠したUI実装です。

## 📚 LocalGov Drupal とは

LocalGov DrupalはイギリスのGOV.UKデザインシステムに基づく、地方自治体向けCMSフレームワークです。
ユーザーニーズに応じた3つのページタイプで情報を整理します。

## 🎯 3つのページタイプ

### 1. Service Page（手続きを "1画面で完結" させるページ）

**用途**: 1つのユーザーニーズやタスクを1画面で完結

**例**: 「粗大ごみを申し込む」「住民票の写しを取得する」

**構造**:
```
① タイトル/要約
  ↓
② 本文（見出しで区切る）
  ↓
③ Task button (CTA) ← 目立つCTAは1つだけ
  ↓
④ Related links・topics（サイドバー）
```

**特徴**:
- 1ページで読了できる長さ
- 重要タスクは「Top task」として色分け表示（赤ボタン）
- 要約に「そのページで出来ること」を明文化

### 2. Guide Page（"まとまった情報束" を順不同で読ませるページ）

**用途**: 同じテーマ内で複数ページをまとめ、読む順番は固定しない

**例**: 「介護保険に関する情報を一通り学びたい」

**構造**:
```
Guide Landing（概要）
  ├─ 子ページ1
  ├─ 子ページ2
  ├─ 子ページ3
  └─ 子ページ4

各ページ下部: Next/Previousボタン
```

**特徴**:
- 読む順番は任意
- 縦型の目次一覧で全体を把握
- 長文の場合、Stacked headingsでスクロール負荷軽減

### 3. Step-by-step Page（"順番どおりに進む" プロセス専用ページ）

**用途**: 明確な開始点と終了点があり、決まった順序で完了する必要がある

**例**: 「出生届を提出する手順を順番に案内」

**構造**:
```
① 短いイントロ（3-4行以内）
  ↓
② 番号付き Step リスト
  Step 1: タイトル
    ├─ Task 1（費用: 300円）
    ├─ Task 2
    └─ Task 3
  Step 2: タイトル
    ├─ Task 1
    └─ または（代替ステップ）
       └─ Task A
  ...
  ↓
③ 総ステップ数・所要時間の表示
```

**特徴**:
- モバイルでStepsをすぐ見せるため、長い序文は避ける
- Step番号は自動読み上げ対応（button要素に番号を含める）
- and/orステップは<h3>階層でネスト

## 🎨 実装内容

### ファイル構成

```
apps/bootstrap-viewer/
├── localgov.html              # LocalGov準拠HTML
├── localgov-data.json         # サンプルデータ
├── LOCALGOV_README.md         # このファイル
└── localgov-schemas.ts        # TypeScript/Zodスキーマ定義
```

### デザインシステム

GOV.UK / LocalGov カラーパレット:
```css
--localgov-blue: #1d70b8     // プライマリカラー
--localgov-green: #00703c    // Guideページ、タスクボタン
--localgov-red: #d4351c      // Top task、緊急情報
--localgov-yellow: #ffdd00   // Step-by-stepページ
--localgov-black: #0b0c0c    // テキスト
--localgov-grey-1: #f3f2f1   // 背景
```

### アクセシビリティ

✅ WCAG 2.1 AA準拠を目指した設計:
- セマンティックHTML（article, nav, ol, button）
- ARIA role属性（alert, button）
- キーボードナビゲーション
- スクリーンリーダー対応（ステップ番号の自動読み上げ）
- 色のコントラスト比確保

## 🚀 使い方

### 1. サーバー起動

```bash
cd apps/bootstrap-viewer
python3 -m http.server 8080
```

### 2. ブラウザでアクセス

```
http://localhost:8080/localgov.html
```

## 📊 サンプルデータ

### 実装されているページ

**Service Pages（2件）**:
1. ✅ 住民票の写しを取得する（Top task）
2. ✅ 粗大ごみの収集を申し込む

**Guide Pages（1件）**:
1. ✅ 介護保険のご案内
   - 介護保険制度とは
   - 要介護認定の申請方法
   - 利用できるサービス一覧
   - 費用と自己負担額

**Step-by-step Pages（1件）**:
1. ✅ 出生届の提出 Step by step
   - Step 1: 必要書類を準備する
   - Step 2: 出生届を記入する
   - Step 3: 市役所に提出する（or 郵送）
   - Step 4: 関連する手続きを行う

**Emergency Alerts（2件）**:
1. 🚨 【重要】避難所について
2. 🚨 インフルエンザ警報

## 🔧 カスタマイズ

### 新しいService Pageを追加

```json
{
  "type": "service",
  "title": "転入届を提出する",
  "summary": "他の市区町村から歌志内市に引っ越してきた方は、14日以内に転入届を提出してください。",
  "sections": [
    {
      "heading": "必要なもの",
      "content": "・本人確認書類\n・転出証明書\n・印鑑"
    }
  ],
  "primaryTask": {
    "label": "オンラインで手続きする",
    "url": "https://www.city.utashinai.hokkaido.jp/tennyu",
    "isTopTask": true
  },
  "relatedLinks": [],
  "category": "転入・転出",
  "url": "https://www.city.utashinai.hokkaido.jp/tennyu"
}
```

### Step-by-step Pageを追加

```json
{
  "type": "step-by-step",
  "title": "国民健康保険への加入 Step by step",
  "introduction": "会社を退職したり、他の市区町村から転入した場合は国民健康保険に加入する必要があります。",
  "steps": [
    {
      "stepNumber": 1,
      "title": "必要書類を確認する",
      "description": "加入に必要な書類を揃えます。",
      "tasks": [
        {
          "title": "退職証明書または離職票",
          "url": "#",
          "estimatedTime": "即日"
        }
      ]
    }
  ],
  "totalSteps": 3,
  "estimatedDuration": "約1時間",
  "category": "健康保険",
  "url": "https://www.city.utashinai.hokkaido.jp/kokuho"
}
```

## 📐 TypeScript/Zod スキーマ

スキーマ定義は `apps/transformer/src/localgov-schemas.ts` に実装済み:

```typescript
import { ServicePageSchema, GuidePageSchema, StepByStepPageSchema } from './localgov-schemas';

// 型安全なデータ検証
const validatedData = LocalGovStructuredDataSchema.parse(rawData);
```

## 🎯 使い分けガイド

| シナリオ | 選ぶページ型 |
|---------|------------|
| 「粗大ごみを申し込む」をオンラインフォームに誘導 | **Service page** |
| 「介護保険に関する情報を一通り学びたい」 | **Guide page** |
| 「出生届を提出する手順を順番に案内」 | **Step-by-step page** |

## 🔍 実装の詳細

### Service Page の特徴

- **Task button**: 緑色（通常）/ 赤色（Top task）
- **レイアウト**: タイトル → 要約 → セクション → CTA → 関連リンク
- **情報量**: 1ページで読了できる長さ

### Guide Page の特徴

- **Next/Previous ボタン**: 各子ページ間を横断
- **目次**: showTableOfContents オプションで縦型目次表示
- **順序**: 読む順番は固定しない

### Step-by-step Page の特徴

- **番号付きリスト**: 円形の黒いバッジで番号表示
- **代替ステップ**: "または"で分岐を表現
- **費用表示**: タスクに費用がある場合は赤字で強調
- **所要時間**: 各タスク・全体の所要時間を明示

## 📚 参考資料

- [LocalGov Drupal Documentation](https://docs.localgovdrupal.org/)
- [GOV.UK Design System - Step by step navigation](https://design-system.service.gov.uk/patterns/step-by-step-navigation/)
- [GOV.UK Design System - Guide page](https://www.gov.uk/guidance/content-design/content-types#guide)

## 🚧 今後の拡張

- [ ] Drupalテンプレートへの変換
- [ ] 多言語対応（英語、やさしい日本語）
- [ ] 音声読み上げ対応
- [ ] プリント最適化CSS
- [ ] ダークモード対応

## ライセンス

MIT License

---

**実装日**: 2025-11-25
**準拠**: LocalGov Drupal CMS Structure
**アクセシビリティ**: WCAG 2.1 AA目標