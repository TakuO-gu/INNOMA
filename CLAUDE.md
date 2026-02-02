# INNOMA Claude Code 設定

## 基本ルール

1. **作業前に `docs/` のドキュメントを参照すること**
2. **タスク完了時は必ずチェック（テスト、Lint、ビルド）を実行すること**
3. **変更内容を `docs/updates/` に記録すること**

---

## ドキュメント参照

設計・実装は `docs/` ディレクトリを正とする。

| ドキュメント | 参照タイミング |
|-------------|---------------|
| [docs/PROJECT.md](docs/PROJECT.md) | プロジェクト構造を確認したいとき |
| [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md) | 要件を確認したいとき |
| [docs/specs/ADMIN_PANEL_SPEC.md](docs/specs/ADMIN_PANEL_SPEC.md) | 管理画面を実装するとき |
| [docs/specs/LLM_FETCHER_SPEC.md](docs/specs/LLM_FETCHER_SPEC.md) | LLM情報取得を実装するとき |
| [docs/guides/TEMPLATE_VARIABLES.md](docs/guides/TEMPLATE_VARIABLES.md) | テンプレート変数を扱うとき |
| [docs/specs/API_REFERENCE.md](docs/specs/API_REFERENCE.md) | APIを実装するとき |
| [docs/specs/DATA_STRUCTURES.md](docs/specs/DATA_STRUCTURES.md) | データ構造を扱うとき |
| [docs/guides/COMPONENT_SELECTION_LOGIC.md](docs/guides/COMPONENT_SELECTION_LOGIC.md) | コンポーネント選択時 |
| [docs/architecture/INNOMA_FlowChart.md](docs/architecture/INNOMA_FlowChart.md) | アーキテクチャを確認したいとき |

---

## タスク完了チェック

タスクが終了したら以下を実行（**ロック付きコマンドを使用すること**）:

```bash
cd apps/web
npm run check            # Lint + テスト + ビルドを排他実行（推奨）
```

または個別に実行する場合:

```bash
cd apps/web
npm run lint:lock        # Lintチェック（排他実行）
npm run test:lock        # テスト実行（排他実行）
npm run build:lock       # ビルド確認（排他実行）
```

> **重要**: 複数のClaude Codeが同時に動作している場合、`:lock`付きコマンドを使用してビルド競合を防止すること。ロックは自動的に待機・解放される。

---

## 更新履歴の記録

変更を行ったら `docs/updates/YYYY-MM-DD.md` に記録する。

### 記録フォーマット

```markdown
# YYYY-MM-DD 更新履歴

## [変更カテゴリ]

- 変更内容1
- 変更内容2
```

### カテゴリ例
- 新機能追加
- バグ修正
- リファクタリング
- ドキュメント更新
- 設定変更

### 記録タイミング
- 機能実装完了時
- バグ修正完了時
- 設定・構成変更時
- ドキュメント更新時

---

## 外部リソース（DADS）

UIコンポーネント実装時はデジタル庁デザインシステム（DADS）を参照する。

| リソース | URL | 用途 |
|---------|-----|------|
| DADS Reactコードスニペット | https://design.digital.go.jp/dads/react/ | コンポーネントの使用例・コード例 |
| Reactコンポーネント実装 | https://github.com/digital-go-jp/design-system-example-components-react/tree/main/src/components | コンポーネントのソースコード参照 |

---

## サービスページ作成チェックリスト

**新しいサービスページを作成したら、以下の3ステップを必ず実行すること:**

### 1. コンテンツ整合性チェック

ページタイトルと内容が一致しているか確認する:
- タイトルが示すサービスの情報がページ内で説明されているか
- 無関係な情報や別サービスの情報が混入していないか
- 概要（Summary）がページ内容を正しく要約しているか

### 2. 変数・RichTextの妥当性検証

`template-validity-checker`エージェントを使用して、ランダムに選んだ10自治体のWebサイトと比較検証する:

```
Task tool: subagent_type=template-validity-checker
```

**検証項目**:
- 静的コンテンツ（RichText内のテキスト）が全国共通で正確か
- 自治体ごとに異なる情報が変数化されているか
- 追加すべき変数がないか（窓口名、手数料、受付時間等）
- 変数のソースURL（sources）が適切に設定されているか

### 3. コンポーネント最適化

[docs/guides/COMPONENT_SELECTION_LOGIC.md](docs/guides/COMPONENT_SELECTION_LOGIC.md) のルールに従い、コンポーネント構成を最適化する:

**確認項目**:
- 手順（3ステップ以上）→ `StepNavigation` を使用しているか
- 条件分岐のある書類リスト → `Table` または `Accordion` を使用しているか
- 単純なリスト → `RichText (unordered list)` を使用しているか
- `Table` の `value` が空でないか（空なら `RichText` に変更）
- 重要な注意事項 → `NotificationBanner` を使用しているか
- セクション順序が [ドキュメント記載の順序](docs/guides/COMPONENT_SELECTION_LOGIC.md#3-セクション順序) に従っているか

---

## 禁止事項

- `archive/` 内のコードを参照・復活させない
- `archive/docs/` 内の古いドキュメントを参照しない
