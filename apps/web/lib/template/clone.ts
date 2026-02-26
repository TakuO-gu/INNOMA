/**
 * テンプレート複製機能
 *
 * sampleテンプレートを複製して新しい自治体用のArtifactを作成する
 */

import { readdir, readFile, writeFile, mkdir, stat } from "fs/promises";
import { join, relative } from "path";
import type {
  CloneTemplateOptions,
  CreateMunicipalityInput,
  MunicipalityMeta,
  VariableStore,
} from "./types";
import { replaceVariables } from "./replace";

const ARTIFACTS_DIR = join(process.cwd(), "data/artifacts");
const TEMPLATE_DIR = join(ARTIFACTS_DIR, "_templates"); // _templatesをテンプレートマスターとして使用

/**
 * ディレクトリ内のすべてのファイルを再帰的に取得
 */
async function getAllFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await getAllFiles(fullPath)));
    } else if (entry.name.endsWith(".json")) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * ディレクトリが存在するか確認
 */
async function exists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * 新しい自治体用にテンプレートを複製
 *
 * @param input 自治体の基本情報
 * @param options 複製オプション
 * @returns 作成された自治体のメタデータ
 */
export async function cloneTemplate(
  input: CreateMunicipalityInput,
  options: CloneTemplateOptions = {}
): Promise<MunicipalityMeta> {
  const { id, name, prefecture, officialUrl } = input;
  const sourceDir = options.sourceTemplate
    ? join(ARTIFACTS_DIR, options.sourceTemplate)
    : TEMPLATE_DIR;

  const targetDir = join(ARTIFACTS_DIR, id);

  // IDの検証
  if (!/^[a-z0-9-]+$/.test(id)) {
    throw new Error(
      "自治体IDは英小文字、数字、ハイフンのみ使用できます"
    );
  }

  // 既存の自治体がないか確認
  if (await exists(targetDir)) {
    throw new Error(`自治体ID "${id}" は既に存在します`);
  }

  // ソーステンプレートの存在確認
  if (!(await exists(sourceDir))) {
    throw new Error(`テンプレート "${sourceDir}" が見つかりません`);
  }

  // ターゲットディレクトリを作成
  await mkdir(targetDir, { recursive: true });

  // 初期変数を設定
  const now = new Date().toISOString();
  const initialVariables: Record<string, string> = {
    municipality_name: name,
    prefecture_name: prefecture,
    generated_at: now,
    ...options.initialVariables,
  };

  // テンプレートファイルを複製
  const sourceFiles = await getAllFiles(sourceDir);
  const replacedVariables = new Set<string>();
  const unreplacedVariables = new Set<string>();

  for (const sourceFile of sourceFiles) {
    const relativePath = relative(sourceDir, sourceFile);
    const targetFile = join(targetDir, relativePath);

    // ターゲットディレクトリを作成
    const targetFileDir = join(targetDir, relative(sourceDir, join(sourceFile, "..")));
    await mkdir(targetFileDir, { recursive: true });

    // ファイルを読み込み
    const content = await readFile(sourceFile, "utf-8");

    // JSONとしてパース
    let jsonContent: Record<string, unknown>;
    try {
      jsonContent = JSON.parse(content);
    } catch {
      // JSONではない場合はそのままコピー
      await writeFile(targetFile, content);
      continue;
    }

    // municipality_idとpage_idを更新
    if (jsonContent.municipality_id) {
      jsonContent.municipality_id = id;
    }
    if (typeof jsonContent.page_id === "string") {
      // 既存の自治体IDプレフィックスを新しいIDに置き換え
      // page_idの形式: {municipality_id}-{rest}
      // 最初のハイフンまでを自治体IDとして置き換える
      const parts = jsonContent.page_id.split('-');
      if (parts.length > 1) {
        parts[0] = id;
        jsonContent.page_id = parts.join('-');
      }
    }

    // JSON文字列に変換
    let jsonString = JSON.stringify(jsonContent, null, 2);

    // 変数置換
    const result = replaceVariables(jsonString, initialVariables);
    jsonString = result.content;
    result.replacedVariables.forEach((v) => replacedVariables.add(v));
    result.unreplacedVariables.forEach((v) => unreplacedVariables.add(v));

    // ファイルを書き込み
    await writeFile(targetFile, jsonString);
  }

  // メタデータを作成
  const meta: MunicipalityMeta = {
    id,
    name,
    prefecture,
    officialUrl,
    createdAt: now,
    updatedAt: now,
    status: "draft",
    settings: {
      autoPublish: false,
      fetchInterval: "manual",
    },
  };

  // meta.jsonを保存
  await writeFile(join(targetDir, "meta.json"), JSON.stringify(meta, null, 2));

  // 初期変数ストアを作成
  const variableStore: VariableStore = {};
  for (const [name, value] of Object.entries(initialVariables)) {
    variableStore[name] = {
      value,
      source: "manual",
      updatedAt: now,
    };
  }

  // variables.jsonを保存
  await writeFile(
    join(targetDir, "variables.json"),
    JSON.stringify(variableStore, null, 2)
  );

  return meta;
}

