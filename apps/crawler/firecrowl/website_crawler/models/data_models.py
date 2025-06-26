"""
データモデル定義
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class WebsiteData(BaseModel):
    """統合されたウェブサイトデータモデル"""
    
    url: str = Field(..., description="対象URL")
    title: str = Field(..., description="ページタイトル")
    
    # テキストデータ
    combined_text: str = Field(..., description="統合されたテキスト（HTML + OCR + 構造化データ）")
    
    # 元データ
    html_content: Optional[str] = Field(None, description="元のHTMLコンテンツ")
    markdown_content: Optional[str] = Field(None, description="Markdownコンテンツ")
    structured_data: Optional[Dict[str, Any]] = Field(None, description="構造化データ")
    ocr_data: List[Dict[str, Any]] = Field(default=[], description="OCRデータ")
    
    # メタデータ
    scraped_at: datetime = Field(default_factory=datetime.now, description="スクレーピング実行日時")
    total_text_length: int = Field(0, description="統合テキストの文字数")
    html_length: int = Field(0, description="HTML文字数")
    markdown_length: int = Field(0, description="Markdown文字数")
    ocr_text_length: int = Field(0, description="OCRテキスト文字数")
    image_count: int = Field(0, description="処理画像数")
    
    # ファイルパス
    json_file_path: Optional[str] = Field(None, description="JSONファイルパス")
    html_file_path: Optional[str] = Field(None, description="HTMLファイルパス")
    markdown_file_path: Optional[str] = Field(None, description="Markdownファイルパス")