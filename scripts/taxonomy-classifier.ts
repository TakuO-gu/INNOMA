#!/usr/bin/env npx tsx
/**
 * LLM Taxonomy Classifier CLI
 *
 * Content Itemを自動的にタクソノミーに分類し、page-registryを更新
 *
 * 使用方法:
 *   npx tsx scripts/taxonomy-classifier.ts                    # 全ページを分類
 *   npx tsx scripts/taxonomy-classifier.ts --slug kokuho      # 特定ページのみ
 *   npx tsx scripts/taxonomy-classifier.ts --dry-run          # プレビューのみ
 *   npx tsx scripts/taxonomy-classifier.ts --no-llm           # キーワードベース分類
 */

import * as fs from "fs";
import * as path from "path";

// プロジェクトルートからの相対パス
const ARTIFACTS_DIR = path.join(__dirname, "../apps/web/data/artifacts");
const TEMPLATES_DIR = path.join(ARTIFACTS_DIR, "_templates");
const PAGE_REGISTRY_PATH = path.join(TEMPLATES_DIR, "page-registry.json");

// コマンドライン引数
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const NO_LLM = args.includes("--no-llm");
const slugArgIndex = args.indexOf("--slug");
const TARGET_SLUG = args.find((a) => a.startsWith("--slug="))?.split("=")[1] ||
  (slugArgIndex !== -1 && args[slugArgIndex + 1] && !args[slugArgIndex + 1].startsWith("--") ? args[slugArgIndex + 1] : undefined);

interface PageRegistryEntry {
  filePath: string;
  categories: string[];
  type?: "topic";
}

interface PageRegistry {
  [slug: string]: PageRegistryEntry;
}

interface TaxonomyClassification {
  primaryCategory: string;
  secondaryCategories: string[];
  subtopics: string[];
  confidence: number;
  reasoning: string;
}

interface ArtifactData {
  title: string;
  description?: string;
  search?: {
    summary?: string;
    keywords?: string[];
    plain_text?: string;
  };
}

/**
 * タクソノミー定義（taxonomy-classifier.tsと同期）
 */
const INNOMA_TAXONOMY: Record<string, { name: string; keywords: string[]; subtopics: string[] }> = {
  registration: {
    name: "届出・証明",
    keywords: ["届出", "届", "証明", "登録", "戸籍", "住民票", "印鑑"],
    subtopics: ["戸籍", "住民登録", "印鑑登録", "マイナンバー", "婚姻・離婚", "出生・死亡"],
  },
  childcare: {
    name: "子育て・出産",
    keywords: ["子育て", "出産", "妊娠", "保育", "児童", "子ども", "育児"],
    subtopics: ["妊娠・出産", "保育所・幼稚園", "児童手当", "子育て支援", "母子保健"],
  },
  welfare: {
    name: "福祉・介護",
    keywords: ["福祉", "介護", "高齢", "障害", "障がい", "生活保護", "年金"],
    subtopics: ["高齢者福祉", "介護保険", "障害者支援", "生活保護", "地域包括支援"],
  },
  health: {
    name: "健康・医療",
    keywords: ["健康", "医療", "保険", "健診", "予防接種", "国保"],
    subtopics: ["国民健康保険", "後期高齢者医療", "健診・検診", "予防接種"],
  },
  tax: {
    name: "税金",
    keywords: ["税", "税金", "納税", "申告", "住民税", "固定資産"],
    subtopics: ["住民税", "固定資産税", "軽自動車税", "納税", "確定申告", "税証明"],
  },
  environment: {
    name: "環境・ごみ",
    keywords: ["ごみ", "ゴミ", "環境", "リサイクル", "分別", "収集"],
    subtopics: ["ごみの出し方", "粗大ごみ", "リサイクル", "家電リサイクル"],
  },
  housing: {
    name: "住まい・土地",
    keywords: ["住宅", "住まい", "建築", "土地", "公営住宅", "空き家"],
    subtopics: ["公営住宅", "住宅補助", "建築確認", "空き家対策"],
  },
  disaster: {
    name: "防災・安全",
    keywords: ["防災", "避難", "災害", "ハザードマップ", "防犯", "安全"],
    subtopics: ["避難所", "ハザードマップ", "防災情報", "被災者支援"],
  },
  business: {
    name: "産業・事業者",
    keywords: ["事業", "起業", "融資", "補助金", "法人", "許可"],
    subtopics: ["起業支援", "融資・補助金", "許認可", "法人税"],
  },
  employment: {
    name: "就労・雇用",
    keywords: ["就労", "雇用", "就職", "労働", "職業", "ハローワーク"],
    subtopics: ["就職支援", "職業訓練", "労働相談", "シルバー人材"],
  },
  driving: {
    name: "自動車・運転",
    keywords: ["運転", "自動車", "免許", "車", "駐車", "交通"],
    subtopics: ["運転免許", "車両登録", "駐車場", "交通安全"],
  },
  nationality: {
    name: "国籍・在留",
    keywords: ["外国人", "国籍", "在留", "帰化", "パスポート", "ビザ"],
    subtopics: ["外国人登録", "在留資格", "帰化", "国際結婚"],
  },
  civic: {
    name: "市民参加・行政",
    keywords: ["選挙", "投票", "情報公開", "相談", "行政"],
    subtopics: ["選挙・投票", "情報公開", "市民相談", "行政手続"],
  },
  land: {
    name: "農林水産",
    keywords: ["農業", "林業", "漁業", "農地", "農林水産"],
    subtopics: ["農業支援", "農地転用", "林業", "漁業"],
  },
  benefits: {
    name: "給付・助成",
    keywords: ["給付", "助成", "年金", "手当", "補助"],
    subtopics: ["年金", "給付金", "助成金"],
  },
};

