# ウェブサイト統合テキスト抽出システム

Firecrawlを使用してウェブサイトの情報を完全にテキスト化し、JSON、HTML、Markdownの各フォーマットで適切なディレクトリに保存するシステムです。

## 機能

### 📄 基本スクレーピング
- Firecrawlによる高品質なHTML/Markdown抽出
- 構造化データの自動抽出（LLM使用）
- 複数フォーマット同時取得（markdown, html, extract）

### 🖼️ 画像OCR機能
- HTMLから画像URL自動抽出
  - `<img src="...">` タグ
  - `background-image: url(...)` CSS
  - `background: url(...)` 省略形CSS（複合指定対応）
  - インライン `style` 属性内の背景画像
  - CSS内の任意の `url()` 指定
  - 複雑なCSS（gradientとの組み合わせ等）にも対応
- **PaddleOCRによる高精度画像内テキスト抽出**
  - **日本語+英語のデュアル言語対応**
  - 縦書きテキスト対応
  - 小さなテキストも検出（閾値調整済み）
  - **信頼度ベースの最適結果選択**
  - **デバッグモードでOCR結果詳細表示**

### 💾 ストレージオプション
- ローカルファイル保存
- AWS S3アップロード対応
- 画像メタデータ管理

### 🎯 構造化データ
- ニュース・お知らせ
- イベント情報  
- 連絡先・アクセス情報
- 手続き・サービス情報
- ナビゲーションメニュー
- 重要リンク・外部リンク
- SNS情報

## インストール

```bash
# 基本パッケージ
pip install -r requirements.txt

# OCR機能を使用する場合
pip install paddleocr Pillow

# S3を使用する場合
pip install boto3
```

## 使用方法

### 基本的な使用

```bash
# 単一URLの処理
python website_crawler.py "https://www.u-toyama.ac.jp/"

# 複数URLの一括処理
python website_crawler.py "https://site1.com/" "https://site2.com/"

# 出力ディレクトリを指定
python website_crawler.py "https://example.com/" --output-dir custom_output

# OCR機能を無効にして処理
python website_crawler.py "https://example.com/" --no-ocr

# 詳細ログを表示
python website_crawler.py "https://example.com/" --verbose
```

### プログラムから使用

```python
from src.web_scraper import WebScraper
from src.text_processor import TextProcessor
from src.output_manager import OutputManager

# 初期化
scraper = WebScraper(enable_image_ocr=True)
processor = TextProcessor()
output_manager = OutputManager("outputs")

# ウェブページ処理
scraped_data = scraper.scrape_page("https://example.com/")
website_data = processor.process_scraped_data(scraped_data)
file_paths = output_manager.save_website_data(website_data)

print(f"統合テキスト文字数: {website_data.total_text_length}")
print(f"出力ファイル: {file_paths}")
```

### 環境変数設定

```bash
# 環境変数設定
export FIRECRAWL_API_KEY="your-api-key"

# .envファイル例
echo "FIRECRAWL_API_KEY=your-api-key" > .env
```

## 設定

### 環境変数

```bash
# 必須
FIRECRAWL_API_KEY=your-firecrawl-api-key

# オプション（S3使用時）
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_DEFAULT_REGION=ap-northeast-1
```

### 初期化オプション

```python
scraper = FirecrawlScraper(
    api_key="your-api-key",           # FirecrawlのAPIキー
    enable_image_ocr=True,            # 画像OCR機能
    image_save_dir="images",          # 画像保存ディレクトリ
    s3_bucket="your-bucket"           # S3バケット名
)
```

## 出力データ構造

```json
{
  "raw_data": {
    "markdown": "...",
    "html": "...",
    "metadata": {...}
  },
  "structured_data": {
    "title": "ページタイトル",
    "organization_name": "組織名",
    "news_items": [...],
    "events": [...],
    "contact_info": {...},
    "important_links": [...],
    "extracted_text_from_images": [
      {
        "image_url": "...",
        "extracted_text": "画像内のテキスト",
        "confidence": 0.95
      }
    ],
    "combined_ocr_text": "全画像のOCRテキスト結合"
  },
  "image_data": [
    {
      "type": "image",
      "url": "...",
      "extracted_text": "OCRテキスト",
      "ocr_confidence": 0.95,
      "local_path": "...",
      "file_size": 12345
    }
  ]
}
```

## 🗂️ プロジェクト構造

```
firecrowl/
├── website_crawler.py          # メイン実行スクリプト
├── src/                        # ソースコード
│   ├── __init__.py
│   ├── web_scraper.py         # ウェブスクレーピング
│   ├── text_processor.py      # テキスト統合処理
│   ├── output_manager.py      # ファイル出力管理
│   ├── data_models.py         # データモデル定義
│   └── image_processor.py     # 画像OCR処理
├── outputs/                    # 出力ディレクトリ
│   ├── json/                  # JSON形式（完全データ）
│   ├── html/                  # HTML形式（視覚的表示）
│   ├── markdown/              # Markdown形式（純粋テキスト）
│   └── structured/            # 構造化データ（CSV表形式）
├── data/                      # データ保存
├── tests/                     # テストファイル
├── requirements.txt           # 依存関係
└── README.md                  # このファイル
```

## 📊 出力フォーマット

### JSON形式
- 完全なメタデータと統合テキスト
- 構造化データとOCR結果を含む

### HTML形式
- 読みやすいフォーマット
- メタデータとテキストを視覚的に表示
- 構造化データをテーブル形式で表示

### Markdown形式
- 純粋なWebページコンテンツのみ
- 構造化データは除外（重複回避）
- 文書管理に適した形式

### CSV形式（構造化データ）
- ニュース、イベント、リンク等を表形式で整理
- Excel等で開けるCSV形式
- カテゴリ別に分類されたデータ

## ライセンス

MIT License

## 依存関係

- firecrawl-py: Firecrawl API
- pydantic: データ検証・スキーマ
- python-dotenv: 環境変数管理
- requests: HTTP通信
- paddleocr: OCR処理（オプション）
- Pillow: 画像処理（オプション）
- boto3: AWS S3（オプション）