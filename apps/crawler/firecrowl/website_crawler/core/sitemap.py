"""
Sitemap analysis and URL discovery functionality
"""

import xml.etree.ElementTree as ET
import requests
from urllib.parse import urljoin, urlparse
from typing import List, Set, Optional, Dict, Any
import logging
from datetime import datetime
import re

logger = logging.getLogger(__name__)


class SitemapAnalyzer:
    """Analyzes sitemaps and discovers URLs for crawling"""
    
    def __init__(self, base_url: str, max_urls: int = 100):
        """
        Initialize sitemap analyzer
        
        Args:
            base_url: Base URL of the website
            max_urls: Maximum number of URLs to discover
        """
        self.base_url = base_url.rstrip('/')
        self.domain = urlparse(base_url).netloc
        self.max_urls = max_urls
        self.discovered_urls: Set[str] = set()
        
    def find_sitemap_urls(self) -> List[str]:
        """Find sitemap URLs from robots.txt and common locations"""
        sitemap_urls = []
        
        # Check robots.txt
        try:
            robots_url = urljoin(self.base_url, '/robots.txt')
            response = requests.get(robots_url, timeout=10)
            if response.status_code == 200:
                for line in response.text.split('\n'):
                    if line.lower().startswith('sitemap:'):
                        sitemap_url = line.split(':', 1)[1].strip()
                        sitemap_urls.append(sitemap_url)
                        logger.info(f"Found sitemap in robots.txt: {sitemap_url}")
        except Exception as e:
            logger.warning(f"Could not fetch robots.txt: {e}")
        
        # Check common sitemap locations
        common_paths = [
            '/sitemap.xml',
            '/sitemap_index.xml',
            '/sitemaps.xml',
            '/sitemap.php',
            '/wp-sitemap.xml'  # WordPress
        ]
        
        for path in common_paths:
            sitemap_url = urljoin(self.base_url, path)
            try:
                response = requests.head(sitemap_url, timeout=10)
                if response.status_code == 200:
                    if sitemap_url not in sitemap_urls:
                        sitemap_urls.append(sitemap_url)
                        logger.info(f"Found sitemap at: {sitemap_url}")
            except Exception as e:
                logger.debug(f"Sitemap not found at {sitemap_url}: {e}")
        
        return sitemap_urls
    
    def parse_sitemap(self, sitemap_url: str) -> List[Dict[str, Any]]:
        """
        Parse a sitemap XML and extract URLs
        
        Returns:
            List of dictionaries with URL metadata
        """
        urls = []
        
        try:
            response = requests.get(sitemap_url, timeout=30)
            response.raise_for_status()
            
            # Parse XML
            root = ET.fromstring(response.content)
            
            # Handle different namespace formats
            namespaces = {
                'sitemap': 'http://www.sitemaps.org/schemas/sitemap/0.9',
                'news': 'http://www.google.com/schemas/sitemap-news/0.9',
                'image': 'http://www.google.com/schemas/sitemap-image/1.1'
            }
            
            # Check if this is a sitemap index
            sitemapindex_elements = root.findall('.//sitemap:sitemap', namespaces)
            if sitemapindex_elements:
                logger.info(f"Found sitemap index with {len(sitemapindex_elements)} sitemaps")
                for sitemap_elem in sitemapindex_elements:
                    loc_elem = sitemap_elem.find('sitemap:loc', namespaces)
                    if loc_elem is not None:
                        # Recursively parse sub-sitemaps
                        sub_urls = self.parse_sitemap(loc_elem.text)
                        urls.extend(sub_urls)
                        if len(urls) >= self.max_urls:
                            break
            else:
                # Parse regular sitemap
                url_elements = root.findall('.//sitemap:url', namespaces)
                logger.info(f"Found {len(url_elements)} URLs in sitemap")
                
                for url_elem in url_elements:
                    url_data = {}
                    
                    # Extract URL
                    loc_elem = url_elem.find('sitemap:loc', namespaces)
                    if loc_elem is not None:
                        url_data['url'] = loc_elem.text
                    else:
                        continue
                    
                    # Extract metadata
                    lastmod_elem = url_elem.find('sitemap:lastmod', namespaces)
                    if lastmod_elem is not None:
                        url_data['lastmod'] = lastmod_elem.text
                    
                    changefreq_elem = url_elem.find('sitemap:changefreq', namespaces)
                    if changefreq_elem is not None:
                        url_data['changefreq'] = changefreq_elem.text
                    
                    priority_elem = url_elem.find('sitemap:priority', namespaces)
                    if priority_elem is not None:
                        url_data['priority'] = float(priority_elem.text)
                    
                    urls.append(url_data)
                    
                    if len(urls) >= self.max_urls:
                        break
        
        except ET.ParseError as e:
            logger.error(f"Failed to parse sitemap XML {sitemap_url}: {e}")
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to fetch sitemap {sitemap_url}: {e}")
        except Exception as e:
            logger.error(f"Unexpected error parsing sitemap {sitemap_url}: {e}")
        
        return urls
    
    def discover_urls_from_sitemaps(self) -> List[Dict[str, Any]]:
        """Discover URLs from all available sitemaps"""
        all_urls = []
        
        sitemap_urls = self.find_sitemap_urls()
        if not sitemap_urls:
            logger.warning("No sitemaps found")
            return all_urls
        
        for sitemap_url in sitemap_urls:
            logger.info(f"Parsing sitemap: {sitemap_url}")
            urls = self.parse_sitemap(sitemap_url)
            all_urls.extend(urls)
            
            if len(all_urls) >= self.max_urls:
                break
        
        # Remove duplicates and filter by domain
        seen_urls = set()
        filtered_urls = []
        
        for url_data in all_urls:
            url = url_data['url']
            parsed_url = urlparse(url)
            
            # Only include URLs from the same domain
            if parsed_url.netloc != self.domain:
                continue
            
            if url not in seen_urls:
                seen_urls.add(url)
                filtered_urls.append(url_data)
        
        logger.info(f"Discovered {len(filtered_urls)} unique URLs from sitemaps")
        return filtered_urls[:self.max_urls]


