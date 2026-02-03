/**
 * Content Type Classifier
 *
 * GOV.UK方式の3ページタイプ（service/guide/answer）を判別するLLMプロンプト
 * docs/guides/CONTENT_ITEM_CREATION.md の定義に準拠
 */

import { generateJSON } from "../gemini";

/**
 * コンテンツタイプの定義
 */
export type ContentType = "service" | "guide" | "answer";

/**
 * 分類結果
 */
export interface ContentTypeClassification {
  /** 判定されたコンテンツタイプ */
  contentType: ContentType;
  /** 判定の信頼度 (0-1) */
  confidence: number;
  /** 判定の理由（日本語） */
  reasoning: string;
  /** 推奨されるページタイトル形式 */
  suggestedTitleFormat: string;
}

/**
 * 分類対象のコンテンツ情報
 */
export interface ContentForTypeClassification {
  /** ページタイトル */
  title: string;
  /** ページの説明・概要 */
  description?: string;
  /** ページの本文（要約または全文） */
  content?: string;
  /** 元のURL */
  sourceUrl?: string;
}

/**
 * コンテンツタイプの定義（プロンプト用）
 */
const CONTENT_TYPE_DEFINITIONS = `
## コンテンツタイプの定義

### 1. service（行動ページ）
**目的**: 利用者に具体的な行動を起こさせる
**特徴**:
- 申請・登録・支払い・予約・提出などの行動を促す
- 文章は最小限、CTAが主役
- 「今すぐ何をすればよいか」が明確

**判定シグナル**:
- タイトルが動詞で始まる（「〜を申請する」「〜を届け出る」）
- 「申請」「届出」「手続き」「登録」「予約」などのアクション語
- 必要書類、手数料、窓口情報がメインコンテンツ
- オンライン申請フォームへのリンク

**タイトル形式**: 動詞で始まる（例: 「住民票を請求する」「転入届を届け出る」）

### 2. guide（理解ページ）
**目的**: 制度や仕組みを理解させる
**特徴**:
- 制度の概要、対象者、条件を説明
- 見出しで80%理解できる構成
- 行動を促さない、理解させることに集中

**判定シグナル**:
- タイトルが名詞（制度名）で終わる（「児童手当」「国民健康保険」）
- 「とは」「について」「制度」「概要」などの説明語
- 条件分岐、金額表、スケジュールなどの詳細情報
- 「詳しくはこちら」のような補足リンク

**タイトル形式**: 名詞（制度名）で終わる（例: 「児童手当」「国民健康保険制度」）

### 3. answer（判定ページ）
**目的**: 対象かどうかを判定する
**特徴**:
- 読むページではなく操作するページ
- Yes/Noの質問で分岐し、結論を出す
- 説明は最小限、判定に集中

**判定シグナル**:
- タイトルが疑問文（「〜ですか？」「〜できますか？」）
- 対象者判定、資格確認、診断チェック
- 条件によって結果が分岐する内容
- 「対象」「該当」「受給資格」などの判定語

**タイトル形式**: 疑問文（例: 「児童手当を受け取れますか？」「住民票が必要ですか？」）
`;

/**
 * 判定ルール（プロンプト用）
 */
const CLASSIFICATION_RULES = `
## 判定ルール

### 優先順位
1. タイトル形式を最優先で判断
   - 疑問文 → answer
   - 動詞で始まる → service
   - 名詞（制度名）→ guide

2. コンテンツの目的で判断
   - 行動させたい → service
   - 理解させたい → guide
   - 判定させたい → answer

3. 迷った場合のデフォルト
   - 手続き・申請の説明 → guide（serviceは行動特化のため）
   - 制度の条件説明 → guide（answerはインタラクティブ判定のため）

### 注意点
- 1ページ = 1目的を厳守
- 「手続き方法」の説明はguide、実際の手続き開始はservice
- 「対象者の条件」の説明はguide、対象かの判定はanswer
`;

/**
 * LLMを使ってコンテンツタイプを判定
 */
