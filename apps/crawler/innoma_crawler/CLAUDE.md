# ドメイン配下HTML完全クロール & DOM変換
## 目的

指定した start_url と同一ドメイン配下の
公開されている HTML ページを全てクロールし、
HTML を意味ベースの DOM(JSON) に変換して保存する。

## 技術

Python

requests

BeautifulSoup

## クロール対象

scheme + netloc が start_url と一致

HTTP GET 可能

Content-Type = text/html

<a href> により到達可能

認証不要

## クロール対象外

外部ドメイン

非HTML（画像・PDF・CSS・JS）

mailto: tel: javascript:

JS実行でのみ出現するURL

## URL発見

HTML内の <a href> を抽出

相対URLは絶対URLに変換

正規化後、未取得URLのみキューに追加

## URL正規化

#fragment 削除

クエリ削除

末尾 / 統一

同一URLは1件扱い

## クロール方式

幅優先探索（BFS）

URLキューが空になるまで継続

取得済みURLは再取得しない

## HTTP取得

GET

timeout = 10s

status 200 のみ処理

Content-Type = text/html のみ処理

## DOM変換

BeautifulSoupでHTMLをパース

以下タグを削除
script style nav footer header aside noscript

main抽出優先順
main → article → section → body

## DOM構造（JSON）
{
  "url": "...",
  "title": "...",
  "lang": "ja",
  "headings": [
    { "level": 1, "text": "..." }
  ],
  "main": [
    { "type": "p", "text": "..." },
    { "type": "ul", "items": ["..."] }
  ],
  "links": [
    { "text": "...", "href": "..." }
  ]
}

##　保存

1URL = 1JSON

UTF-8

ファイル名はURLハッシュ

## 完了条件

URLキューが空

新規URLが発見されない

## 制限

JavaScript未対応

フォーム遷移不可

視覚レイアウト無視

## 出力目的

検索

分析

LLM入力

Web構造理解