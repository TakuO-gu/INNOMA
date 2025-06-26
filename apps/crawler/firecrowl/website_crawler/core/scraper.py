"""
Webスクレーパー - Firecrawlを使用したウェブページ取得
"""

import os
import logging
from typing import Dict, Any, Optional
from firecrawl import FirecrawlApp
from .ocr import ImageProcessor

logger = logging.getLogger(__name__)


class WebScraper:
    """ウェブページの基本データ取得クラス"""
    
    def __init__(self, 
                 api_key: Optional[str] = None,
                 enable_image_ocr: bool = True,
                 image_save_dir: str = "downloaded_images"):
        """
        初期化
        
        Args:
            api_key: FirecrawlのAPIキー
            enable_image_ocr: 画像OCR機能を有効にするか
            image_save_dir: 画像保存ディレクトリ
        """
        self.api_key = api_key or os.getenv('FIRECRAWL_API_KEY')
        if not self.api_key:
            raise ValueError("FirecrawlのAPIキーが設定されていません。")
        
        self.app = FirecrawlApp(api_key=self.api_key)
        self.enable_image_ocr = enable_image_ocr
        
        # 画像OCRプロセッサー初期化
        self.image_processor = None
        if enable_image_ocr:
            self.image_processor = ImageProcessor(
                ocr_enabled=True,
                save_images=True,
                image_dir=image_save_dir,
                vertical_text=True
            )
            logger.info("画像OCR機能を有効にしました")
    
    def scrape_page(self, url: str) -> Dict[str, Any]:
        """
        ページをスクレーピングして基本データを取得
        
        Args:
            url: 対象URL
            
        Returns:
            スクレーピング結果
        """
        try:
            logger.info(f"ページスクレーピング開始: {url}")
            
            # 基本データ取得
            basic_result = self.app.scrape_url(
                url=url,
                formats=['markdown', 'html']
            )
            
            # 構造化データ取得
            structured_result = self._extract_structured_data(url)
            
            # 結果統合
            result = {
                'url': url,
                'html': basic_result.html if hasattr(basic_result, 'html') else None,
                'markdown': basic_result.markdown if hasattr(basic_result, 'markdown') else None,
                'metadata': basic_result.metadata if hasattr(basic_result, 'metadata') else None,
                'structured_data': structured_result.extract if hasattr(structured_result, 'extract') else {},
                'image_data': []
            }
            
            # 画像OCR処理
            if self.enable_image_ocr and self.image_processor and result['html']:
                try:
                    logger.info("画像OCR処理開始")
                    processed_images = self.image_processor.process_images_from_page(
                        result['html'], url
                    )
                    result['image_data'] = [img.model_dump() for img in processed_images]
                    logger.info(f"画像OCR処理完了: {len(processed_images)}件")
                    
                    # 画像が検出されない場合の詳細ログ
                    if len(processed_images) == 0:
                        logger.warning("画像が検出されませんでした。HTMLを確認します...")
                        logger.debug(f"HTML内容（最初の500文字）: {result['html'][:500]}")
                        
                except Exception as e:
                    logger.error(f"画像OCR処理エラー: {e}")
                    import traceback
                    logger.debug(f"詳細エラー: {traceback.format_exc()}")
            
            logger.info(f"ページスクレーピング完了: {url}")
            return result
            
        except Exception as e:
            logger.error(f"ページスクレーピングエラー: {e}")
            raise
    
    def _extract_structured_data(self, url: str) -> Any:
        """構造化データ抽出"""
        simplified_schema = {
            "type": "object",
            "properties": {
                "title": {"type": "string", "description": "ページタイトル"},
                "organization_name": {"type": "string", "description": "組織名"},
                "main_content": {"type": "string", "description": "メインコンテンツ"},
                "news_items": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "title": {"type": "string"},
                            "date": {"type": "string"},
                            "url": {"type": "string"},
                            "content": {"type": "string"}
                        }
                    }
                },
                "events": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "title": {"type": "string"},
                            "date": {"type": "string"},
                            "location": {"type": "string"},
                            "description": {"type": "string"}
                        }
                    }
                },
                "contact_info": {
                    "type": "object",
                    "properties": {
                        "phone": {"type": "string"},
                        "email": {"type": "string"},
                        "address": {"type": "string"}
                    }
                },
                "important_links": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "text": {"type": "string"},
                            "url": {"type": "string"}
                        }
                    }
                }
            }
        }
        
        return self.app.scrape_url(
            url=url,
            formats=['extract'],
            extract={
                'schema': simplified_schema,
                'systemPrompt': 'ページから主要な情報を抽出してください。ニュース、イベント、連絡先、重要なリンクを含めてください。'
            }
        )