export async function classifyContentType(
  content: ContentForTypeClassification
): Promise<ContentTypeClassification> {
  const prompt = `あなたは自治体ウェブサイトのコンテンツ設計エキスパートです。
以下のコンテンツを分析し、GOV.UK方式の3タイプ（service/guide/answer）のどれに該当するか判定してください。

${CONTENT_TYPE_DEFINITIONS}

${CLASSIFICATION_RULES}

## 分析対象コンテンツ
タイトル: ${content.title}
${content.description ? `説明: ${content.description}` : ""}
${content.content ? `本文（抜粋）:\n${content.content.slice(0, 2000)}` : ""}
${content.sourceUrl ? `URL: ${content.sourceUrl}` : ""}

## 出力形式（JSON）
{
  "contentType": "service" | "guide" | "answer",
  "confidence": 0.0-1.0,
  "reasoning": "判定理由（日本語、2-3文）",
  "suggestedTitleFormat": "推奨されるタイトル形式の例"
}`;

  const result = await generateJSON<ContentTypeClassification>(prompt, {
    temperature: 0.1,
    maxOutputTokens: 1024,
  });

  // バリデーション
  const validTypes: ContentType[] = ["service", "guide", "answer"];
  if (!validTypes.includes(result.contentType)) {
    // デフォルトはguide
    result.contentType = "guide";
  }

  return {
    contentType: result.contentType,
    confidence: Math.max(0, Math.min(1, result.confidence || 0.5)),
    reasoning: result.reasoning || "",
    suggestedTitleFormat: result.suggestedTitleFormat || "",
  };
}

/**
 * 複数コンテンツを一括分類
 */
