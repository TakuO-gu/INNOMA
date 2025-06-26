#!/usr/bin/env python3
"""
Firecrawl を使用したウェブページスクレーピング & JSON変換サンプル
自治体サイト向けの構造化データ抽出 + 画像OCR機能を統合

機能:
1. Firecrawlによる基本的なスクレーピング（markdown, html, extract）
2. 画像の自動取得（img src, background-image）
3. PaddleOCRによる画像内テキスト抽出（縦書き対応）
4. OCRテキストの構造化データへの統合
5. ローカル/S3への画像保存

必要な依存関係:
- firecrawl-py
- paddleocr
- Pillow
- boto3 (S3使用時)

使用例:
    # 基本的な使用
    scraper = FirecrawlScraper()
    
    # 画像OCR有効
    scraper = FirecrawlScraper(
        enable_image_ocr=True,
        image_save_dir="images",
        s3_bucket="my-bucket"  # オプション
    )
"""

import os
import json
import re
import hashlib
from datetime import datetime
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field
from firecrawl import FirecrawlApp
from dotenv import load_dotenv
import logging
import requests
from urllib.parse import urljoin, urlparse
from pathlib import Path
from io import BytesIO
try:
    from PIL import Image
except ImportError:
    Image = None
try:
    from paddleocr import PaddleOCR
except ImportError:
    PaddleOCR = None
try:
    import boto3
except ImportError:
    boto3 = None

# 環境変数の読み込み
load_dotenv()

# ログ設定
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# データスキーマ定義（Pydantic使用）
class LinkInfo(BaseModel):
    """リンク情報スキーマ"""
    text: str = Field(..., description="リンクテキスト")
    url: str = Field(..., description="リンクURL")
    description: Optional[str] = Field(None, description="リンクの説明")

class ContactInfo(BaseModel):
    """連絡先情報スキーマ"""
    phone: Optional[str] = Field(None, description="電話番号")
    email: Optional[str] = Field(None, description="メールアドレス")
    address: Optional[str] = Field(None, description="住所")
    hours: Optional[str] = Field(None, description="受付時間")
    fax: Optional[str] = Field(None, description="FAX番号")
    department: Optional[str] = Field(None, description="担当部署")
    postal_code: Optional[str] = Field(None, description="郵便番号")

class SocialMediaInfo(BaseModel):
    """SNS情報スキーマ"""
    platform: str = Field(..., description="プラットフォーム名")
    url: str = Field(..., description="SNS URL")
    handle: Optional[str] = Field(None, description="アカウント名")

class EventInfo(BaseModel):
    """イベント情報スキーマ"""
    title: str = Field(..., description="イベント名")
    date: Optional[str] = Field(None, description="開催日")
    end_date: Optional[str] = Field(None, description="終了日")
    time: Optional[str] = Field(None, description="開催時間")
    location: Optional[str] = Field(None, description="開催場所")
    description: Optional[str] = Field(None, description="説明")
    registration_required: Optional[bool] = Field(None, description="申込必要")
    registration_deadline: Optional[str] = Field(None, description="申込締切")
    fee: Optional[str] = Field(None, description="参加費")
    capacity: Optional[str] = Field(None, description="定員")
    target_audience: Optional[str] = Field(None, description="対象者")
    organizer: Optional[str] = Field(None, description="主催者")
    contact: Optional[str] = Field(None, description="問い合わせ先")
    url: Optional[str] = Field(None, description="詳細URL")

class NewsItem(BaseModel):
    """ニュース項目スキーマ"""
    title: str = Field(..., description="ニュースタイトル")
    date: Optional[str] = Field(None, description="投稿日")
    category: Optional[str] = Field(None, description="カテゴリ")
    summary: Optional[str] = Field(None, description="要約")
    content: Optional[str] = Field(None, description="本文")
    author: Optional[str] = Field(None, description="投稿者")
    tags: List[str] = Field(default=[], description="タグ一覧")
    url: Optional[str] = Field(None, description="詳細URL")
    importance: Optional[str] = Field(None, description="重要度（高・中・低）")

