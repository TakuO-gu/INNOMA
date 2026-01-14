#!/usr/bin/env python3
"""CLIエントリーポイント"""
import argparse
import sys
from pathlib import Path

from .crawler import WebCrawler

# プロジェクトルートからの相対パス
PROJECT_ROOT = Path(__file__).resolve().parents[4]
DEFAULT_OUTPUT_DIR = PROJECT_ROOT / 'data' / 'crawl'


def main():
    """メイン関数"""
    parser = argparse.ArgumentParser(
        description='指定ドメイン配下のHTMLを完全クロールしてDOM(JSON)に変換'
    )

    parser.add_argument(
        'start_url',
        help='クロール開始URL (例: https://example.com/)'
    )

    parser.add_argument(
        '-o', '--output',
        default=str(DEFAULT_OUTPUT_DIR),
        help=f'出力ディレクトリ (デフォルト: {DEFAULT_OUTPUT_DIR})'
    )

    parser.add_argument(
        '-t', '--timeout',
        type=int,
        default=10,
        help='HTTPリクエストタイムアウト秒数 (デフォルト: 10)'
    )

    parser.add_argument(
        '-d', '--delay',
        type=float,
        default=0.5,
        help='リクエスト間の待機時間秒数 (デフォルト: 0.5)'
    )

    args = parser.parse_args()

    # URLバリデーション
    if not (args.start_url.startswith('http://') or
            args.start_url.startswith('https://')):
        print('エラー: start_url は http:// または https:// で始まる必要があります',
              file=sys.stderr)
        sys.exit(1)

    # クローラー実行
    try:
        crawler = WebCrawler(
            start_url=args.start_url,
            output_dir=args.output,
            timeout=args.timeout,
            delay=args.delay
        )
        crawler.crawl()
    except KeyboardInterrupt:
        print('\nクロールを中断しました')
        sys.exit(1)
    except Exception as e:
        print(f'エラー: {e}', file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
