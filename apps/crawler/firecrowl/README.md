# Firecrawl Website Crawler

Modern web scraping with OCR support using Firecrawl API

## 🚀 Overview

A comprehensive website crawler that extracts content from web pages using the Firecrawl API, with advanced OCR capabilities for image text extraction. Outputs structured data in multiple formats for various use cases.

## ✨ Features

### 📊 Comprehensive Data Extraction
- **HTML Content**: Clean, structured HTML extraction
- **Markdown Conversion**: Formatted markdown output
- **Structured Data**: News, events, contact information extraction
- **OCR Processing**: Text extraction from images with confidence scoring

### 📁 Multiple Output Formats
- **JSON**: Complete data structure with metadata
- **HTML**: Beautiful, formatted web pages
- **Markdown**: Clean text format for documentation
- **CSV**: Structured data in spreadsheet format

### 🖼️ Advanced Image Processing
- Automatic image download and processing
- PaddleOCR integration for high-accuracy text extraction
- Vertical text support (Japanese, Chinese, etc.)
- Confidence scoring for extracted text
- Optional AWS S3 integration

### ⚡ Efficient Processing
- Batch processing for multiple URLs
- Progress tracking and detailed logging
- Error handling and recovery
- Configurable output options

## 📋 Requirements

- Python 3.8+
- Firecrawl API key
- PaddleOCR (for image text extraction)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd firecrawl-website-crawler
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env file to add your Firecrawl API key
   ```

## 📖 Usage

### Command Line Interface

```bash
# Process a single website
python -m website_crawler.cli https://example.com

# Process multiple websites
python -m website_crawler.cli https://site1.com https://site2.com

# Custom output directory
python -m website_crawler.cli https://example.com --output-dir custom_output

# Disable OCR for faster processing
python -m website_crawler.cli https://example.com --no-ocr

# Verbose logging
python -m website_crawler.cli https://example.com --verbose
```

### Python API

```python
from website_crawler.cli import WebsiteCrawler

# Initialize crawler
crawler = WebsiteCrawler(
    output_dir="outputs",
    enable_ocr=True
)

# Process single website
result = crawler.process_website("https://example.com")

if result['status'] == 'success':
    print(f"Title: {result['title']}")
    print(f"Text length: {result['text_length']:,} characters")
    print(f"Images processed: {result['image_count']}")
```

### Using as a Package

```bash
# Install in development mode
pip install -e .

# Use the CLI command
website-crawler https://example.com
```

## 📂 Project Structure

```
website-crawler/
├── website_crawler/        # Main package
│   ├── cli.py             # Command-line interface
│   ├── config.py          # Configuration management
│   ├── core/              # Core functionality
│   │   ├── scraper.py     # Web scraping
│   │   ├── processor.py   # Text processing
│   │   └── ocr.py         # Image OCR processing
│   ├── models/            # Data models
│   │   ├── data_models.py # Pydantic models
│   │   └── schemas.py     # API schemas
│   ├── outputs/           # Output management
│   │   └── managers.py    # File output handlers
│   └── utils/             # Utilities
│       └── logging.py     # Logging setup
├── examples/              # Usage examples
├── tests/                 # Test files
└── docs/                  # Documentation
```

## 🔧 Configuration

### Environment Variables

```bash
# Required
FIRECRAWL_API_KEY=your_api_key_here

# Optional
LOG_LEVEL=INFO
ENABLE_OCR=true
OCR_CONFIDENCE_THRESHOLD=0.7
DEFAULT_OUTPUT_DIR=outputs
```

### Command Line Options

- `--output-dir`: Specify output directory
- `--filename`: Custom filename (single URL only)
- `--no-ocr`: Disable OCR processing
- `--verbose, -v`: Enable verbose logging
- `--log-file`: Specify log file path

## 📊 Output Examples

### JSON Structure
```json
{
  "metadata": {
    "url": "https://example.com",
    "title": "Example Site",
    "scraped_at": "2024-01-01T12:00:00",
    "total_text_length": 15420,
    "image_count": 5
  },
  "content": {
    "combined_text": "Integrated text content...",
    "html_content": "Raw HTML content...",
    "markdown_content": "Markdown formatted content...",
    "structured_data": {...},
    "ocr_data": [...]
  }
}
```

### CSV Output (Structured Data)
| Category | Title | Date | URL | Content | Additional |
|----------|-------|------|-----|---------|------------|
| News | Latest Update | 2024-01-01 | https://... | Content description | |
| Event | Workshop | 2024-01-15 | | Event details | Location: Room A |

## 🔍 Development

### Run Examples

```bash
# Basic usage
python examples/basic_usage.py

# Batch processing
python examples/batch_processing.py
```

### Install Development Dependencies

```bash
pip install -e ".[dev]"
```

### Code Formatting

```bash
# Format code
black website_crawler/
isort website_crawler/

# Type checking
mypy website_crawler/
```

## 🐛 Troubleshooting

### Common Issues

1. **API Key Error**
   ```
   ValueError: FIRECRAWL_API_KEY environment variable is required
   ```
   Solution: Set your API key in `.env` file

2. **OCR Library Error**
   ```
   ImportError: No module named 'paddleocr'
   ```
   Solution: `pip install paddleocr`

3. **Memory Issues**
   ```
   MemoryError: Unable to allocate array
   ```
   Solution: Use `--no-ocr` flag to disable OCR processing

### Log Files

Check `website_crawler.log` for detailed error information and processing logs.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

- 🐛 **Issues**: [GitHub Issues](https://github.com/your-org/firecrawl-website-crawler/issues)
- 📧 **Email**: support@example.com
- 📖 **Documentation**: [Wiki](https://github.com/your-org/firecrawl-website-crawler/wiki)

## 🏷️ Version History

- **v1.0.0**: Initial release with full refactoring
  - Modern package structure
  - CLI interface
  - Multiple output formats
  - OCR integration