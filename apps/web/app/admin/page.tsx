import Link from "next/link";
import { readdirSync, statSync } from "fs";
import { join } from "path";

// アーティファクトディレクトリのパス
const ARTIFACTS_DIR = join(process.cwd(), "data/artifacts");

// 自治体一覧を取得
function getMunicipalities(): {
  id: string;
  name: string;
  fileCount: number;
  updatedAt: Date | null;
}[] {
  try {
    const entries = readdirSync(ARTIFACTS_DIR, { withFileTypes: true });
    const municipalities = entries
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith("_"))
      .map((entry) => {
        const dirPath = join(ARTIFACTS_DIR, entry.name);
        const files = getAllJsonFiles(dirPath);
        const stats = files.length > 0 ? statSync(files[0]) : null;

        // home.jsonから自治体名を取得
        let name = entry.name;
        try {
          const homeJson = require(join(dirPath, "home.json"));
          if (homeJson.blocks) {
            const heroBlock = homeJson.blocks.find(
              (b: { type: string }) => b.type === "Hero"
            );
            if (heroBlock?.props?.title) {
              name = heroBlock.props.title.replace("へようこそ", "");
            }
          }
        } catch {
          // home.jsonがない場合はディレクトリ名を使用
        }

        return {
          id: entry.name,
          name,
          fileCount: files.length,
          updatedAt: stats?.mtime ?? null,
        };
      });

    return municipalities;
  } catch {
    return [];
  }
}

// 再帰的にJSONファイルを取得
function getAllJsonFiles(dir: string): string[] {
  const files: string[] = [];
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...getAllJsonFiles(fullPath));
      } else if (entry.name.endsWith(".json")) {
        files.push(fullPath);
      }
    }
  } catch {
    // ディレクトリが存在しない場合は空配列を返す
  }
  return files;
}

export default function AdminDashboard() {
  const municipalities = getMunicipalities();

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
        <Link
          href="/admin/generate"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          新規自治体を生成
        </Link>
      </div>

      {/* 統計 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-500">登録自治体数</div>
          <div className="text-3xl font-bold text-gray-900">
            {municipalities.length}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-500">総アーティファクト数</div>
          <div className="text-3xl font-bold text-gray-900">
            {municipalities.reduce((sum, m) => sum + m.fileCount, 0)}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-500">テンプレート（Sample市）</div>
          <div className="text-3xl font-bold text-gray-900">
            {municipalities.find((m) => m.id === "sample")?.fileCount ?? 0}
          </div>
        </div>
      </div>

      {/* 自治体一覧 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">自治体一覧</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {municipalities.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              まだ自治体が登録されていません。
              <br />
              <Link
                href="/admin/generate"
                className="text-blue-600 hover:underline"
              >
                新規自治体を生成
              </Link>
              してください。
            </div>
          ) : (
            municipalities.map((municipality) => (
              <div
                key={municipality.id}
                className="px-6 py-4 flex items-center justify-between hover:bg-gray-50"
              >
                <div>
                  <div className="font-medium text-gray-900">
                    {municipality.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    ID: {municipality.id} / {municipality.fileCount}ページ
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {municipality.updatedAt && (
                    <div className="text-sm text-gray-500">
                      更新:{" "}
                      {municipality.updatedAt.toLocaleDateString("ja-JP")}
                    </div>
                  )}
                  <Link
                    href={`/${municipality.id}`}
                    className="text-blue-600 hover:underline text-sm"
                    target="_blank"
                  >
                    プレビュー
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
