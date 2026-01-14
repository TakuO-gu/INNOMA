# INNOMA Bootstrap Viewer

Bootstrap 5を使用した、自治体データのビューアーアプリケーションです。

## 特徴

- ✅ **Bootstrap 5**: モダンで使いやすいUI
- ✅ **レスポンシブデザイン**: モバイル・タブレット・デスクトップ対応
- ✅ **アクセシブル**: WCAG AA準拠を目指した設計
- ✅ **リアルタイム表示**: JSONデータを動的に読み込み
- ✅ **視覚的な情報整理**: カード形式で見やすく表示

## クイックスタート

### 1. サーバー起動

```bash
cd apps/bootstrap-viewer
python3 -m http.server 8080
```

### 2. ブラウザでアクセス

```
http://localhost:8080
```

## 表示内容

### ヒーローセクション
- 自治体名と都道府県
- 最終更新日時
- データ信頼度
- AI処理時間
- 総情報件数

### 緊急情報（重要）
- 赤色の目立つアラート
- 緊急度の高い情報を最上部に表示

### ニュース・お知らせ
- 重要度別カラーバッジ（重要：赤、注目：黄、お知らせ：灰）
- 公開日表示
- カード形式で見やすく配置

### イベント情報
- イベント名
- 開催日
- 詳細へのリンク

### 手続き・サービス
- 手続き名
- 重要度表示
- 手続き方法へのリンク

### 施設情報
- 施設名
- 重要度表示
- 施設詳細へのリンク

## データ形式

`data.json` ファイルは以下の形式を期待します：

```json
{
  "metadata": {
    "municipality": "自治体名",
    "prefecture": "都道府県名",
    "extractedAt": "2024-01-01T00:00:00Z",
    "confidence": 0.8,
    "llmModel": "gpt-4o",
    "processingTimeMs": 9794
  },
  "news": [...],
  "events": [...],
  "procedures": [...],
  "facilities": [...],
  "emergencyInfo": [...]
}
```

## カスタマイズ

### 色のカスタマイズ

`index.html` の `<style>` セクションで CSS変数を変更：

```css
:root {
    --bs-primary: #0d6efd;
    --bs-secondary: #6c757d;
    --bs-danger: #dc3545;
    --bs-warning: #ffc107;
    --bs-success: #198754;
}
```

### セクションの追加/削除

`renderXXX()` 関数を編集してセクションをカスタマイズできます。

## 技術スタック

- **HTML5**: セマンティックなマークアップ
- **Bootstrap 5.3.2**: CSSフレームワーク
- **Bootstrap Icons 1.11.1**: アイコンライブラリ
- **Vanilla JavaScript**: フレームワークレス

## ブラウザサポート

- Chrome (最新版)
- Firefox (最新版)
- Safari (最新版)
- Edge (最新版)

## アクセシビリティ

- セマンティックHTML使用
- ARIAラベル適用
- キーボードナビゲーション対応
- 色のコントラスト比確保
- レスポンシブフォント

## スクリーンショット

### デスクトップ表示
- ヒーローセクション: グラデーション背景
- カードグリッド: 3カラムレイアウト

### モバイル表示
- シングルカラム
- ハンバーガーメニュー
- タッチ最適化

## デプロイ

### 静的ホスティング

GitHub Pages, Netlify, Vercel などで簡単にデプロイできます：

```bash
# GitHub Pagesの例
git add apps/bootstrap-viewer
git commit -m "Add Bootstrap viewer"
git push origin main
```

### Docker

```dockerfile
FROM nginx:alpine
COPY . /usr/share/nginx/html
```

## ライセンス

MIT License

## 実装者

Claude (Sonnet 4.5) - 2025-11-25