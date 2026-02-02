# INNOMA ドキュメント

**最終更新**: 2026-02-02

---

## 概要

INNOMAプロジェクトのドキュメント一覧です。

---

## ディレクトリ構成

```
docs/
├── README.md              # このファイル
├── PROJECT.md             # プロジェクト概要
├── REQUIREMENTS.md        # 要件定義
│
├── specs/                 # 仕様書
│   ├── API_REFERENCE.md       # API リファレンス
│   ├── ADMIN_PANEL_SPEC.md    # 管理画面仕様
│   ├── LLM_FETCHER_SPEC.md    # LLM情報取得仕様
│   ├── UI_SPEC.md             # UI仕様
│   └── DATA_STRUCTURES.md     # データ構造仕様
│
├── guides/                # 開発ガイド
│   ├── TEMPLATE_VARIABLES.md          # テンプレート変数ガイド
│   ├── DISTRICT_DEPENDENT_VARIABLES.md # 地区依存変数ガイド
│   ├── COMPONENT_SELECTION_LOGIC.md   # コンポーネント選択ルール
│   └── DADS_COMPONENTS.md             # DADSコンポーネント一覧
│
├── architecture/          # アーキテクチャ図
│   ├── INNOMA_FlowChart.md        # システム全体フローチャート
│   └── FETCH_TO_SHOW_FLOWCHART.md # 情報取得〜表示フロー
│
├── reports/               # 自治体レポート
│   ├── MUNICIPALITY_VARIABLE_REPORT.md # 変数レポート（総合）
│   ├── TSURU_VARIABLE_REPORT.md        # 都留市レポート
│   ├── OTAKI_VARIABLE_REPORT.md        # 大滝村レポート
│   ├── HIGASHIYOSHINO_VARIABLE_REPORT.md # 東吉野村レポート
│   ├── KITAGAWA_VARIABLE_REPORT.md     # 北川村レポート
│   └── VARIABLE_REVIEW_NOTES.md        # 変数レビューメモ
│
└── updates/               # 更新履歴
    └── 2026-*.md
```

---

## クイックリファレンス

### 初めての方

| ドキュメント | 説明 |
|-------------|------|
| [PROJECT.md](PROJECT.md) | プロジェクト概要、技術スタック、ディレクトリ構成 |
| [REQUIREMENTS.md](REQUIREMENTS.md) | 機能要件、非機能要件 |
| [architecture/INNOMA_FlowChart.md](architecture/INNOMA_FlowChart.md) | システム全体のアーキテクチャ図 |

### 機能実装時

| タスク | 参照ドキュメント |
|-------|-----------------|
| API実装 | [specs/API_REFERENCE.md](specs/API_REFERENCE.md) |
| 管理画面実装 | [specs/ADMIN_PANEL_SPEC.md](specs/ADMIN_PANEL_SPEC.md) |
| LLM情報取得実装 | [specs/LLM_FETCHER_SPEC.md](specs/LLM_FETCHER_SPEC.md) |
| UI実装 | [specs/UI_SPEC.md](specs/UI_SPEC.md) |
| データ構造確認 | [specs/DATA_STRUCTURES.md](specs/DATA_STRUCTURES.md) |

### テンプレート作成時

| タスク | 参照ドキュメント |
|-------|-----------------|
| 変数の使い方 | [guides/TEMPLATE_VARIABLES.md](guides/TEMPLATE_VARIABLES.md) |
| 地区依存変数 | [guides/DISTRICT_DEPENDENT_VARIABLES.md](guides/DISTRICT_DEPENDENT_VARIABLES.md) |
| コンポーネント選択 | [guides/COMPONENT_SELECTION_LOGIC.md](guides/COMPONENT_SELECTION_LOGIC.md) |
| DADSコンポーネント | [guides/DADS_COMPONENTS.md](guides/DADS_COMPONENTS.md) |

### フロー確認時

| タスク | 参照ドキュメント |
|-------|-----------------|
| システム全体 | [architecture/INNOMA_FlowChart.md](architecture/INNOMA_FlowChart.md) |
| 情報取得〜表示 | [architecture/FETCH_TO_SHOW_FLOWCHART.md](architecture/FETCH_TO_SHOW_FLOWCHART.md) |

---

## 外部リソース

| リソース | URL |
|---------|-----|
| DADS Reactコードスニペット | https://design.digital.go.jp/dads/react/ |
| DADSコンポーネント実装 | https://github.com/digital-go-jp/design-system-example-components-react |

---

## 更新履歴

最新の更新履歴は [updates/](updates/) ディレクトリを参照してください。
