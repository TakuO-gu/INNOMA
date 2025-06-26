#!/usr/bin/env python3
"""
メイン実行スクリプト
"""

import json
import logging
from dotenv import load_dotenv
from firecrawl_scraper import FirecrawlScraper

# 環境変数の読み込み
load_dotenv()

# ログ設定
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def main():
    """メイン実行関数"""
    
    # 設定
    SAMPLE_URLS = [
        "https://www.u-toyama.ac.jp/",  # 富山大学
    ]
    
    try:
        # スクレーパー初期化（画像OCR有効、デバッグ有効）
        scraper = FirecrawlScraper(
            enable_image_ocr=True,  # 画像OCRを有効に
            image_save_dir="downloaded_images",
            s3_bucket=None,  # S3を使用する場合はバケット名を指定
            debug_ocr=True   # OCRデバッグ情報を表示
        )
        
        # 単一URL のサンプル
        logger.info("=== 包括的データ抽出サンプル ===")
        comprehensive_result = scraper.extract_comprehensive_data(SAMPLE_URLS[0])
        
        # 構造化データのみ表示
        structured_data = comprehensive_result.get('structured_data', {})
        print("構造化データサンプル:")
        print(json.dumps(structured_data, ensure_ascii=False, indent=2)[:1000] + "...")
        
        # 全データをファイルに保存
        with open("comprehensive_sample.json", "w", encoding="utf-8") as f:
            json.dump(comprehensive_result, f, ensure_ascii=False, indent=2)
        logger.info("包括的データを comprehensive_sample.json に保存しました")
        
        # 複数URL の一括処理サンプル
        logger.info("=== 一括スクレーピングサンプル ===")
        batch_results = scraper.batch_scrape(
            urls=SAMPLE_URLS,
            output_file="municipality_data.json"
        )
        
        # 結果サマリー表示
        successful = len([r for r in batch_results if r.get('scrape_status') == 'success'])
        logger.info(f"処理完了: 成功 {successful}/{len(SAMPLE_URLS)} 件")
        
    except Exception as e:
        logger.error(f"実行エラー: {e}")
        raise


if __name__ == "__main__":
    main()