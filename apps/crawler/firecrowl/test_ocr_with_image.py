#!/usr/bin/env python3
"""
実際の画像を使ったOCR機能のテスト
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from src.image_processor import ImageProcessor
import logging

# ログ設定
logging.basicConfig(level=logging.INFO)

def test_ocr_with_downloaded_images():
    print("=== 実際の画像を使ったOCR機能テスト ===")
    
    # ダウンロード済み画像フォルダ確認
    image_dir = Path("downloaded_images")
    if not image_dir.exists():
        print("❌ downloaded_imagesフォルダが見つかりません")
        return
    
    image_files = list(image_dir.glob("*.jpg")) + list(image_dir.glob("*.png"))
    if not image_files:
        print("❌ テスト用画像が見つかりません")
        return
    
    print(f"📸 テスト用画像を発見: {len(image_files)}件")
    
    # ImageProcessor初期化
    processor = ImageProcessor(
        ocr_enabled=True,
        save_images=False,  # 既存ファイルなので保存不要
        debug_ocr=True
    )
    
    if not processor.ocr_enabled:
        print("❌ OCR機能が無効です")
        return
    
    # 最初の3つの画像でテスト
    test_images = image_files[:3]
    success_count = 0
    
    for i, image_path in enumerate(test_images, 1):
        print(f"\n📋 テスト {i}/{len(test_images)}: {image_path.name}")
        
        try:
            # 画像ファイルから直接OCR実行
            from PIL import Image
            import numpy as np
            
            img = Image.open(image_path)
            img_array = np.array(img)
            
            # 日本語OCRテスト
            if processor.ocr:
                result = processor.ocr.ocr(img_array)
                if result and result[0]:
                    texts = []
                    for line in result[0]:
                        if line and len(line) >= 2:
                            text = line[1][0] if line[1] else ''
                            confidence = line[1][1] if line[1] and len(line[1]) > 1 else 0.0
                            if text.strip():
                                texts.append(f"{text.strip()} (信頼度: {confidence:.2f})")
                    
                    if texts:
                        print(f"✅ OCR成功: {len(texts)}行検出")
                        for text in texts[:3]:  # 最初の3行のみ表示
                            print(f"   - {text}")
                        if len(texts) > 3:
                            print(f"   ... および他{len(texts)-3}行")
                        success_count += 1
                    else:
                        print("⚠️  テキストが検出されませんでした")
                else:
                    print("⚠️  OCR結果が空です")
            else:
                print("❌ OCRエンジンが初期化されていません")
                
        except Exception as e:
            print(f"❌ エラー: {e}")
    
    print(f"\n📊 テスト結果: {success_count}/{len(test_images)} 件成功")
    
    if success_count > 0:
        print("✅ OCR機能は正常に動作しています！")
        return True
    else:
        print("❌ OCR機能に問題があります")
        return False

if __name__ == "__main__":
    test_ocr_with_downloaded_images()