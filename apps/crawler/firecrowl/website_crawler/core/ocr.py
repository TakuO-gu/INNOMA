#!/usr/bin/env python3
"""
画像OCR処理クラス
"""

import os
import re
import hashlib
import logging
from datetime import datetime
from typing import List, Optional
from urllib.parse import urljoin, urlparse
from pathlib import Path
from io import BytesIO

from ..models.schemas import MediaInfo

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

import requests

logger = logging.getLogger(__name__)


class ImageProcessor:
    """画像OCR処理クラス"""
    
    def __init__(self, 
                 ocr_enabled: bool = True,
                 save_images: bool = True,
                 image_dir: str = "downloaded_images",
                 s3_bucket: Optional[str] = None,
                 vertical_text: bool = True,
                 debug_ocr: bool = False):
        """
        初期化
        
        Args:
            ocr_enabled: OCR機能を有効にするか
            save_images: 画像を保存するか
            image_dir: ローカル保存ディレクトリ
            s3_bucket: S3バケット名
            vertical_text: 縦書きテキストを有効にするか
            debug_ocr: OCRデバッグログを有効にするか
        """
        self.ocr_enabled = ocr_enabled
        self.save_images = save_images
        self.image_dir = Path(image_dir)
        self.s3_bucket = s3_bucket
        self.vertical_text = vertical_text
        self.debug_ocr = debug_ocr
        
        # ディレクトリ作成
        if self.save_images:
            self.image_dir.mkdir(exist_ok=True)
        
        # OCR初期化
        self.ocr = None
        if self.ocr_enabled and PaddleOCR:
            try:
                # 日本語対応OCR設定（シンプルなAPI使用）
                self.ocr = PaddleOCR(
                    use_angle_cls=True,  # 角度調整（回転したテキストに対応）
                    lang='japan'  # 日本語（ひらがな、カタカナ、漢字、英数字）
                )
                logger.info("PaddleOCR（日本語+英語対応）を初期化しました")
                
                # 英語専用OCRも初期化（英語テキストの精度向上のため）
                try:
                    self.ocr_en = PaddleOCR(
                        use_angle_cls=True,
                        lang='en'  # 英語専用
                    )
                    logger.info("PaddleOCR（英語専用）も初期化しました")
                except Exception as e:
                    logger.warning(f"英語専用OCRの初期化に失敗: {e}")
                    self.ocr_en = None
                    
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
            _base_url: ベースURL
            
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
                    img_bytes = BytesIO(content)
                    if Image:
                        img = Image.open(BytesIO(content))
                        # RGBに変換（RGBAやPモードの場合）
                        if img.mode in ('RGBA', 'P'):
                            img = img.convert('RGB')
                    
                    # 日本語OCRで実行
                    jp_texts = []
                    jp_confidences = []
                    
                    try:
                        jp_ocr_result = self.ocr.ocr(img_bytes.getvalue())
                        if jp_ocr_result and jp_ocr_result[0]:
                            for line in jp_ocr_result[0]:
                                if line and len(line) >= 2:
                                    text = line[1][0] if line[1] else ''
                                    confidence = line[1][1] if line[1] and len(line[1]) > 1 else 0.0
                                    
                                    if text.strip():
                                        jp_texts.append(text.strip())
                                        jp_confidences.append(confidence)
                        
                        if self.debug_ocr and jp_texts:
                            logger.info(f"日本語OCR結果: {len(jp_texts)}行検出")
                            for i, text in enumerate(jp_texts):
                                logger.info(f"  日本語[{i+1}]: {text} (信頼度: {jp_confidences[i]:.2f})")
                        else:
                            logger.debug(f"日本語OCR結果: {len(jp_texts)}行検出")
                    except Exception as e:
                        logger.warning(f"日本語OCR処理に失敗: {e}")
                    
                    # 英語OCRでも実行（利用可能な場合）
                    en_texts = []
                    en_confidences = []
                    
                    if hasattr(self, 'ocr_en') and self.ocr_en:
                        try:
                            img_bytes.seek(0)  # バイトストリームを先頭に戻す
                            en_ocr_result = self.ocr_en.ocr(img_bytes.getvalue())
                            if en_ocr_result and en_ocr_result[0]:
                                for line in en_ocr_result[0]:
                                    if line and len(line) >= 2:
                                        text = line[1][0] if line[1] else ''
                                        confidence = line[1][1] if line[1] and len(line[1]) > 1 else 0.0
                                        
                                        if text.strip():
                                            en_texts.append(text.strip())
                                            en_confidences.append(confidence)
                            
                            if self.debug_ocr and en_texts:
                                logger.info(f"英語OCR結果: {len(en_texts)}行検出")
                                for i, text in enumerate(en_texts):
                                    logger.info(f"  英語[{i+1}]: {text} (信頼度: {en_confidences[i]:.2f})")
                            else:
                                logger.debug(f"英語OCR結果: {len(en_texts)}行検出")
                        except Exception as e:
                            logger.warning(f"英語OCR処理に失敗: {e}")
                    
                    # 結果をマージして最適な組み合わせを選択
                    best_texts = []
                    best_confidences = []
                    
                    # 日本語と英語の結果を比較し、より良い結果を採用
                    if jp_texts and en_texts:
                        jp_avg_conf = sum(jp_confidences) / len(jp_confidences) if jp_confidences else 0.0
                        en_avg_conf = sum(en_confidences) / len(en_confidences) if en_confidences else 0.0
                        
                        # 信頼度が高い方を採用、または両方をマージ
                        if jp_avg_conf > en_avg_conf:
                            best_texts = jp_texts
                            best_confidences = jp_confidences
                            logger.debug(f"日本語OCR結果を採用（信頼度: {jp_avg_conf:.2f} > {en_avg_conf:.2f}）")
                        else:
                            best_texts = en_texts
                            best_confidences = en_confidences
                            logger.debug(f"英語OCR結果を採用（信頼度: {en_avg_conf:.2f} > {jp_avg_conf:.2f}）")
                        
                        # 追加: 両方の結果をマージすることも考慮
                        if abs(jp_avg_conf - en_avg_conf) < 0.1:  # 信頼度が近い場合はマージ
                            all_texts = jp_texts + en_texts
                            all_confidences = jp_confidences + en_confidences
                            # 重複を除去
                            unique_texts = []
                            unique_confidences = []
                            for i, text in enumerate(all_texts):
                                if text not in unique_texts:
                                    unique_texts.append(text)
                                    unique_confidences.append(all_confidences[i])
                            best_texts = unique_texts
                            best_confidences = unique_confidences
                            logger.debug(f"日英OCR結果をマージ（総計: {len(best_texts)}行）")
                    
                    elif jp_texts:
                        best_texts = jp_texts
                        best_confidences = jp_confidences
                        logger.debug("日本語OCR結果のみ利用")
                    elif en_texts:
                        best_texts = en_texts
                        best_confidences = en_confidences
                        logger.debug("英語OCR結果のみ利用")
                    
                    # 最終結果を設定
                    if best_texts:
                        extracted_text = '\n'.join(best_texts)
                        ocr_confidence = sum(best_confidences) / len(best_confidences) if best_confidences else 0.0
                        logger.debug(f"OCR抽出成功: {len(best_texts)}行, 平均信頼度: {ocr_confidence:.2f}")
                        
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