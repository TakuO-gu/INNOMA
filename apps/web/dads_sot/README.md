# DADS Source of Truth (SoT)

このフォルダは DADS 公式スニペットの固定版です。

## 運用ルール

- DOM構造 / class / aria / data-* を「正」とする
- `components/blocks/dads` はこのSoTをJSX化したもの
- 変更は必ず **SoT → 実装** の順に行う

## ファイル一覧

| ファイル | 対応コンポーネント |
|---------|------------------|
| `breadcrumbs.html` | `DadsBreadcrumbs.tsx` |
| `resource-list.html` | `DadsResourceList.tsx` |
| `notification-banner.html` | `DadsNotificationBanner.tsx` |
| `step-navigation.html` | `DadsStepNavigation.tsx` |
| `table.html` | `DadsTable.tsx` |

## 更新手順

1. DADS公式のスニペットが更新された場合、まずこのフォルダのHTMLを更新
2. `npm test` を実行してテストが失敗することを確認
3. 対応する `components/blocks/dads/*.tsx` を修正
4. テストがパスすることを確認