class ProcedureInfo(BaseModel):
    """手続き情報スキーマ"""
    title: str = Field(..., description="手続き名")
    description: Optional[str] = Field(None, description="手続きの説明")
    required_documents: List[str] = Field(default=[], description="必要書類")
    fee: Optional[str] = Field(None, description="手数料")
    processing_time: Optional[str] = Field(None, description="処理期間")
    office_hours: Optional[str] = Field(None, description="受付時間")
    location: Optional[str] = Field(None, description="窓口")
    online_available: Optional[bool] = Field(None, description="オンライン対応可能")
    url: Optional[str] = Field(None, description="詳細URL")

class ServiceInfo(BaseModel):
    """サービス情報スキーマ"""
    name: str = Field(..., description="サービス名")
    description: Optional[str] = Field(None, description="サービス説明")
    category: Optional[str] = Field(None, description="カテゴリ")
    target: Optional[str] = Field(None, description="対象者")
    url: Optional[str] = Field(None, description="詳細URL")

class NavigationMenu(BaseModel):
    """ナビゲーションメニュー情報"""
    title: str = Field(..., description="メニュータイトル")
    url: Optional[str] = Field(None, description="メニューURL")
    children: List['NavigationMenu'] = Field(default=[], description="サブメニュー")

class MediaInfo(BaseModel):
    """メディア情報スキーマ"""
    type: str = Field(..., description="メディアタイプ（image, video, audio, document）")
    url: str = Field(..., description="メディアURL")
    alt_text: Optional[str] = Field(None, description="代替テキスト")
    caption: Optional[str] = Field(None, description="キャプション")
    description: Optional[str] = Field(None, description="説明")
    extracted_text: Optional[str] = Field(None, description="OCRで抽出したテキスト")
    ocr_confidence: Optional[float] = Field(None, description="OCRの信頼度")
    local_path: Optional[str] = Field(None, description="ローカル保存パス")
    file_size: Optional[int] = Field(None, description="ファイルサイズ（バイト）")

class ComprehensivePageData(BaseModel):
    """包括的なページデータスキーマ"""
    # 基本情報
    title: str = Field(..., description="ページタイトル")
    url: str = Field(..., description="ページURL")
    description: Optional[str] = Field(None, description="ページ説明・概要")
    keywords: List[str] = Field(default=[], description="キーワード・タグ")
    language: Optional[str] = Field(None, description="言語")
    
    # 組織・サイト情報
    organization_name: Optional[str] = Field(None, description="組織名")
    site_type: Optional[str] = Field(None, description="サイト種別")
    page_type: Optional[str] = Field(None, description="ページ種別")
    
    # 日付情報
    published_date: Optional[str] = Field(None, description="公開日")
    last_updated: Optional[str] = Field(None, description="最終更新日")
    
    # コンテンツ情報
    main_content: Optional[str] = Field(None, description="メインコンテンツ")
    headings: List[str] = Field(default=[], description="見出し一覧")
    
    # ニュース・お知らせ
    news_items: List[NewsItem] = Field(default=[], description="ニュース・お知らせ一覧")
    
    # イベント情報
    events: List[EventInfo] = Field(default=[], description="イベント一覧")
    
    # 手続き・サービス
    procedures: List[ProcedureInfo] = Field(default=[], description="手続き一覧")
    services: List[ServiceInfo] = Field(default=[], description="サービス一覧")
    
    # 連絡先・アクセス
    contact_info: Optional[ContactInfo] = Field(None, description="連絡先情報")
    social_media: List[SocialMediaInfo] = Field(default=[], description="SNS情報")
    
    # リンク・ナビゲーション
    navigation_menu: List[NavigationMenu] = Field(default=[], description="ナビゲーションメニュー")
    important_links: List[LinkInfo] = Field(default=[], description="重要なリンク")
    external_links: List[LinkInfo] = Field(default=[], description="外部リンク")
    
    # メディア
    images: List[MediaInfo] = Field(default=[], description="画像一覧")
    documents: List[MediaInfo] = Field(default=[], description="文書・PDF一覧")
    videos: List[MediaInfo] = Field(default=[], description="動画一覧")
    
    # 緊急・重要情報
    emergency_info: Optional[str] = Field(None, description="緊急情報")
    important_notices: List[str] = Field(default=[], description="重要なお知らせ")
    
    # フッター・その他
    footer_info: Optional[str] = Field(None, description="フッター情報")
    copyright: Optional[str] = Field(None, description="著作権情報")
    privacy_policy_url: Optional[str] = Field(None, description="プライバシーポリシーURL")
    
    # メタデータ
    scraped_at: str = Field(default_factory=lambda: datetime.now().isoformat(), description="スクレーピング実行日時")
    raw_html_length: Optional[int] = Field(None, description="生HTMLの文字数")
    markdown_length: Optional[int] = Field(None, description="Markdownの文字数")
    
