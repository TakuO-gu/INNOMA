"""Core functionality for web scraping and processing"""

from .scraper import WebScraper
from .processor import TextProcessor
from .ocr import ImageProcessor

__all__ = ["WebScraper", "TextProcessor", "ImageProcessor"]