"""
ページタイプ分類器

Crawlerで取得したDOMデータを元に、ページを以下のカテゴリーに分類します:
1. Service page: 1ページで読了できる長さのページ
2. Guide page: 1ページで読了できない、複数ページへのリンクをまとめるページ
3. Step-by-step page: 1ページで読了できない、明確な開始点と終了点があり、
                      タスクを決まった順序で完了する必要がある手続き
4. Other: その他
"""

import json
import os
import time
from typing import Dict, List, Literal
from pathlib import Path
from google import genai
from google.genai import types
from dotenv import load_dotenv


PageType = Literal["service_page", "guide_page", "step_by_step_page", "other"]


class PageClassifier:
    """Gemini APIを使用してページタイプを分類するクラス"""

    def __init__(self, api_key: str | None = None):
        """
        初期化

        Args:
            api_key: Gemini API キー。Noneの場合は環境変数から取得
        """
        load_dotenv()
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY is required")

        self.client = genai.Client(api_key=self.api_key)
        self.model_name = "models/gemini-2.5-flash"

    def _create_batch_prompt(self, page_data_list: List[Dict]) -> str:
        """
        複数ページの一括分類用プロンプトを生成

        Args:
            page_data_list: クローラーから取得したページデータのリスト（最大10個）

        Returns:
            Gemini APIに送信するプロンプト
        """
        pages_info = []
        for idx, page_data in enumerate(page_data_list, 1):
            # 見出しをテキスト形式に変換
            headings_text = "\n".join([
                f"{'#' * h['level']} {h['text']}"
                for h in page_data.get("headings", [])[:15]  # 最初の15個のみ
            ])

            # リンクをテキスト形式に変換
            links_text = "\n".join([
                f"- {link['text']}"
                for link in page_data.get("links", [])[:10]  # 最初の10個のみ
            ])

            page_info = f"""
[ページ {idx}]
URL: {page_data.get('url', 'N/A')}
タイトル: {page_data.get('title', 'N/A')}
見出し構造:
{headings_text if headings_text else '(なし)'}
リンク数: {len(page_data.get('links', []))}
主要リンク:
{links_text if links_text else '(なし)'}
"""
            pages_info.append(page_info)

        prompt = f"""以下の複数のページ情報を分析して、それぞれのページタイプを分類してください。

【分類基準】
1. service_page: 1ページで読了できる長さのページ。具体的なサービスや情報を提供している。
2. guide_page: 1ページで読了できない、複数のページへのリンクをまとめているナビゲーションページ。カタログやディレクトリのような役割。
3. step_by_step_page: 1ページで読了できない、明確な開始点と終了点があり、タスクを決まった順序で完了する必要がある手続きを説明するページ。申請手順や登録手順など。
4. other: 上記のいずれにも該当しないページ。

【ページ情報】
{''.join(pages_info)}

【出力形式】
以下のJSON配列形式で回答してください。各ページに対して順番に結果を返してください:
[
  {{
    "page_index": 1,
    "page_type": "service_page|guide_page|step_by_step_page|other",
    "confidence": 0.0-1.0,
    "reasoning": "分類の理由を日本語で簡潔に説明"
  }},
  ...
]

JSON形式のみで回答してください。他のテキストは含めないでください。
"""
        return prompt

    def classify_batch_chunk(self, page_data_list: List[Dict], max_retries: int = 3) -> List[Dict]:
        """
        最大10ページをまとめて分類

        Args:
            page_data_list: ページデータのリスト（最大10個）
            max_retries: リトライ最大回数

        Returns:
            分類結果のリスト
        """
        if len(page_data_list) > 10:
            raise ValueError("一度に処理できるページは最大10個です")

        prompt = self._create_batch_prompt(page_data_list)

        for attempt in range(max_retries):
            try:
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=prompt
                )
                result_text = response.text.strip()

                # JSONブロックから抽出
                if "```json" in result_text:
                    result_text = result_text.split("```json")[1].split("```")[0].strip()
                elif "```" in result_text:
                    result_text = result_text.split("```")[1].split("```")[0].strip()

                classifications = json.loads(result_text)

                # 結果にページ情報を追加
                results = []
                for i, page_data in enumerate(page_data_list):
                    if i < len(classifications):
                        result = classifications[i]
                        result["url"] = page_data.get("url", "")
                        result["title"] = page_data.get("title", "")
                        results.append(result)
                    else:
                        # 結果が足りない場合
                        results.append({
                            "page_type": "other",
                            "confidence": 0.0,
                            "reasoning": "分類結果が返されませんでした",
                            "url": page_data.get("url", ""),
                            "title": page_data.get("title", "")
                        })

                return results

            except Exception as e:
                error_str = str(e)

                # レート制限エラーの場合はリトライ
                if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
                    if attempt < max_retries - 1:
                        wait_time = 15
                        if "retry in" in error_str.lower():
                            try:
                                import re
                                match = re.search(r'(\d+(?:\.\d+)?)\s*s', error_str)
                                if match:
                                    wait_time = float(match.group(1)) + 1
                            except:
                                pass

                        print(f"  レート制限エラー。{wait_time}秒待機してリトライします...")
                        time.sleep(wait_time)
                        continue

                # その他のエラーまたは最終リトライ
                print(f"  エラー: {error_str[:200]}")
                return [{
                    "page_type": "other",
                    "confidence": 0.0,
                    "reasoning": f"分類エラー: {error_str[:100]}",
                    "url": page_data.get("url", ""),
                    "title": page_data.get("title", ""),
                    "error": error_str[:300]
                } for page_data in page_data_list]

        # 全リトライ失敗
        return [{
            "page_type": "other",
            "confidence": 0.0,
            "reasoning": "最大リトライ回数に達しました",
            "url": page_data.get("url", ""),
            "title": page_data.get("title", ""),
            "error": "Max retries exceeded"
        } for page_data in page_data_list]

    def classify_batch(self, page_data_list: List[Dict], batch_size: int = 10, requests_per_minute: int = 5) -> List[Dict]:
        """
        複数のページを一括分類（10個ずつまとめて処理、レート制限対応）

        Args:
            page_data_list: ページデータのリスト
            batch_size: 1リクエストあたりのページ数（デフォルト: 10）
            requests_per_minute: 1分間のリクエスト数上限（デフォルト: 5）

        Returns:
            分類結果のリスト
        """
        results = []
        total_pages = len(page_data_list)
        total_batches = (total_pages + batch_size - 1) // batch_size

        # レート制限対応: 1分間あたりのリクエスト数を制限
        request_interval = 60.0 / requests_per_minute  # 5リクエスト/分 = 12秒間隔
        last_request_time = 0

        print(f"合計 {total_pages} ページを {total_batches} バッチで処理します")
        print(f"レート制限: {requests_per_minute}リクエスト/分 (リクエスト間隔: {request_interval:.1f}秒)")
        print()

        for batch_idx in range(0, total_pages, batch_size):
            batch_end = min(batch_idx + batch_size, total_pages)
            batch_data = page_data_list[batch_idx:batch_end]
            batch_num = (batch_idx // batch_size) + 1

            print(f"[バッチ {batch_num}/{total_batches}] ページ {batch_idx + 1}-{batch_end} を処理中...")

            # レート制限対応: 前回のリクエストから一定時間待機
            if last_request_time > 0:
                elapsed = time.time() - last_request_time
                if elapsed < request_interval:
                    wait_time = request_interval - elapsed
                    print(f"  レート制限対応のため {wait_time:.1f}秒 待機...")
                    time.sleep(wait_time)

            # バッチ処理
            last_request_time = time.time()
            batch_results = self.classify_batch_chunk(batch_data)
            results.extend(batch_results)

            # 成功したページ数をカウント
            success_count = sum(1 for r in batch_results if r.get("page_type") != "other" or "error" not in r)
            print(f"  完了: {len(batch_results)}ページ処理 ({success_count}件成功)")
            print()

        return results


def load_json_file(file_path: str | Path) -> Dict:
    """JSONファイルを読み込む"""
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_json_file(data: any, file_path: str | Path) -> None:
    """JSONファイルに保存"""
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    # 使用例
    classifier = PageClassifier()

    # サンプルファイルで試す
    sample_file = Path("/Users/ogtk/INNOMA/INNOMA/apps/crawler/innoma_crawler/takaoka_output/0018b06eab677bc6.json")

    if sample_file.exists():
        page_data = load_json_file(sample_file)
        result = classifier.classify(page_data)

        print("\n=== 分類結果 ===")
        print(json.dumps(result, ensure_ascii=False, indent=2))
