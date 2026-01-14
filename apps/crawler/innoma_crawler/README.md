# INNOMA Crawler

指定したドメイン配下のHTMLページを完全にクロールし、DOM構造をJSON形式に変換して保存するクローラー。

## 機能

- 指定したstart_urlと同一ドメイン配下の全HTMLページをクロール
- 幅優先探索(BFS)によるクロール
- HTMLを意味ベースのDOM構造(JSON)に変換
- URL正規化による重複排除
- リクエスト間隔制御

## インストール

```bash
cd apps/crawler/innoma_crawler
pip install -r requirements.txt
```

## 使い方

### 基本的な使用方法

```bash
python -m innoma_crawler.main https://example.com/
```

### オプション指定

```bash
python -m innoma_crawler.main https://example.com/ \
  --output ./crawled_data \
  --timeout 15 \
  --delay 1.0
```

### オプション

- `start_url`: クロール開始URL (必須)
- `-o, --output`: 出力ディレクトリ (デフォルト: output)
- `-t, --timeout`: HTTPリクエストタイムアウト秒数 (デフォルト: 10)
- `-d, --delay`: リクエスト間の待機時間秒数 (デフォルト: 0.5)

## 出力形式

各URLごとに1つのJSONファイルが生成されます。ファイル名はURLのハッシュ値です。

```json
{
  "url": "https://example.com/page/",
  "title": "ページタイトル",
  "lang": "ja",
  "headings": [
    { "level": 1, "text": "見出し1" },
    { "level": 2, "text": "見出し2" }
  ],
  "main": [
    { "type": "p", "text": "段落のテキスト" },
    { "type": "ul", "items": ["項目1", "項目2"] }
  ],
  "links": [
    { "text": "リンクテキスト", "href": "/other-page/" }
  ]
}
```

## クロール対象

- start_urlと同じscheme + netlocのページ
- HTTP GETで取得可能
- Content-Type: text/html
- `<a href>`により到達可能
- 認証不要

## クロール対象外

- 外部ドメイン
- 非HTML (画像、PDF、CSS、JSなど)
- `mailto:`, `tel:`, `javascript:` スキーム
- JavaScript実行でのみ出現するURL

## 制限事項

- JavaScript未対応 (静的HTMLのみ)
- フォーム遷移不可
- 視覚レイアウト情報は含まれません
