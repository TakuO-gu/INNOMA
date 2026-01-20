/**
 * 自治体データ ストレージ操作
 *
 * 自治体のメタデータ、変数ストア、ファイル操作
 */

import { readdir, readFile, writeFile, stat } from "fs/promises";
import { join } from "path";
import type {
  MunicipalityMeta,
  MunicipalitySummary,
  MunicipalityStatus,
  VariableStore,
} from "./types";
import { getMunicipalityPageCount } from "./clone";

const ARTIFACTS_DIR = join(process.cwd(), "data/artifacts");

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
 * 登録されている自治体の一覧を取得
 *
 * @returns 自治体サマリーのリスト
 */
export async function getMunicipalities(): Promise<MunicipalitySummary[]> {
  const entries = await readdir(ARTIFACTS_DIR, { withFileTypes: true });
  const municipalities: MunicipalitySummary[] = [];

  for (const entry of entries) {
    // ディレクトリのみ、_で始まるものは除外
    if (!entry.isDirectory() || entry.name.startsWith("_")) {
      continue;
    }

    const id = entry.name;
    const meta = await getMunicipalityMeta(id);
    const variables = await getVariableStore(id);
    const pageCount = await getMunicipalityPageCount(id);
    const pendingDrafts = await countPendingDrafts(id);

    // 変数統計を計算
    const variableNames = Object.keys(variables);
    const filledCount = variableNames.filter(
      (name) => variables[name]?.value && variables[name].value.trim() !== ""
    ).length;

    // sampleの場合はデフォルト値を使用
    const summary: MunicipalitySummary = {
      id,
      name: meta?.name ?? id,
      prefecture: meta?.prefecture ?? "",
      status: meta?.status ?? (id === "sample" ? "published" : "draft"),
      updatedAt: meta?.updatedAt ?? new Date().toISOString(),
      variableStats: {
        total: 353, // 全変数数（TEMPLATE_VARIABLES.mdより）
        filled: filledCount,
        missing: 353 - filledCount,
      },
      pendingDrafts,
      pageCount,
    };

    municipalities.push(summary);
  }

  // 更新日時で降順ソート
  municipalities.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return municipalities;
}

/**
 * 特定の自治体の詳細を取得
 */
export async function getMunicipality(
  id: string
): Promise<MunicipalitySummary | null> {
  const dirPath = join(ARTIFACTS_DIR, id);
  if (!(await exists(dirPath))) {
    return null;
  }

  const meta = await getMunicipalityMeta(id);
  const variables = await getVariableStore(id);
  const pageCount = await getMunicipalityPageCount(id);
  const pendingDrafts = await countPendingDrafts(id);

  const variableNames = Object.keys(variables);
  const filledCount = variableNames.filter(
    (name) => variables[name]?.value && variables[name].value.trim() !== ""
  ).length;

  return {
    id,
    name: meta?.name ?? id,
    prefecture: meta?.prefecture ?? "",
    status: meta?.status ?? "draft",
    updatedAt: meta?.updatedAt ?? new Date().toISOString(),
    variableStats: {
      total: 353,
      filled: filledCount,
      missing: 353 - filledCount,
    },
    pendingDrafts,
    pageCount,
  };
}

/**
 * 自治体のメタデータを取得
 */
export async function getMunicipalityMeta(
  id: string
): Promise<MunicipalityMeta | null> {
  const metaPath = join(ARTIFACTS_DIR, id, "meta.json");

  if (!(await exists(metaPath))) {
    // sampleの場合はデフォルトメタデータを返す
    if (id === "sample") {
      return {
        id: "sample",
        name: "サンプル市",
        prefecture: "東京都",
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: new Date().toISOString(),
        status: "published",
        settings: {
          autoPublish: false,
          fetchInterval: "manual",
        },
      };
    }
    return null;
  }

  try {
    const content = await readFile(metaPath, "utf-8");
    return JSON.parse(content) as MunicipalityMeta;
  } catch {
    return null;
  }
}

/**
 * 自治体のメタデータを更新
 */
export async function updateMunicipalityMeta(
  id: string,
  updates: Partial<MunicipalityMeta>
): Promise<MunicipalityMeta> {
  const current = await getMunicipalityMeta(id);
  if (!current) {
    throw new Error(`自治体 "${id}" が見つかりません`);
  }

  const updated: MunicipalityMeta = {
    ...current,
    ...updates,
    id, // IDは変更不可
    updatedAt: new Date().toISOString(),
  };

  const metaPath = join(ARTIFACTS_DIR, id, "meta.json");
  await writeFile(metaPath, JSON.stringify(updated, null, 2));

  return updated;
}

/**
 * 自治体の変数ストアを取得
 */
