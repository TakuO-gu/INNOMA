"""Next.js revalidate API クライアント"""
import os
import json
import logging
from typing import List, Optional
from dataclasses import dataclass

import requests

logger = logging.getLogger(__name__)


@dataclass
class RevalidateResult:
    """再検証結果"""
    success: bool
    revalidated_paths: List[str]
    invalidated_keys: List[str]
    invalidated_by_prefix: int
    error: Optional[str] = None


class RevalidateClient:
    """
    Next.js /api/revalidate エンドポイントのクライアント

    環境変数:
        REVALIDATE_URL: revalidate API の URL (例: http://localhost:3000/api/revalidate)
        REVALIDATE_SECRET: 認証用シークレット
    """

    def __init__(
        self,
        base_url: Optional[str] = None,
        secret: Optional[str] = None,
        timeout: int = 30
    ):
        """
        Args:
            base_url: revalidate API の URL (省略時は環境変数から取得)
            secret: 認証用シークレット (省略時は環境変数から取得)
            timeout: リクエストタイムアウト(秒)
        """
        self.base_url = base_url or os.environ.get('REVALIDATE_URL', '')
        self.secret = secret or os.environ.get('REVALIDATE_SECRET', '')
        self.timeout = timeout

        if not self.base_url:
            logger.warning("REVALIDATE_URL is not configured. Revalidation will be skipped.")
        if not self.secret:
            logger.warning("REVALIDATE_SECRET is not configured. Revalidation will be skipped.")

    @property
    def is_configured(self) -> bool:
        """設定が有効か"""
        return bool(self.base_url and self.secret)

    def revalidate_paths(self, paths: List[str]) -> RevalidateResult:
        """
        URLパスを再検証 (Next.js ISRキャッシュ)

        Args:
            paths: 再検証するURLパスのリスト (例: ["/tokyo-shibuya/procedures/juminhyo"])

        Returns:
            RevalidateResult
        """
        return self._call_revalidate(paths=paths)

    def invalidate_keys(self, keys: List[str]) -> RevalidateResult:
        """
        Artifactキーのキャッシュを無効化 (インメモリキャッシュ)

        Args:
            keys: 無効化するキーのリスト (例: ["tokyo-shibuya/procedures/juminhyo.json"])

        Returns:
            RevalidateResult
        """
        return self._call_revalidate(keys=keys)

    def invalidate_prefix(self, prefix: str) -> RevalidateResult:
        """
        プレフィックスに一致するキャッシュを一括無効化

        Args:
            prefix: プレフィックス (例: "tokyo-shibuya/")

        Returns:
            RevalidateResult
        """
        return self._call_revalidate(prefix=prefix)

    def revalidate(
        self,
        paths: Optional[List[str]] = None,
        keys: Optional[List[str]] = None,
        prefix: Optional[str] = None
    ) -> RevalidateResult:
        """
        再検証を実行（複合）

        Args:
            paths: URLパスのリスト (Next.js ISR)
            keys: Artifactキーのリスト (インメモリ)
            prefix: プレフィックス (一括無効化)

        Returns:
            RevalidateResult
        """
        return self._call_revalidate(paths=paths, keys=keys, prefix=prefix)

    def _call_revalidate(
        self,
        paths: Optional[List[str]] = None,
        keys: Optional[List[str]] = None,
        prefix: Optional[str] = None
    ) -> RevalidateResult:
        """API呼び出し"""
        if not self.is_configured:
            logger.info("Revalidation skipped: not configured")
            return RevalidateResult(
                success=False,
                revalidated_paths=[],
                invalidated_keys=[],
                invalidated_by_prefix=0,
                error="Not configured"
            )

        body = {}
        if paths:
            body['paths'] = paths
        if keys:
            body['keys'] = keys
        if prefix:
            body['prefix'] = prefix

        if not body:
            return RevalidateResult(
                success=False,
                revalidated_paths=[],
                invalidated_keys=[],
                invalidated_by_prefix=0,
                error="No paths, keys, or prefix provided"
            )

        try:
            response = requests.post(
                self.base_url,
                json=body,
                headers={
                    'Content-Type': 'application/json',
                    'Authorization': f'Bearer {self.secret}'
                },
                timeout=self.timeout
            )

            if response.status_code == 401:
                logger.error("Revalidation failed: Unauthorized")
                return RevalidateResult(
                    success=False,
                    revalidated_paths=[],
                    invalidated_keys=[],
                    invalidated_by_prefix=0,
                    error="Unauthorized"
                )

            if response.status_code != 200:
                logger.error(f"Revalidation failed: HTTP {response.status_code}")
                return RevalidateResult(
                    success=False,
                    revalidated_paths=[],
                    invalidated_keys=[],
                    invalidated_by_prefix=0,
                    error=f"HTTP {response.status_code}"
                )

            data = response.json()

            result = RevalidateResult(
                success=data.get('success', False),
                revalidated_paths=data.get('revalidatedPaths', []),
                invalidated_keys=data.get('invalidatedKeys', []),
                invalidated_by_prefix=data.get('invalidatedByPrefix', 0)
            )

            logger.info(
                f"Revalidation completed: "
                f"{len(result.revalidated_paths)} paths, "
                f"{len(result.invalidated_keys)} keys, "
                f"{result.invalidated_by_prefix} by prefix"
            )

            return result

        except requests.exceptions.Timeout:
            logger.error("Revalidation failed: Timeout")
            return RevalidateResult(
                success=False,
                revalidated_paths=[],
                invalidated_keys=[],
                invalidated_by_prefix=0,
                error="Timeout"
            )
        except requests.exceptions.RequestException as e:
            logger.error(f"Revalidation failed: {e}")
            return RevalidateResult(
                success=False,
                revalidated_paths=[],
                invalidated_keys=[],
                invalidated_by_prefix=0,
                error=str(e)
            )
        except json.JSONDecodeError:
            logger.error("Revalidation failed: Invalid JSON response")
            return RevalidateResult(
                success=False,
                revalidated_paths=[],
                invalidated_keys=[],
                invalidated_by_prefix=0,
                error="Invalid JSON response"
            )


# シングルトンインスタンス
_client: Optional[RevalidateClient] = None


def get_revalidate_client() -> RevalidateClient:
    """デフォルトのRevalidateClientを取得"""
    global _client
    if _client is None:
        _client = RevalidateClient()
    return _client


def revalidate_paths(paths: List[str]) -> RevalidateResult:
    """URLパスを再検証（ショートカット）"""
    return get_revalidate_client().revalidate_paths(paths)


def invalidate_municipality(municipality_id: str) -> RevalidateResult:
    """自治体のキャッシュを一括無効化（ショートカット）"""
    return get_revalidate_client().invalidate_prefix(f"{municipality_id}/")