/**
 * テンプレートで使用されている変数を抽出
 *
 * @param templatePath テンプレートのパス（省略時はsample）
 * @returns 見つかった変数のリスト
 */
export async function extractTemplateVariables(
  templatePath?: string
): Promise<Map<string, { files: string[]; count: number }>> {
  const sourceDir = templatePath
    ? join(ARTIFACTS_DIR, templatePath)
    : TEMPLATE_DIR;

  const files = await getAllFiles(sourceDir);
  const variableMap = new Map<string, { files: string[]; count: number }>();

  // {{variable_name}} パターンをマッチ
  const variablePattern = /\{\{([a-z_][a-z0-9_]*)\}\}/gi;

  for (const file of files) {
    const content = await readFile(file, "utf-8");
    const relativePath = relative(sourceDir, file);
    let match;

    while ((match = variablePattern.exec(content)) !== null) {
      const varName = match[1].toLowerCase();
      const existing = variableMap.get(varName);

      if (existing) {
        existing.count++;
        if (!existing.files.includes(relativePath)) {
          existing.files.push(relativePath);
        }
      } else {
        variableMap.set(varName, {
          files: [relativePath],
          count: 1,
        });
      }
    }
  }

  return variableMap;
}

/**
 * 自治体のファイル数を取得
 */
export async function getMunicipalityPageCount(
  municipalityId: string
): Promise<number> {
  const dir = join(ARTIFACTS_DIR, municipalityId);
  if (!(await exists(dir))) {
    return 0;
  }

  const files = await getAllFiles(dir);
  // meta.jsonとvariables.jsonは除外
  return files.filter(
    (f) => !f.endsWith("meta.json") && !f.endsWith("variables.json")
  ).length;
}

/**
 * 自治体を削除
 */
export async function deleteMunicipality(municipalityId: string): Promise<void> {
  const { rm } = await import("fs/promises");
  const dir = join(ARTIFACTS_DIR, municipalityId);

  if (!(await exists(dir))) {
    throw new Error(`自治体 "${municipalityId}" が見つかりません`);
  }

  // _templatesとsampleは削除不可
  if (municipalityId === "_templates") {
    throw new Error("_templatesテンプレートは削除できません");
  }
  if (municipalityId === "sample") {
    throw new Error("sampleデモデータは削除できません");
  }

  await rm(dir, { recursive: true, force: true });
}

// キャッシュ: テンプレート変数の総数
let cachedTotalVariableCount: number | null = null;
let cachedAllVariableNames: string[] | null = null;

/**
 * テンプレートで使用されている全変数の数を取得
 * 結果はキャッシュされる
 */
export async function getTotalVariableCount(): Promise<number> {
  if (cachedTotalVariableCount !== null) {
    return cachedTotalVariableCount;
  }

  const variableMap = await extractTemplateVariables();
  cachedTotalVariableCount = variableMap.size;
  return cachedTotalVariableCount;
}

/**
 * テンプレートで使用されている全変数名を取得
 * 結果はキャッシュされる
 */
export async function getAllTemplateVariableNames(): Promise<string[]> {
  if (cachedAllVariableNames !== null) {
    return cachedAllVariableNames;
  }

  const variableMap = await extractTemplateVariables();
  cachedAllVariableNames = Array.from(variableMap.keys()).sort();
  return cachedAllVariableNames;
}
