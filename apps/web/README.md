# INNOMA Web Frontend

INNOMA Web Frontendは、構造化された自治体データを表示するNext.jsアプリケーションです。DA-DS（デジタル庁デザインシステム）準拠のUI Mapperを使用し、アクセシブルで使いやすいWeb体験を提供します。

## 特徴

- ✅ **Next.js 15**: React Server Components + App Router
- ✅ **Tailwind CSS**: ユーティリティファーストCSS
- ✅ **TypeScript**: 型安全な実装
- ✅ **DA-DS準拠**: UI Mapperコンポーネント使用
- ✅ **アクセシビリティ**: WCAG 2.1 AA準拠
- ✅ **レスポンシブ**: モバイル・タブレット・デスクトップ対応
- ✅ **SEO最適化**: メタデータ・構造化データ

## セットアップ

### 1. 依存関係のインストール

```bash
cd apps/web
npm install
```

### 2. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

### 3. ビルド

```bash
npm run build
npm start
```

## ディレクトリ構成

```
apps/web/
├── app/
│   ├── layout.tsx              # ルートレイアウト
│   ├── page.tsx                # ホームページ
│   ├── globals.css             # グローバルスタイル
│   └── municipalities/
│       ├── page.tsx            # 自治体一覧ページ
│       └── [id]/
│           └── page.tsx        # 自治体詳細ページ
├── lib/                        # ユーティリティ関数
├── public/                     # 静的ファイル
├── next.config.ts              # Next.js設定
├── tailwind.config.ts          # Tailwind CSS設定
├── tsconfig.json               # TypeScript設定
└── package.json
```

## ページ構成

### ホームページ (`/`)

INNOMAプロジェクトの概要とミッションを紹介。

**主要セクション:**
- ヒーローセクション
- 3つの主要機能（アクセシビリティ、横断検索、多言語対応）
- パイプラインアーキテクチャ
- オープンソースコミュニティへの案内

### 自治体一覧ページ (`/municipalities`)

登録されている自治体の一覧を表示。

**機能:**
- カード形式の一覧表示
- 各自治体へのリンク
- レスポンシブグリッドレイアウト

### 自治体詳細ページ (`/municipalities/[id]`)

個別の自治体の構造化データを表示。UI Mapperの`MunicipalDataView`コンポーネントを使用。

**表示内容:**
- 緊急情報（最優先）
- ニュース・お知らせ
- イベント情報
- 手続き・サービス
- 施設情報
- 連絡先

## データ統合

現在はサンプルデータを使用していますが、実際の運用では以下の方法でデータを統合します：

### 方法1: 静的JSONファイル

```typescript
// lib/data.ts
import fs from 'fs';
import path from 'path';
import type { MunicipalStructuredData } from '@innoma/transformer';

export function getMunicipalData(id: string): MunicipalStructuredData | null {
  const filePath = path.join(process.cwd(), 'data', `${id}.json`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(fileContent);
}
```

### 方法2: API統合

```typescript
// lib/api.ts
import type { MunicipalStructuredData } from '@innoma/transformer';

export async function fetchMunicipalData(
  id: string
): Promise<MunicipalStructuredData | null> {
  const response = await fetch(`${process.env.API_URL}/municipalities/${id}`, {
    next: { revalidate: 3600 } // 1時間ごとに再検証
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}
```

### 方法3: データベース統合

```typescript
// lib/db.ts
import { prisma } from './prisma';
import type { MunicipalStructuredData } from '@innoma/transformer';

export async function getMunicipalDataFromDB(
  id: string
): Promise<MunicipalStructuredData | null> {
  const municipality = await prisma.municipality.findUnique({
    where: { id },
    include: {
      news: true,
      events: true,
      procedures: true,
      facilities: true,
      contacts: true,
      emergencyInfo: true,
    },
  });

  if (!municipality) {
    return null;
  }

  return transformDBToStructuredData(municipality);
}
```

## デプロイ

### Vercelへのデプロイ

```bash
# Vercel CLIをインストール
npm i -g vercel

# デプロイ
vercel
```

または、GitHubリポジトリを接続して自動デプロイを設定できます。

### その他のプラットフォーム

- **Netlify**: `next export`でStatic HTML Export
- **AWS Amplify**: Next.js SSR対応
- **Cloudflare Pages**: Edge Runtime対応
- **Self-hosted**: `npm run build && npm start`でNodeサーバー起動

## 環境変数

必要に応じて`.env.local`ファイルを作成：

```bash
# API URL（API統合時）
API_URL=https://api.innoma.example.com

# Next.js設定
NEXT_PUBLIC_SITE_URL=https://innoma.example.com
```

## パフォーマンス最適化

- **Image Optimization**: Next.jsの`<Image>`コンポーネント使用
- **Code Splitting**: 自動コード分割
- **Lazy Loading**: React.lazy()でコンポーネント遅延読み込み
- **Caching**: ISR（Incremental Static Regeneration）使用

## アクセシビリティ

- **キーボードナビゲーション**: すべての操作がキーボードで可能
- **スクリーンリーダー**: ARIA属性完備
- **色コントラスト**: WCAG 2.1 AA準拠
- **フォーカス管理**: 明確なフォーカスインジケーター

## 開発

### 新しいページの追加

```bash
# 新しいページディレクトリを作成
mkdir -p app/new-page

# page.tsxを作成
touch app/new-page/page.tsx
```

### カスタムコンポーネントの追加

```bash
# コンポーネントディレクトリを作成
mkdir -p components

# 新しいコンポーネントを作成
touch components/MyComponent.tsx
```

## トラブルシューティング

### ビルドエラー

```bash
# node_modulesを削除して再インストール
rm -rf node_modules package-lock.json
npm install
```

### UI Mapperコンポーネントが見つからない

```bash
# UI Mapperをビルド
cd ../ui-mapper
npm install
npm run build
```

## ライセンス

MIT License

## 次のステップ

- [ ] API Gateway統合
- [ ] データベースセットアップ
- [ ] 検索機能の実装
- [ ] 多言語対応
- [ ] PWA対応
- [ ] パフォーマンス計測・最適化
