/**
 * クイズデータ自動生成
 * デプロイ済み自治体のvariablesからタイムトライアル用の問題を生成する
 */

import fs from "fs";
import path from "path";

// 変数キー → 質問テンプレートのマッピング
// {municipality} は自治体名に置換される
const QUESTION_TEMPLATES: Record<
  string,
  { question: string; category: string }
> = {
  // 手数料系
  juminhyo_fee: {
    question: "{municipality}の住民票の写しの手数料はいくら？",
    category: "手数料",
  },
  koseki_fee: {
    question: "{municipality}の戸籍謄本の手数料はいくら？",
    category: "手数料",
  },
  inkan_shomei_fee: {
    question: "{municipality}の印鑑証明書の手数料はいくら？",
    category: "手数料",
  },
  inkan_touroku_fee: {
    question: "{municipality}の印鑑登録の手数料はいくら？",
    category: "手数料",
  },
  juminhyo_convenience_fee: {
    question: "{municipality}の住民票のコンビニ交付手数料はいくら？",
    category: "手数料",
  },
  jokoseki_fee: {
    question: "{municipality}の除籍謄本の手数料はいくら？",
    category: "手数料",
  },
  zeishoumei_fee: {
    question: "{municipality}の税証明書の手数料はいくら？",
    category: "手数料",
  },
  // 電話番号系
  city_hall_phone: {
    question: "{municipality}の市役所（役場）の代表電話番号は？",
    category: "電話番号",
  },
  shimin_phone: {
    question: "{municipality}の市民課の電話番号は？",
    category: "電話番号",
  },
  kokuho_phone: {
    question: "{municipality}の国民健康保険の問い合わせ電話番号は？",
    category: "電話番号",
  },
  kosodate_phone: {
    question: "{municipality}の子育て支援の問い合わせ電話番号は？",
    category: "電話番号",
  },
  kaigo_phone: {
    question: "{municipality}の介護保険の問い合わせ電話番号は？",
    category: "電話番号",
  },
  zeimu_phone: {
    question: "{municipality}の税務課の電話番号は？",
    category: "電話番号",
  },
  fukushi_phone: {
    question: "{municipality}の福祉課の電話番号は？",
    category: "電話番号",
  },
  // 住所・窓口系
  city_hall_address: {
    question: "{municipality}の市役所（役場）の住所は？",
    category: "窓口",
  },
  city_hall_hours: {
    question: "{municipality}の市役所（役場）の開庁時間は？",
    category: "窓口",
  },
  juminhyo_madoguchi: {
    question: "{municipality}の住民票が取れる窓口はどこ？",
    category: "窓口",
  },
  // 保険・税金系
  kokuho_rate: {
    question: "{municipality}の国民健康保険料率はいくら？",
    category: "保険・税金",
  },
  kouki_rate: {
    question: "{municipality}の後期高齢者医療保険料率は？",
    category: "保険・税金",
  },
  jidou_teate_amount: {
    question: "{municipality}の児童手当の支給額は？",
    category: "手当",
  },
};

// 自治体メタデータ（2つのフォーマットに対応）
export interface MunicipalityMeta {
  id: string;
  name: string;
  prefecture: string;
  officialUrl: string;
}

// クイズ問題
export interface QuizQuestion {
  id: string;
  municipalityId: string;
  municipalityName: string;
  prefecture: string;
  officialUrl: string;
  variableKey: string;
  question: string;
  answer: string;
  category: string;
  innomaPath: string; // INNOMAサイトで該当情報があるページパス
}

