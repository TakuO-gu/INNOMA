"""
Multi-page crawler for comprehensive website crawling
"""

import time
import logging
import csv
import json
from typing import List, Dict, Any, Optional, Callable
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from datetime import datetime

from .sitemap import URLDiscovery
from .scraper import WebScraper
from .processor import TextProcessor
from ..models.data_models import CrawlResult, SiteStructure
from ..outputs.managers import OutputManager

logger = logging.getLogger(__name__)


class MultiPageCrawler:
    """Handles crawling multiple pages from a website"""
    
    def __init__(
        self,
        api_key: str,
        output_dir: str = "outputs",
        max_urls: int = 50,
        max_depth: int = 2,
        max_workers: int = 3,
        delay_between_requests: float = 1.0,
        enable_ocr: bool = True,
        progress_callback: Optional[Callable[[str, int, int], None]] = None
    ):
        """
        Initialize multi-page crawler
        
        Args:
            api_key: Firecrawl API key
            output_dir: Directory for output files
            max_urls: Maximum number of URLs to crawl
            max_depth: Maximum depth for link discovery
            max_workers: Number of concurrent workers
            delay_between_requests: Delay between requests (seconds)
            enable_ocr: Enable OCR processing
            progress_callback: Callback function for progress updates
        """
        self.api_key = api_key
        self.output_dir = Path(output_dir)
        self.max_urls = max_urls
        self.max_depth = max_depth
        self.max_workers = max_workers
        self.delay_between_requests = delay_between_requests
        self.enable_ocr = enable_ocr
        self.progress_callback = progress_callback
        
        # Initialize components
        self.scraper = WebScraper(
            api_key=api_key,
            enable_image_ocr=enable_ocr,
            image_save_dir=str(self.output_dir / "downloaded_images")
        )
        self.text_processor = TextProcessor()
        self.output_manager = OutputManager(str(self.output_dir))
        
        # Statistics
        self.stats = {
            'total_urls': 0,
            'successful': 0,
            'failed': 0,
            'start_time': None,
            'end_time': None,
            'total_text_length': 0,
            'total_images': 0
        }
        
        logger.info(f"MultiPageCrawler initialized: max_urls={max_urls}, max_depth={max_depth}")
    
    def _update_progress(self, message: str, current: int, total: int):
        """Update progress through callback"""
        if self.progress_callback:
            self.progress_callback(message, current, total)
        logger.info(f"Progress: {current}/{total} - {message}")
    
    def discover_urls(self, base_url: str) -> List[Dict[str, Any]]:
        """
        Discover URLs for crawling
        
        Args:
            base_url: Base URL of the website
            
        Returns:
            List of URL data with metadata
        """
        logger.info(f"Starting URL discovery for: {base_url}")
        
        url_discovery = URLDiscovery(
            base_url=base_url,
            max_urls=self.max_urls,
            max_depth=self.max_depth
        )
        
        discovered_urls = url_discovery.discover_all_urls(prefer_sitemap=True)
        
        self._update_progress("URLs discovered", len(discovered_urls), self.max_urls)
        return discovered_urls
    
    def crawl_single_page(self, url_data: Dict[str, Any]) -> Optional[CrawlResult]:
        """
        Crawl a single page
        
        Args:
            url_data: URL data with metadata
            
        Returns:
            CrawlResult object or None if failed
        """
        url = url_data['url']
        
        try:
            logger.info(f"Crawling: {url}")
            
            # Scrape the page
            scraped_data = self.scraper.scrape_page(url)
            
            # Process the data
            website_data = self.text_processor.process_scraped_data(scraped_data)
            
            # Create result
            result = CrawlResult(
                url=url,
                title=website_data.title,
                success=True,
                scraped_at=datetime.now(),
                text_length=website_data.total_text_length,
                image_count=website_data.image_count,
                content=website_data.combined_text,
                metadata=url_data,
                website_data=website_data
            )
            
            # Update statistics
            self.stats['total_text_length'] += website_data.total_text_length
            self.stats['total_images'] += website_data.image_count
            
            # Add delay to avoid overwhelming the server
            time.sleep(self.delay_between_requests)
            
            logger.info(f"Successfully crawled: {url} ({website_data.total_text_length} chars)")
            return result
            
        except Exception as e:
            logger.error(f"Failed to crawl {url}: {e}")
            return CrawlResult(
                url=url,
                title=f"Failed: {str(e)}",
                success=False,
                scraped_at=datetime.now(),
                error_message=str(e),
                metadata=url_data
            )
    
    def crawl_multiple_pages(
        self,
        urls_data: List[Dict[str, Any]],
        use_threading: bool = False  # Default to False for rate limit safety
    ) -> List[CrawlResult]:
        """
        Crawl multiple pages with rate limit handling
        
        Args:
            urls_data: List of URL data with metadata
            use_threading: Use threading for concurrent crawling
            
        Returns:
            List of CrawlResult objects
        """
        results = []
        total_urls = len(urls_data)
        
        logger.info(f"Starting to crawl {total_urls} pages")
        self._update_progress("Starting crawl", 0, total_urls)
        
        # Force sequential processing for better rate limit handling
        if use_threading and self.max_workers > 1 and self.delay_between_requests < 5.0:
            logger.warning("Using sequential crawling for better rate limit handling")
            use_threading = False
        
        if use_threading and self.max_workers > 1:
            # Concurrent crawling (risky with API rate limits)
            with ThreadPoolExecutor(max_workers=min(2, self.max_workers)) as executor:
                # Submit tasks in batches to avoid rate limits
                batch_size = 2
                for batch_start in range(0, len(urls_data), batch_size):
                    batch = urls_data[batch_start:batch_start + batch_size]
                    
                    # Submit batch
                    future_to_url = {
                        executor.submit(self.crawl_single_page, url_data): url_data
                        for url_data in batch
                    }
                    
                    # Process batch results
                    for future in as_completed(future_to_url):
                        url_data = future_to_url[future]
                        
                        try:
                            result = future.result()
                            if result:
                                results.append(result)
                                if result.success:
                                    self.stats['successful'] += 1
                                else:
                                    self.stats['failed'] += 1
                                    # Check for rate limit error
                                    if "rate limit" in result.error_message.lower():
                                        logger.warning("Rate limit detected, switching to sequential mode")
                                        use_threading = False
                                        break
                        except Exception as e:
                            logger.error(f"Future failed for {url_data['url']}: {e}")
                            self.stats['failed'] += 1
                        
                        self._update_progress(f"Crawled {url_data['url']}", len(results), total_urls)
                    
                    # Wait between batches
                    if batch_start + batch_size < len(urls_data):
                        time.sleep(5)  # 5-second delay between batches
                    
                    # If rate limit hit, switch to sequential
                    if not use_threading:
                        break
        
        # Sequential crawling (safe for rate limits)
        if not use_threading:
            remaining_urls = urls_data[len(results):]
            for i, url_data in enumerate(remaining_urls):
                result = self.crawl_single_page(url_data)
                if result:
                    results.append(result)
                    if result.success:
                        self.stats['successful'] += 1
                    else:
                        self.stats['failed'] += 1
                        # If rate limit error, increase delay
                        if result.error_message and "rate limit" in result.error_message.lower():
                            logger.warning("Rate limit hit, increasing delay to 30 seconds")
                            time.sleep(30)  # Wait 30 seconds for rate limit reset
                
                self._update_progress(f"Crawled {url_data['url']}", len(results), total_urls)
        
        logger.info(f"Crawling completed: {self.stats['successful']} successful, {self.stats['failed']} failed")
        return results
    
    def create_site_structure(self, results: List[CrawlResult], base_url: str) -> SiteStructure:
        """
        Create site structure from crawl results
        
        Args:
            results: List of crawl results
            base_url: Base URL of the website
            
        Returns:
            SiteStructure object
        """
        successful_results = [r for r in results if r.success]
        
        return SiteStructure(
            base_url=base_url,
            total_pages=len(results),
            successful_pages=len(successful_results),
            failed_pages=len(results) - len(successful_results),
            total_text_length=self.stats['total_text_length'],
            total_images=self.stats['total_images'],
            crawl_start_time=self.stats['start_time'],
            crawl_end_time=self.stats['end_time'],
            pages=[r for r in results if r.success]
        )
    
    def save_results(self, results: List[CrawlResult], site_structure: SiteStructure) -> Dict[str, str]:
        """
        Save crawl results to files
        
        Args:
            results: List of crawl results
            site_structure: Site structure data
            
        Returns:
            Dictionary of saved file paths
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        domain = site_structure.base_url.replace("https://", "").replace("http://", "")
        domain = "".join(c for c in domain if c.isalnum() or c in ".-_")[:50]
        
        saved_files = {}
        
        # Save individual page results with organized folder structure
        for i, result in enumerate(results):
            if result.success and result.website_data:
                # Create page-specific directory
                page_name = f"page_{i+1:03d}_{result.url.split('/')[-1]}"
                page_dir = self.output_dir / "pages" / page_name
                page_dir.mkdir(parents=True, exist_ok=True)
                
                # Generate filename without domain prefix
                base_filename = f"{timestamp}"
                
                # Save each format in the page directory
                formats = ['json', 'html', 'markdown']
                for format_type in formats:
                    file_path = page_dir / f"{base_filename}.{format_type}"
                    
                    if format_type == 'json':
                        with open(file_path, 'w', encoding='utf-8') as f:
                            json.dump(result.website_data.__dict__, f, ensure_ascii=False, indent=2, default=str)
                    elif format_type == 'html':
                        with open(file_path, 'w', encoding='utf-8') as f:
                            f.write(f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{result.website_data.title}</title>
</head>
<body>
    <h1>{result.website_data.title}</h1>
    <p><strong>URL:</strong> <a href="{result.website_data.url}">{result.website_data.url}</a></p>
    <div>{result.website_data.combined_text}</div>
</body>
</html>""")
                    elif format_type == 'markdown':
                        with open(file_path, 'w', encoding='utf-8') as f:
                            f.write(f"# {result.website_data.title}\n\n")
                            f.write(f"**URL:** {result.website_data.url}\n\n")
                            f.write(result.website_data.combined_text)
                
                # Add page info to saved files
                saved_files[f'page_{i+1:03d}'] = str(page_dir)
        
        # Save site structure report
        structure_file = self.output_dir / "site_reports" / f"{domain}_structure_{timestamp}.json"
        structure_file.parent.mkdir(exist_ok=True)
        
        with open(structure_file, 'w', encoding='utf-8') as f:
            json.dump(site_structure.__dict__, f, ensure_ascii=False, indent=2, default=str)
        saved_files['site_structure'] = str(structure_file)
        
        # Save summary CSV
        if results:
            summary_data = []
            for result in results:
                if result.success:
                    summary_data.append({
                        'url': result.url,
                        'title': result.title,
                        'text_length': result.text_length,
                        'image_count': result.image_count,
                        'scraped_at': result.scraped_at.isoformat()
                    })
            
            if summary_data:
                csv_file = self.output_dir / "structured" / f"summary_{timestamp}.csv"
                csv_file.parent.mkdir(exist_ok=True)
                
                with open(csv_file, 'w', newline='', encoding='utf-8') as f:
                    if summary_data:
                        writer = csv.DictWriter(f, fieldnames=summary_data[0].keys())
                        writer.writeheader()
                        writer.writerows(summary_data)
                
                saved_files['summary'] = str(csv_file)
        
        logger.info(f"Saved results to {len(saved_files)} files")
        return saved_files
    
    def crawl_website(self, base_url: str) -> Dict[str, Any]:
        """
        Crawl entire website
        
        Args:
            base_url: Base URL of the website
            
        Returns:
            Dictionary with crawl results and statistics
        """
        self.stats['start_time'] = datetime.now()
        
        try:
            # Step 1: Discover URLs
            self._update_progress("Discovering URLs", 0, 100)
            urls_data = self.discover_urls(base_url)
            
            if not urls_data:
                logger.warning("No URLs discovered for crawling")
                return {
                    'success': False,
                    'error': 'No URLs discovered',
                    'stats': self.stats
                }
            
            self.stats['total_urls'] = len(urls_data)
            
            # Step 2: Crawl pages
            self._update_progress("Starting page crawling", 0, len(urls_data))
            results = self.crawl_multiple_pages(urls_data)
            
            # Step 3: Create site structure
            self._update_progress("Creating site structure", 95, 100)
            site_structure = self.create_site_structure(results, base_url)
            
            # Step 4: Save results
            self._update_progress("Saving results", 98, 100)
            saved_files = self.save_results(results, site_structure)
            
            self.stats['end_time'] = datetime.now()
            
            self._update_progress("Crawling completed", 100, 100)
            
            return {
                'success': True,
                'site_structure': site_structure,
                'results': results,
                'saved_files': saved_files,
                'stats': self.stats
            }
            
        except Exception as e:
            logger.error(f"Website crawling failed: {e}")
            self.stats['end_time'] = datetime.now()
            
            return {
                'success': False,
                'error': str(e),
                'stats': self.stats
            }