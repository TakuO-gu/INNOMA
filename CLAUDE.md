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
| [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md) | 実装の優先順位を確認したいとき |
| [docs/ADMIN_PANEL_SPEC.md](docs/ADMIN_PANEL_SPEC.md) | 管理画面を実装するとき |
| [docs/LLM_FETCHER_SPEC.md](docs/LLM_FETCHER_SPEC.md) | LLM情報取得を実装するとき |
| [docs/TEMPLATE_VARIABLES.md](docs/TEMPLATE_VARIABLES.md) | テンプレート変数を扱うとき |
| [docs/API_REFERENCE.md](docs/API_REFERENCE.md) | APIを実装するとき |
| [docs/DATA_STRUCTURES.md](docs/DATA_STRUCTURES.md) | データ構造を扱うとき |

---

## タスク完了チェック

タスクが終了したら以下を実行:

```bash
cd apps/web
npm run lint             # Lintチェック
npm run test             # テスト実行
npm run build            # ビルド確認
```

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

## 禁止事項

- `archive/` 内のコードを参照・復活させない
- `archive/docs/` 内の古いドキュメントを参照しない
