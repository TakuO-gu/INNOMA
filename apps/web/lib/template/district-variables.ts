/**
 * District-Dependent Variables Processing
 * 地区（町丁目）によって値が異なる変数の処理
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import {
  District,
  DistrictDependentVariable,
  MunicipalityDistrictData,
} from '../llm/types';
import { districtDependentVariables } from '../llm/variable-priority';

const DATA_DIR = join(process.cwd(), 'data/artifacts');

/**
 * 自治体の地区データファイルパスを取得
 */
function getDistrictDataPath(municipalityId: string): string {
  return join(DATA_DIR, municipalityId, 'data', 'districts.json');
}

/**
 * 自治体の地区データを読み込み
 */
export async function loadDistrictData(
  municipalityId: string
): Promise<MunicipalityDistrictData | null> {
  const filePath = getDistrictDataPath(municipalityId);

  try {
    const content = await readFile(filePath, 'utf-8');
    return JSON.parse(content) as MunicipalityDistrictData;
  } catch {
    // ファイルが存在しない場合はnull
    return null;
  }
}

/**
 * 自治体の地区データを保存
 */
export async function saveDistrictData(
  data: MunicipalityDistrictData
): Promise<void> {
  const filePath = getDistrictDataPath(data.municipalityId);

  // ディレクトリがなければ作成
  await mkdir(dirname(filePath), { recursive: true });

  await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * 特定の変数の地区データを取得
 */
export async function getDistrictVariable(
  municipalityId: string,
  variableName: string
): Promise<DistrictDependentVariable | null> {
  const data = await loadDistrictData(municipalityId);
  if (!data) return null;

  return data.variables[variableName] || null;
}

/**
 * 地区IDから変数の値を取得
 */
export async function getDistrictValue(
  municipalityId: string,
  variableName: string,
  districtId: string
): Promise<string | null> {
  const variable = await getDistrictVariable(municipalityId, variableName);
  if (!variable) return null;

  const district = variable.districts.find((d) => d.id === districtId);
  return district?.value || variable.defaultValue || null;
}

/**
 * 地区名（町名）から地区IDを検索
 */
export async function findDistrictByArea(
  municipalityId: string,
  variableName: string,
  areaName: string
): Promise<District | null> {
  const variable = await getDistrictVariable(municipalityId, variableName);
  if (!variable) return null;

  // 完全一致を優先
  for (const district of variable.districts) {
    if (district.areas.includes(areaName)) {
      return district;
    }
  }

  // 部分一致で検索
  const normalizedArea = normalizeAreaName(areaName);
  for (const district of variable.districts) {
    for (const area of district.areas) {
      if (
        normalizeAreaName(area).includes(normalizedArea) ||
        normalizedArea.includes(normalizeAreaName(area))
      ) {
        return district;
      }
    }
  }

  return null;
}

/**
 * 地区名を正規化（表記揺れ対応）
 */
function normalizeAreaName(name: string): string {
  return name
    // 全角を半角に
    .replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0))
    // 漢数字を算用数字に
    .replace(/[一二三四五六七八九十]/g, (s) => {
      const map: Record<string, string> = {
        一: '1',
        二: '2',
        三: '3',
        四: '4',
        五: '5',
        六: '6',
        七: '7',
        八: '8',
        九: '9',
        十: '10',
      };
      return map[s] || s;
    })
    // 「丁目」「番地」などを除去
    .replace(/(丁目|番地|番|号)$/g, '')
    // スペースを除去
    .replace(/\s+/g, '');
}

/**
 * 変数が地区依存かどうかを判定
 */
export function isDistrictDependent(variableName: string): boolean {
  return districtDependentVariables.includes(variableName);
}

/**
 * 自治体に地区データが存在するか確認
 */
export async function hasDistrictData(municipalityId: string): Promise<boolean> {
  const data = await loadDistrictData(municipalityId);
  return data !== null && Object.keys(data.variables).length > 0;
}

/**
 * 自治体の全地区依存変数のリストを取得
 */
export async function listDistrictVariables(
  municipalityId: string
): Promise<string[]> {
  const data = await loadDistrictData(municipalityId);
  if (!data) return [];

  return Object.keys(data.variables);
}