export async function classifyContentTypeBatch(
  contents: ContentForTypeClassification[]
): Promise<ContentTypeClassification[]> {
  // 並列実行（レート制限を考慮して5件ずつ）
  const batchSize = 5;
  const results: ContentTypeClassification[] = [];

  for (let i = 0; i < contents.length; i += batchSize) {
    const batch = contents.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(classifyContentType));
    results.push(...batchResults);

    // レート制限対策: バッチ間で少し待機
    if (i + batchSize < contents.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return results;
}

/**
 * キーワードベースの簡易分類（LLMなし）
 * LLMが使えない場合やプレビュー用
 */
export function classifyContentTypeByKeywords(
  content: ContentForTypeClassification
): ContentTypeClassification {
  const title = content.title || "";
  const text = [content.title, content.description, content.content]
    .filter(Boolean)
    .join(" ");

  // 1. タイトル形式で判定（最優先）

  // 疑問文 → answer
  if (title.includes("？") || title.includes("?") ||
      title.match(/ですか|できますか|必要ですか|対象ですか|受け取れますか/)) {
    return {
      contentType: "answer",
      confidence: 0.9,
      reasoning: "タイトルが疑問文形式のため、判定ページ（answer）と判断",
      suggestedTitleFormat: title,
    };
  }

  // 動詞で始まる → service
  const actionVerbs = [
    "申請する", "届け出る", "届出する", "届ける", "届を出す",
    "登録する", "変更する", "取得する", "請求する", "受け取る",
    "予約する", "申し込む", "支払う", "納める", "提出する",
  ];
  for (const verb of actionVerbs) {
    if (title.includes(verb)) {
      return {
        contentType: "service",
        confidence: 0.85,
        reasoning: `タイトルに行動動詞「${verb}」が含まれるため、行動ページ（service）と判断`,
        suggestedTitleFormat: title,
      };
    }
  }

  // 2. コンテンツのキーワードで判定

  // answer判定キーワード
  const answerKeywords = ["対象者判定", "資格確認", "チェック", "診断", "該当するか"];
  for (const keyword of answerKeywords) {
    if (text.includes(keyword)) {
      return {
        contentType: "answer",
        confidence: 0.7,
        reasoning: `コンテンツに判定関連キーワード「${keyword}」が含まれるため、判定ページ（answer）と判断`,
        suggestedTitleFormat: `${title.replace(/について|の案内|制度$/, "")}を受けられますか？`,
      };
    }
  }

  // service判定キーワード（高優先度）
  const serviceKeywordsHigh = ["オンライン申請", "電子申請", "申請フォーム", "予約フォーム"];
  for (const keyword of serviceKeywordsHigh) {
    if (text.includes(keyword)) {
      return {
        contentType: "service",
        confidence: 0.8,
        reasoning: `コンテンツにアクション関連キーワード「${keyword}」が含まれるため、行動ページ（service）と判断`,
        suggestedTitleFormat: `${title.replace(/について|の案内|制度$/, "")}を申請する`,
      };
    }
  }

  // service判定キーワード（低優先度）
  const serviceKeywordsLow = ["必要書類", "手数料", "窓口", "受付時間", "持ち物"];
  let serviceScore = 0;
  for (const keyword of serviceKeywordsLow) {
    if (text.includes(keyword)) {
      serviceScore++;
    }
  }
  if (serviceScore >= 3) {
    return {
      contentType: "service",
      confidence: 0.6,
      reasoning: "手続き関連キーワード（必要書類、手数料、窓口等）が複数含まれるため、行動ページ（service）と判断",
      suggestedTitleFormat: `${title.replace(/について|の案内|制度$/, "")}を申請する`,
    };
  }

  // 3. デフォルトはguide
  return {
    contentType: "guide",
    confidence: 0.5,
    reasoning: "明確な行動・判定シグナルがないため、理解ページ（guide）と判断",
    suggestedTitleFormat: title.replace(/を申請する|の手続き$/, ""),
  };
}

/**
 * タイトルからコンテンツタイプを推定（超簡易版）
 */
export function guessContentTypeFromTitle(title: string): ContentType {
  // 疑問文 → answer
  if (title.includes("？") || title.includes("?") ||
      title.match(/ですか|できますか|必要ですか/)) {
    return "answer";
  }

  // 動詞で終わる → service
  if (title.match(/する$|届け出る$|届ける$|請求する$|申請する$/)) {
    return "service";
  }

  // デフォルト → guide
  return "guide";
}

/* =============================================================================
 * ページ分割機能
 *
 * 1ページ = 1目的 の原則に従い、複数目的を持つページを分割する
 * ============================================================================= */

/**
 * 分割されたページの提案
 */
export interface SplitPageSuggestion {
  /** 提案されるページタイトル */
  title: string;
  /** コンテンツタイプ */
  contentType: ContentType;
  /** このページに含めるべき内容の要約 */
  contentSummary: string;
  /** 元コンテンツのどの部分を使用するか（セクション名やキーワード） */
  sourceReference: string[];
  /** 推奨されるURL slug */
  suggestedSlug: string;
}

/**
 * ページ分割分析結果
 */
export interface PageSplitAnalysis {
  /** 分割が必要かどうか */
  needsSplit: boolean;
  /** 分割の理由 */
  reasoning: string;
  /** 検出されたコンテンツタイプ（複数の場合は分割推奨） */
  detectedTypes: ContentType[];
  /** 分割する場合の提案（needsSplit=trueの場合のみ） */
  splitSuggestions: SplitPageSuggestion[];
  /** 分割しない場合の単一タイプ判定 */
  singleTypeClassification?: ContentTypeClassification;
}

/**
 * ページ分割が必要かどうかを分析
 */
export async function analyzePageSplit(
  content: ContentForTypeClassification
): Promise<PageSplitAnalysis> {
  const prompt = `あなたは自治体ウェブサイトのコンテンツ設計エキスパートです。
以下のコンテンツを分析し、「1ページ = 1目的」の原則に従って分割が必要かどうか判定してください。

${CONTENT_TYPE_DEFINITIONS}

## 分割の判定基準

### 分割が必要なケース
1. **制度説明 + 申請手続き** が混在
   - 例: 「児童手当とは〜」の説明と「申請方法」「必要書類」が同一ページ
   - → guide（制度説明）と service（申請手続き）に分割

2. **制度説明 + 対象者判定** が混在
   - 例: 制度の概要と「対象となる方」のチェックリストが詳細
   - → guide（制度説明）と answer（対象者判定）に分割

3. **複数の独立したサービス** が混在
   - 例: 「転入届」「転出届」「転居届」が1ページに
   - → それぞれ独立した service に分割

4. **3つ以上に分割が必要な場合**
   - 例: 児童手当のページに「制度説明」「申請手続き」「対象者判定」がすべて含まれる
   - → guide + service + answer の3ページに分割
   - 各ページは明確に1つの目的を持つこと

### 分割が不要なケース
1. 1つの目的に集中している
2. 付随情報として他タイプの要素が少量含まれる程度
3. 制度説明の中で簡単に対象者を言及している程度

## 分析対象コンテンツ
タイトル: ${content.title}
${content.description ? `説明: ${content.description}` : ""}
${content.content ? `本文:\n${content.content.slice(0, 4000)}` : ""}
${content.sourceUrl ? `URL: ${content.sourceUrl}` : ""}

## 出力形式（JSON）
{
  "needsSplit": true | false,
  "reasoning": "判定理由（日本語、2-3文）",
  "detectedTypes": ["guide", "service"] など検出されたタイプ,
  "splitSuggestions": [
    {
      "title": "提案されるページタイトル",
      "contentType": "guide" | "service" | "answer",
      "contentSummary": "このページに含めるべき内容の要約（50字程度）",
      "sourceReference": ["元コンテンツのセクション名やキーワード"],
      "suggestedSlug": "url-slug"
    }
  ],
  "singleTypeClassification": {
    "contentType": "guide" | "service" | "answer",
    "confidence": 0.0-1.0,
    "reasoning": "判定理由",
    "suggestedTitleFormat": "推奨タイトル"
  }
}

注意:
- needsSplit=true の場合、splitSuggestions は必須（2つ以上）
- needsSplit=false の場合、singleTypeClassification は必須
- 分割する場合、各ページは明確に1つの目的を持つこと`;

  const result = await generateJSON<PageSplitAnalysis>(prompt, {
    temperature: 0.2,
    maxOutputTokens: 2048,
  });

  // バリデーション
  const validTypes: ContentType[] = ["service", "guide", "answer"];

  return {
    needsSplit: result.needsSplit || false,
    reasoning: result.reasoning || "",
    detectedTypes: (result.detectedTypes || []).filter(t => validTypes.includes(t)),
    splitSuggestions: result.needsSplit
      ? (result.splitSuggestions || []).map(s => ({
          title: s.title || "",
          contentType: validTypes.includes(s.contentType) ? s.contentType : "guide",
          contentSummary: s.contentSummary || "",
          sourceReference: s.sourceReference || [],
          suggestedSlug: s.suggestedSlug || "",
        }))
      : [],
    singleTypeClassification: !result.needsSplit && result.singleTypeClassification
      ? {
          contentType: validTypes.includes(result.singleTypeClassification.contentType)
            ? result.singleTypeClassification.contentType
            : "guide",
          confidence: Math.max(0, Math.min(1, result.singleTypeClassification.confidence || 0.5)),
          reasoning: result.singleTypeClassification.reasoning || "",
          suggestedTitleFormat: result.singleTypeClassification.suggestedTitleFormat || "",
        }
      : undefined,
  };
}

/**
 * キーワードベースの簡易分割分析（LLMなし）
 */
export function analyzePageSplitByKeywords(
  content: ContentForTypeClassification
): PageSplitAnalysis {
  const text = [content.title, content.description, content.content]
    .filter(Boolean)
    .join(" ");
  const title = content.title || "";

  // 各タイプのシグナルをカウント
  const signals = {
    guide: 0,
    service: 0,
    answer: 0,
  };

  // guide シグナル
  const guideKeywords = ["とは", "について", "制度", "概要", "仕組み", "対象者", "支給額"];
  for (const kw of guideKeywords) {
    if (text.includes(kw)) signals.guide++;
  }

  // service シグナル
  const serviceKeywords = ["申請方法", "届出方法", "必要書類", "手数料", "窓口", "受付時間", "持ち物", "オンライン申請"];
  for (const kw of serviceKeywords) {
    if (text.includes(kw)) signals.service++;
  }

  // answer シグナル（対象者判定が複雑な場合のみ）
  const answerKeywords = ["対象ですか", "該当するか", "チェック", "判定", "資格確認", "受け取れますか"];
  const answerComplexityKeywords = ["以下のいずれか", "次の条件", "該当する場合", "対象となる方", "対象外", "例外"];
  for (const kw of answerKeywords) {
    if (text.includes(kw)) signals.answer += 2; // 強いシグナル
  }
  for (const kw of answerComplexityKeywords) {
    if (text.includes(kw)) signals.answer += 1; // 弱いシグナル（複雑さの指標）
  }

  // 検出されたタイプを判定
  const detectedTypes: ContentType[] = [];
  if (signals.guide >= 2) detectedTypes.push("guide");
  if (signals.service >= 3) detectedTypes.push("service");
  if (signals.answer >= 3) detectedTypes.push("answer"); // 閾値を上げて精度向上

  // 分割が必要か判定（2タイプ以上検出された場合）
  const needsSplit = detectedTypes.length >= 2;

  if (needsSplit) {
    const baseName = title.replace(/について|の案内|制度$|の手続き$/, "");
    const splitSuggestions: SplitPageSuggestion[] = [];

    if (detectedTypes.includes("guide")) {
      splitSuggestions.push({
        title: baseName,
        contentType: "guide",
        contentSummary: `${baseName}の制度概要、対象者、支給額などの説明`,
        sourceReference: guideKeywords.filter(kw => text.includes(kw)),
        suggestedSlug: baseName.toLowerCase().replace(/\s+/g, "-"),
      });
    }
    if (detectedTypes.includes("service")) {
      splitSuggestions.push({
        title: `${baseName}を申請する`,
        contentType: "service",
        contentSummary: `${baseName}の申請手続き、必要書類、窓口情報`,
        sourceReference: serviceKeywords.filter(kw => text.includes(kw)),
        suggestedSlug: `${baseName.toLowerCase().replace(/\s+/g, "-")}-apply`,
      });
    }
    if (detectedTypes.includes("answer")) {
      splitSuggestions.push({
        title: `${baseName}を受け取れますか？`,
        contentType: "answer",
        contentSummary: `${baseName}の対象者判定`,
        sourceReference: answerKeywords.filter(kw => text.includes(kw)),
        suggestedSlug: `${baseName.toLowerCase().replace(/\s+/g, "-")}-check`,
      });
    }

    return {
      needsSplit: true,
      reasoning: `複数のコンテンツタイプ（${detectedTypes.join(", ")}）が検出されたため、分割を推奨`,
      detectedTypes,
      splitSuggestions,
    };
  }

  // 分割不要の場合、単一タイプを判定
  const singleType = classifyContentTypeByKeywords(content);
  return {
    needsSplit: false,
    reasoning: "単一の目的に集中しているため、分割不要",
    detectedTypes: [singleType.contentType],
    splitSuggestions: [],
    singleTypeClassification: singleType,
  };
}

/**
 * ページ分析と分類を一括で実行（分割が必要な場合は分割提案を返す）
 */
export async function classifyAndSplitIfNeeded(
  content: ContentForTypeClassification
): Promise<PageSplitAnalysis> {
  // まず分割分析を実行
  const analysis = await analyzePageSplit(content);
  return analysis;
}

/**
 * 複数コンテンツの一括分析（分割提案含む）
 */
export async function classifyAndSplitBatch(
  contents: ContentForTypeClassification[]
): Promise<PageSplitAnalysis[]> {
  const batchSize = 3; // 分割分析は重いので3件ずつ
  const results: PageSplitAnalysis[] = [];

  for (let i = 0; i < contents.length; i += batchSize) {
    const batch = contents.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(analyzePageSplit));
    results.push(...batchResults);

    if (i + batchSize < contents.length) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }

  return results;
}

