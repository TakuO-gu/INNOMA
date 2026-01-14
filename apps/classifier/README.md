# Page Classifier

Crawlerで取得したDOMデータを元に、ページタイプを分類するツールです。

## ページタイプ

このツールは以下の4つのカテゴリーにページを分類します:

1. **Service page**: 1ページで読了できる長さのページ
   - 具体的なサービスや情報を提供している
   - 例: 特定の手続きの詳細ページ、お知らせページ

2. **Guide page**: 1ページで読了できない、複数ページへのリンクをまとめるページ
   - ナビゲーションやディレクトリとしての役割
   - 例: カテゴリーページ、サービス一覧ページ

3. **Step-by-step page**: 手続きを段階的に説明するページ
   - 明確な開始点と終了点がある
   - タスクを決まった順序で完了する必要がある
   - 例: 申請手順、登録フロー

4. **Other**: その他のページ

## セットアップ

### 1. 依存関係のインストール

```bash
cd apps/extractor
pip install -r requirements.txt
```

### 2. 環境変数の設定

Gemini API キーを取得して設定します:

1. [Google AI Studio](https://aistudio.google.com/apikey) でAPI キーを取得
2. `.env`ファイルを作成:

```bash
cd apps/extractor
cp .env.example .env
```

3. `.env`ファイルを編集してAPI キーを設定:

```
GEMINI_API_KEY=your_actual_api_key_here
```

## 使い方

### 単一ファイルの分類

```python
from page_classifier import PageClassifier, load_json_file

classifier = PageClassifier()
page_data = load_json_file("path/to/page.json")
result = classifier.classify(page_data)

print(result["page_type"])  # "service_page", "guide_page", etc.
print(result["confidence"])  # 0.0 - 1.0
print(result["reasoning"])   # 分類の理由
```

### バッチ処理

**重要な改善点:**
- **10ページを1リクエストで処理**: 効率的にバッチ処理
- **レート制限対応**: 1分間に5リクエスト (12秒間隔)
- **160ファイルを約4分で処理可能** (従来の32分から大幅短縮)

```bash
# 基本的な使い方
python classify_pages.py /path/to/crawler/output

# 出力ファイルを指定
python classify_pages.py /path/to/crawler/output --output results.json

# 処理するファイル数を制限（テスト用）
python classify_pages.py /path/to/crawler/output --limit 20

# サンプルデータで試す
python classify_pages.py ../crawler/innoma_crawler/takaoka_output --limit 20
```

#### 処理時間の目安
- 20ファイル: 約24秒 (2バッチ)
- 50ファイル: 約1分 (5バッチ)
- 100ファイル: 約2.5分 (10バッチ)
- 160ファイル: 約4分 (16バッチ)

### 出力形式

結果はJSON形式で保存されます:

```json
[
  {
    "page_type": "service_page",
    "confidence": 0.9,
    "reasoning": "1ページで完結する具体的な災害支援の情報を提供している",
    "url": "https://example.com/page1",
    "title": "ページタイトル",
    "file_name": "abc123.json"
  },
  {
    "page_type": "guide_page",
    "confidence": 0.85,
    "reasoning": "多数のリンクで子育て関連の各種サービスへのナビゲーションを提供している",
    "url": "https://example.com/page2",
    "title": "子育て",
    "file_name": "def456.json"
  }
]
```

## 入力データ形式

クローラーから取得したJSONファイルは以下の形式を想定しています:

```json
{
  "url": "https://example.com/page",
  "title": "ページタイトル",
  "lang": "ja",
  "headings": [
    {
      "level": 1,
      "text": "見出しテキスト"
    }
  ],
  "links": [
    {
      "text": "リンクテキスト",
      "href": "https://example.com/link"
    }
  ]
}
```

## 使用しているLLM

このツールは**Gemini API**（gemini-2.5-flash）を使用してページを分類します。

## ライセンス

MIT
