"""Webクローラーメインモジュール"""
import hashlib
import json
import os
import time
from collections import deque
from typing import Set, Deque, Optional, List
from pathlib import Path

import requests
from bs4 import BeautifulSoup

from .url_normalizer import (
    normalize_url,
    is_same_domain,
    resolve_url,
    is_valid_http_url,
    should_skip_url
)
from .dom_converter import convert_html_to_dom
from .revalidate import RevalidateClient, RevalidateResult


class WebCrawler:
    """指定ドメイン配下のHTMLを完全クロールするクローラー"""

    def __init__(
        self,
        start_url: str,
        output_dir: str = 'output',
        timeout: int = 10,
        delay: float = 0.5,
        municipality_id: Optional[str] = None,
        revalidate_url: Optional[str] = None,
        revalidate_secret: Optional[str] = None
    ):
        """
        Args:
            start_url: クロール開始URL
            output_dir: JSON出力ディレクトリ
            timeout: HTTPリクエストタイムアウト(秒)
            delay: リクエスト間の待機時間(秒)
            municipality_id: 自治体ID（revalidate時に使用）
            revalidate_url: Next.js revalidate API の URL
            revalidate_secret: revalidate API の認証シークレット
        """
        self.start_url = normalize_url(start_url)
        self.output_dir = Path(output_dir)
        self.timeout = timeout
        self.delay = delay
        self.municipality_id = municipality_id

        # クロール状態管理
        self.visited_urls: Set[str] = set()
        self.url_queue: Deque[str] = deque([self.start_url])

        # 更新されたパスを記録（revalidate用）
        self.updated_paths: List[str] = []

        # 統計情報
        self.total_crawled = 0
        self.total_skipped = 0
        self.total_errors = 0

        # Revalidate クライアント
        self.revalidate_client = RevalidateClient(
            base_url=revalidate_url,
            secret=revalidate_secret
        )

        # 出力ディレクトリ作成
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def crawl(self) -> None:
        """クロール実行"""
        print(f"クロール開始: {self.start_url}")
        print(f"出力先: {self.output_dir}")
        print("-" * 60)

        while self.url_queue:
            url = self.url_queue.popleft()

            # 既に訪問済みならスキップ
            if url in self.visited_urls:
                continue

            # 訪問済みに追加
            self.visited_urls.add(url)

            # ページ取得・処理
            self._crawl_page(url)

            # 待機
            if self.url_queue:
                time.sleep(self.delay)

        print("-" * 60)
        print(f"クロール完了")
        print(f"  取得成功: {self.total_crawled}件")
        print(f"  スキップ: {self.total_skipped}件")
        print(f"  エラー: {self.total_errors}件")

        # Artifact更新をNext.jsに通知
        self._notify_revalidate()

    def _crawl_page(self, url: str) -> None:
        """
        1ページをクロール

        Args:
            url: クロール対象URL
        """
        print(f"[{len(self.visited_urls)}] {url}")

        try:
            # HTTP GET
            response = requests.get(
                url,
                timeout=self.timeout,
                headers={'User-Agent': 'Mozilla/5.0 INNOMA Crawler'}
            )

            # ステータスコード確認
            if response.status_code != 200:
                print(f"  ⚠ Status {response.status_code}")
                self.total_skipped += 1
                return

            # Content-Type確認
            content_type = response.headers.get('Content-Type', '')
            if 'text/html' not in content_type.lower():
                print(f"  ⚠ Not HTML: {content_type}")
                self.total_skipped += 1
                return

            # エンコーディングを明示的に設定
            # response.encodingがNoneまたは不適切な場合、apparent_encodingを使用
            if response.encoding is None or response.encoding.lower() in ['iso-8859-1', 'ascii']:
                response.encoding = response.apparent_encoding

            # HTML取得
            html = response.text

            # リンク抽出・キューに追加
            self._extract_and_enqueue_links(url, html)

            # DOM変換
            dom_data = convert_html_to_dom(html, url)

            # JSON保存
            self._save_json(url, dom_data)

            # revalidate用にパスを記録
            if self.municipality_id:
                artifact_path = f"/{self.municipality_id}/{self._url_to_filename(url).replace('.json', '')}"
                self.updated_paths.append(artifact_path)

            self.total_crawled += 1
            print(f"  ✓ 保存完了")

        except requests.exceptions.Timeout:
            print(f"  ✗ Timeout")
            self.total_errors += 1
        except requests.exceptions.RequestException as e:
            print(f"  ✗ Request Error: {e}")
            self.total_errors += 1
        except Exception as e:
            print(f"  ✗ Error: {e}")
            self.total_errors += 1

    def _extract_and_enqueue_links(self, base_url: str, html: str) -> None:
        """
        HTML内のリンクを抽出してキューに追加

        Args:
            base_url: 基準URL
            html: HTML文字列
        """
        soup = BeautifulSoup(html, 'lxml')
        new_links_count = 0

        for a_tag in soup.find_all('a', href=True):
            href = a_tag.get('href', '').strip()

            if not href:
                continue

            # スキップ対象のURLか確認
            if should_skip_url(href):
                continue

            # 絶対URLに変換
            absolute_url = resolve_url(base_url, href)

            # 有効なHTTP URLか確認
            if not is_valid_http_url(absolute_url):
                continue

            # 同一ドメインか確認
            if not is_same_domain(self.start_url, absolute_url):
                continue

            # URL正規化
            normalized_url = normalize_url(absolute_url)

            # 未訪問かつキューに未追加なら追加
            if (normalized_url not in self.visited_urls and
                normalized_url not in self.url_queue):
                self.url_queue.append(normalized_url)
                new_links_count += 1

        if new_links_count > 0:
            print(f"  → 新規リンク {new_links_count}件発見")

    def _save_json(self, url: str, data: dict) -> None:
        """
        DOM データをJSON形式で保存

        Args:
            url: ページURL
            data: DOM データ
        """
        # URLをハッシュ化してファイル名生成
        filename = self._url_to_filename(url)
        filepath = self.output_dir / filename

        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    def _url_to_filename(self, url: str) -> str:
        """
        URLからファイル名を生成

        Args:
            url: URL

        Returns:
            ファイル名
        """
        # URLをSHA256ハッシュ化
        url_hash = hashlib.sha256(url.encode('utf-8')).hexdigest()[:16]
        return f"{url_hash}.json"

    def _notify_revalidate(self) -> Optional[RevalidateResult]:
        """
        Next.jsにArtifact更新を通知

        Returns:
            RevalidateResult or None
        """
        if not self.revalidate_client.is_configured:
            print("\n⚠ Revalidate: 未設定のためスキップ")
            return None

        if not self.updated_paths and not self.municipality_id:
            print("\n⚠ Revalidate: 更新パスがないためスキップ")
            return None

        print("\n" + "-" * 60)
        print("Next.js キャッシュ再検証")

        # 方法1: 個別パスを再検証（パスが少ない場合）
        # 方法2: プレフィックスで一括無効化（パスが多い場合）
        if self.municipality_id and len(self.updated_paths) > 10:
            # プレフィックスで一括無効化
            print(f"  方式: プレフィックス一括 ({self.municipality_id}/)")
            result = self.revalidate_client.invalidate_prefix(f"{self.municipality_id}/")
        elif self.updated_paths:
            # 個別パスを再検証
            print(f"  方式: 個別パス ({len(self.updated_paths)}件)")
            result = self.revalidate_client.revalidate_paths(self.updated_paths)
        else:
            return None

        if result.success:
            print(f"  ✓ 再検証完了")
            print(f"    パス: {len(result.revalidated_paths)}件")
            print(f"    キー: {len(result.invalidated_keys)}件")
            print(f"    プレフィックス: {result.invalidated_by_prefix}件")
        else:
            print(f"  ✗ 再検証失敗: {result.error}")

        return result