/* =============================================================================
 * 追加ページ推奨機能
 *
 * guideページに対して、関連するservice/answerページの作成を推奨する
 * ============================================================================= */

/**
 * 追加ページの推奨
 */
export interface AdditionalPageRecommendation {
  /** 推奨されるページタイプ */
  pageType: "service" | "answer";
  /** 推奨されるタイトル */
  title: string;
  /** 推奨されるURLスラッグ */
  slug: string;
  /** 推奨理由 */
  reason: string;
  /** 推奨の強さ (high/medium/low) */
  priority: "high" | "medium" | "low";
  /** このページに含めるべき内容 */
  suggestedContent: string[];
}

/**
 * ページ分析結果（追加ページ推奨含む）
 */
export interface PageAnalysisWithRecommendations {
  /** 現在のページタイプ */
  currentType: ContentType;
  /** 追加ページの推奨リスト */
  recommendations: AdditionalPageRecommendation[];
  /** 分析の要約 */
  summary: string;
}

/**
 * 届出・申請キーワード（serviceページ推奨用）
 */
const SERVICE_TRIGGER_KEYWORDS = {
  // 届出系
  todoke: ["届", "届出", "届け出", "届け"],
  // 申請系
  shinsei: ["申請", "申込", "申し込み", "手続き", "手続"],
  // 登録系
  touroku: ["登録", "加入", "入会"],
  // 請求系
  seikyuu: ["請求", "交付", "発行", "取得"],
  // 予約系
  yoyaku: ["予約", "予約制"],
  // 納付系
  noufu: ["納付", "納税", "支払い", "支払"],
};

