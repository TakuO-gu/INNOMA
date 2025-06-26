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


class CrawlResult(BaseModel):
    """単一ページのクローリング結果"""
    
    url: str = Field(..., description="クローリング対象URL")
    title: str = Field(..., description="ページタイトル")
    success: bool = Field(..., description="クローリング成功フラグ")
    scraped_at: datetime = Field(default_factory=datetime.now, description="スクレーピング実行日時")
    
    # 成功時のデータ
    text_length: Optional[int] = Field(None, description="テキスト文字数")
    image_count: Optional[int] = Field(None, description="処理画像数")
    content: Optional[str] = Field(None, description="統合テキストコンテンツ")
    website_data: Optional[WebsiteData] = Field(None, description="詳細ウェブサイトデータ")
    
    # エラー情報
    error_message: Optional[str] = Field(None, description="エラーメッセージ")
    
    # メタデータ
    metadata: Optional[Dict[str, Any]] = Field(None, description="追加メタデータ")


class SiteStructure(BaseModel):
    """サイト全体の構造データ"""
    
    base_url: str = Field(..., description="ベースURL")
    total_pages: int = Field(..., description="総ページ数")
    successful_pages: int = Field(..., description="成功ページ数")
    failed_pages: int = Field(..., description="失敗ページ数")
    
    # 統計情報
    total_text_length: int = Field(0, description="全ページの総文字数")
    total_images: int = Field(0, description="全ページの総画像数")
    
    # タイミング情報
    crawl_start_time: Optional[datetime] = Field(None, description="クローリング開始時刻")
    crawl_end_time: Optional[datetime] = Field(None, description="クローリング終了時刻")
    
    # ページデータ
    pages: List[CrawlResult] = Field(default=[], description="個別ページ結果")
    
    @property
    def crawl_duration(self) -> Optional[float]:
        """クローリング実行時間（秒）"""
        if self.crawl_start_time and self.crawl_end_time:
            return (self.crawl_end_time - self.crawl_start_time).total_seconds()
        return None
    
    @property
    def success_rate(self) -> float:
        """成功率（0.0-1.0）"""
        if self.total_pages == 0:
            return 0.0
        return self.successful_pages / self.total_pages
    
    @property
    def avg_text_length(self) -> float:
        """平均テキスト長"""
        if self.successful_pages == 0:
            return 0.0
        return self.total_text_length / self.successful_pages


class MultiCrawlConfig(BaseModel):
    """複数ページクローリング設定"""
    
    max_urls: int = Field(50, description="最大URL数")
    max_depth: int = Field(2, description="最大深度")
    max_workers: int = Field(3, description="最大並列数")
    delay_between_requests: float = Field(1.0, description="リクエスト間隔（秒）")
    enable_ocr: bool = Field(True, description="OCR有効フラグ")
    prefer_sitemap: bool = Field(True, description="サイトマップ優先フラグ")
    
    # フィルタリング設定
    exclude_patterns: List[str] = Field(
        default=[
            r'\.pdf$', r'\.doc$', r'\.docx$', r'\.xls$', r'\.xlsx$',
            r'\.zip$', r'\.rar$', r'\.exe$', r'\.dmg$',
            r'/wp-admin/', r'/admin/', r'/login', r'/logout'
        ],
        description="除外パターン（正規表現）"
    )
    
    include_patterns: Optional[List[str]] = Field(None, description="含有パターン（正規表現）")
    
    # 出力設定
    save_individual_pages: bool = Field(True, description="個別ページ保存フラグ")
    create_site_report: bool = Field(True, description="サイトレポート作成フラグ")
    create_summary: bool = Field(True, description="サマリー作成フラグ")