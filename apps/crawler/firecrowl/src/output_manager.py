"""
出力管理 - JSON、HTML、Markdownファイルの作成と保存
"""

import json
import os
import logging
import csv
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List
from .data_models import WebsiteData

logger = logging.getLogger(__name__)


class OutputManager:
    """出力ファイル管理クラス"""
    
    def __init__(self, base_output_dir: str = "outputs"):
        """
        初期化
        
        Args:
            base_output_dir: 出力ディレクトリのベースパス
        """
        self.base_output_dir = Path(base_output_dir)
        self.json_dir = self.base_output_dir / "json"
        self.html_dir = self.base_output_dir / "html"
        self.markdown_dir = self.base_output_dir / "markdown"
        self.structured_dir = self.base_output_dir / "structured"
        
        # ディレクトリ作成
        self._create_directories()
    
    def _create_directories(self):
        """出力ディレクトリを作成"""
        for directory in [self.json_dir, self.html_dir, self.markdown_dir, self.structured_dir]:
            directory.mkdir(parents=True, exist_ok=True)
    
    def save_website_data(self, website_data: WebsiteData, base_filename: str = None) -> Dict[str, str]:
        """
        WebsiteDataを各フォーマットで保存
        
        Args:
            website_data: 保存するデータ
            base_filename: ベースファイル名（指定しない場合は自動生成）
            
        Returns:
            保存されたファイルパスの辞書
        """
        try:
            if not base_filename:
                base_filename = self._generate_filename(website_data.url)
            
            # ファイルパス生成
            json_path = self.json_dir / f"{base_filename}.json"
            html_path = self.html_dir / f"{base_filename}.html"
            markdown_path = self.markdown_dir / f"{base_filename}.md"
            structured_path = self.structured_dir / f"{base_filename}.csv"
            
            # JSON保存
            self._save_json(website_data, json_path)
            
            # HTML保存
            self._save_html(website_data, html_path)
            
            # Markdown保存（統合テキストのみ）
            self._save_markdown(website_data, markdown_path)
            
            # 構造化データを表形式で保存
            self._save_structured_data(website_data, structured_path)
            
            # ファイルパスを更新
            website_data.json_file_path = str(json_path)
            website_data.html_file_path = str(html_path)
            website_data.markdown_file_path = str(markdown_path)
            
            file_paths = {
                'json': str(json_path),
                'html': str(html_path),
                'markdown': str(markdown_path),
                'structured': str(structured_path)
            }
            
            logger.info(f"ファイル保存完了: {base_filename}")
            return file_paths
            
        except Exception as e:
            logger.error(f"ファイル保存エラー: {e}")
            raise
    
    def _generate_filename(self, url: str) -> str:
        """URLからファイル名を生成"""
        import hashlib
        from urllib.parse import urlparse
        
        parsed = urlparse(url)
        domain = parsed.netloc.replace('www.', '')
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        url_hash = hashlib.md5(url.encode()).hexdigest()[:8]
        
        return f"{domain}_{timestamp}_{url_hash}"
    
    def _save_json(self, website_data: WebsiteData, file_path: Path):
        """JSON形式で保存"""
        data = {
            'metadata': {
                'url': website_data.url,
                'title': website_data.title,
                'scraped_at': website_data.scraped_at.isoformat(),
                'total_text_length': website_data.total_text_length,
                'html_length': website_data.html_length,
                'markdown_length': website_data.markdown_length,
                'ocr_text_length': website_data.ocr_text_length,
                'image_count': website_data.image_count
            },
            'content': {
                'combined_text': website_data.combined_text,
                'html_content': website_data.html_content,
                'markdown_content': website_data.markdown_content,
                'structured_data': website_data.structured_data,
                'ocr_data': website_data.ocr_data
            }
        }
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2, default=str)
    
    def _save_html(self, website_data: WebsiteData, file_path: Path):
        """HTML形式で保存"""
        html_content = f"""<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{website_data.title}</title>
    <style>
        body {{
            font-family: Arial, sans-serif;
            line-height: 1.6;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }}
        .container {{
            background-color: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }}
        .header {{
            border-bottom: 2px solid #007acc;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }}
        .title {{
            color: #007acc;
            margin-bottom: 10px;
        }}
        .metadata {{
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 30px;
            border-left: 4px solid #007acc;
        }}
        .content {{
            white-space: pre-wrap;
            line-height: 1.8;
        }}
        .section {{
            margin-bottom: 30px;
        }}
        .section-title {{
            color: #007acc;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
            margin-bottom: 15px;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">{website_data.title}</h1>
            <p><strong>URL:</strong> <a href="{website_data.url}" target="_blank">{website_data.url}</a></p>
        </div>
        
        <div class="metadata">
            <h3>メタデータ</h3>
            <p><strong>スクレーピング実行日時:</strong> {website_data.scraped_at.strftime('%Y年%m月%d日 %H:%M:%S')}</p>
            <p><strong>統合テキスト文字数:</strong> {website_data.total_text_length:,}文字</p>
            <p><strong>HTML文字数:</strong> {website_data.html_length:,}文字</p>
            <p><strong>Markdown文字数:</strong> {website_data.markdown_length:,}文字</p>
            <p><strong>OCRテキスト文字数:</strong> {website_data.ocr_text_length:,}文字</p>
            <p><strong>処理画像数:</strong> {website_data.image_count}枚</p>
        </div>
        
        <div class="section">
            <h2 class="section-title">統合テキストコンテンツ</h2>
            <div class="content">{self._escape_html(website_data.combined_text)}</div>
        </div>
        
        <div class="section">
            <h2 class="section-title">構造化データ</h2>
            <p><strong>構造化データは別途CSVファイルとして保存されています。</strong></p>
            <p>📁 <code>structured/{self._generate_filename(website_data.url)}.csv</code></p>
            {self._generate_structured_table_html(website_data)}
        </div>
    </div>
</body>
</html>"""
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(html_content)
    
    def _save_markdown(self, website_data: WebsiteData, file_path: Path):
        """Markdown形式で保存"""
        markdown_content = f"""# {website_data.title}

## メタデータ

- **URL:** [{website_data.url}]({website_data.url})
- **スクレーピング実行日時:** {website_data.scraped_at.strftime('%Y年%m月%d日 %H:%M:%S')}
- **統合テキスト文字数:** {website_data.total_text_length:,}文字
- **HTML文字数:** {website_data.html_length:,}文字
- **Markdown文字数:** {website_data.markdown_length:,}文字
- **OCRテキスト文字数:** {website_data.ocr_text_length:,}文字
- **処理画像数:** {website_data.image_count}枚

## 統合テキストコンテンツ

{website_data.combined_text}

---
*このファイルは自動生成されました - {datetime.now().strftime('%Y/%m/%d %H:%M:%S')}*
"""
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(markdown_content)
    
    def _escape_html(self, text: str) -> str:
        """HTMLエスケープ"""
        import html
        return html.escape(text)
    
    def create_summary_report(self, processed_files: list) -> str:
        """処理結果のサマリーレポートを作成"""
        summary_path = self.base_output_dir / "summary_report.md"
        
        summary_content = f"""# ウェブサイト処理結果サマリー

**生成日時:** {datetime.now().strftime('%Y年%m月%d日 %H:%M:%S')}
**処理件数:** {len(processed_files)}件

## 処理結果一覧

| No. | サイト名 | URL | 統合テキスト文字数 | 画像数 |
|-----|----------|-----|-------------------|-------|
"""
        
        for i, file_info in enumerate(processed_files, 1):
            summary_content += f"| {i} | {file_info.get('title', 'N/A')} | [{file_info.get('url', 'N/A')}]({file_info.get('url', '')}) | {file_info.get('text_length', 0):,} | {file_info.get('image_count', 0)} |\n"
        
        summary_content += f"""
## ファイル出力場所

- **JSON:** `{self.json_dir}`
- **HTML:** `{self.html_dir}`
- **Markdown:** `{self.markdown_dir}`

---
*自動生成レポート*
"""
        
        with open(summary_path, 'w', encoding='utf-8') as f:
            f.write(summary_content)
        
        logger.info(f"サマリーレポート作成: {summary_path}")
        return str(summary_path)
    
    def _save_structured_data(self, website_data: WebsiteData, file_path: Path):
        """構造化データをCSV形式で保存"""
        try:
            if not website_data.structured_data:
                # 空のCSVファイルを作成
                with open(file_path, 'w', encoding='utf-8', newline='') as f:
                    writer = csv.writer(f)
                    writer.writerow(['カテゴリ', 'タイトル', '日付', 'URL', '内容', 'その他'])
                return
            
            structured_data = website_data.structured_data
            rows = []
            
            # ニュース項目
            if 'news_items' in structured_data and isinstance(structured_data['news_items'], list):
                for item in structured_data['news_items']:
                    if isinstance(item, dict):
                        rows.append([
                            'ニュース',
                            item.get('title', ''),
                            item.get('date', ''),
                            item.get('url', ''),
                            item.get('content', ''),
                            item.get('category', '')
                        ])
            
            # イベント情報
            if 'events' in structured_data and isinstance(structured_data['events'], list):
                for item in structured_data['events']:
                    if isinstance(item, dict):
                        additional_info = []
                        if item.get('location'):
                            additional_info.append(f"場所: {item['location']}")
                        if item.get('description'):
                            additional_info.append(f"説明: {item['description']}")
                        
                        rows.append([
                            'イベント',
                            item.get('title', ''),
                            item.get('date', ''),
                            '',
                            item.get('description', ''),
                            ' | '.join(additional_info)
                        ])
            
            # 重要なリンク
            if 'important_links' in structured_data and isinstance(structured_data['important_links'], list):
                for item in structured_data['important_links']:
                    if isinstance(item, dict):
                        rows.append([
                            '重要なリンク',
                            item.get('text', ''),
                            '',
                            item.get('url', ''),
                            '',
                            ''
                        ])
            
            # 連絡先情報
            if 'contact_info' in structured_data and isinstance(structured_data['contact_info'], dict):
                contact = structured_data['contact_info']
                contact_details = []
                if contact.get('phone'):
                    contact_details.append(f"電話: {contact['phone']}")
                if contact.get('email'):
                    contact_details.append(f"メール: {contact['email']}")
                if contact.get('address'):
                    contact_details.append(f"住所: {contact['address']}")
                
                if contact_details:
                    rows.append([
                        '連絡先',
                        '連絡先情報',
                        '',
                        '',
                        ' | '.join(contact_details),
                        ''
                    ])
            
            # CSVファイルに書き込み
            with open(file_path, 'w', encoding='utf-8', newline='') as f:
                writer = csv.writer(f)
                # ヘッダー行
                writer.writerow(['カテゴリ', 'タイトル', '日付', 'URL', '内容', 'その他'])
                # データ行
                writer.writerows(rows)
            
            logger.info(f"構造化データCSV保存完了: {len(rows)}件")
            
        except Exception as e:
            logger.error(f"構造化データCSV保存エラー: {e}")
            # エラー時は空のCSVファイルを作成
            with open(file_path, 'w', encoding='utf-8', newline='') as f:
                writer = csv.writer(f)
                writer.writerow(['カテゴリ', 'タイトル', '日付', 'URL', '内容', 'その他'])
                writer.writerow(['エラー', 'データ取得エラー', '', '', str(e), ''])
    
    def _generate_structured_table_html(self, website_data: WebsiteData) -> str:
        """構造化データのHTMLテーブルを生成"""
        if not website_data.structured_data:
            return "<p>構造化データがありません。</p>"
        
        table_html = """
        <style>
        .structured-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            border: 1px solid #ddd;
        }
        .structured-table th, .structured-table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        .structured-table th {
            background-color: #f2f2f2;
            font-weight: bold;
        }
        .structured-table tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        .url-cell {
            max-width: 200px;
            word-break: break-all;
        }
        </style>
        <table class="structured-table">
            <thead>
                <tr>
                    <th>カテゴリ</th>
                    <th>タイトル</th>
                    <th>日付</th>
                    <th>URL</th>
                    <th>内容</th>
                </tr>
            </thead>
            <tbody>
        """
        
        structured_data = website_data.structured_data
        
        # ニュース項目
        if 'news_items' in structured_data and isinstance(structured_data['news_items'], list):
            for item in structured_data['news_items']:
                if isinstance(item, dict):
                    url = item.get('url', '')
                    url_display = f'<a href="{url}" target="_blank">{url[:50]}...</a>' if url else ''
                    
                    table_html += f"""
                    <tr>
                        <td>ニュース</td>
                        <td>{self._escape_html(item.get('title', ''))}</td>
                        <td>{self._escape_html(item.get('date', ''))}</td>
                        <td class="url-cell">{url_display}</td>
                        <td>{self._escape_html(item.get('content', ''))}</td>
                    </tr>
                    """
        
        # イベント情報
        if 'events' in structured_data and isinstance(structured_data['events'], list):
            for item in structured_data['events']:
                if isinstance(item, dict):
                    additional_info = []
                    if item.get('location'):
                        additional_info.append(f"場所: {item['location']}")
                    if item.get('description'):
                        additional_info.append(f"説明: {item['description']}")
                    
                    table_html += f"""
                    <tr>
                        <td>イベント</td>
                        <td>{self._escape_html(item.get('title', ''))}</td>
                        <td>{self._escape_html(item.get('date', ''))}</td>
                        <td class="url-cell"></td>
                        <td>{self._escape_html(' | '.join(additional_info))}</td>
                    </tr>
                    """
        
        # 重要なリンク
        if 'important_links' in structured_data and isinstance(structured_data['important_links'], list):
            for item in structured_data['important_links']:
                if isinstance(item, dict):
                    url = item.get('url', '')
                    url_display = f'<a href="{url}" target="_blank">{url[:50]}...</a>' if url else ''
                    
                    table_html += f"""
                    <tr>
                        <td>重要なリンク</td>
                        <td>{self._escape_html(item.get('text', ''))}</td>
                        <td></td>
                        <td class="url-cell">{url_display}</td>
                        <td></td>
                    </tr>
                    """
        
        table_html += """
            </tbody>
        </table>
        """
        
        return table_html