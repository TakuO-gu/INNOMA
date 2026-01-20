# UI・CSS仕様書

**作成日**: 2026-01-20

---

## 1. 概要

INNOMAプロジェクトのUI・CSSアーキテクチャ。デジタル庁デザインシステム（DADS）をベースに、Tailwind CSSとカスタムコンポーネントスタイルを組み合わせて使用。

---

## 2. 技術スタック

| 技術 | 用途 |
|------|------|
| Tailwind CSS 3.x | ユーティリティファースト CSS |
| @digital-go-jp/design-tokens | DADSデザイントークン |
| @digital-go-jp/tailwind-theme-plugin | DADSテーマプラグイン |

### ファイル構成

```
apps/web/
├── app/globals.css          # グローバルスタイル
├── tailwind.config.ts       # Tailwind設定
└── components/
    ├── dads/                # DADSコンポーネント（Tailwindクラス使用）
    ├── blocks/              # ブロックレンダラー
    └── layout/              # レイアウトコンポーネント
```

### Tailwind設定

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  plugins: [
    require("@digital-go-jp/tailwind-theme-plugin"),
  ],
} satisfies Config;
```

---

## 3. globals.css の構成

### インポート

```css
@import "@digital-go-jp/design-tokens/dist/tokens.css";

@tailwind base;
@tailwind components;
@tailwind utilities;
```

### レイヤー構成

| レイヤー | 用途 |
|---------|------|
| `@layer base` | HTMLベーススタイル、リセット |
| `@layer components` | 再利用可能なコンポーネントクラス |
| `@layer utilities` | ユーティリティクラス |

---

## 4. ベーススタイル

### HTML/Body

```css
html {
  scroll-behavior: smooth;
}