class ImageProcessor:
    """画像OCR処理クラス"""
    
    def __init__(self, 
                 ocr_enabled: bool = True,
                 save_images: bool = True,
                 image_dir: str = "downloaded_images",
                 s3_bucket: Optional[str] = None,
                 vertical_text: bool = True):
        """
        初期化
        
        Args:
            ocr_enabled: OCR機能を有効にするか
            save_images: 画像を保存するか
            image_dir: ローカル保存ディレクトリ
            s3_bucket: S3バケット名
            vertical_text: 縦書きテキストを有効にするか
        """
        self.ocr_enabled = ocr_enabled
        self.save_images = save_images
        self.image_dir = Path(image_dir)
        self.s3_bucket = s3_bucket
        self.vertical_text = vertical_text
        
        # ディレクトリ作成
        if self.save_images:
            self.image_dir.mkdir(exist_ok=True)
        
        # OCR初期化
        self.ocr = None
        if self.ocr_enabled and PaddleOCR:
            try:
                # 縦書きサポートを含むOCR設定
                self.ocr = PaddleOCR(
                    use_angle_cls=True,  # 角度調整
                    lang='japan',  # 日本語
                    use_gpu=False,  # GPU使用（環境に応じて調整）
                    show_log=False
                )
                logger.info("PaddleOCRを初期化しました")
            except Exception as e:
                logger.warning(f"PaddleOCRの初期化に失敗: {e}")
                self.ocr_enabled = False
        elif self.ocr_enabled:
            logger.warning("PaddleOCRがインストールされていません")
            self.ocr_enabled = False
        
        # S3初期化
        self.s3_client = None
        if self.s3_bucket and boto3:
            try:
                self.s3_client = boto3.client('s3')
                logger.info(f"S3クライアントを初期化しました: {self.s3_bucket}")
            except Exception as e:
                logger.warning(f"S3クライアントの初期化に失敗: {e}")
                self.s3_client = None
    
    def extract_images_from_html(self, html_content: str, base_url: str) -> List[str]:
        """
        HTMLから画像URLを抽出
        
        Args:
            html_content: HTMLコンテンツ
            base_url: ベースURL
            
        Returns:
            画像URLのリスト
        """
        image_urls = set()
        
        # imgタグのsrcを抽出
        img_pattern = r'<img[^>]+src=["\']([^"\'>]+)["\'][^>]*>'
        for match in re.finditer(img_pattern, html_content, re.IGNORECASE):
            src = match.group(1)
            full_url = urljoin(base_url, src)
            if self._is_valid_image_url(full_url):
                image_urls.add(full_url)
        
        # background-image: url(...)を抽出
        bg_image_pattern = r'background-image\s*:\s*url\(["\']?([^"\')]+)["\']?\)'
        for match in re.finditer(bg_image_pattern, html_content, re.IGNORECASE):
            src = match.group(1)
            full_url = urljoin(base_url, src)
            if self._is_valid_image_url(full_url):
                image_urls.add(full_url)
        
        # background: url(...)を抽出（background-imageの省略形）
        bg_pattern = r'background\s*:\s*[^;]*?url\(["\']?([^"\')]+)["\']?\)'
        for match in re.finditer(bg_pattern, html_content, re.IGNORECASE):
            src = match.group(1)
            full_url = urljoin(base_url, src)
            if self._is_valid_image_url(full_url):
                image_urls.add(full_url)
        
        # styleAttribute内のbackgroundも抽出
        style_attr_pattern = r'style=["\']([^"\']*)["\']'
        for style_match in re.finditer(style_attr_pattern, html_content, re.IGNORECASE):
            style_content = style_match.group(1)
            
            # style属性内のbackground-image
            for bg_match in re.finditer(r'background-image\s*:\s*url\(["\']?([^"\')]+)["\']?\)', style_content, re.IGNORECASE):
                src = bg_match.group(1)
                full_url = urljoin(base_url, src)
                if self._is_valid_image_url(full_url):
                    image_urls.add(full_url)
            
            # style属性内のbackground
            for bg_match in re.finditer(r'background\s*:\s*[^;]*?url\(["\']?([^"\')]+)["\']?\)', style_content, re.IGNORECASE):
                src = bg_match.group(1)
                full_url = urljoin(base_url, src)
                if self._is_valid_image_url(full_url):
                    image_urls.add(full_url)
        
        # CSS内の@importやその他のurl()も抽出
        css_url_pattern = r'url\(["\']?([^"\')]+\.(jpg|jpeg|png|gif|bmp|webp|svg))["\']?\)'
        for match in re.finditer(css_url_pattern, html_content, re.IGNORECASE):
            src = match.group(1)
            full_url = urljoin(base_url, src)
            if self._is_valid_image_url(full_url):
                image_urls.add(full_url)
        
        return list(image_urls)
    
    def _is_valid_image_url(self, url: str) -> bool:
        """有効な画像URLか判定"""
        if not url or url.startswith('data:'):
            return False
        
        image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'}
        parsed = urlparse(url)
        path = parsed.path.lower()
        
        return any(path.endswith(ext) for ext in image_extensions)
    
    def download_and_process_image(self, image_url: str, _base_url: str) -> Optional[MediaInfo]:
        """
        画像をダウンロードしてOCR処理
        
        Args:
            image_url: 画像URL
            base_url: ベースURL
            
        Returns:
            MediaInfoオブジェクト
        """
        try:
            # 画像ダウンロード
            response = requests.get(image_url, timeout=30, stream=True)
            response.raise_for_status()
            
            # ファイル名生成
            url_hash = hashlib.md5(image_url.encode()).hexdigest()[:8]
            parsed_url = urlparse(image_url)
            file_ext = Path(parsed_url.path).suffix or '.jpg'
            filename = f"{url_hash}{file_ext}"
            
            # ファイルサイズ取得
            content = response.content
            file_size = len(content)
            
            local_path = None
            extracted_text = None
            ocr_confidence = None
            
            # ローカル保存
            if self.save_images:
                local_path = str(self.image_dir / filename)
                with open(local_path, 'wb') as f:
                    f.write(content)
                logger.debug(f"画像を保存しました: {local_path}")
            
            # S3アップロード
            if self.s3_client:
                try:
                    s3_key = f"images/{filename}"
                    self.s3_client.put_object(
                        Bucket=self.s3_bucket,
                        Key=s3_key,
                        Body=content,
                        ContentType=response.headers.get('content-type', 'image/jpeg')
                    )
                    logger.debug(f"S3にアップロードしました: {s3_key}")
                except Exception as e:
                    logger.warning(f"S3アップロードに失敗: {e}")
            
            # OCR処理
            if self.ocr_enabled and self.ocr:
                try:
                    # メモリ上で画像を処理
                    if Image:
                        img = Image.open(BytesIO(content))
                        # RGBに変換（RGBAやPモードの場合）
                        if img.mode in ('RGBA', 'P'):
                            img = img.convert('RGB')
                    
                    # OCR実行
                    ocr_result = self.ocr.ocr(BytesIO(content))
                    
                    if ocr_result and ocr_result[0]:
                        texts = []
                        confidences = []
                        
                        for line in ocr_result[0]:
                            if line and len(line) >= 2:
                                text = line[1][0] if line[1] else ''
                                confidence = line[1][1] if line[1] and len(line[1]) > 1 else 0.0
                                
                                if text.strip():
                                    texts.append(text.strip())
                                    confidences.append(confidence)
                        
                        if texts:
                            extracted_text = '\n'.join(texts)
                            ocr_confidence = sum(confidences) / len(confidences) if confidences else 0.0
                            logger.debug(f"OCR抽出成功: {len(texts)}行, 信頼度: {ocr_confidence:.2f}")
                        
                except Exception as e:
                    logger.warning(f"OCR処理に失敗: {e}")
            
            # MediaInfoオブジェクト作成
            return MediaInfo(
                type="image",
                url=image_url,
                extracted_text=extracted_text,
                ocr_confidence=ocr_confidence,
                local_path=local_path,
                file_size=file_size
            )
            
        except Exception as e:
            logger.error(f"画像処理エラー {image_url}: {e}")
            return None
    
    def process_images_from_page(self, html_content: str, base_url: str) -> List[MediaInfo]:
        """
        ページからすべての画像を処理
        
        Args:
            html_content: HTMLコンテンツ
            base_url: ベースURL
            
        Returns:
            MediaInfoオブジェクトのリスト
        """
        image_urls = self.extract_images_from_html(html_content, base_url)
        processed_images = []
        
        logger.info(f"{len(image_urls)}個の画像を発見しました")
        
        for i, image_url in enumerate(image_urls, 1):
            logger.info(f"画像処理中: {i}/{len(image_urls)} - {image_url}")
            
            media_info = self.download_and_process_image(image_url, base_url)
            if media_info:
                processed_images.append(media_info)
        
        logger.info(f"画像処理完了: {len(processed_images)}/{len(image_urls)}件成功")
        return processed_images