export async function getVariableStore(id: string): Promise<VariableStore> {
  const variablesPath = join(ARTIFACTS_DIR, id, "variables.json");

  if (!(await exists(variablesPath))) {
    return {};
  }

  try {
    const content = await readFile(variablesPath, "utf-8");
    return JSON.parse(content) as VariableStore;
  } catch {
    return {};
  }
}

/**
 * 自治体の変数ストアを更新
 */
export async function updateVariableStore(
  id: string,
  updates: VariableStore
): Promise<VariableStore> {
  const current = await getVariableStore(id);
  const now = new Date().toISOString();

  // 更新をマージ
  const updated: VariableStore = { ...current };
  for (const [name, value] of Object.entries(updates)) {
    updated[name] = {
      ...value,
      updatedAt: now,
    };
  }

  const variablesPath = join(ARTIFACTS_DIR, id, "variables.json");
  await writeFile(variablesPath, JSON.stringify(updated, null, 2));

  // メタデータの更新日時も更新
  await updateMunicipalityMeta(id, {});

  return updated;
}

/**
 * 自治体のステータスを更新
 */
export async function updateMunicipalityStatus(
  id: string,
  status: MunicipalityStatus
): Promise<void> {
  await updateMunicipalityMeta(id, { status });
}

/**
 * 下書きの数をカウント
 */
async function countPendingDrafts(municipalityId: string): Promise<number> {
  const draftsDir = join(ARTIFACTS_DIR, "_drafts", municipalityId);

  if (!(await exists(draftsDir))) {
    return 0;
  }

  try {
    const entries = await readdir(draftsDir);
    return entries.filter((e) => e.endsWith(".json")).length;
  } catch {
    return 0;
  }
}

/**
 * すべての変数名を取得（優先度順）
 */
export function getAllVariableNames(): string[] {
  // 基本情報（必須）
  const basicVariables = [
    "municipality_name",
    "prefecture_name",
    "city_hall_address",
    "city_hall_hours",
    "city_hall_phone",
    "city_hall_email",
    "city_hall_department",
    "generated_at",
  ];

  // 主要部署連絡先
  const departmentPrefixes = [
    "shimin",
    "registration",
    "koseki",
    "resident",
    "mynumber",
    "tax",
    "zeimu",
    "shisanzei",
    "kokuho",
    "kouki",
    "nenkin",
    "welfare",
    "childcare",
    "kosodate",
    "boshi",
    "nursery",
    "nursery_apply",
    "koureisha",
    "kaigo",
    "shogai",
    "disability",
    "seikatsu_hogo",
    "health",
    "kenshin",
    "yobosesshu",
    "houkatsu",
    "environment",
    "bosai",
    "disaster",
    "housing",
    "building",
    "urban_planning",
    "development",
    "land",
    "business",
    "agriculture",
    "forestry",
    "fishery",
    "wildlife",
    "employment",
    "driving",
    "nationality",
    "multicultural",
    "civic",
    "election_commission",
    "audit_commission",
    "agricultural_commission",
    "disclosure",
    "privacy",
    "legal",
    "victim_support",
    "benefits",
    "planning",
  ];

  const departmentVariables = departmentPrefixes.flatMap((prefix) => [
    `${prefix}_department`,
    `${prefix}_phone`,
    `${prefix}_email`,
    `${prefix}_address`,
    `${prefix}_hours`,
  ]);

  // 外部機関
  const externalPrefixes = [
    "hello_work",
    "pension_office",
    "tax_office",
    "legal_affairs_bureau",
    "labor_bureau",
    "labor_standards_office",
    "police_station",
    "driver_license_center",
    "transport_branch",
    "passport_office",
    "immigration_bureau",
    "international_association",
    "silver_center",
  ];

  const externalVariables = externalPrefixes.flatMap((prefix) => [
    `${prefix}_name`,
    `${prefix}_phone`,
    `${prefix}_address`,
  ]);

  // 料金
  const feeVariables = [
    "juminhyo_fee",
    "juminhyo_convenience_fee",
    "juminhyo_kisai_fee",
    "koseki_fee",
    "kaisei_koseki_fee",
    "jokoseki_fee",
    "inkan_touroku_fee",
    "inkan_shomei_fee",
    "inkan_shomei_convenience_fee",
    "fuhyo_fee",
    "tokutei_kenshin_fee",
    "kouki_kenshin_fee",
    "influenza_fee",
    "sodaigomi_fee_small",
    "sodaigomi_fee_medium",
    "sodaigomi_fee_large",
    "sodaigomi_fee_xlarge",
  ];

  return [
    ...basicVariables,
    ...departmentVariables,
    ...externalVariables,
    ...feeVariables,
  ];
}
