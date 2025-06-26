#!/usr/bin/env python3
"""
ウェブサイト統合テキスト抽出システム - メイン実行スクリプト

Firecrawlを使用してウェブサイトの情報を完全にテキスト化し、
JSON、HTML、Markdownの各フォーマットで適切なディレクトリに保存します。

使用例:
    python website_crawler.py "https://www.u-toyama.ac.jp/"
    python website_crawler.py "https://example.com/" --output-dir custom_output
"""

import sys
import argparse
import logging
from pathlib import Path
from dotenv import load_dotenv

# プロジェクトのsrcディレクトリをパスに追加
sys.path.insert(0, str(Path(__file__).parent / "src"))

from src.web_scraper import WebScraper
from src.text_processor import TextProcessor
from src.output_manager import OutputManager

# 環境変数読み込み
load_dotenv()

# ログ設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('website_crawler.log', encoding='utf-8')
    ]
)
logger = logging.getLogger(__name__)


class WebsiteCrawler:
    """ウェブサイト統合処理システム"""
    
    def __init__(self, output_dir: str = "outputs", enable_ocr: bool = True):
        """
        初期化
        
        Args:
            output_dir: 出力ディレクトリ
            enable_ocr: OCR機能を有効にするか
        """
        self.scraper = WebScraper(enable_image_ocr=enable_ocr)
        self.text_processor = TextProcessor()
        self.output_manager = OutputManager(output_dir)
        
        logger.info("ウェブサイトクローラーを初期化しました")
    
    def process_website(self, url: str, filename: str = None) -> dict:
        """
        ウェブサイトを処理して各フォーマットで保存
        
        Args:
            url: 処理対象のURL
            filename: 出力ファイル名（指定しない場合は自動生成）
            
        Returns:
            処理結果の辞書
        """
        try:
            logger.info(f"ウェブサイト処理開始: {url}")
            
            # 1. ウェブページスクレーピング
            logger.info("ステップ1: ウェブページスクレーピング")
            scraped_data = self.scraper.scrape_page(url)
            
            # 2. テキスト統合処理
            logger.info("ステップ2: テキスト統合処理")
            website_data = self.text_processor.process_scraped_data(scraped_data)
            
            # 3. ファイル出力
            logger.info("ステップ3: ファイル出力")
            file_paths = self.output_manager.save_website_data(website_data, filename)
            
            # 処理結果
            result = {
                'status': 'success',
                'url': url,
                'title': website_data.title,
                'text_length': website_data.total_text_length,
                'image_count': website_data.image_count,
                'files': file_paths,
                'website_data': website_data
            }
            
            logger.info(f"ウェブサイト処理完了: {url}")
            logger.info(f"統合テキスト: {website_data.total_text_length:,}文字")
            logger.info(f"処理画像: {website_data.image_count}枚")
            
            return result
            
        except Exception as e:
            logger.error(f"ウェブサイト処理エラー: {e}")
            return {
                'status': 'error',
                'url': url,
                'error': str(e)
            }
    
    def process_multiple_websites(self, urls: list, output_dir: str = None) -> list:
        """
        複数のウェブサイトを一括処理
        
        Args:
            urls: URL一覧
            output_dir: 出力ディレクトリ（指定しない場合はデフォルト）
            
        Returns:
            処理結果一覧
        """
        if output_dir:
            self.output_manager = OutputManager(output_dir)
        
        results = []
        
        for i, url in enumerate(urls, 1):
            logger.info(f"進行状況: {i}/{len(urls)} - {url}")
            
            try:
                result = self.process_website(url)
                results.append(result)
                
                # 10件ごとに中間レポート作成
                if i % 10 == 0:
                    self._create_intermediate_report(results, f"intermediate_report_{i}.md")
                    
            except Exception as e:
                logger.error(f"URL処理エラー {url}: {e}")
                results.append({
                    'status': 'error',
                    'url': url,
                    'error': str(e)
                })
        
        # 最終サマリーレポート作成
        summary_files = []
        for result in results:
            if result['status'] == 'success':
                summary_files.append({
                    'title': result['title'],
                    'url': result['url'],
                    'text_length': result['text_length'],
                    'image_count': result['image_count']
                })
        
        self.output_manager.create_summary_report(summary_files)
        
        # 結果サマリー
        successful = len([r for r in results if r['status'] == 'success'])
        logger.info(f"一括処理完了: 成功 {successful}/{len(urls)} 件")
        
        return results
    
    def _create_intermediate_report(self, results: list, filename: str):
        """中間レポート作成"""
        report_path = self.output_manager.base_output_dir / filename
        
        successful = [r for r in results if r['status'] == 'success']
        failed = [r for r in results if r['status'] == 'error']
        
        content = f"""# 中間処理レポート

**生成日時:** {logging.Formatter().formatTime(logging.LogRecord('', 0, '', 0, '', (), None))}
**処理済み:** {len(results)}件
**成功:** {len(successful)}件
**失敗:** {len(failed)}件

## 成功したサイト
"""
        
        for result in successful:
            content += f"- [{result['title']}]({result['url']}) - {result['text_length']:,}文字\n"
        
        if failed:
            content += "\n## 失敗したサイト\n"
            for result in failed:
                content += f"- {result['url']} - エラー: {result['error']}\n"
        
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        logger.info(f"中間レポート作成: {report_path}")


def main():
    """メイン関数"""
    parser = argparse.ArgumentParser(
        description="ウェブサイト統合テキスト抽出システム"
    )
    parser.add_argument(
        "urls",
        nargs="+",
        help="処理対象のURL（複数指定可能）"
    )
    parser.add_argument(
        "--output-dir",
        default="outputs",
        help="出力ディレクトリ（デフォルト: outputs）"
    )
    parser.add_argument(
        "--no-ocr",
        action="store_true",
        help="OCR機能を無効にする"
    )
    parser.add_argument(
        "--filename",
        help="出力ファイル名（単一URLの場合のみ）"
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="詳細ログを表示"
    )
    
    args = parser.parse_args()
    
    # ログレベル設定
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    try:
        # クローラー初期化
        crawler = WebsiteCrawler(
            output_dir=args.output_dir,
            enable_ocr=not args.no_ocr
        )
        
        # 処理実行
        if len(args.urls) == 1:
            # 単一URL処理
            result = crawler.process_website(args.urls[0], args.filename)
            
            if result['status'] == 'success':
                print(f"\n✅ 処理完了: {result['title']}")
                print(f"📊 統合テキスト: {result['text_length']:,}文字")
                print(f"🖼️  処理画像: {result['image_count']}枚")
                print(f"📁 出力ファイル:")
                for format_type, path in result['files'].items():
                    print(f"   - {format_type.upper()}: {path}")
            else:
                print(f"❌ 処理失敗: {result['error']}")
                sys.exit(1)
        else:
            # 複数URL処理
            results = crawler.process_multiple_websites(args.urls, args.output_dir)
            
            successful = len([r for r in results if r['status'] == 'success'])
            print(f"\n✅ 一括処理完了: {successful}/{len(args.urls)} 件成功")
            print(f"📁 出力ディレクトリ: {args.output_dir}")
        
    except KeyboardInterrupt:
        logger.info("処理が中断されました")
        sys.exit(1)
    except Exception as e:
        logger.error(f"実行エラー: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()