/**
 * テンプレート変数を地区データで置換
 * @param template テンプレート文字列（{{variable_name}}を含む）
 * @param municipalityId 自治体ID
 * @param selectedDistricts ユーザーが選択した地区（変数名 -> 地区ID）
 * @param fallbackVariables 通常の変数（地区依存でない変数用）
 */
export async function resolveDistrictVariables(
  template: string,
  municipalityId: string,
  selectedDistricts: Record<string, string>,
  fallbackVariables: Record<string, string>
): Promise<string> {
  const districtData = await loadDistrictData(municipalityId);

  // {{variable_name}} のパターンを検索
  const variablePattern = /\{\{([a-z_]+)\}\}/g;

  let result = template;
  let match;

  while ((match = variablePattern.exec(template)) !== null) {
    const variableName = match[1];
    let value: string | undefined;

    // 地区依存変数の場合
    if (isDistrictDependent(variableName) && districtData) {
      const districtVar = districtData.variables[variableName];
      if (districtVar) {
        const selectedDistrictId = selectedDistricts[variableName];
        if (selectedDistrictId) {
          // 地区が選択されている場合
          const district = districtVar.districts.find(
            (d) => d.id === selectedDistrictId
          );
          value = district?.value || districtVar.defaultValue;
        } else {
          // 地区未選択の場合
          value = districtVar.defaultValue;
        }
      }
    }

    // 地区依存でない、または地区データがない場合はフォールバック
    if (!value) {
      value = fallbackVariables[variableName];
    }

    // 値があれば置換
    if (value) {
      result = result.replace(match[0], value);
    }
  }

  return result;
}

/**
 * 空の地区データを作成
 */
export function createEmptyDistrictData(
  municipalityId: string
): MunicipalityDistrictData {
  return {
    municipalityId,
    variables: {},
    updatedAt: new Date().toISOString(),
  };
}

/**
 * 地区依存変数を追加または更新
 */
export async function upsertDistrictVariable(
  municipalityId: string,
  variable: DistrictDependentVariable
): Promise<void> {
  let data = await loadDistrictData(municipalityId);
  if (!data) {
    data = createEmptyDistrictData(municipalityId);
  }

  variable.updatedAt = new Date().toISOString();
  data.variables[variable.variableName] = variable;
  data.updatedAt = new Date().toISOString();

  await saveDistrictData(data);
}

/**
 * 地区を追加
 */
export async function addDistrict(
  municipalityId: string,
  variableName: string,
  district: District
): Promise<void> {
  const data = await loadDistrictData(municipalityId);
  if (!data || !data.variables[variableName]) {
    throw new Error(`Variable ${variableName} not found for ${municipalityId}`);
  }

  // 重複チェック
  if (data.variables[variableName].districts.some((d) => d.id === district.id)) {
    throw new Error(`District ${district.id} already exists`);
  }

  data.variables[variableName].districts.push(district);
  data.variables[variableName].updatedAt = new Date().toISOString();
  data.updatedAt = new Date().toISOString();

  await saveDistrictData(data);
}

/**
 * 地区を更新
 */
export async function updateDistrict(
  municipalityId: string,
  variableName: string,
  districtId: string,
  updates: Partial<District>
): Promise<void> {
  const data = await loadDistrictData(municipalityId);
  if (!data || !data.variables[variableName]) {
    throw new Error(`Variable ${variableName} not found for ${municipalityId}`);
  }

  const districtIndex = data.variables[variableName].districts.findIndex(
    (d) => d.id === districtId
  );
  if (districtIndex === -1) {
    throw new Error(`District ${districtId} not found`);
  }

  data.variables[variableName].districts[districtIndex] = {
    ...data.variables[variableName].districts[districtIndex],
    ...updates,
  };
  data.variables[variableName].updatedAt = new Date().toISOString();
  data.updatedAt = new Date().toISOString();

  await saveDistrictData(data);
}

/**
 * 地区を削除
 */
export async function removeDistrict(
  municipalityId: string,
  variableName: string,
  districtId: string
): Promise<void> {
  const data = await loadDistrictData(municipalityId);
  if (!data || !data.variables[variableName]) {
    throw new Error(`Variable ${variableName} not found for ${municipalityId}`);
  }

  data.variables[variableName].districts = data.variables[
    variableName
  ].districts.filter((d) => d.id !== districtId);
  data.variables[variableName].updatedAt = new Date().toISOString();
  data.updatedAt = new Date().toISOString();

  await saveDistrictData(data);
}
