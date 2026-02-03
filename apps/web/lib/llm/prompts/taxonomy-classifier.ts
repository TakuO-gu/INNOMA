/**
 * LLM Taxonomy Classifier
 *
 * GOV.UK方式のタクソノミー分類をLLMで自動化
 * Content Itemのタイトル・説明・内容から適切なカテゴリを推論
 */

import { generateJSON } from "../gemini";

/**
 * INNOMAのタクソノミー定義
 * GOV.UK方式: 階層構造を持つトピック分類
 */
export const INNOMA_TAXONOMY = {
  // Level 1: 大カテゴリ（トピックページに対応）
  registration: {
    name: "届出・証明",
    nameEn: "registration",
    description: "戸籍、住民票、印鑑登録など各種届出・証明書",
    keywords: ["届出", "届", "証明", "登録", "戸籍", "住民票", "印鑑"],
    subtopics: ["戸籍", "住民登録", "印鑑登録", "マイナンバー", "婚姻・離婚", "出生・死亡"],
  },
  childcare: {
    name: "子育て・出産",
    nameEn: "childcare",
    description: "妊娠、出産、子育て支援、保育所、児童手当など",
    keywords: ["子育て", "出産", "妊娠", "保育", "児童", "子ども", "育児"],
    subtopics: ["妊娠・出産", "保育所・幼稚園", "児童手当", "子育て支援", "母子保健"],
  },
  welfare: {
    name: "福祉・介護",
    nameEn: "welfare",
    description: "高齢者福祉、介護保険、障害者支援、生活保護など",
    keywords: ["福祉", "介護", "高齢", "障害", "障がい", "生活保護", "年金"],
    subtopics: ["高齢者福祉", "介護保険", "障害者支援", "生活保護", "地域包括支援"],
  },
  health: {
    name: "健康・医療",
    nameEn: "health",
    description: "国民健康保険、後期高齢者医療、健診、予防接種など",
    keywords: ["健康", "医療", "保険", "健診", "予防接種", "国保"],
    subtopics: ["国民健康保険", "後期高齢者医療", "健診・検診", "予防接種"],
  },
  tax: {
    name: "税金",
    nameEn: "tax",
    description: "住民税、固定資産税、納税、確定申告など",
    keywords: ["税", "税金", "納税", "申告", "住民税", "固定資産"],
    subtopics: ["住民税", "固定資産税", "軽自動車税", "納税", "確定申告", "税証明"],
  },
  environment: {
    name: "環境・ごみ",
    nameEn: "environment",
    description: "ごみの分別・収集、リサイクル、環境保全など",
    keywords: ["ごみ", "ゴミ", "環境", "リサイクル", "分別", "収集"],
    subtopics: ["ごみの出し方", "粗大ごみ", "リサイクル", "家電リサイクル"],
  },
  housing: {
    name: "住まい・土地",
    nameEn: "housing",
    description: "住宅、建築、土地、公営住宅、空き家など",
    keywords: ["住宅", "住まい", "建築", "土地", "公営住宅", "空き家"],
    subtopics: ["公営住宅", "住宅補助", "建築確認", "空き家対策"],
  },
  disaster: {
    name: "防災・安全",
    nameEn: "disaster",
    description: "防災、避難所、ハザードマップ、防犯など",
    keywords: ["防災", "避難", "災害", "ハザードマップ", "防犯", "安全"],
    subtopics: ["避難所", "ハザードマップ", "防災情報", "被災者支援"],
  },
  business: {
    name: "産業・事業者",
    nameEn: "business",
    description: "起業、融資、補助金、許認可、法人税など",
    keywords: ["事業", "起業", "融資", "補助金", "法人", "許可"],
    subtopics: ["起業支援", "融資・補助金", "許認可", "法人税"],
  },
  employment: {
    name: "就労・雇用",
    nameEn: "employment",
    description: "就職支援、労働相談、職業訓練、ハローワークなど",
    keywords: ["就労", "雇用", "就職", "労働", "職業", "ハローワーク"],
    subtopics: ["就職支援", "職業訓練", "労働相談", "シルバー人材"],
  },
  driving: {
    name: "自動車・運転",
    nameEn: "driving",
    description: "運転免許、車検、駐車場、交通安全など",
    keywords: ["運転", "自動車", "免許", "車", "駐車", "交通"],
    subtopics: ["運転免許", "車両登録", "駐車場", "交通安全"],
  },
  nationality: {
    name: "国籍・在留",
    nameEn: "nationality",
    description: "外国人登録、在留資格、帰化、パスポートなど",
    keywords: ["外国人", "国籍", "在留", "帰化", "パスポート", "ビザ"],
    subtopics: ["外国人登録", "在留資格", "帰化", "国際結婚"],
  },
  civic: {
    name: "市民参加・行政",
    nameEn: "civic",
    description: "選挙、情報公開、市民相談、パブリックコメントなど",
    keywords: ["選挙", "投票", "情報公開", "相談", "行政"],
    subtopics: ["選挙・投票", "情報公開", "市民相談", "行政手続"],
  },
  land: {
    name: "農林水産",
    nameEn: "land",
    description: "農業、林業、漁業、農地転用など",
    keywords: ["農業", "林業", "漁業", "農地", "農林水産"],
    subtopics: ["農業支援", "農地転用", "林業", "漁業"],
  },
  benefits: {
    name: "給付・助成",
    nameEn: "benefits",
    description: "各種給付金、助成金、年金など",
    keywords: ["給付", "助成", "年金", "手当", "補助"],
    subtopics: ["年金", "給付金", "助成金"],
  },
} as const;

export type TaxonomyCategory = keyof typeof INNOMA_TAXONOMY;

/**
 * タクソノミー分類結果
 */
