"""Core functionality for web scraping and processing"""

from .scraper import WebScraper
from .processor import TextProcessor
from .ocr import ImageProcessor
from .sitemap import SitemapAnalyzer, LinkDiscoverer, URLDiscovery
from .multi_crawler import MultiPageCrawler

__all__ = [
    "WebScraper", 
    "TextProcessor", 
    "ImageProcessor",
    "SitemapAnalyzer",
    "LinkDiscoverer", 
    "URLDiscovery",
    "MultiPageCrawler"
]