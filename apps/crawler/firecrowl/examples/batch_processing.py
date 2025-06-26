#!/usr/bin/env python3
"""
Batch processing example for Firecrawl Website Crawler
"""

import sys
from pathlib import Path

# Add firecrawl to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from website_crawler.cli import WebsiteCrawler


def main():
    """Batch processing example"""
    urls = [
        "https://httpbin.org/html",
        "https://httpbin.org/json",
        "https://example.com"
    ]
    
    # Initialize crawler
    crawler = WebsiteCrawler(
        output_dir="batch_outputs",
        enable_ocr=False  # Disable OCR for faster processing
    )
    
    # Process multiple websites
    results = crawler.process_multiple_websites(urls)
    
    # Show results
    successful = [r for r in results if r['status'] == 'success']
    failed = [r for r in results if r['status'] == 'error']
    
    print(f"✅ Successful: {len(successful)}")
    print(f"❌ Failed: {len(failed)}")
    
    if failed:
        print("\nFailed URLs:")
        for result in failed:
            print(f"  - {result['url']}: {result['error']}")


if __name__ == "__main__":
    main()