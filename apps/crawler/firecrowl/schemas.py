#!/usr/bin/env python3
"""
データスキーマ定義（Pydantic使用）
"""

from datetime import datetime
from typing import Dict, List, Optional
from pydantic import BaseModel, Field


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


# 後方互換性のためのエイリアス
MunicipalityPageData = ComprehensivePageData