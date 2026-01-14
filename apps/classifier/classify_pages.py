#!/usr/bin/env python3
"""
ページ分類バッチ処理スクリプト

Usage:
    python classify_pages.py <input_dir> [--output <output_file>] [--limit <n>]

Example:
    python classify_pages.py /path/to/crawler/output --output results.json --limit 10
"""

import argparse
import json
from pathlib import Path
from typing import List, Dict
from page_classifier import PageClassifier, load_json_file, save_json_file


def find_json_files(directory: Path, limit: int | None = None) -> List[Path]:
    """
    ディレクトリ内のJSONファイルを検索

    Args:
        directory: 検索するディレクトリ
        limit: 処理するファイル数の上限

    Returns:
        JSONファイルのパスのリスト
    """
    json_files = sorted(directory.glob("*.json"))
    if limit:
        json_files = json_files[:limit]
    return json_files


def main():
    parser = argparse.ArgumentParser(
        description="クローラーで取得したページデータを分類します"
    )
    parser.add_argument(
        "input_dir",
        type=Path,
        help="クローラーの出力ディレクトリ"
    )
    parser.add_argument(
        "--output", "-o",
        type=Path,
        default="classification_results.json",
        help="結果を保存するファイル (デフォルト: classification_results.json)"
    )
    parser.add_argument(
        "--limit", "-l",
        type=int,
        help="処理するファイル数の上限"
    )
    parser.add_argument(
        "--summary", "-s",
        action="store_true",
        help="サマリーを表示"
    )

    args = parser.parse_args()

    if not args.input_dir.exists():
        print(f"エラー: ディレクトリが存在しません: {args.input_dir}")
        return 1

    print(f"入力ディレクトリ: {args.input_dir}")
    print(f"出力ファイル: {args.output}")

    # JSONファイルを検索
    json_files = find_json_files(args.input_dir, args.limit)
    print(f"見つかったファイル数: {len(json_files)}")

    if not json_files:
        print("処理するファイルがありません")
        return 1

    # 分類器を初期化
    classifier = PageClassifier()

    # 全ファイルを読み込み
    print("\nファイルを読み込み中...")
    page_data_list = []
    file_names = []
    for file_path in json_files:
        try:
            page_data = load_json_file(file_path)
            page_data_list.append(page_data)
            file_names.append(file_path.name)
        except Exception as e:
            print(f"  警告: {file_path.name} の読み込みに失敗: {str(e)}")
            page_data_list.append({"url": "", "title": "", "headings": [], "links": []})
            file_names.append(file_path.name)

    # バッチ処理で分類
    print(f"\n分類を開始します...")
    print("=" * 80)
    results = classifier.classify_batch(page_data_list)

    # ファイル名を追加
    for i, result in enumerate(results):
        result["file_name"] = file_names[i]

        # 進捗表示
        if (i + 1) % 10 == 0 or (i + 1) == len(results):
            print(f"\n処理済み: {i + 1}/{len(results)} ページ")

    # 結果を保存
    save_json_file(results, args.output)
    print(f"\n結果を保存しました: {args.output}")

    # サマリーを表示
    if args.summary or True:  # 常にサマリーを表示
        print("\n=== サマリー ===")
        print(f"総ファイル数: {len(results)}")

        # タイプごとの集計
        type_counts = {}
        for result in results:
            page_type = result.get("page_type", "other")
            type_counts[page_type] = type_counts.get(page_type, 0) + 1

        for page_type, count in sorted(type_counts.items()):
            percentage = (count / len(results)) * 100
            print(f"  {page_type}: {count} ({percentage:.1f}%)")

    return 0


if __name__ == "__main__":
    exit(main())