class LinkDiscoverer:
    """Discovers links by crawling and parsing web pages"""
    
    def __init__(self, base_url: str, max_depth: int = 2, max_urls: int = 100):
        """
        Initialize link discoverer
        
        Args:
            base_url: Base URL of the website
            max_depth: Maximum crawling depth
            max_urls: Maximum number of URLs to discover
        """
        self.base_url = base_url.rstrip('/')
        self.domain = urlparse(base_url).netloc
        self.max_depth = max_depth
        self.max_urls = max_urls
        self.discovered_urls: Set[str] = set()
        self.exclude_patterns = [
            r'\.pdf$', r'\.doc$', r'\.docx$', r'\.xls$', r'\.xlsx$',
            r'\.zip$', r'\.rar$', r'\.exe$', r'\.dmg$',
            r'/wp-admin/', r'/admin/', r'/login', r'/logout',
            r'\?.*search=', r'\?.*query=', r'#.*$'
        ]
    
    def is_valid_url(self, url: str) -> bool:
        """Check if URL should be crawled"""
        parsed_url = urlparse(url)
        
        # Only crawl URLs from the same domain
        if parsed_url.netloc != self.domain:
            return False
        
        # Check exclude patterns
        for pattern in self.exclude_patterns:
            if re.search(pattern, url, re.IGNORECASE):
                return False
        
        return True
    
    def extract_links_from_html(self, html_content: str, base_url: str) -> Set[str]:
        """Extract links from HTML content"""
        from bs4 import BeautifulSoup
        
        links = set()
        
        try:
            soup = BeautifulSoup(html_content, 'html.parser')
            
            # Find all anchor tags with href
            for link in soup.find_all('a', href=True):
                href = link['href']
                
                # Convert relative URLs to absolute
                absolute_url = urljoin(base_url, href)
                
                if self.is_valid_url(absolute_url):
                    links.add(absolute_url)
        
        except Exception as e:
            logger.error(f"Error extracting links from HTML: {e}")
        
        return links
    
    def discover_urls_by_crawling(self, start_urls: List[str] = None) -> List[str]:
        """
        Discover URLs by crawling web pages
        
        Args:
            start_urls: Initial URLs to start crawling from
            
        Returns:
            List of discovered URLs
        """
        if not start_urls:
            start_urls = [self.base_url]
        
        discovered_urls = set(start_urls)
        to_crawl = [(url, 0) for url in start_urls]  # (url, depth)
        crawled = set()
        
        while to_crawl and len(discovered_urls) < self.max_urls:
            current_url, depth = to_crawl.pop(0)
            
            if current_url in crawled or depth > self.max_depth:
                continue
            
            crawled.add(current_url)
            logger.info(f"Crawling URL (depth {depth}): {current_url}")
            
            try:
                response = requests.get(current_url, timeout=30)
                response.raise_for_status()
                
                # Extract links from the page
                new_links = self.extract_links_from_html(response.text, current_url)
                
                for link in new_links:
                    if link not in discovered_urls and len(discovered_urls) < self.max_urls:
                        discovered_urls.add(link)
                        if depth < self.max_depth:
                            to_crawl.append((link, depth + 1))
            
            except Exception as e:
                logger.warning(f"Failed to crawl {current_url}: {e}")
        
        logger.info(f"Discovered {len(discovered_urls)} URLs through crawling")
        return list(discovered_urls)[:self.max_urls]


