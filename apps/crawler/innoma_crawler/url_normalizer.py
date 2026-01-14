"""URL正規化モジュール"""
from urllib.parse import urlparse, urljoin, urlunparse


def normalize_url(url: str) -> str:
    """
    URLを正規化する
    - #fragment削除
    - クエリ削除
    - 末尾/統一（ファイル名がない場合のみ）

    Args:
        url: 正規化対象のURL

    Returns:
        正規化されたURL
    """
    parsed = urlparse(url)

    # fragment, query削除
    normalized = urlunparse((
        parsed.scheme,
        parsed.netloc,
        parsed.path,
        '',  # params
        '',  # query
        ''   # fragment
    ))

    # 末尾/統一（ファイル拡張子がない場合のみ）
    # パスの最後の部分に拡張子がない場合は/を追加
    path = parsed.path
    if path and '.' not in path.split('/')[-1]:
        # 最後のパス要素に拡張子がない → ディレクトリとみなす
        if not normalized.endswith('/'):
            normalized += '/'

    return normalized


def is_same_domain(url1: str, url2: str) -> bool:
    """
    2つのURLが同じドメインかどうか判定
    scheme + netloc が一致するか確認

    Args:
        url1: URL1
        url2: URL2

    Returns:
        同じドメインの場合True
    """
    parsed1 = urlparse(url1)
    parsed2 = urlparse(url2)

    return (parsed1.scheme == parsed2.scheme and
            parsed1.netloc == parsed2.netloc)


def resolve_url(base_url: str, href: str) -> str:
    """
    相対URLを絶対URLに変換

    Args:
        base_url: 基準となるURL
        href: 相対または絶対URL

    Returns:
        絶対URL
    """
    return urljoin(base_url, href)


def is_valid_http_url(url: str) -> bool:
    """
    有効なHTTP(S) URLかどうか判定

    Args:
        url: 検証対象のURL

    Returns:
        有効なHTTP(S) URLの場合True
    """
    try:
        parsed = urlparse(url)
        return parsed.scheme in ('http', 'https') and bool(parsed.netloc)
    except Exception:
        return False


def should_skip_url(url: str) -> bool:
    """
    クロール対象外のURLかどうか判定
    mailto:, tel:, javascript: などを除外

    Args:
        url: 検証対象のURL

    Returns:
        スキップすべきURLの場合True
    """
    url_lower = url.lower().strip()
    skip_schemes = ('mailto:', 'tel:', 'javascript:', 'data:', 'file:')

    return any(url_lower.startswith(scheme) for scheme in skip_schemes)
