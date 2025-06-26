"""
テキスト統合処理 - HTML、Markdown、OCR、構造化データを統合
"""

import re
import logging
from typing import Dict, Any, List
from bs4 import BeautifulSoup, Comment
from .data_models import WebsiteData

logger = logging.getLogger(__name__)


class TextProcessor:
    """テキストデータ統合処理クラス"""
    
    def __init__(self):
        """初期化"""
        pass
    
    def process_scraped_data(self, scraped_data: Dict[str, Any]) -> WebsiteData:
        """
        スクレーピングデータを処理してWebsiteDataに変換
        
        Args:
            scraped_data: スクレーピング結果
            
        Returns:
            統合されたWebsiteData
        """
        try:
            logger.info("テキスト統合処理開始")
            
            # 基本情報抽出
            url = scraped_data.get('url', '')
            title = self._extract_title(scraped_data)
            
            # 各データソースからテキスト抽出
            html_text = self._extract_text_from_html(scraped_data.get('html', ''))
            markdown_text = scraped_data.get('markdown', '')
            structured_text = self._extract_text_from_structured_data(scraped_data.get('structured_data', {}))
            ocr_text = self._extract_text_from_ocr_data(scraped_data.get('image_data', []))
            
            # テキスト統合
            combined_text = self._combine_texts(html_text, markdown_text, structured_text, ocr_text)
            
            # WebsiteDataオブジェクト作成
            website_data = WebsiteData(
                url=url,
                title=title,
                combined_text=combined_text,
                html_content=scraped_data.get('html'),
                markdown_content=markdown_text,
                structured_data=scraped_data.get('structured_data'),
                ocr_data=scraped_data.get('image_data', []),
                total_text_length=len(combined_text),
                html_length=len(html_text),
                markdown_length=len(markdown_text),
                ocr_text_length=len(ocr_text),
                image_count=len(scraped_data.get('image_data', []))
            )
            
            logger.info(f"テキスト統合処理完了: 統合テキスト長={len(combined_text)}")
            return website_data
            
        except Exception as e:
            logger.error(f"テキスト統合処理エラー: {e}")
            raise
    
    def _extract_title(self, scraped_data: Dict[str, Any]) -> str:
        """タイトル抽出"""
        # 構造化データから取得
        structured_data = scraped_data.get('structured_data', {})
        if isinstance(structured_data, dict) and 'title' in structured_data:
            return structured_data['title']
        
        # HTMLから取得
        html = scraped_data.get('html', '')
        if html:
            soup = BeautifulSoup(html, 'html.parser')
            title_tag = soup.find('title')
            if title_tag:
                return title_tag.get_text().strip()
        
        # メタデータから取得
        metadata = scraped_data.get('metadata', {})
        if isinstance(metadata, dict) and 'title' in metadata:
            return metadata['title']
        
        return "無題"
    
    def _extract_text_from_html(self, html: str) -> str:
        """HTMLからテキスト抽出"""
        if not html:
            return ""
        
        try:
            soup = BeautifulSoup(html, 'html.parser')
            
            # 不要な要素を削除
            for element in soup(['script', 'style', 'nav', 'header', 'footer']):
                element.decompose()
            
            # コメント削除
            for comment in soup.find_all(string=lambda text: isinstance(text, Comment)):
                comment.extract()
            
            # テキスト抽出
            text = soup.get_text()
            
            # テキスト整形
            lines = [line.strip() for line in text.splitlines()]
            lines = [line for line in lines if line]  # 空行削除
            
            return '\n'.join(lines)
            
        except Exception as e:
            logger.warning(f"HTML解析エラー: {e}")
            return html
    
    def _extract_text_from_structured_data(self, structured_data: Dict[str, Any]) -> str:
        """構造化データからテキスト抽出"""
        if not structured_data:
            return ""
        
        texts = []
        
        try:
            # 基本情報
            if 'main_content' in structured_data:
                texts.append(f"メインコンテンツ:\n{structured_data['main_content']}")
            
            # ニュース項目
            if 'news_items' in structured_data and isinstance(structured_data['news_items'], list):
                news_texts = []
                for item in structured_data['news_items']:
                    if isinstance(item, dict):
                        news_text = f"タイトル: {item.get('title', '')}"
                        if item.get('date'):
                            news_text += f"\n日付: {item['date']}"
                        if item.get('content'):
                            news_text += f"\n内容: {item['content']}"
                        news_texts.append(news_text)
                
                if news_texts:
                    texts.append(f"ニュース・お知らせ:\n" + '\n\n'.join(news_texts))
            
            # イベント情報
            if 'events' in structured_data and isinstance(structured_data['events'], list):
                event_texts = []
                for item in structured_data['events']:
                    if isinstance(item, dict):
                        event_text = f"イベント: {item.get('title', '')}"
                        if item.get('date'):
                            event_text += f"\n日付: {item['date']}"
                        if item.get('location'):
                            event_text += f"\n場所: {item['location']}"
                        if item.get('description'):
                            event_text += f"\n説明: {item['description']}"
                        event_texts.append(event_text)
                
                if event_texts:
                    texts.append(f"イベント情報:\n" + '\n\n'.join(event_texts))
            
            # 連絡先情報
            if 'contact_info' in structured_data and isinstance(structured_data['contact_info'], dict):
                contact = structured_data['contact_info']
                contact_text = "連絡先情報:"
                if contact.get('phone'):
                    contact_text += f"\n電話: {contact['phone']}"
                if contact.get('email'):
                    contact_text += f"\nメール: {contact['email']}"
                if contact.get('address'):
                    contact_text += f"\n住所: {contact['address']}"
                
                if len(contact_text) > len("連絡先情報:"):
                    texts.append(contact_text)
            
            # 重要なリンク
            if 'important_links' in structured_data and isinstance(structured_data['important_links'], list):
                link_texts = []
                for item in structured_data['important_links']:
                    if isinstance(item, dict) and item.get('text'):
                        link_text = f"リンク: {item['text']}"
                        if item.get('url'):
                            link_text += f" ({item['url']})"
                        link_texts.append(link_text)
                
                if link_texts:
                    texts.append(f"重要なリンク:\n" + '\n'.join(link_texts))
            
            return '\n\n'.join(texts)
            
        except Exception as e:
            logger.warning(f"構造化データ処理エラー: {e}")
            return str(structured_data)
    
    def _extract_text_from_ocr_data(self, ocr_data: List[Dict[str, Any]]) -> str:
        """OCRデータからテキスト抽出"""
        if not ocr_data:
            return ""
        
        ocr_texts = []
        
        try:
            for item in ocr_data:
                if isinstance(item, dict) and item.get('extracted_text'):
                    image_url = item.get('url', 'unknown')
                    confidence = item.get('ocr_confidence', 0)
                    text = item['extracted_text']
                    
                    ocr_text = f"画像OCR結果 ({image_url}) [信頼度: {confidence:.2f}]:\n{text}"
                    ocr_texts.append(ocr_text)
            
            if ocr_texts:
                return "画像から抽出されたテキスト:\n\n" + '\n\n'.join(ocr_texts)
            
            return ""
            
        except Exception as e:
            logger.warning(f"OCRデータ処理エラー: {e}")
            return ""
    
    def _combine_texts(self, html_text: str, markdown_text: str, structured_text: str, ocr_text: str) -> str:
        """テキストデータを統合（純粋なコンテンツのみ）"""
        sections = []
        
        # Markdownテキスト（最も構造化されている）を優先
        if markdown_text:
            sections.append(f"=== Webページコンテンツ ===\n{markdown_text}")
        elif html_text:
            # Markdownが無い場合のみHTMLを使用
            sections.append(f"=== Webページコンテンツ ===\n{html_text}")
        
        # 構造化データは別ファイルに保存するため、ここには含めない
        
        # OCRテキスト
        if ocr_text:
            sections.append(f"=== {ocr_text}")
        
        combined = '\n\n'.join(sections)
        
        # テキスト整形
        combined = re.sub(r'\n{3,}', '\n\n', combined)  # 過度な改行を削減
        combined = combined.strip()
        
        return combined
    
    def _extract_additional_structured_info(self, structured_text: str, markdown_text: str) -> str:
        """構造化データから重複しない追加情報を抽出"""
        if not structured_text or not markdown_text:
            return structured_text
        
        # 構造化データのセクションを分割
        sections = structured_text.split('\n\n')
        additional_sections = []
        
        for section in sections:
            section = section.strip()
            if not section:
                continue
                
            # セクションの最初の行をチェック
            first_line = section.split('\n')[0]
            
            # 連絡先情報や重要なリンクなど、Markdownに含まれにくい情報を保持
            if any(keyword in first_line for keyword in ['連絡先情報', '重要なリンク', 'イベント情報']):
                # Markdownに同様の内容が含まれていないかチェック
                section_keywords = self._extract_keywords_from_section(section)
                if not self._has_similar_content(markdown_text, section_keywords):
                    additional_sections.append(section)
            # メインコンテンツやニュースは通常Markdownに含まれるのでスキップ
            elif not any(keyword in first_line for keyword in ['メインコンテンツ', 'ニュース・お知らせ']):
                additional_sections.append(section)
        
        return '\n\n'.join(additional_sections)
    
    def _extract_keywords_from_section(self, section: str) -> list:
        """セクションからキーワードを抽出"""
        # 電話番号、メールアドレス、URLなどの特徴的な情報を抽出
        import re
        keywords = []
        
        # 電話番号パターン
        phone_pattern = r'(\d{2,4}-\d{2,4}-\d{4}|\d{10,11})'
        phones = re.findall(phone_pattern, section)
        keywords.extend(phones)
        
        # メールアドレス
        email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
        emails = re.findall(email_pattern, section)
        keywords.extend(emails)
        
        # URL
        url_pattern = r'https?://[^\s\)]+|www\.[^\s\)]+'
        urls = re.findall(url_pattern, section)
        keywords.extend(urls)
        
        return keywords
    
    def _has_similar_content(self, markdown_text: str, keywords: list) -> bool:
        """Markdownに類似の内容が含まれているかチェック"""
        if not keywords:
            return False
        
        # キーワードの50%以上がMarkdownに含まれている場合は重複とみなす
        found_count = 0
        for keyword in keywords:
            if keyword in markdown_text:
                found_count += 1
        
        return found_count / len(keywords) > 0.5