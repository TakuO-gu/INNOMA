/**
 * Content Structurer Prompt
 *
 * LLMが取得した情報を適切なブロックタイプに構造化するためのプロンプト
 */

import { generateJSON } from '../gemini';
import type { Block } from '../../artifact/innoma-artifact-schema.v2';

/**
 * 情報タイプの定義
 */
export type InformationType =
  | 'procedure'      // 手続きの流れ・ステップ
  | 'requirements'   // 必要書類・持ち物
  | 'eligibility'    // 対象者・条件
  | 'fees'           // 費用・料金
  | 'schedule'       // 受付時間・場所・期間
  | 'contact'        // 問い合わせ先
  | 'warning'        // 注意事項・警告
  | 'emergency'      // 緊急情報（災害、臨時休業等）
  | 'faq'            // よくある質問
  | 'links'          // 関連リンク
  | 'related'        // 関連サービス・カード形式
  | 'quote'          // 法令引用・規則
  | 'status'         // ステータス情報（受付中、準備中等）
  | 'definition'     // 用語説明・名前-値ペア（シンプルな場合）
  | 'description'    // 一般的な説明文

/**
 * 構造化された情報
 */
export interface StructuredInfo {
  type: InformationType;
  title?: string;
  content: unknown; // ブロックタイプによって異なる
  importance: 'high' | 'medium' | 'low';
}

/**
 * コンポーネント選択ルール
 */
export const COMPONENT_SELECTION_RULES = `
## コンポーネント選択ルール

### 1. 手続きの流れ（procedure）
- 3ステップ以上で各ステップに詳細説明がある → StepNavigation
- 2ステップ以下またはシンプル → RichText (ordered list)

### 2. 必要書類（requirements）
- 条件分岐あり（本人/代理人等）で2-4条件 → Table
- 条件分岐あり（5条件以上）→ Accordion
- シンプルなリスト（3項目以下）→ DescriptionList
- シンプルなリスト（4項目以上）→ RichText (unordered list)

### 3. 費用・料金（fees）
- 2パターン以上 → Table
- 1パターン → DescriptionList または RichText (強調テキスト)

### 4. 対象者・条件（eligibility）
- 対象/対象外の区別がある → Table
- シンプルな条件 → RichText (unordered list)

### 5. 問い合わせ先（contact）
- 単一窓口 → Contact
- 複数窓口（2-3箇所）→ DirectoryList
- 複数窓口（4箇所以上）→ Card形式でグリッド表示

### 6. 注意事項（warning）
- 重要 かつ 説明文が50文字以上 → NotificationBanner (severity: warning)
- 短い注意事項（50文字未満）→ RichText (unordered list)
- 補足的な注意 → RichText (paragraph)

### 7. 緊急情報（emergency）
- 災害情報、臨時休業等 → EmergencyBanner（最優先で表示）

### 8. FAQ（faq）
- Q&A形式 → Accordion

### 9. 関連リンク（links）
- 説明付き → ResourceList
- シンプル → RelatedLinks
- アクション誘導 → ActionButton

### 10. 関連サービス（related）
- 関連する他サービスへの誘導 → Card（グリッド表示）

### 11. 法令引用・規則（quote）
- 法令の引用、重要な規則 → Blockquote

### 12. ステータス情報（status）
- 受付中、準備中等の状態表示 → StatusBadge

### 13. 用語説明・名前-値ペア（definition）
- シンプルな定義リスト → DescriptionList
- Tableほど複雑でない場合に使用
`;

/**
 * 情報分析プロンプト
 */
