#!/usr/bin/env python3
"""
単一ファイルをテストするスクリプト
"""

import json
from pathlib import Path
from page_classifier import PageClassifier, load_json_file

def main():
    # サンプルファイルのパス
    sample_files = [
        "../crawler/innoma_crawler/takaoka_output/0018b06eab677bc6.json",
        "../crawler/innoma_crawler/takaoka_output/1064cc767c1bc9ea.json",
    ]

    print("Page Classifier Test")
    print("=" * 50)

    try:
        classifier = PageClassifier()
        print("✓ Classifier initialized successfully")
        print(f"✓ Using model: {classifier.model_name}")
        print()

        for sample_file in sample_files:
            file_path = Path(sample_file)

            if not file_path.exists():
                print(f"✗ File not found: {sample_file}")
                continue

            print(f"Testing: {file_path.name}")
            print("-" * 50)

            page_data = load_json_file(file_path)
            print(f"URL: {page_data.get('url', 'N/A')}")
            print(f"Title: {page_data.get('title', 'N/A')}")
            print(f"Headings: {len(page_data.get('headings', []))}")
            print(f"Links: {len(page_data.get('links', []))}")
            print()

            # 分類実行
            print("Classifying...")
            result = classifier.classify(page_data)

            print(f"Page Type: {result['page_type']}")
            print(f"Confidence: {result.get('confidence', 'N/A')}")
            print(f"Reasoning: {result.get('reasoning', 'N/A')}")

            if 'error' in result:
                print(f"Error: {result['error']}")

            print("=" * 50)
            print()

    except Exception as e:
        print(f"✗ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1

    return 0

if __name__ == "__main__":
    exit(main())