# 後方互換性のためのエイリアス
MunicipalityPageData = ComprehensivePageData

class FirecrawlScraper:
    """Firecrawlを使用したスクレーパークラス"""
    
    def __init__(self, 
                 api_key: Optional[str] = None,
                 enable_image_ocr: bool = False,
                 image_save_dir: str = "downloaded_images",
                 s3_bucket: Optional[str] = None):
        """
        初期化
        
        Args:
            api_key: FirecrawlのAPIキー（環境変数FIRECRAWL_API_KEYからも取得可能）
            enable_image_ocr: 画像OCR機能を有効にするか
            image_save_dir: 画像保存ディレクトリ
            s3_bucket: S3バケット名
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
                vertical_text=True
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
            custom_schema: カスタムデータスキーマ（Pydanticモデル）
            
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

# サンプル実行コード
def main():
    """メイン実行関数"""
    
    # 設定
    SAMPLE_URLS = [
        "https://www.u-toyama.ac.jp/",  # 渋谷区
    ]
    
    try:
        # スクレーパー初期化（画像OCR有効）
        scraper = FirecrawlScraper(
            enable_image_ocr=True,  # 画像OCRを有効に
            image_save_dir="downloaded_images",
            s3_bucket=None  # S3を使用する場合はバケット名を指定
        )
        
        # 単一URL のサンプル
        logger.info("=== 包括的データ抽出サンプル ===")
        comprehensive_result = scraper.extract_comprehensive_data(SAMPLE_URLS[0])
        
        # 構造化データのみ表示
        structured_data = comprehensive_result.get('structured_data', {})
        print("構造化データサンプル:")
        print(json.dumps(structured_data, ensure_ascii=False, indent=2)[:1000] + "...")
        
        # 全データをファイルに保存
        with open("comprehensive_sample.json", "w", encoding="utf-8") as f:
            json.dump(comprehensive_result, f, ensure_ascii=False, indent=2)
        logger.info("包括的データを comprehensive_sample.json に保存しました")
        
        # 複数URL の一括処理サンプル
        logger.info("=== 一括スクレーピングサンプル ===")
        batch_results = scraper.batch_scrape(
            urls=SAMPLE_URLS,
            output_file="municipality_data.json"
        )
        
        # 結果サマリー表示
        successful = len([r for r in batch_results if r.get('scrape_status') == 'success'])
        logger.info(f"処理完了: 成功 {successful}/{len(SAMPLE_URLS)} 件")
        
    except Exception as e:
        logger.error(f"実行エラー: {e}")
        raise

if __name__ == "__main__":
    main()