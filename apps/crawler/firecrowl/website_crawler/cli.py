#!/usr/bin/env python3
"""
Firecrawl Website Crawler - CLI Interface

Modern web scraping with OCR support and structured output
"""

import sys
import argparse
import logging
from pathlib import Path
from typing import List

from .config import config
from .utils.logging import setup_logging
from .core import WebScraper, TextProcessor, MultiPageCrawler
from .outputs import OutputManager

logger = logging.getLogger(__name__)


class WebsiteCrawler:
    """Main website crawler orchestrator"""
    
    def __init__(self, output_dir: str = None, enable_ocr: bool = None):
        """Initialize crawler with configuration"""
        self.output_dir = output_dir or config.default_output_dir
        self.enable_ocr = enable_ocr if enable_ocr is not None else config.enable_ocr
        
        # Initialize components
        self.scraper = WebScraper(
            api_key=config.firecrawl_api_key,
            enable_image_ocr=self.enable_ocr,
            image_save_dir=config.image_dir
        )
        self.text_processor = TextProcessor()
        self.output_manager = OutputManager(self.output_dir)
        
        logger.info("Website crawler initialized")
    
    def process_website(self, url: str, filename: str = None) -> dict:
        """Process a single website"""
        try:
            logger.info(f"Processing website: {url}")
            
            # Step 1: Scrape website
            scraped_data = self.scraper.scrape_page(url)
            
            # Step 2: Process and integrate text
            website_data = self.text_processor.process_scraped_data(scraped_data)
            
            # Step 3: Save outputs
            file_paths = self.output_manager.save_website_data(website_data, filename)
            
            result = {
                'status': 'success',
                'url': url,
                'title': website_data.title,
                'text_length': website_data.total_text_length,
                'image_count': website_data.image_count,
                'files': file_paths
            }
            
            logger.info(f"Processing completed: {url}")
            return result
            
        except Exception as e:
            logger.error(f"Processing failed for {url}: {e}")
            return {
                'status': 'error',
                'url': url,
                'error': str(e)
            }
    
    def process_multiple_websites(self, urls: List[str]) -> List[dict]:
        """Process multiple websites"""
        results = []
        
        for i, url in enumerate(urls, 1):
            logger.info(f"Progress: {i}/{len(urls)} - {url}")
            result = self.process_website(url)
            results.append(result)
        
        # Create summary report
        successful_results = [r for r in results if r['status'] == 'success']
        if successful_results:
            summary_data = [
                {
                    'title': r['title'],
                    'url': r['url'],
                    'text_length': r['text_length'],
                    'image_count': r['image_count']
                }
                for r in successful_results
            ]
            self.output_manager.create_summary_report(summary_data)
        
        successful_count = len(successful_results)
        logger.info(f"Batch processing completed: {successful_count}/{len(urls)} successful")
        
        return results