export interface TaxonomyClassification {
  /** プライマリカテゴリ（最も適切な1つ） */
  primaryCategory: TaxonomyCategory;
  /** セカンダリカテゴリ（関連する他のカテゴリ、最大2つ） */
  secondaryCategories: TaxonomyCategory[];
  /** サブトピック（より詳細な分類） */
  subtopics: string[];
  /** 分類の信頼度 (0-1) */
  confidence: number;
  /** 分類の理由（日本語） */
  reasoning: string;
}

/**
 * 分類対象のコンテンツ情報
 */
export interface ContentForClassification {
  /** ページタイトル */
  title: string;
  /** ページの説明・概要 */
  description?: string;
  /** ページの本文（要約または全文） */
  content?: string;
  /** 関連キーワード */
  keywords?: string[];
}

/**
 * LLMを使ってコンテンツをタクソノミーに分類
 */
export async function classifyContent(
  content: ContentForClassification
): Promise<TaxonomyClassification> {
  // タクソノミー定義をプロンプト用に整形
  const taxonomyDescription = Object.entries(INNOMA_TAXONOMY)
    .map(([key, value]) => {
      return `- ${key} (${value.name}): ${value.description}
    キーワード: ${value.keywords.join(", ")}
    サブトピック: ${value.subtopics.join(", ")}`;
    })
    .join("\n");

  const prompt = `あなたは行政サービスの分類専門家です。
以下のコンテンツを分析し、最も適切なタクソノミーカテゴリに分類してください。

## タクソノミー定義
${taxonomyDescription}

## 分類対象コンテンツ
タイトル: ${content.title}
${content.description ? `説明: ${content.description}` : ""}
${content.content ? `本文（抜粋）: ${content.content.slice(0, 1000)}` : ""}
${content.keywords?.length ? `キーワード: ${content.keywords.join(", ")}` : ""}

## 分類ルール
1. primaryCategory: 最も適切なカテゴリを1つ選択（必須）
2. secondaryCategories: 関連する他のカテゴリを0-2個選択
3. subtopics: 選択したカテゴリのサブトピックから該当するものを選択
4. confidence: 分類の確信度を0-1で評価
5. reasoning: 分類の理由を簡潔に説明

## 出力形式（JSON）
{
  "primaryCategory": "カテゴリ名（英語キー）",
  "secondaryCategories": ["カテゴリ名"],
  "subtopics": ["サブトピック名"],
  "confidence": 0.9,
  "reasoning": "分類の理由"
}`;

  const result = await generateJSON<TaxonomyClassification>(prompt, {
    temperature: 0.2,
    maxOutputTokens: 1024,
  });

  // バリデーション
  if (!isValidCategory(result.primaryCategory)) {
    throw new Error(`Invalid primary category: ${result.primaryCategory}`);
  }

  return {
    primaryCategory: result.primaryCategory,
    secondaryCategories: (result.secondaryCategories || []).filter(isValidCategory),
    subtopics: result.subtopics || [],
    confidence: Math.max(0, Math.min(1, result.confidence || 0.5)),
    reasoning: result.reasoning || "",
  };
}

/**
 * 複数コンテンツを一括分類
 */
export async function classifyContentBatch(
  contents: ContentForClassification[]
): Promise<TaxonomyClassification[]> {
  // 並列実行（レート制限を考慮して5件ずつ）
  const batchSize = 5;
  const results: TaxonomyClassification[] = [];

  for (let i = 0; i < contents.length; i += batchSize) {
    const batch = contents.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(classifyContent));
    results.push(...batchResults);

    // レート制限対策: バッチ間で少し待機
    if (i + batchSize < contents.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return results;
}

/**
 * カテゴリの妥当性チェック
 */
function isValidCategory(category: string): category is TaxonomyCategory {
  return category in INNOMA_TAXONOMY;
}

/**
 * キーワードベースの簡易分類（LLMなし）
 * LLMが使えない場合やプレビュー用
 */
export function classifyByKeywords(
  content: ContentForClassification
): TaxonomyClassification {
  const text = [content.title, content.description, content.content, ...(content.keywords || [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const scores: Record<TaxonomyCategory, number> = {} as Record<TaxonomyCategory, number>;

  for (const [category, definition] of Object.entries(INNOMA_TAXONOMY)) {
    let score = 0;
    for (const keyword of definition.keywords) {
      if (text.includes(keyword.toLowerCase())) {
        score += 1;
      }
    }
    scores[category as TaxonomyCategory] = score;
  }

  // スコア順にソート
  const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a);
  const [primaryCategory, primaryScore] = sorted[0];
  const secondaryCategories = sorted
    .slice(1, 3)
    .filter(([, score]) => score > 0)
    .map(([cat]) => cat as TaxonomyCategory);

  // サブトピックを取得
  const primaryDef = INNOMA_TAXONOMY[primaryCategory as TaxonomyCategory];
  const subtopics = primaryDef.subtopics.filter((st) =>
    text.includes(st.toLowerCase())
  );

  return {
    primaryCategory: primaryCategory as TaxonomyCategory,
    secondaryCategories,
    subtopics,
    confidence: Math.min(1, primaryScore / 3), // 3キーワードで100%
    reasoning: `キーワードマッチ: ${primaryDef.keywords.filter((k) => text.includes(k.toLowerCase())).join(", ")}`,
  };
}

/**
 * 分類結果をpage-registry形式に変換
 */
export function toPageRegistryFormat(
  slug: string,
  filePath: string,
  classification: TaxonomyClassification
): {
  slug: string;
  entry: {
    filePath: string;
    categories: TaxonomyCategory[];
    type?: "topic";
  };
} {
  return {
    slug,
    entry: {
      filePath,
      categories: [classification.primaryCategory, ...classification.secondaryCategories],
    },
  };
}