/**
 * 対象者判定キーワード（answerページ推奨用）
 *
 * 複雑度の定義:
 * - 強シグナル（weight: 3）: 明確に判定が必要なキーワード
 * - 中シグナル（weight: 2）: 条件分岐を示唆するキーワード
 * - 弱シグナル（weight: 1）: 単純な言及程度のキーワード
 *
 * answerページ推奨条件:
 * - 複雑度スコア >= 5 かつ
 * - 2つ以上の異なるカテゴリに該当 かつ
 * - 単純届出タイプでない
 */
const ANSWER_TRIGGER_KEYWORDS = {
  // 給付・受給系（強シグナル: 金銭給付は判定が複雑なことが多い）
  kyuufu: { keywords: ["受給", "給付", "支給", "もらえる", "受け取れる", "手当"], weight: 3 },
  // 所得・年齢制限系（強シグナル: 複数条件の組み合わせ）
  seigen: { keywords: ["所得制限", "所得", "収入", "年収"], weight: 3 },
  // 年齢条件系（中シグナル）
  nenrei: { keywords: ["年齢", "〜歳以上", "〜歳未満", "〜歳まで", "65歳", "75歳", "18歳"], weight: 2 },
  // 資格・要件系（中シグナル）
  jouken: { keywords: ["条件", "要件", "資格", "受給資格", "加入条件"], weight: 2 },
  // 対象者系（弱シグナル: 単純な言及の可能性あり）
  taishousha: { keywords: ["対象者", "対象となる方"], weight: 1 },
  // 該当系（弱シグナル）
  gaitou: { keywords: ["該当", "該当する"], weight: 1 },
};