export function buildAnalysisPrompt(
  rawContent: string,
  serviceName: string,
  municipalityName: string
): string {
  return `あなたは自治体サービスページのコンテンツ構造化エキスパートです。

以下のコンテンツを分析し、情報タイプごとに分類してください。

【サービス名】${serviceName}
【自治体名】${municipalityName}

【コンテンツ】
${rawContent}

【情報タイプ】
- procedure: 手続きの流れ・ステップ
- requirements: 必要書類・持ち物
- eligibility: 対象者・条件
- fees: 費用・料金
- schedule: 受付時間・場所・期間
- contact: 問い合わせ先
- warning: 注意事項・警告
- emergency: 緊急情報（災害、臨時休業等）
- faq: よくある質問
- links: 関連リンク
- related: 関連サービス
- quote: 法令引用・規則
- status: ステータス情報（受付中、準備中等）
- definition: 用語説明・名前-値ペア（シンプルな場合）
- description: 一般的な説明文

【出力形式】
{
  "sections": [
    {
      "type": "情報タイプ",
      "title": "セクションタイトル",
      "content": "抽出した内容",
      "importance": "high/medium/low",
      "hasConditions": true/false,  // 条件分岐があるか
      "itemCount": 数値,            // アイテム数（リストの場合）
      "stepCount": 数値             // ステップ数（手順の場合）
    }
  ],
  "summary": "サービスの概要（1-2文）"
}

注意:
- 各情報タイプは複数回出現可能
- 重要度は市民にとっての重要度で判断
- 同じ情報を複数のタイプに分類しない
`;
}

/**
 * ブロック生成プロンプト
 */
export function buildBlockGenerationPrompt(
  analyzedSections: StructuredInfo[],
  _serviceName: string
): string {
  const sectionsJson = JSON.stringify(analyzedSections, null, 2);

  return `以下の分析結果を、INNOMAのブロックタイプに変換してください。

【分析結果】
${sectionsJson}

${COMPONENT_SELECTION_RULES}

【出力形式】
{
  "blocks": [
    {
      "id": "一意のID",
      "type": "ブロックタイプ",
      "props": { ... }
    }
  ]
}

【ブロックタイプの定義】

1. Section
{
  "type": "Section",
  "props": {
    "heading": "セクション見出し",
    "level": 2 | 3 | 4,
    "content": RichTextNode[]
  }
}

2. StepNavigation
{
  "type": "StepNavigation",
  "props": {
    "steps": [
      { "title": "ステップタイトル", "body": RichTextNode[] }
    ]
  }
}

3. Table
{
  "type": "Table",
  "props": {
    "rows": [
      { "label": "ラベル", "value": "値" または RichTextNode[] }
    ]
  }
}

4. Accordion
{
  "type": "Accordion",
  "props": {
    "items": [
      { "title": "質問/見出し", "content": RichTextNode[] }
    ]
  }
}

5. NotificationBanner
{
  "type": "NotificationBanner",
  "props": {
    "severity": "info" | "warning" | "danger" | "success",
    "title": "タイトル",
    "content": RichTextNode[] (オプション)
  }
}

6. Contact
{
  "type": "Contact",
  "props": {
    "department": "部署名",
    "phone": "電話番号",
    "email": "メールアドレス",
    "hours": "受付時間",
    "address": "住所"
  }
}

7. ResourceList
{
  "type": "ResourceList",
  "props": {
    "heading": "見出し",
    "items": [
      { "title": "リンクテキスト", "href": "URL", "description": "説明" }
    ]
  }
}

8. RichText
{
  "type": "RichText",
  "props": {
    "content": RichTextNode[]
  }
}

【RichTextNodeの形式】
- { "type": "heading", "level": 2|3|4, "text": "見出し" }
- { "type": "paragraph", "runs": [{ "text": "テキスト", "bold": true/false }] }
- { "type": "list", "ordered": true/false, "items": [[RichTextNode]] }
- { "type": "callout", "severity": "info"|"warning"|"danger", "title": "タイトル", "content": [RichTextNode] }

【セクション順序】
1. 概要 (RichText)
2. 重要なお知らせ (NotificationBanner) ※該当する場合のみ
3. 対象となる方 (Section)
4. 必要なもの (Section)
5. 手続きの流れ (StepNavigation または Section)
6. 費用 (Section または Table)
7. 届出先・受付時間 (Section)
8. ご注意ください (Section with callout)
9. よくある質問 (Accordion)
10. 問い合わせ先 (Contact)
11. 関連情報 (ResourceList または RelatedLinks)
`;
}