body {
  @apply antialiased text-gray-900;
}
```

### フォーカス状態（アクセシビリティ）

```css
:focus-visible {
  @apply outline-2 outline-offset-2 outline-blue-500;
}
```

### モバイルタップターゲット

```css
@media (max-width: 640px) {
  button, a {
    min-height: 44px;  /* WCAG推奨サイズ */
  }
}
```

---

## 5. カラーパレット

### ソリッドグレー（DADS）

| トークン | 用途 |
|---------|------|
| `solid-gray-50` | 背景（薄） |
| `solid-gray-100` | 背景 |
| `solid-gray-200` | ボーダー |
| `solid-gray-300` | ボーダー（濃） |
| `solid-gray-400` | テキスト（薄） |
| `solid-gray-500` | テキスト（中） |
| `solid-gray-600` | テキスト |
| `solid-gray-700` | テキスト（濃） |
| `solid-gray-900` | 見出し |

### セマンティックカラー

| 用途 | クラス例 |
|------|---------|
| プライマリ | `bg-blue-600`, `text-blue-600` |
| 成功 | `bg-green-600`, `text-green-600` |
| 警告 | `bg-amber-500`, `text-amber-600` |
| 危険 | `bg-red-600`, `text-red-600` |
| 情報 | `bg-blue-50`, `border-blue-500` |

---

## 6. 共通ヘッダー

### 表示要素

全ての自治体ページ（`/[municipality]/**`）に以下の要素を含むヘッダーを表示:

1. **INNOMAロゴ** - クリックでINNOMAトップページへ遷移
2. **自治体名** - クリックで自治体トップページへ遷移
3. **検索バー** - 当該自治体内のコンテンツを検索

### レイアウト

```
┌─────────────────────────────────────────────────────────────┐
│  INNOMA | 青ヶ島村      [検索...          ] [トップ][他の自治体] │
└─────────────────────────────────────────────────────────────┘
```

### スタイル

| 要素 | クラス |
|------|--------|
| ヘッダー背景 | `bg-white` |
| INNOMAロゴ | `text-blue-600` (hover: `text-blue-700`) |
| 自治体名 | `text-solid-gray-900` |
| フォーカスリング | `ring-yellow-300` |
| 最大幅 | `max-w-7xl` |
| パディング | `px-4 py-3` |
| 固定 | `sticky top-0 z-50` |
| 下線 | `border-b border-solid-gray-300` |

### レスポンシブ対応

**デスクトップ（md以上）**:
- ロゴ、自治体名、検索バー、ナビゲーションを1行に表示

**モバイル（md未満）**:
- ロゴと自治体名のみ表示
- ハンバーガーメニューで検索とナビゲーションを展開

### アクセシビリティ

- キーボードナビゲーション対応
- フォーカス状態の視覚的表示（黄色リング）
- スクリーンリーダー対応（aria-label）

---

## 7. 検索機能

### 検索バーの動作

- プレースホルダー: 「{自治体名}内を検索...」
- Enter または検索ボタンで検索実行
- 検索結果ページ: `/{municipality}/search?q={query}`

### 検索対象

- 当該自治体のArtifact内のコンテンツ
- タイトル、本文、メタデータを対象
- ブロックから抽出したテキスト（RichText、InfoTable、ProcedureSteps等）

### 検索結果の表示

コンテンツタイプバッジ:
- ページ: グレー
- 手続き: グリーン
- 緊急情報: レッド
- お知らせ: ブルー

### 検索アルゴリズム

| マッチ条件 | スコア |
|-----------|--------|
| タイトル完全一致 | +100 |
| タイトル部分一致 | +50 |
| 本文マッチ回数 | +5/回（最大30） |
| 各単語のタイトルマッチ | +20 |
| 各単語の本文マッチ | +5 |

---

## 8. ナビゲーション

| リンク | 遷移先 | 説明 |
|--------|--------|------|
| INNOMA | `/` | INNOMAトップページ |
| 自治体名 | `/{municipality}` | 自治体トップページ |
| トップ | `/{municipality}` | 自治体トップページ（デスクトップ） |
| 他の自治体 | `/municipalities` | 自治体一覧ページ |

---

## 9. コンポーネントクラス

### ページレイアウト

| クラス | 説明 |
|--------|------|
| `.dads-page` | ページコンテナ（max-w-4xl, 中央揃え） |
| `.block-renderer` | ブロック間のスペーシング |

```css
.dads-page {
  @apply max-w-4xl mx-auto px-6 py-12;
}
.dads-page > * + * {
  @apply mt-12;
}
```

### テキストコンポーネント

| クラス | 説明 |
|--------|------|
| `.dads-paragraph` | 段落テキスト |
| `.dads-richtext` | リッチテキストコンテナ |
| `.dads-summary` | サマリーブロック |
| `.dads-summary__text` | サマリーテキスト |

### リスト・ディレクトリ

| クラス | 説明 |
|--------|------|
| `.dads-resource-list` | リソースリストコンテナ |
| `.dads-resource-list__item` | リソースアイテム |
| `.dads-resource-list__title` | リソースタイトル |
| `.dads-resource-list__description` | リソース説明 |
| `.dads-resource-list__meta` | メタ情報 |
| `.dads-resource-list__external` | 外部リンクマーカー（↗） |
| `.dads-directory-list` | ディレクトリリスト |
| `.dads-directory-list__item` | ディレクトリアイテム |
| `.dads-directory-list__name` | 名前 |
| `.dads-directory-list__details` | 詳細（dt/dd） |

### 連絡先・お問い合わせ

| クラス | 説明 |
|--------|------|
| `.dads-contact` | 連絡先ブロック |
| `.dads-contact__card` | 連絡先カード |
| `.dads-contact__department` | 部署名 |
| `.dads-contact__label` | ラベル（電話、住所等） |
| `.dads-contact__address` | 住所 |
| `.dads-contact__phone` | 電話番号 |
| `.dads-contact__fax` | FAX番号 |
| `.dads-contact__email` | メールアドレス |
| `.dads-contact__hours` | 営業時間 |

### ボタン

| クラス | 説明 |
|--------|------|
| `.dads-action-button` | アクションボタンコンテナ |
| `.dads-button` | ボタンベース |
| `.dads-button--primary` | プライマリボタン（青） |
| `.dads-button--large` | 大きいボタン |
| `.dads-button__icon` | ボタン内アイコン |

```css
.dads-button {
  @apply inline-flex items-center justify-center gap-3
         px-8 py-4 rounded-xl font-semibold
         transition-all shadow-md hover:shadow-lg;
}

.dads-button--primary {
  @apply bg-blue-600 text-white
         hover:bg-blue-700 active:bg-blue-800;
}
```

### コールアウト（注意・警告）

| クラス | 説明 |
|--------|------|
| `.dads-callout` | コールアウトベース |
| `.dads-callout--info` | 情報（青） |
| `.dads-callout--warning` | 警告（黄） |
| `.dads-callout--danger` | 危険（赤） |
| `.dads-callout__title` | コールアウトタイトル |
| `.dads-callout__content` | コールアウト内容 |

### ニュース・メタ情報

| クラス | 説明 |
|--------|------|
| `.dads-news-meta` | ニュースメタコンテナ |
| `.dads-news-meta__date` | 日付 |
| `.dads-news-meta__updated` | 更新日 |
| `.dads-news-meta__category` | カテゴリバッジ |

### カード・ホバー効果

| クラス | 説明 |
|--------|------|
| `.card-hover` | カードホバーエフェクト |
| `.line-clamp-2` | 2行で切り詰め |
| `.line-clamp-3` | 3行で切り詰め |

### アクセシビリティ

| クラス | 説明 |
|--------|------|
| `.skip-link` | スキップリンク（コンテンツへジャンプ） |
| `.dads-u-visually-hidden` | 視覚的に非表示（スクリーンリーダー用） |

---

## 10. ユーティリティクラス

| クラス | 説明 |
|--------|------|
| `.safe-top` | セーフエリア上部パディング |
| `.safe-bottom` | セーフエリア下部パディング |
| `.scrollbar-hide` | スクロールバー非表示 |

---

## 11. アニメーション

### シマーローディング

```css
@keyframes shimmer {
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
}

.animate-shimmer {
  animation: shimmer 1.5s ease-in-out infinite;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200px 100%;
}
```

---

## 12. 印刷スタイル

```css
@media print {
  header, footer, nav, .no-print {
    display: none !important;
  }

  body {
    font-size: 12pt;
    line-height: 1.5;
  }

  a[href^="http"]::after {
    content: " (" attr(href) ")";
  }
}
```

---

## 13. 命名規則

### BEM風命名

```
.dads-{block}
.dads-{block}__{element}
.dads-{block}--{modifier}
```

例:
- `.dads-button` - ブロック
- `.dads-button__icon` - エレメント
- `.dads-button--primary` - モディファイア

### プレフィックス

| プレフィックス | 用途 |
|---------------|------|
| `dads-` | DADSベースのコンポーネント |
| `dads-u-` | ユーティリティクラス |

---

## 14. ベストプラクティス

### 推奨

- Tailwindユーティリティクラスを優先使用
- カスタムクラスは再利用性が高い場合のみ作成
- `@layer`でスタイルを適切に分類
- DADSデザイントークンを使用

### 非推奨

- インラインスタイルの使用
- `!important`の多用
- 深いセレクタネスト
- マジックナンバー

---

## 15. 関連ファイル

| ファイル | 説明 |
|----------|------|
| `app/globals.css` | グローバルスタイル |
| `tailwind.config.ts` | Tailwind設定 |
| `components/dads/` | DADSコンポーネント |
| `components/layout/MunicipalityHeader.tsx` | ヘッダーコンポーネント |
| `app/[municipality]/layout.tsx` | 自治体ページレイアウト |
| `app/[municipality]/search/page.tsx` | 検索結果ページ |
| `lib/search/index.ts` | 検索ライブラリ |

---

## 16. 参考リンク

- [デジタル庁デザインシステム](https://design.digital.go.jp/)
- [DADS React コードスニペット](https://design.digital.go.jp/dads/react/)
- [Tailwind CSS ドキュメント](https://tailwindcss.com/docs)

---

## 17. 今後の拡張予定

- 緊急情報バナーの表示
- 言語切り替え機能
- ユーザー設定（フォントサイズ、コントラスト）