/**
 * 単純な届出タイプ（answerページが不要なケース）
 * これらは対象者判定がシンプルで、住民であれば基本的に全員対象
 */
const SIMPLE_PROCEDURE_PATTERNS = [
  // 転居系
  /^転入届?$/,
  /^転出届?$/,
  /^転居届?$/,
  // 届出系（ライフイベント）
  /^出生届?$/,
  /^死亡届?$/,
  /^婚姻届?$/,
  /^離婚届?$/,
  // 証明書系
  /^住民票/,
  /^戸籍/,
  /^印鑑登録?$/,
  /^税証明/,
  // ごみ系
  /^ごみ/,
  /^粗大ごみ/,
  /^家電リサイクル/,
];

/**
 * タイトルからサービスの基本名を抽出
 */
function extractBaseName(title: string): string {
  return title
    .replace(/について|の案内|制度$|の手続き$|のご案内$|に関する.+$/, "")
    .trim();
}

/**
 * コンテンツから追加ページの推奨を生成（キーワードベース）
 */
export function recommendAdditionalPages(
  content: ContentForTypeClassification
): PageAnalysisWithRecommendations {
  const title = content.title || "";
  const text = [content.title, content.description, content.content]
    .filter(Boolean)
    .join(" ");
  const baseName = extractBaseName(title);

  const recommendations: AdditionalPageRecommendation[] = [];

  // 現在のタイプを判定
  const currentType = guessContentTypeFromTitle(title);

  // service推奨の判定
  const serviceSignals: { keyword: string; category: string }[] = [];
  for (const [category, keywords] of Object.entries(SERVICE_TRIGGER_KEYWORDS)) {
    for (const kw of keywords) {
      if (text.includes(kw)) {
        serviceSignals.push({ keyword: kw, category });
      }
    }
  }

  // answer推奨の判定（複雑度スコアを計算）
  const answerSignals: { keyword: string; category: string; weight: number }[] = [];
  let answerComplexityScore = 0;
  for (const [category, config] of Object.entries(ANSWER_TRIGGER_KEYWORDS)) {
    for (const kw of config.keywords) {
      if (text.includes(kw)) {
        answerSignals.push({ keyword: kw, category, weight: config.weight });
        answerComplexityScore += config.weight;
        break; // 同一カテゴリは1回のみカウント
      }
    }
  }

  // 単純届出タイプかどうかを判定
  const isSimpleProcedure = SIMPLE_PROCEDURE_PATTERNS.some(pattern => pattern.test(baseName));

  // serviceページの推奨
  if (serviceSignals.length > 0 && currentType !== "service") {
    const uniqueCategories = Array.from(new Set(serviceSignals.map(s => s.category)));
    const priority = serviceSignals.length >= 3 ? "high" : serviceSignals.length >= 2 ? "medium" : "low";

    // 適切な動詞を選択
    let verb = "申請する";
    let slugSuffix = "apply";
    if (uniqueCategories.includes("todoke")) {
      verb = "届け出る";
      slugSuffix = "submit";
    } else if (uniqueCategories.includes("touroku")) {
      verb = "登録する";
      slugSuffix = "register";
    } else if (uniqueCategories.includes("seikyuu")) {
      verb = "請求する";
      slugSuffix = "request";
    } else if (uniqueCategories.includes("yoyaku")) {
      verb = "予約する";
      slugSuffix = "reserve";
    }

    recommendations.push({
      pageType: "service",
      title: `${baseName}を${verb}`,
      slug: `${toSlug(baseName)}-${slugSuffix}`,
      reason: `届出・申請関連キーワード（${serviceSignals.slice(0, 3).map(s => s.keyword).join("、")}）が検出されました`,
      priority,
      suggestedContent: [
        "必要書類一覧",
        "手数料",
        "窓口・受付時間",
        "オンライン申請リンク（あれば）",
        "申請の流れ（StepNavigation）",
      ],
    });
  }

  // answerページの推奨
  // 条件:
  // 1. 複雑度スコア >= 5（強シグナル2つ or 強+中 or 中3つ以上）
  // 2. 2つ以上の異なるカテゴリに該当
  // 3. 単純届出タイプでない
  const uniqueAnswerCategories = Array.from(new Set(answerSignals.map(s => s.category)));
  const shouldRecommendAnswer =
    currentType !== "answer" &&
    !isSimpleProcedure &&
    answerComplexityScore >= 5 &&
    uniqueAnswerCategories.length >= 2;

  if (shouldRecommendAnswer) {
    // 優先度は複雑度スコアに基づく
    const priority = answerComplexityScore >= 8 ? "high" : answerComplexityScore >= 6 ? "medium" : "low";

    // 適切な疑問文を選択
    let question = "対象ですか？";
    let slugSuffix = "check";
    if (uniqueAnswerCategories.includes("kyuufu")) {
      question = "受け取れますか？";
      slugSuffix = "check";
    } else if (uniqueAnswerCategories.includes("jouken")) {
      question = "利用できますか？";
      slugSuffix = "eligibility";
    } else if (uniqueAnswerCategories.includes("nenrei")) {
      question = "対象年齢ですか？";
      slugSuffix = "check";
    }

    recommendations.push({
      pageType: "answer",
      title: `${baseName}${question}`,
      slug: `${toSlug(baseName)}-${slugSuffix}`,
      reason: `対象者判定が複雑です（複雑度スコア: ${answerComplexityScore}、カテゴリ: ${uniqueAnswerCategories.join("、")}）`,
      priority,
      suggestedContent: [
        "SmartAnswer形式の判定フロー",
        "判定結果ごとの次のアクション",
        "関連するguide/serviceページへのリンク",
      ],
    });
  }

  // 優先度でソート
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  // サマリー生成
  let summary = "";
  if (recommendations.length === 0) {
    summary = "追加ページの作成は不要と判断されました。";
  } else {
    const serviceRec = recommendations.filter(r => r.pageType === "service");
    const answerRec = recommendations.filter(r => r.pageType === "answer");
    const parts: string[] = [];
    if (serviceRec.length > 0) {
      parts.push(`serviceページ（${serviceRec[0].title}）`);
    }
    if (answerRec.length > 0) {
      parts.push(`answerページ（${answerRec[0].title}）`);
    }
    summary = `${parts.join("と")}の作成を推奨します。`;
  }

  return {
    currentType,
    recommendations,
    summary,
  };
}