/**
 * 分析結果にブロックタイプ候補を付与
 */
interface AnalyzedSection {
  type: InformationType;
  title?: string;
  content: string;
  importance: 'high' | 'medium' | 'low';
  hasConditions?: boolean;
  itemCount?: number;
  stepCount?: number;
  // コードで決定したブロックタイプ候補
  recommendedBlock: string;
  alternativeBlocks: string[];
}

function enrichWithBlockRecommendations(
  sections: Array<{
    type: InformationType;
    title?: string;
    content: string;
    importance: 'high' | 'medium' | 'low';
    hasConditions?: boolean;
    itemCount?: number;
    stepCount?: number;
  }>
): AnalyzedSection[] {
  return sections.map(section => {
    const recommended = getRecommendedBlockType(section.type, {
      hasConditions: section.hasConditions,
      itemCount: section.itemCount,
      stepCount: section.stepCount,
      importance: section.importance,
      contentLength: section.content.length, // 文字数を渡す
    });

    // 代替候補を決定
    const alternatives: string[] = [];
    switch (section.type) {
      case 'procedure':
        alternatives.push('StepNavigation', 'RichText');
        break;
      case 'requirements':
        alternatives.push('Table', 'Accordion', 'DescriptionList', 'RichText');
        break;
      case 'eligibility':
        alternatives.push('Table', 'RichText');
        break;
      case 'fees':
        alternatives.push('Table', 'DescriptionList', 'RichText');
        break;
      case 'schedule':
        alternatives.push('Table', 'DescriptionList', 'Contact');
        break;
      case 'contact':
        alternatives.push('Contact', 'DirectoryList', 'Card', 'Table');
        break;
      case 'warning':
        alternatives.push('NotificationBanner', 'RichText');
        break;
      case 'emergency':
        alternatives.push('EmergencyBanner', 'NotificationBanner');
        break;
      case 'faq':
        alternatives.push('Accordion');
        break;
      case 'links':
        alternatives.push('ResourceList', 'ActionButton', 'RelatedLinks');
        break;
      case 'related':
        alternatives.push('Card', 'ResourceList');
        break;
      case 'quote':
        alternatives.push('Blockquote', 'RichText');
        break;
      case 'status':
        alternatives.push('StatusBadge', 'RichText');
        break;
      case 'definition':
        alternatives.push('DescriptionList', 'Table', 'RichText');
        break;
      default:
        alternatives.push('RichText');
    }

    return {
      ...section,
      recommendedBlock: recommended,
      alternativeBlocks: alternatives.filter(a => a !== recommended),
    };
  });
}

/**
 * ブロック生成プロンプト（改善版）
 */