/**
 * キーワードベースの分類
 */
function classifyByKeywords(
  title: string,
  description?: string,
  keywords?: string[]
): TaxonomyClassification {
  const text = [title, description, ...(keywords || [])].filter(Boolean).join(" ").toLowerCase();

  const scores: Record<string, number> = {};

  for (const [category, definition] of Object.entries(INNOMA_TAXONOMY)) {
    let score = 0;
    for (const keyword of definition.keywords) {
      if (text.includes(keyword.toLowerCase())) {
        score += 1;
      }
    }
    scores[category] = score;
  }

  const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a);
  const [primaryCategory, primaryScore] = sorted[0];
  const secondaryCategories = sorted
    .slice(1, 3)
    .filter(([, score]) => score > 0)
    .map(([cat]) => cat);

  const primaryDef = INNOMA_TAXONOMY[primaryCategory];
  const subtopics = primaryDef.subtopics.filter((st) => text.includes(st.toLowerCase()));

  return {
    primaryCategory,
    secondaryCategories,
    subtopics,
    confidence: Math.min(1, primaryScore / 3),
    reasoning: `キーワードマッチ: ${primaryDef.keywords.filter((k) => text.includes(k.toLowerCase())).join(", ")}`,
  };
}

/**
 * LLMで分類（gemini.tsをdynamic import）
 */
async function classifyWithLLM(
  title: string,
  description?: string,
  keywords?: string[]
): Promise<TaxonomyClassification> {
  // taxonomy-classifier.tsをdynamic import
  const { classifyContent } = await import(
    "../apps/web/lib/llm/prompts/taxonomy-classifier"
  );

  return classifyContent({
    title,
    description,
    keywords,
  });
}

/**
 * Artifactファイルを読み込んで分類対象データを取得
 */
function loadArtifactData(filePath: string): ArtifactData | null {
  const fullPath = path.join(TEMPLATES_DIR, filePath + ".json");
  if (!fs.existsSync(fullPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(fullPath, "utf-8");
    return JSON.parse(content) as ArtifactData;
  } catch {
    return null;
  }
}

/**
 * メイン処理
 */
async function main() {
  console.log("=".repeat(60));
  console.log("INNOMA Taxonomy Classifier");
  console.log("=".repeat(60));
  console.log(`Mode: ${NO_LLM ? "Keyword-based" : "LLM-based"}`);
  console.log(`Dry run: ${DRY_RUN}`);
  if (TARGET_SLUG) {
    console.log(`Target: ${TARGET_SLUG}`);
  }
  console.log("");

  // page-registryを読み込み
  const registry: PageRegistry = JSON.parse(fs.readFileSync(PAGE_REGISTRY_PATH, "utf-8"));

  // 分類対象を抽出（topicを除く）
  const targets = Object.entries(registry).filter(([slug, entry]) => {
    if (entry.type === "topic") return false;
    if (TARGET_SLUG && slug !== TARGET_SLUG) return false;
    return true;
  });

  console.log(`Processing ${targets.length} Content Items...\n`);

  const stats = {
    processed: 0,
    updated: 0,
    errors: 0,
    unchanged: 0,
  };

  const updates: { slug: string; oldCategories: string[]; newCategories: string[]; reasoning: string }[] = [];

  for (const [slug, entry] of targets) {
    const artifact = loadArtifactData(entry.filePath);
    if (!artifact) {
      console.log(`  [SKIP] ${slug}: Artifact not found`);
      continue;
    }

    try {
      let classification: TaxonomyClassification;

      if (NO_LLM) {
        classification = classifyByKeywords(
          artifact.title,
          artifact.description || artifact.search?.summary,
          artifact.search?.keywords
        );
      } else {
        classification = await classifyWithLLM(
          artifact.title,
          artifact.description || artifact.search?.summary,
          artifact.search?.keywords
        );
        // LLM呼び出し間隔を空ける
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      const newCategories = [
        classification.primaryCategory,
        ...classification.secondaryCategories,
      ];

      const oldCategories = entry.categories;
      const hasChanged =
        JSON.stringify(oldCategories.sort()) !== JSON.stringify(newCategories.sort());

      if (hasChanged) {
        updates.push({
          slug,
          oldCategories,
          newCategories,
          reasoning: classification.reasoning,
        });
        stats.updated++;
        console.log(`  [UPDATE] ${slug}`);
        console.log(`    ${artifact.title}`);
        console.log(`    ${oldCategories.join(", ")} → ${newCategories.join(", ")}`);
        console.log(`    (${classification.reasoning})`);
      } else {
        stats.unchanged++;
        console.log(`  [OK] ${slug}: ${oldCategories.join(", ")}`);
      }

      stats.processed++;
    } catch (error) {
      stats.errors++;
      console.error(`  [ERROR] ${slug}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // 結果サマリー
  console.log("\n" + "=".repeat(60));
  console.log("Summary");
  console.log("=".repeat(60));
  console.log(`Processed:  ${stats.processed}`);
  console.log(`Updated:    ${stats.updated}`);
  console.log(`Unchanged:  ${stats.unchanged}`);
  console.log(`Errors:     ${stats.errors}`);

  // 変更をpage-registryに反映
  if (!DRY_RUN && updates.length > 0) {
    console.log("\nUpdating page-registry.json...");

    for (const update of updates) {
      registry[update.slug].categories = update.newCategories;
    }

    fs.writeFileSync(PAGE_REGISTRY_PATH, JSON.stringify(registry, null, 2) + "\n");
    console.log(`✓ Updated ${updates.length} entries`);
  } else if (DRY_RUN && updates.length > 0) {
    console.log("\n⚠️  DRY RUN - 実際に変更するには --dry-run を外して再実行");
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