def create_parser() -> argparse.ArgumentParser:
    """Create argument parser"""
    parser = argparse.ArgumentParser(
        description="Firecrawl Website Crawler - Modern web scraping with OCR support",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Single page crawling
  %(prog)s https://example.com
  %(prog)s https://example.com --output-dir custom_output
  
  # Multi-page crawling
  %(prog)s https://example.com --multi-page
  %(prog)s https://example.com --multi-page --max-urls 100 --max-depth 3
  
  # Multiple URLs (single page mode)
  %(prog)s https://site1.com https://site2.com --no-ocr
        """
    )
    
    parser.add_argument(
        "urls",
        nargs="+",
        help="URLs to process (one or more)"
    )
    
    parser.add_argument(
        "--output-dir",
        default=config.default_output_dir,
        help=f"Output directory (default: {config.default_output_dir})"
    )
    
    parser.add_argument(
        "--filename",
        help="Output filename (single URL only)"
    )
    
    parser.add_argument(
        "--no-ocr",
        action="store_true",
        help="Disable OCR processing"
    )
    
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Enable verbose logging"
    )
    
    parser.add_argument(
        "--log-file",
        default=config.log_file,
        help=f"Log file path (default: {config.log_file})"
    )
    
    # Multi-page crawling options
    parser.add_argument(
        "--multi-page",
        action="store_true",
        help="Enable multi-page crawling mode"
    )
    
    parser.add_argument(
        "--max-urls",
        type=int,
        default=50,
        help="Maximum number of URLs to crawl (default: 50)"
    )
    
    parser.add_argument(
        "--max-depth",
        type=int,
        default=2,
        help="Maximum crawling depth (default: 2)"
    )
    
    parser.add_argument(
        "--max-workers",
        type=int,
        default=1,
        help="Maximum number of concurrent workers (default: 1, use sequential processing)"
    )
    
    parser.add_argument(
        "--delay",
        type=float,
        default=6.0,
        help="Delay between requests in seconds (default: 6.0 for rate limit safety)"
    )
    
    parser.add_argument(
        "--no-sitemap",
        action="store_true",
        help="Disable sitemap discovery"
    )
    
    return parser


def main():
    """Main CLI entry point"""
    parser = create_parser()
    args = parser.parse_args()
    
    # Setup logging
    log_level = "DEBUG" if args.verbose else config.log_level
    setup_logging(level=log_level, log_file=args.log_file)
    
    try:
        if args.multi_page:
            # Multi-page crawling mode
            if len(args.urls) > 1:
                print("❌ Multi-page mode only supports single base URL")
                sys.exit(1)
            
            base_url = args.urls[0]
            print(f"🔄 Starting multi-page crawling for: {base_url}")
            
            # Progress callback
            def progress_callback(message: str, current: int, total: int):
                percentage = (current / total) * 100 if total > 0 else 0
                print(f"📈 [{percentage:5.1f}%] {message}")
            
            # Initialize multi-page crawler
            multi_crawler = MultiPageCrawler(
                api_key=config.firecrawl_api_key,
                output_dir=args.output_dir,
                max_urls=args.max_urls,
                max_depth=args.max_depth,
                max_workers=args.max_workers,
                delay_between_requests=args.delay,
                enable_ocr=not args.no_ocr,
                progress_callback=progress_callback
            )
            
            # Execute multi-page crawling
            result = multi_crawler.crawl_website(base_url)
            
            if result['success']:
                site_structure = result['site_structure']
                stats = result['stats']
                
                print(f"\n✅ Multi-page crawling completed!")
                print(f"🌐 Base URL: {site_structure.base_url}")
                print(f"📊 Pages crawled: {site_structure.successful_pages}/{site_structure.total_pages}")
                print(f"📝 Total text: {site_structure.total_text_length:,} characters")
                print(f"🖼️  Total images: {site_structure.total_images}")
                duration = site_structure.crawl_duration
                if duration:
                    print(f"⏱️  Duration: {duration:.1f} seconds")
                else:
                    print(f"⏱️  Duration: N/A")
                print(f"📈 Success rate: {site_structure.success_rate:.1%}")
                
                print(f"\n📁 Saved files:")
                for file_type, path in result['saved_files'].items():
                    print(f"   - {file_type.replace('_', ' ').title()}: {path}")
                    
            else:
                print(f"❌ Multi-page crawling failed: {result['error']}")
                sys.exit(1)
        
        else:
            # Single page mode (existing functionality)
            # Initialize crawler
            crawler = WebsiteCrawler(
                output_dir=args.output_dir,
                enable_ocr=not args.no_ocr
            )
            
            # Process URLs
            if len(args.urls) == 1:
                # Single URL processing
                result = crawler.process_website(args.urls[0], args.filename)
                
                if result['status'] == 'success':
                    print(f"\n✅ Processing completed: {result['title']}")
                    print(f"📊 Text length: {result['text_length']:,} characters")
                    print(f"🖼️  Images processed: {result['image_count']}")
                    print(f"📁 Output files:")
                    for format_type, path in result['files'].items():
                        print(f"   - {format_type.upper()}: {path}")
                else:
                    print(f"❌ Processing failed: {result['error']}")
                    sys.exit(1)
            else:
                # Multiple URL processing
                results = crawler.process_multiple_websites(args.urls)
                
                successful = len([r for r in results if r['status'] == 'success'])
                print(f"\n✅ Batch processing completed: {successful}/{len(args.urls)} successful")
                print(f"📁 Output directory: {args.output_dir}")
                
                # Show failed URLs
                failed_results = [r for r in results if r['status'] == 'error']
                if failed_results:
                    print("\n❌ Failed URLs:")
                    for result in failed_results:
                        print(f"   - {result['url']}: {result['error']}")
        
    except KeyboardInterrupt:
        logger.info("Processing interrupted by user")
        print("\n⚠️  Processing interrupted")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()