class URLDiscovery:
    """Unified URL discovery combining sitemaps and crawling"""
    
    def __init__(self, base_url: str, max_urls: int = 100, max_depth: int = 2):
        """
        Initialize URL discovery
        
        Args:
            base_url: Base URL of the website
            max_urls: Maximum number of URLs to discover
            max_depth: Maximum crawling depth for link discovery
        """
        self.base_url = base_url
        self.max_urls = max_urls
        self.max_depth = max_depth
        
        self.sitemap_analyzer = SitemapAnalyzer(base_url, max_urls)
        self.link_discoverer = LinkDiscoverer(base_url, max_depth, max_urls)
    
    def discover_all_urls(self, prefer_sitemap: bool = True) -> List[Dict[str, Any]]:
        """
        Discover URLs using both sitemaps and crawling
        
        Args:
            prefer_sitemap: If True, prioritize sitemap discovery over crawling
            
        Returns:
            List of URL data with metadata
        """
        all_urls = []
        
        if prefer_sitemap:
            # Try sitemap first
            logger.info("Attempting sitemap discovery...")
            sitemap_urls = self.sitemap_analyzer.discover_urls_from_sitemaps()
            
            if sitemap_urls:
                all_urls.extend(sitemap_urls)
                logger.info(f"Found {len(sitemap_urls)} URLs from sitemaps")
            else:
                logger.info("No sitemap URLs found, falling back to crawling...")
        
        # If we don't have enough URLs, supplement with crawling
        if len(all_urls) < self.max_urls:
            remaining_count = self.max_urls - len(all_urls)
            self.link_discoverer.max_urls = remaining_count
            
            logger.info(f"Discovering additional URLs through crawling (up to {remaining_count})...")
            crawled_urls = self.link_discoverer.discover_urls_by_crawling()
            
            # Convert to URL data format
            existing_urls = {url_data['url'] for url_data in all_urls}
            for url in crawled_urls:
                if url not in existing_urls:
                    all_urls.append({
                        'url': url,
                        'source': 'crawling',
                        'discovered_at': datetime.now().isoformat()
                    })
        
        logger.info(f"Total discovered URLs: {len(all_urls)}")
        return all_urls[:self.max_urls]