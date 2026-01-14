#!/usr/bin/env python3
"""
利用可能なモデルを一覧表示
"""

import os
from google import genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("Error: GEMINI_API_KEY not found")
    exit(1)

client = genai.Client(api_key=api_key)

print("Available models:")
print("=" * 80)

try:
    models = client.models.list()
    for model in models:
        if hasattr(model, 'name'):
            print(f"- {model.name}")
            if hasattr(model, 'supported_generation_methods'):
                print(f"  Supported methods: {model.supported_generation_methods}")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
