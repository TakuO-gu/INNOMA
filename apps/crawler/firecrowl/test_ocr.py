#!/usr/bin/env python3
"""
OCR機能のテスト用スクリプト
"""

import os
from image_processor import ImageProcessor

def test_ocr():
    print("=== OCR機能テスト ===")
    
    try:
        processor = ImageProcessor(
            ocr_enabled=True, 
            save_images=False,
            debug_ocr=True
        )
        
        print(f"✅ ImageProcessor 初期化成功")
        print(f"   OCR有効: {processor.ocr_enabled}")
        print(f"   日本語OCR: {processor.ocr is not None}")
        print(f"   英語OCR: {hasattr(processor, 'ocr_en') and processor.ocr_en is not None}")
        
        if processor.ocr_enabled:
            print("\n✅ OCR機能が利用可能です！")
        else:
            print("\n❌ OCR機能が利用できません")
            
    except Exception as e:
        print(f"❌ エラー: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_ocr()