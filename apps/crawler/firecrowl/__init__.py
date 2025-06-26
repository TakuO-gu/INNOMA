#!/usr/bin/env python3
"""
Firecrawl Web Scraper with OCR
自治体サイト向けの構造化データ抽出 + 画像OCR機能
"""

from .schemas import (
    ComprehensivePageData,
    MunicipalityPageData,
    LinkInfo,
    ContactInfo,
    SocialMediaInfo,
    EventInfo,
    NewsItem,
    ProcedureInfo,
    ServiceInfo,
    NavigationMenu,
    MediaInfo
)
from .image_processor import ImageProcessor
from .firecrawl_scraper import FirecrawlScraper

__version__ = "1.0.0"
__all__ = [
    "FirecrawlScraper",
    "ImageProcessor",
    "ComprehensivePageData",
    "MunicipalityPageData",
    "LinkInfo",
    "ContactInfo",
    "SocialMediaInfo",
    "EventInfo",
    "NewsItem",
    "ProcedureInfo",
    "ServiceInfo",
    "NavigationMenu",
    "MediaInfo"
]