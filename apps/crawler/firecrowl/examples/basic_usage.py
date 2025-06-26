#!/usr/bin/env python3
"""
Basic usage example for Firecrawl Website Crawler
"""

import sys
from pathlib import Path

# Add firecrawl to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from website_crawler.cli import WebsiteCrawler


def main():
    """Basic usage example"""
    # Initialize crawler
    crawler = WebsiteCrawler(
        output_dir="example_outputs",
        enable_ocr=True
    )
    
    # Process a single website
    result = crawler.process_website("https://httpbin.org/html")
    
    if result['status'] == 'success':
        print(f"✅ Success: {result['title']}")
        print(f"📊 Text: {result['text_length']:,} chars")
        print(f"🖼️  Images: {result['image_count']}")
        print("📁 Files:")
        for format_type, path in result['files'].items():
            print(f"   {format_type}: {path}")
    else:
        print(f"❌ Failed: {result['error']}")


if __name__ == "__main__":
    main()