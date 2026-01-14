"""DOM変換モジュール"""
from typing import Dict, List, Any, Optional
from bs4 import BeautifulSoup, Tag


def convert_html_to_dom(html: str, url: str) -> Dict[str, Any]:
    """
    HTMLを意味ベースのDOM構造(JSON)に変換

    Args:
        html: HTML文字列
        url: ページのURL

    Returns:
        DOM構造のdict
    """
    soup = BeautifulSoup(html, 'lxml')

    # 不要なタグを削除
    for tag_name in ['script', 'style', 'nav', 'footer', 'header', 'aside', 'noscript']:
        for tag in soup.find_all(tag_name):
            tag.decompose()

    # タイトル取得
    title = ''
    title_tag = soup.find('title')
    if title_tag:
        title = title_tag.get_text(strip=True)

    # 言語取得
    lang = 'ja'
    html_tag = soup.find('html')
    if html_tag and html_tag.get('lang'):
        lang = html_tag.get('lang')

    # メインコンテンツ抽出
    main_content = _extract_main_content(soup)

    # 見出し抽出
    headings = _extract_headings(main_content or soup)

    # メインコンテンツ構造化
    main_structure = _extract_main_structure(main_content or soup)

    # リンク抽出
    links = _extract_links(main_content or soup)

    return {
        'url': url,
        'title': title,
        'lang': lang,
        'headings': headings,
        'main': main_structure,
        'links': links
    }


def _extract_main_content(soup: BeautifulSoup) -> Optional[Tag]:
    """
    メインコンテンツを抽出
    優先順: main → article → section → body

    Args:
        soup: BeautifulSoupオブジェクト

    Returns:
        メインコンテンツのTag、見つからない場合None
    """
    for tag_name in ['main', 'article', 'section', 'body']:
        tag = soup.find(tag_name)
        if tag:
            return tag
    return None


def _extract_headings(content: Tag) -> List[Dict[str, Any]]:
    """
    見出しを抽出

    Args:
        content: 抽出対象のTag

    Returns:
        見出しのリスト
    """
    headings = []
    for level in range(1, 7):
        for tag in content.find_all(f'h{level}'):
            text = tag.get_text(strip=True)
            if text:
                headings.append({
                    'level': level,
                    'text': text
                })
    return headings


def _extract_main_structure(content: Tag) -> List[Dict[str, Any]]:
    """
    メインコンテンツを構造化

    Args:
        content: 抽出対象のTag

    Returns:
        構造化されたコンテンツのリスト
    """
    structure = []

    # 直接の子要素を処理
    for child in content.children:
        if not isinstance(child, Tag):
            continue

        tag_name = child.name

        # 段落
        if tag_name == 'p':
            text = child.get_text(strip=True)
            if text:
                structure.append({
                    'type': 'p',
                    'text': text
                })

        # 順序なしリスト
        elif tag_name == 'ul':
            items = []
            for li in child.find_all('li', recursive=False):
                text = li.get_text(strip=True)
                if text:
                    items.append(text)
            if items:
                structure.append({
                    'type': 'ul',
                    'items': items
                })

        # 順序付きリスト
        elif tag_name == 'ol':
            items = []
            for li in child.find_all('li', recursive=False):
                text = li.get_text(strip=True)
                if text:
                    items.append(text)
            if items:
                structure.append({
                    'type': 'ol',
                    'items': items
                })

        # div, section, articleは再帰的に処理
        elif tag_name in ['div', 'section', 'article']:
            # 直接のテキストがあれば段落として扱う
            text = child.get_text(strip=True)
            if text and len(text) < 1000:  # 長すぎるテキストは除外
                # 子要素がない場合のみテキストとして追加
                if not child.find_all(['p', 'ul', 'ol', 'div', 'section', 'article']):
                    structure.append({
                        'type': 'p',
                        'text': text
                    })

    return structure


def _extract_links(content: Tag) -> List[Dict[str, str]]:
    """
    リンクを抽出

    Args:
        content: 抽出対象のTag

    Returns:
        リンクのリスト
    """
    links = []
    for a_tag in content.find_all('a', href=True):
        text = a_tag.get_text(strip=True)
        href = a_tag.get('href', '')

        if text and href:
            links.append({
                'text': text,
                'href': href
            })

    return links
