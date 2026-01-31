/**
 * District Data API
 * GET: 自治体の地区依存変数データを取得
 */

import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { loadDistrictData } from "@/lib/template/district-variables";
import { isValidMunicipalityId, isValidVariableName } from "@/lib/security/validators";

const DATA_DIR = join(process.cwd(), "data/artifacts");

interface RouteParams {
  params: Promise<{
    municipalityId: string;
    variableName: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { municipalityId, variableName } = await params;
  if (!isValidMunicipalityId(municipalityId) || !isValidVariableName(variableName)) {
    return NextResponse.json(
      { error: "パラメータの形式が正しくありません" },
      { status: 400 }
    );
  }
  const { searchParams } = new URL(request.url);
  const includeAll = searchParams.get("includeAll") === "true";

  try {
    // sheltersの場合は専用の処理
    if (variableName === "shelters") {
      const shelterPath = join(DATA_DIR, municipalityId, "data", "shelters.json");
      try {
        const content = await readFile(shelterPath, "utf-8");
        return NextResponse.json(JSON.parse(content));
      } catch {
        return NextResponse.json(
          { error: "避難所データが見つかりません" },
          { status: 404 }
        );
      }
    }

    // hazard-mapsの場合は専用の処理
    if (variableName === "hazard-maps") {
      const hazardMapPath = join(DATA_DIR, municipalityId, "data", "hazard-maps.json");
      try {
        const content = await readFile(hazardMapPath, "utf-8");
        return NextResponse.json(JSON.parse(content));
      } catch {
        return NextResponse.json(
          { error: "ハザードマップデータが見つかりません" },
          { status: 404 }
        );
      }
    }

    const districtData = await loadDistrictData(municipalityId);

    if (!districtData) {
      return NextResponse.json(
        { error: "地区データが見つかりません" },
        { status: 404 }
      );
    }

    // 変数グループの場合（例: gomi_shushu → gomi関連の変数をまとめて取得）
    if (variableName.endsWith("_area") || variableName.includes("_")) {
      const baseGroup = variableName.replace("_area", "");

      // グループに関連する変数を検索
      // 例: gomi_shushu → moeru_gomi_shushuhi, moenai_gomi_shushuhi などにマッチ
      const relatedVars = Object.keys(districtData.variables).filter(
        (key) =>
          key.startsWith(baseGroup) ||
          key.includes(`_${baseGroup}`) ||
          key.includes(`${baseGroup}_`) ||
          // gomi関連の特別処理
          (baseGroup.includes("gomi") && key.includes("gomi")) ||
          key === variableName
      );

      if (relatedVars.length > 0) {
        // 最初に見つかった変数の地区データを返す
        const firstVar = districtData.variables[relatedVars[0]];
        if (firstVar) {
          const response: Record<string, unknown> = {
            variableName: relatedVars[0],
            districts: firstVar.districts,
            defaultValue: firstVar.defaultValue,
            selectPrompt: firstVar.selectPrompt,
            relatedVariables: relatedVars,
          };

          // includeAll=true の場合、全関連変数のデータを含める
          if (includeAll) {
            const allVariables: Record<string, unknown> = {};
            for (const varName of relatedVars) {
              const varData = districtData.variables[varName];
              if (varData) {
                allVariables[varName] = {
                  variableName: varData.variableName,
                  districts: varData.districts,
                  defaultValue: varData.defaultValue,
                };
              }
            }
            response.allVariables = allVariables;
          }

          return NextResponse.json(response);
        }
      }
    }

    // 特定の変数を取得
    const variable = districtData.variables[variableName];

    if (!variable) {
      return NextResponse.json(
        { error: "該当する変数が見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      variableName: variable.variableName,
      districts: variable.districts,
      defaultValue: variable.defaultValue,
      selectPrompt: variable.selectPrompt,
    });
  } catch (error) {
    console.error("Error loading district data:", error);
    return NextResponse.json(
      { error: "地区データの取得に失敗しました" },
      { status: 500 }
    );
  }
}
