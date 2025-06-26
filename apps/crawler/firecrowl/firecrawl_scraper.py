#!/usr/bin/env python3
"""
Firecrawlスクレーパーメインクラス
"""

import os
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
from pydantic import BaseModel

from firecrawl import FirecrawlApp
from schemas import ComprehensivePageData
from image_processor import ImageProcessor

logger = logging.getLogger(__name__)


class FirecrawlScraper:
    """Firecrawlを使用したスクレーパークラス"""
    
    def __init__(self, 
                 api_key: Optional[str] = None,
                 enable_image_ocr: bool = False,
                 image_save_dir: str = "downloaded_images",
                 s3_bucket: Optional[str] = None,
                 debug_ocr: bool = False):
        """
        初期化
        
        Args:
            api_key: FirecrawlのAPIキー（環境変数FIRECRAWL_API_KEYからも取得可能）
            enable_image_ocr: 画像OCR機能を有効にするか
            image_save_dir: 画像保存ディレクトリ
            s3_bucket: S3バケット名
            debug_ocr: OCRデバッグ情報を表示するか
        """
        self.api_key = api_key or os.getenv('FIRECRAWL_API_KEY')
        if not self.api_key:
            raise ValueError("FirecrawlのAPIキーが設定されていません。環境変数FIRECRAWL_API_KEYまたは引数で指定してください。")
        
        self.app = FirecrawlApp(api_key=self.api_key)
        logger.info("Firecrawlクライアントを初期化しました")
        
        # 画像OCRプロセッサー初期化
        self.enable_image_ocr = enable_image_ocr
        self.image_processor = None
        if enable_image_ocr:
            self.image_processor = ImageProcessor(
                ocr_enabled=True,
                save_images=True,
                image_dir=image_save_dir,
                s3_bucket=s3_bucket,
                vertical_text=True,
                debug_ocr=debug_ocr
            )
            logger.info("画像OCR機能を有効にしました")
    
    def scrape_to_markdown(self, url: str) -> Dict[str, Any]:
        """
        URLをスクレーピングしてMarkdownとメタデータを取得
        
        Args:
            url: スクレーピング対象のURL
            
        Returns:
            スクレーピング結果（markdown, metadata含む）
        """
        try:
            logger.info(f"スクレーピング開始: {url}")
            
            # Firecrawlの基本的なスクレーピング実行
            result = self.app.scrape_url(
                url=url,
                formats=['markdown', 'html']
            )
            
            logger.info(f"スクレーピング完了: {len(result.markdown or '')} 文字")
            return result.model_dump()
            
        except Exception as e:
            logger.error(f"スクレーピングエラー: {e}")
            raise
    
    def extract_comprehensive_data(self, url: str, _custom_schema: Optional[BaseModel] = None) -> Dict[str, Any]:
        """
        URLから全フォーマットのデータを包括的に抽出（段階的処理）
        
        Args:
            url: スクレーピング対象のURL
            _custom_schema: カスタムデータスキーマ（Pydanticモデル）
            
        Returns:
            全フォーマットのデータと構造化データ
        """
        try:
            logger.info(f"包括的データ抽出開始: {url}")
            
            # まず基本的な情報を取得
            basic_result = self.app.scrape_url(
                url=url,
                formats=['markdown', 'html']
            )
            
            # 簡略化されたスキーマで構造化データを抽出
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
                                "category": {"type": "string"}
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
            
            extract_result = self.app.scrape_url(
                url=url,
                formats=['extract'],
                extract={
                    'schema': simplified_schema,
                    'systemPrompt': 'ページから主要な情報を抽出してください。ニュース、イベント、連絡先、重要なリンクを含めてください。'
                }
            )
            
            # 結果を統合
            final_result = {
                'raw_data': {
                    'markdown': basic_result.markdown if hasattr(basic_result, 'markdown') else None,
                    'html': basic_result.html if hasattr(basic_result, 'html') else None,
                    'metadata': basic_result.metadata if hasattr(basic_result, 'metadata') else None
                },
                'structured_data': extract_result.extract if hasattr(extract_result, 'extract') else {},
                'image_data': []
            }
            
            # 画像OCR処理
            if self.enable_image_ocr and self.image_processor and final_result['raw_data']['html']:
                try:
                    logger.info("画像OCR処理を開始します")
                    processed_images = self.image_processor.process_images_from_page(
                        final_result['raw_data']['html'], url
                    )
                    final_result['image_data'] = [img.model_dump() for img in processed_images]
                    
                    # OCRテキストを構造化データに統合
                    if final_result['structured_data'] and processed_images:
                        ocr_texts = []
                        for img in processed_images:
                            if img.extracted_text:
                                ocr_texts.append({
                                    'image_url': img.url,
                                    'extracted_text': img.extracted_text,
                                    'confidence': img.ocr_confidence
                                })
                        
                        if ocr_texts:
                            final_result['structured_data']['extracted_text_from_images'] = ocr_texts
                            
                            # 全OCRテキストを結合
                            all_ocr_text = '\n\n'.join([item['extracted_text'] for item in ocr_texts])
                            final_result['structured_data']['combined_ocr_text'] = all_ocr_text
                    
                    logger.info(f"画像OCR処理完了: {len(processed_images)}件の画像を処理")
                except Exception as e:
                    logger.error(f"画像OCR処理エラー: {e}")
            
            # メタデータを構造化データに追加
            if final_result['structured_data']:
                final_result['structured_data']['url'] = url
                final_result['structured_data']['scraped_at'] = datetime.now().isoformat()
                if final_result['raw_data']['markdown']:
                    final_result['structured_data']['markdown_length'] = len(final_result['raw_data']['markdown'])
                if final_result['raw_data']['html']:
                    final_result['structured_data']['raw_html_length'] = len(final_result['raw_data']['html'])
                if final_result['image_data']:
                    final_result['structured_data']['total_images_processed'] = len(final_result['image_data'])
            
            logger.info(f"包括的データ抽出完了: {len(final_result['structured_data'])} 項目")
            return final_result
            
        except Exception as e:
            logger.error(f"包括的データ抽出エラー: {e}")
            raise
    
    def extract_structured_data(self, url: str, custom_schema: Optional[BaseModel] = None) -> Dict[str, Any]:
        """
        後方互換性のためのメソッド（新しいextract_comprehensive_dataを使用）
        """
        result = self.extract_comprehensive_data(url, custom_schema)
        return result.get('structured_data', {})
    
    def batch_scrape(self, urls: List[str], output_file: str = "scraped_data.json") -> List[Dict[str, Any]]:
        """
        複数URLの一括スクレーピング
        
        Args:
            urls: スクレーピング対象のURL一覧
            output_file: 出力JSONファイル名
            
        Returns:
            全URLのスクレーピング結果一覧
        """
        results = []
        
        for i, url in enumerate(urls, 1):
            try:
                logger.info(f"進行状況: {i}/{len(urls)} - {url}")
                
                # 包括的データ抽出実行
                comprehensive_data = self.extract_comprehensive_data(url)
                data = comprehensive_data.get('structured_data', {})
                data['source_url'] = url
                data['scrape_status'] = 'success'
                
                results.append(data)
                
                # 中間保存（大量データ処理時の安全策）
                if i % 10 == 0:
                    self._save_intermediate_results(results, f"temp_{output_file}")
                    
            except Exception as e:
                logger.error(f"URL {url} の処理失敗: {e}")
                results.append({
                    'source_url': url,
                    'scrape_status': 'failed',
                    'error': str(e),
                    'scraped_at': datetime.now().isoformat()
                })
        
        # 最終結果保存
        self._save_results(results, output_file)
        logger.info(f"一括スクレーピング完了: {len(results)}件処理, 出力: {output_file}")
        
        return results
    
    def _save_intermediate_results(self, data: List[Dict], filename: str):
        """中間結果の保存"""
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        logger.info(f"中間結果保存: {filename}")
    
    def _save_results(self, data: List[Dict], filename: str):
        """最終結果の保存"""
        # メタデータ追加
        output = {
            'scraping_metadata': {
                'total_urls': len(data),
                'successful_scrapes': len([d for d in data if d.get('scrape_status') == 'success']),
                'failed_scrapes': len([d for d in data if d.get('scrape_status') == 'failed']),
                'generated_at': datetime.now().isoformat(),
                'firecrawl_version': '0.0.x'  # 実際のバージョンに更新
            },
            'data': data
        }
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(output, f, ensure_ascii=False, indent=2)