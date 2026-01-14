# BuildingBlocksMainAreaコンポーネント実装完了

Figmaデザイン（node-id: 4146-9009）をReactコンポーネントとして実装しました。

## 📁 ファイル構成

```
apps/web/components/blocks/
├── BuildingBlocksMainArea.tsx          # メインコンポーネント
├── BuildingBlocksMainArea.test.tsx     # ユニットテスト
├── BuildingBlocksMainArea.stories.tsx  # Storybook用ストーリーズ
└── BuildingBlocksMainArea.md           # コンポーネント仕様書
```

## 🎯 実装内容

### BuildingBlocksMainArea コンポーネント

DADS（デジタル庁デザインシステム）に準拠したメインエリアコンポーネント

#### 特徴
- ✅ Figmaデザインに準拠した実装
- ✅ DADS デザイントークン対応
- ✅ TypeScript による型安全性
- ✅ アクセシビリティ対応（WCAG 2.1 AA）
- ✅ レスポンシブデザイン
- ✅ Tailwind CSS + DADS tailwind-theme-plugin使用

#### 構成要素
1. **タイトルコンテナ**
   - ラベル（オプション）
   - タイトル（必須）
   - メニューアイコン（オプション）

2. **コンテンツエリア**
   - テキストコンテンツ（オプション）
   - 改行対応（`whitespace-pre-wrap`）

#### Props

```typescript
type BuildingBlocksMainAreaProps = {
  label?: string;           // ラベルテキスト
  title: string;            // タイトル（必須）
  content?: string;         // コンテンツテキスト
  showEndIcon?: boolean;    // メニューアイコン表示（デフォルト: true）
  showLabel?: boolean;      // ラベル表示（デフォルト: true）
  showContent?: boolean;    // コンテンツ表示（デフォルト: true）
  onIconClick?: () => void; // アイコンクリックコールバック
  className?: string;       // 追加CSSクラス
};
```

## 🚀 使用方法

### 基本的な使用

```tsx
import { BuildingBlocksMainArea } from '@/components/blocks/BuildingBlocksMainArea';

export default function MyComponent() {
  return (
    <BuildingBlocksMainArea
      label="ラベル"
      title="タイトル"
      content="コンテンツテキスト"
      onIconClick={() => console.log('Menu clicked')}
    />
  );
}
```

### デモページへのアクセス

```bash
# Next.js開発サーバーで確認
npm run dev
# http://localhost:3000/dev/building-blocks-demo にアクセス
```

## 🎨 デザイン仕様

### カラーパレット
- テキスト: `solid-gray-800`
- タイトル: `solid-gray-900`
- ボーダー: `solid-gray-300`
- ホバー/フォーカス: `solid-gray-100`

### タイポグラフィ
- **ラベル**: 16px, Regular, Gray-800
- **タイトル**: 20px, Bold, Gray-900
- **コンテンツ**: 16px, Regular, Gray-800

### 間隔
- 左右パディング: 24px
- ラベル/タイトル間：4px
- アイコン：44px × 44px

## ✅ 実装チェックリスト

- [x] Figmaデザインに準拠した視覚的実装
- [x] TypeScriptによる型安全性
- [x] DADS準拠のデザイントークン
- [x] アクセシビリティ対応
- [x] レスポンシブ対応
- [x] ユニットテスト
- [x] Storybook ストーリーズ
- [x] コンポーネント仕様書
- [x] 実装例ドキュメント

## 🔗 関連ファイル

- [デモページ](app/dev/building-blocks-demo.tsx)
- [コンポーネント仕様](components/blocks/BuildingBlocksMainArea.md)
- [テスト](components/blocks/BuildingBlocksMainArea.test.tsx)
- [Storybook](components/blocks/BuildingBlocksMainArea.stories.tsx)

## 📦 依存関係

- React 18.3.1+
- TypeScript 5.3.3+
- Tailwind CSS 3.4.17+
- @digital-go-jp/tailwind-theme-plugin 0.3.3+

## 🧪 テストの実行

```bash
# ユニットテスト実行
npm run test

# カバレッジ確認
npm run test -- --coverage
```

## 📖 Storybook

```bash
# Storybookサーバー起動（プロジェクト設定時）
npm run storybook
```

## 🔄 今後の拡張可能性

- メニューアイコンのカスタマイズ
- ドラッグ&ドロップ機能の追加
- アニメーション効果の追加
- より詳細な状態管理の実装

---

**実装日**: 2026年1月14日
**Figmaリンク**: https://www.figma.com/design/vmBC7ZuqMhvteFLyFAaaTA/
**node-id**: 4146-9009