// 変数キーからINNOMAのページパスを推定
function getInnomaPath(variableKey: string): string {
  if (variableKey.startsWith("juminhyo")) return "/juminhyo";
  if (variableKey.startsWith("koseki") || variableKey.startsWith("jokoseki"))
    return "/koseki";
  if (variableKey.startsWith("inkan")) return "/inkan";
  if (variableKey.startsWith("kokuho")) return "/kokuho";
  if (variableKey.startsWith("kaigo")) return "/kaigo";
  if (variableKey.startsWith("jidou_teate")) return "/jidou-teate";
  if (variableKey.startsWith("kouki")) return "/kouki";
  if (
    variableKey.startsWith("city_hall") ||
    variableKey.startsWith("shimin") ||
    variableKey === "zeishoumei_fee"
  )
    return "";
  if (variableKey.startsWith("zeimu")) return "/tax";
  if (variableKey.startsWith("fukushi")) return "/welfare";
  if (variableKey.startsWith("kosodate")) return "/childcare";
  return "";
}

// メタデータを統一フォーマットで読み込む
function loadMunicipalityMeta(dirPath: string): MunicipalityMeta | null {
  const metaPath = path.join(dirPath, "meta.json");
  if (!fs.existsSync(metaPath)) return null;
  const raw = JSON.parse(fs.readFileSync(metaPath, "utf-8"));

  return {
    id: raw.id || raw.municipalityId || "",
    name: raw.name || raw.municipalityName || "",
    prefecture: raw.prefecture || raw.prefectureName || "",
    officialUrl: raw.officialUrl || raw.officialWebsite || "",
  };
}

// 変数ファイルを読み込む
function loadVariables(
  dirPath: string
): Record<string, { value: string; confidence?: number }> {
  const varsDir = path.join(dirPath, "variables");
  if (!fs.existsSync(varsDir)) return {};

  const allVars: Record<string, { value: string; confidence?: number }> = {};
  const files = fs.readdirSync(varsDir).filter((f) => f.endsWith(".json"));

  for (const file of files) {
    const data = JSON.parse(
      fs.readFileSync(path.join(varsDir, file), "utf-8")
    );
    for (const [key, val] of Object.entries(data)) {
      const v = val as { value?: string; confidence?: number };
      if (v.value) {
        allVars[key] = { value: v.value, confidence: v.confidence };
      }
    }
  }
  return allVars;
}

// 全自治体からクイズデータを生成
export function generateQuizData(): QuizQuestion[] {
  const artifactsDir = path.join(
    process.cwd(),
    "data/artifacts"
  );
  const dirs = fs.readdirSync(artifactsDir);
  const questions: QuizQuestion[] = [];

  const skipDirs = new Set([
    "_templates",
    "_drafts",
    "_jobs",
    "_config",
    "sample",
  ]);

  for (const dir of dirs) {
    if (skipDirs.has(dir)) continue;
    const dirPath = path.join(artifactsDir, dir);
    if (!fs.statSync(dirPath).isDirectory()) continue;

    const meta = loadMunicipalityMeta(dirPath);
    if (!meta || !meta.id) continue;

    const variables = loadVariables(dirPath);

    for (const [varKey, template] of Object.entries(QUESTION_TEMPLATES)) {
      const varData = variables[varKey];
      if (!varData?.value) continue;
      // confidence が低すぎるものは除外
      if (varData.confidence !== undefined && varData.confidence < 0.8)
        continue;

      questions.push({
        id: `${meta.id}-${varKey}`,
        municipalityId: meta.id,
        municipalityName: meta.name,
        prefecture: meta.prefecture,
        officialUrl: meta.officialUrl,
        variableKey: varKey,
        question: template.question.replace("{municipality}", meta.name),
        answer: varData.value,
        category: template.category,
        innomaPath: getInnomaPath(varKey),
      });
    }
  }

  return questions;
}

// スロット用のデータ: ユニークな自治体名・情報カテゴリ
export function getSlotData(questions: QuizQuestion[]) {
  const municipalities = [
    ...new Map(
      questions.map((q) => [
        q.municipalityId,
        {
          id: q.municipalityId,
          name: q.municipalityName,
          prefecture: q.prefecture,
        },
      ])
    ).values(),
  ];

  const categories = [...new Set(questions.map((q) => q.category))];

  return { municipalities, categories };
}