/**
 * 日本語タイトルをURL用スラッグに変換
 */
function toSlug(title: string): string {
  // 簡易的な変換（実際の運用では適切なローマ字変換を使用）
  return title
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/g, "");
}

/**
 * 複数コンテンツの追加ページ推奨を一括生成
 */
export function recommendAdditionalPagesBatch(
  contents: ContentForTypeClassification[]
): PageAnalysisWithRecommendations[] {
  return contents.map(recommendAdditionalPages);
}

/**
 * LLMを使った詳細な追加ページ推奨
 */
export async function recommendAdditionalPagesWithLLM(
  content: ContentForTypeClassification
): Promise<PageAnalysisWithRecommendations> {
  const prompt = `あなたは自治体ウェブサイトのコンテンツ設計エキスパートです。
以下のコンテンツを分析し、追加で作成すべきページを推奨してください。

${CONTENT_TYPE_DEFINITIONS}

## 推奨の判断基準

### serviceページを推奨するケース
- 届出・申請・登録・請求などの手続きがある
- 必要書類や手数料の情報がある
- 窓口や受付時間の情報がある
- オンライン申請が可能

### answerページを推奨するケース
- 対象者の条件が複数ある（年齢、所得、居住地など）
- 「対象となる方」「受給資格」などの記載がある
- 条件によって結果が分岐する
- ユーザーが「自分は対象か？」と迷う可能性がある

## 分析対象コンテンツ
タイトル: ${content.title}
${content.description ? `説明: ${content.description}` : ""}
${content.content ? `本文:\n${content.content.slice(0, 3000)}` : ""}

## 出力形式（JSON）
{
  "currentType": "guide" | "service" | "answer",
  "recommendations": [
    {
      "pageType": "service" | "answer",
      "title": "推奨タイトル",
      "slug": "url-slug",
      "reason": "推奨理由（日本語）",
      "priority": "high" | "medium" | "low",
      "suggestedContent": ["含めるべき内容1", "含めるべき内容2"]
    }
  ],
  "summary": "分析サマリー（日本語、1-2文）"
}

注意:
- 推奨がない場合は recommendations を空配列にする
- priority は届出/申請が明確なら high、可能性があるなら medium、あいまいなら low
- suggestedContent には具体的な内容を3-5個リストアップ`;

  const result = await generateJSON<PageAnalysisWithRecommendations>(prompt, {
    temperature: 0.2,
    maxOutputTokens: 2048,
  });

  // バリデーション
  const validTypes: ContentType[] = ["service", "guide", "answer"];
  const validPageTypes: ("service" | "answer")[] = ["service", "answer"];
  const validPriorities: ("high" | "medium" | "low")[] = ["high", "medium", "low"];

  return {
    currentType: validTypes.includes(result.currentType) ? result.currentType : "guide",
    recommendations: (result.recommendations || [])
      .filter(r => validPageTypes.includes(r.pageType))
      .map(r => ({
        pageType: r.pageType,
        title: r.title || "",
        slug: r.slug || "",
        reason: r.reason || "",
        priority: validPriorities.includes(r.priority) ? r.priority : "medium",
        suggestedContent: r.suggestedContent || [],
      })),
    summary: result.summary || "",
  };
}
