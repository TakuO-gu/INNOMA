# BuildingBlocksMainArea コンポーネント

## 概要

`BuildingBlocksMainArea`は、DADS（デジタル庁デザインシステム）に準拠したメインエリアコンポーネントです。タイトルとコンテンツを表示し、オプションでラベルとメニューアイコンを含むことができます。

## 特徴

- ✅ DADS準拠のデザイン
- ✅ TypeScriptによる型安全性
- ✅ アクセシビリティ対応
- ✅ レスポンシブデザイン
- ✅ カスタマイズ可能なプロップス

## 使用方法

### 基本的な使用法

```tsx
import { BuildingBlocksMainArea } from '@/components/blocks/BuildingBlocksMainArea';

export default function MyComponent() {
  return (
    <BuildingBlocksMainArea
      label="ラベル"
      title="タイトル"
      content="コンテンツテキスト"
    />
  );
}
```

### ラベルなし

```tsx
<BuildingBlocksMainArea
  title="タイトルのみ"
  content="このコンポーネントはラベルを表示しません"
  showLabel={false}
/>
```

### コンテンツなし

```tsx
<BuildingBlocksMainArea
  label="ラベル"
  title="タイトルのみの表示"
  showContent={false}
/>
```

### アイコン操作

```tsx
<BuildingBlocksMainArea
  label="操作可能"
  title="メニューアイコンで操作"
  content="アイコンをクリックすると、onIconClickコールバックが呼ばれます"
  onIconClick={() => {
    console.log('Menu icon clicked!');
    // メニューを開く、など
  }}
/>
```

## Props

| Prop | Type | Default | 説明 |
|------|------|---------|------|
| `label` | `string` | - | ラベルテキスト |
| `title` | `string` | - | タイトル（必須） |
| `content` | `string` | - | コンテンツテキスト |
| `showLabel` | `boolean` | `true` | ラベルを表示するか |
| `showContent` | `boolean` | `true` | コンテンツを表示するか |
| `showEndIcon` | `boolean` | `true` | メニューアイコンを表示するか |
| `onIconClick` | `() => void` | - | メニューアイコンクリック時のコールバック |
| `className` | `string` | `''` | 追加のCSSクラス |

## デザインシステム

このコンポーネントは以下のデザイントークンを使用しています：

- **フォント**
  - ラベル: 16px, Regular, Gray-800
  - タイトル: 20px, Bold, Gray-900
  - コンテンツ: 16px, Regular, Gray-800

- **色**
  - テキスト: `--color-neutral-solid-gray-800`（#333）
  - タイトル: `--color-neutral-solid-gray-900`（#1a1a1a）
  - ボーダー: `--color-neutral-solid-gray-300`

- **間隔**
  - 左右パディング: 24px
  - ラベル/タイトル間: 4px

## アクセシビリティ

- セマンティックなHTML構造
- キーボードナビゲーション対応
- フォーカス可視性の確保
- スクリーンリーダー対応

## 例

### 複数の使用

```tsx
export default function PageWithMultipleBlocks() {
  return (
    <div className="space-y-4">
      <BuildingBlocksMainArea
        label="セクション1"
        title="最初のブロック"
        content="このエリアには情報が表示されます"
      />
      <BuildingBlocksMainArea
        label="セクション2"
        title="2番目のブロック"
        content="各ブロックは独立して動作します"
        onIconClick={() => handleMenuClick('block2')}
      />
    </div>
  );
}
```

### カスタムスタイル

```tsx
<BuildingBlocksMainArea
  label="カスタムスタイル"
  title="独自のスタイルを適用"
  content="classNameプロップで追加のスタイルを指定できます"
  className="shadow-lg rounded-lg"
/>
```