function buildEnhancedBlockPrompt(sections: AnalyzedSection[]): string {
  const sectionsWithRecommendations = sections.map(s => ({
    type: s.type,
    title: s.title,
    content: s.content,
    importance: s.importance,
    hasConditions: s.hasConditions,
    itemCount: s.itemCount,
    stepCount: s.stepCount,
    recommendedBlock: s.recommendedBlock,
    alternativeBlocks: s.alternativeBlocks,
  }));

  return `以下の分析結果を、指定されたブロックタイプに変換してください。

【重要】
- 各セクションの「recommendedBlock」を優先的に使用してください
- Sectionは使用しないでください（代わりにTable, StepNavigation, Accordion等を使う）
- RichTextを使う場合は、calloutやlistを積極的に活用してください

【分析結果】
${JSON.stringify(sectionsWithRecommendations, null, 2)}

【出力形式】
{
  "blocks": [
    {
      "id": "一意のID",
      "type": "ブロックタイプ（recommendedBlockまたはalternativeBlocksから選択）",
      "props": { ... }
    }
  ]
}

【ブロックタイプと使い分け】

## StepNavigation（手順が3つ以上ある場合に必須）
{
  "type": "StepNavigation",
  "props": {
    "steps": [
      { "title": "ステップ1: 申請書に記入", "body": [RichTextNode] }
    ]
  }
}

## Table（比較・条件分岐がある場合に必須）
{
  "type": "Table",
  "props": {
    "rows": [
      { "label": "本人の場合", "value": "運転免許証、マイナンバーカード" },
      { "label": "代理人の場合", "value": "委任状＋代理人の本人確認書類" }
    ]
  }
}

## Accordion（FAQ、詳細情報がある場合）
{
  "type": "Accordion",
  "props": {
    "items": [
      { "title": "質問または見出し", "content": [RichTextNode] }
    ]
  }
}

## NotificationBanner（重要な注意事項 かつ 50文字以上の説明がある場合のみ）
- 短い注意事項（50文字未満）はRichText with calloutを使用すること
- titleとcontentの両方が必要
{
  "type": "NotificationBanner",
  "props": {
    "severity": "warning",
    "title": "注意事項のタイトル",
    "content": [RichTextNode]
  }
}

## Contact（問い合わせ先）
{
  "type": "Contact",
  "props": {
    "department": "市民課",
    "phone": "0766-20-1234",
    "hours": "平日8:30〜17:15",
    "address": "市役所1階"
  }
}

## ResourceList（関連リンク）
{
  "type": "ResourceList",
  "props": {
    "heading": "関連情報",
    "items": [
      { "title": "リンクテキスト", "href": "#", "description": "説明" }
    ]
  }
}

## DescriptionList（シンプルな名前-値ペア、3項目以下の場合）
- Tableより軽量で、シンプルな情報に適切
{
  "type": "DescriptionList",
  "props": {
    "heading": "見出し（オプション）",
    "items": [
      { "term": "項目名", "description": "説明文" }
    ]
  }
}

## EmergencyBanner（緊急情報・災害時）
- 最優先で表示される
- 災害情報、臨時休業等に使用
{
  "type": "EmergencyBanner",
  "props": {
    "title": "緊急のお知らせ",
    "content": [RichTextNode],
    "link": { "href": "#", "text": "詳細はこちら" }
  }
}

## Card（関連サービス、複数窓口のグリッド表示）
- 関連サービスへの誘導
- 4箇所以上の窓口案内
{
  "type": "Card",
  "props": {
    "title": "カードタイトル",
    "description": "説明文",
    "href": "リンク先（オプション）",
    "image": "画像URL（オプション）"
  }
}

## Blockquote（法令引用・規則）
- 法律や条例の引用
- 重要な規則の明示
{
  "type": "Blockquote",
  "props": {
    "content": "引用テキスト",
    "cite": "出典（オプション）"
  }
}

## StatusBadge（ステータス表示）
- 受付中、準備中等の状態表示
{
  "type": "StatusBadge",
  "props": {
    "label": "受付中",
    "variant": "success" | "warning" | "error" | "info"
  }
}

## DirectoryList（複数窓口の一覧表示、2-3箇所の場合）
- 複数の問い合わせ先を一覧表示
{
  "type": "DirectoryList",
  "props": {
    "heading": "届出先一覧",
    "items": [
      { "name": "市民課", "phone": "0766-20-1234", "address": "市役所1階" },
      { "name": "支所窓口", "phone": "0766-20-5678", "address": "支所1階" }
    ]
  }
}

## RichText（他に適切なブロックがない場合のみ）
- listまたはparagraphを使用
- 単なる段落の羅列は避け、リストで構造化すること
{
  "type": "RichText",
  "props": {
    "content": [
      { "type": "paragraph", "runs": [{ "text": "説明文", "bold": false }] },
      { "type": "list", "ordered": false, "items": [[{ "type": "paragraph", "runs": [{ "text": "項目1" }] }]] }
    ]
  }
}

【RichTextNodeの形式】
- { "type": "paragraph", "runs": [{ "text": "テキスト", "bold": true/false }] }
- { "type": "list", "ordered": true/false, "items": [[RichTextNode, ...], ...] }
- { "type": "heading", "level": 3, "text": "見出し" }

【セクション順序】
1. 概要 (RichText with paragraph)
2. 重要なお知らせ (NotificationBanner - 50文字以上の場合のみ)
3. 対象となる方 (Table または RichText with list)
4. 必要なもの (Table または Accordion)
5. 手続きの流れ (StepNavigation)
6. 費用 (Table または DescriptionList)
7. 届出先・受付時間 (Contact または DirectoryList)
8. ご注意ください (NotificationBanner - 50文字以上、または RichText with list)
9. よくある質問 (Accordion)
10. 問い合わせ先 (Contact または DirectoryList)
11. 関連情報 (ResourceList)
`;
}

