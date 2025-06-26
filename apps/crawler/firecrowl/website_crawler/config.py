"""
Configuration management for Firecrawl crawler
"""

import os
from pathlib import Path
from typing import Optional
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class Config(BaseModel):
    """Application configuration"""
    
    # API Configuration
    firecrawl_api_key: str = os.getenv('FIRECRAWL_API_KEY', '')
    
    # OCR Configuration
    enable_ocr: bool = True
    ocr_confidence_threshold: float = 0.7
    vertical_text_support: bool = True
    
    # Output Configuration
    default_output_dir: str = "outputs"
    save_images: bool = True
    image_dir: str = "downloaded_images"
    
    # Processing Configuration
    max_retries: int = 3
    timeout_seconds: int = 30
    
    # Logging Configuration
    log_level: str = "INFO"
    log_file: str = "website_crawler.log"
    
    def validate(self) -> None:
        """Validate configuration"""
        if not self.firecrawl_api_key:
            raise ValueError("FIRECRAWL_API_KEY environment variable is required")
    
    @classmethod
    def load(cls) -> "Config":
        """Load configuration from environment"""
        config = cls()
        config.validate()
        return config


# Global configuration instance
config = Config.load()