/**
 * コンテンツを分析してブロックに変換
 */
export async function analyzeAndStructure(
  rawContent: string,
  serviceName: string,
  municipalityName: string
): Promise<{ blocks: Block[]; summary: string }> {
  // Step 1: コンテンツを分析
  const analysisPrompt = buildAnalysisPrompt(rawContent, serviceName, municipalityName);

  interface AnalysisResult {
    sections: Array<{
      type: InformationType;
      title?: string;
      content: string;
      importance: 'high' | 'medium' | 'low';
      hasConditions?: boolean;
      itemCount?: number;
      stepCount?: number;
    }>;
    summary: string;
  }

  const analysis = await generateJSON<AnalysisResult>(analysisPrompt, {
    maxOutputTokens: 4000,
  });

  // Step 2: コードでブロックタイプ候補を決定
  const enrichedSections = enrichWithBlockRecommendations(analysis.sections);

  // Step 3: LLMでブロックに変換（推奨タイプを指定）
  const blockPrompt = buildEnhancedBlockPrompt(enrichedSections);

  interface BlockResult {
    blocks: Block[];
  }

  const result = await generateJSON<BlockResult>(blockPrompt, {
    maxOutputTokens: 8000,
  });

  return {
    blocks: result.blocks,
    summary: analysis.summary,
  };
}

/**
 * 情報タイプから推奨ブロックタイプを取得
 */
export function getRecommendedBlockType(
  infoType: InformationType,
  options: {
    hasConditions?: boolean;
    itemCount?: number;
    stepCount?: number;
    importance?: 'high' | 'medium' | 'low';
    contentLength?: number; // コンテンツの文字数
  } = {}
): string {
  const { hasConditions, itemCount = 0, stepCount = 0, importance = 'medium' } = options;

  switch (infoType) {
    case 'procedure':
      if (stepCount >= 3) return 'StepNavigation';
      return 'RichText'; // ordered list

    case 'requirements':
      if (hasConditions) {
        if (itemCount <= 4) return 'Table';
        return 'Accordion';
      }
      // シンプルなリストは項目数で判断
      if (itemCount <= 3) return 'DescriptionList';
      return 'RichText'; // unordered list

    case 'eligibility':
      if (hasConditions) return 'Table';
      return 'RichText'; // unordered list

    case 'fees':
      if (itemCount >= 2) return 'Table';
      return 'DescriptionList';

    case 'schedule':
      return 'Table';

    case 'contact':
      if (itemCount >= 4) return 'Card'; // 多数の窓口はカード形式
      if (itemCount >= 2) return 'DirectoryList';
      return 'Contact';

    case 'warning':
      // NotificationBannerは適切な文章量（50文字以上）がある場合のみ使用
      // 短い注意事項はcalloutで十分
      if (importance === 'high' && options.contentLength && options.contentLength >= 50) {
        return 'NotificationBanner';
      }
      return 'RichText'; // with callout

    case 'emergency':
      // 緊急情報は常にEmergencyBanner
      return 'EmergencyBanner';

    case 'faq':
      return 'Accordion';

    case 'links':
      if (importance === 'high') return 'ActionButton';
      return 'ResourceList';

    case 'related':
      // 関連サービスはカード形式
      return 'Card';

    case 'quote':
      // 法令引用はBlockquote
      return 'Blockquote';

    case 'status':
      // ステータス情報はStatusBadge
      return 'StatusBadge';

    case 'definition':
      // シンプルな定義リスト
      return 'DescriptionList';

    case 'description':
    default:
      return 'RichText';
  }
}
