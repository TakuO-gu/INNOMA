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
 * コンポーネント選択ルール（DADS準拠 31種類対応）
 *
 * docs/FETCH_TO_SHOW_FLOWCHART.md の「コンポーネント選択ロジック（DADS準拠）」と同期
 *
 * 注意: Breadcrumbsはディレクトリ構造から自動生成されるため、このルールには含まない
 */
export const COMPONENT_SELECTION_RULES = `
## コンポーネント選択ルール（DADS準拠 31種類）

### ページ構造
- ページタイトル → Title
- 概要・要約 → Summary
- セクション見出し（h2）→ Section (level: 2)
- セクション見出し（h3/h4）→ RichText (heading node)
- ※パンくず（Breadcrumbs）はディレクトリ構造から自動生成されるため、コンテンツ構造化では扱わない

### ナビゲーション・リンク
- **RelatedLinks**: シンプルな関連リンクのリスト（テキストリンクのみ、説明なし）
  - 例: 「関連ページ」「このページを見た人はこちらも」
- **ResourceList**: 詳細説明付きのリソース一覧（タイトル・説明・リンク）
  - 例: 「申請に必要な書類」「関連する制度の詳細」「外部サービスへのリンク」
- **QuickLinks**: ページ内アンカーやトップへのクイックアクセス

### 手順・フロー
- 3ステップ以上 → StepNavigation
- 1〜2ステップ → RichText (ordered list)
- ※1ステップしかない場合は手順UIではなく、RichText (paragraph)で説明

### リスト・データ
- 条件分岐あり かつ 折りたたみ必要 → Accordion
- シンプルなリスト → RichText (unordered list)
- 定義リスト（用語説明）→ DescriptionList
- キー・バリューペア → DescriptionList

### 表（Table）
- **Tableは以下の場合のみ使用**:
  1. 項目を並べて比較する必要がある場合（例: 複数プランの比較、条件別の料金表）
  2. 大量のデータを一覧表示する場合（5項目以上）
- 単純なキー・バリューはDescriptionListを使用
- 手数料が1〜4項目程度 → DescriptionList

### Q&A・FAQ
- Q&A形式 → Accordion

### 通知・警告
- 緊急（災害、臨時休業等）→ EmergencyBanner
- 重要度: 高（危険）→ NotificationBanner (severity: danger)
- 重要度: 中（警告）→ NotificationBanner (severity: warning)
- 重要度: 低（情報）→ NotificationBanner (severity: info)
- 成功通知 → NotificationBanner (severity: success)

### 連絡先・施設
- 1件の連絡先 → Contact
- 複数の連絡先 → DirectoryList
- 避難所情報 → ShelterList
- ハザードマップ → HazardMapViewer

### カード・グリッド
- **類似したクリック可能なアイテムを並べる場合** → CardGrid (variant: link)
- 比較・詳細表示（5項目以上）→ Table
- 画像+テキスト → CardGrid (variant: media)
- アイコン+説明 → CardGrid (variant: info)
- 統計・数値（複数）→ InfoCardGrid
- 統計・数値（単体）→ InfoCard
- 関連サービス・リンク（2項目以上）→ CardGrid

### トピック・ニュース
- トピック（グリッド）→ TopicGrid
- トピック（リスト）→ TopicList
- ニュース一覧 → NewsList
- ニュースメタ情報 → NewsMeta

### アクション
- 主要CTAボタン → ActionButton
- 補助アクション → TaskButton
- 添付ファイル → Attachments

### 地区・変数
- 地区選択UI → DistrictSelector

### テキスト・引用
- 本文 → RichText
- 引用（法令等）→ Blockquote
- ステータス表示 → StatusBadge

### ホームページ専用
- ヒーローセクション → Hero

### 参照
- 出典・参照元 → Sources (Wikipedia形式)
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
- { "type": "divider" }

【セクション順序】
1. 概要 (RichText)
2. 重要なお知らせ (NotificationBanner) ※該当する場合のみ
3. 対象となる方 (Section)
4. 必要なもの (Section)
5. 手続きの流れ (3ステップ以上: StepNavigation、1-2ステップ: RichText)
6. 費用 (Section または Table)
7. 届出先・受付時間 (Section)
8. ご注意ください (NotificationBanner または RichText)
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
 * ブロック定義（JSON形式の例）
 */
const BLOCK_DEFINITIONS = `
## StepNavigation（手順が3つ以上ある場合のみ使用）
- 1〜2ステップの場合はRichText (ordered list)を使用すること
- 1ステップしかない場合はStepNavigationもordered listも使わず、RichText (paragraph)で説明
{
  "type": "StepNavigation",
  "props": {
    "steps": [
      { "title": "ステップ1: 申請書に記入", "body": [RichTextNode] },
      { "title": "ステップ2: 窓口に提出", "body": [RichTextNode] },
      { "title": "ステップ3: 交付を受け取る", "body": [RichTextNode] }
    ]
  }
}

## Table（比較・条件分岐がある場合）
- 値が空の場合はTableを使用せず、RichText (unordered list)を使用
{
  "type": "Table",
  "props": {
    "rows": [
      { "label": "本人の場合", "value": "運転免許証、マイナンバーカード" },
      { "label": "代理人の場合", "value": "委任状＋代理人の本人確認書類" }
    ]
  }
}

## Accordion（FAQ、条件分岐あり かつ 折りたたみが必要な場合）
{
  "type": "Accordion",
  "props": {
    "items": [
      { "title": "質問または見出し", "content": [RichTextNode] }
    ]
  }
}

## NotificationBanner（重要な注意事項 かつ 50文字以上の説明がある場合のみ）
- 短い注意事項（50文字未満）はRichText (unordered list)を使用すること
- severityはinfo/warning/danger/successから選択
{
  "type": "NotificationBanner",
  "props": {
    "severity": "warning",
    "title": "注意事項のタイトル",
    "content": [RichTextNode]
  }
}

## EmergencyBanner（緊急情報・災害時のみ）
{
  "type": "EmergencyBanner",
  "props": {
    "title": "緊急のお知らせ",
    "content": [RichTextNode],
    "link": { "href": "#", "text": "詳細はこちら" }
  }
}

## Contact（1件の連絡先）
{
  "type": "Contact",
  "props": {
    "department": "市民課",
    "phone": "0766-20-1234",
    "hours": "平日8:30〜17:15",
    "address": "市役所1階"
  }
}

## DirectoryList（複数の連絡先）
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

## ResourceList（関連リンク - カード形式・説明付き）
{
  "type": "ResourceList",
  "props": {
    "heading": "関連情報",
    "items": [
      { "title": "リンクテキスト", "href": "#", "description": "説明" }
    ]
  }
}

## RelatedLinks（関連リンク - リスト形式・説明なし）
{
  "type": "RelatedLinks",
  "props": {
    "heading": "関連リンク",
    "items": [
      { "text": "リンクテキスト", "href": "#", "external": false }
    ]
  }
}

## DescriptionList（定義リスト・用語説明）
{
  "type": "DescriptionList",
  "props": {
    "heading": "見出し（オプション）",
    "items": [
      { "term": "項目名", "description": "説明文" }
    ]
  }
}

## ActionButton（主要CTAボタン）
{
  "type": "ActionButton",
  "props": {
    "label": "ボタンテキスト",
    "href": "#",
    "variant": "primary" | "secondary"
  }
}

## TaskButton（補助アクションボタン）
{
  "type": "TaskButton",
  "props": {
    "label": "ボタンテキスト",
    "href": "#"
  }
}

## Attachments（添付ファイル）
{
  "type": "Attachments",
  "props": {
    "title": "関連書類",
    "items": [
      { "title": "申請書", "href": "#", "content_type": "application/pdf" }
    ]
  }
}

## CardGrid（カードグリッド - 画像+テキスト / リンクカード / アイコン+説明）
{
  "type": "CardGrid",
  "props": {
    "heading": "見出し（オプション）",
    "variant": "media" | "link" | "info",
    "columns": 2 | 3 | 4,
    "items": [
      { "title": "タイトル", "description": "説明", "href": "#", "image": "画像URL" }
    ]
  }
}

## InfoCard（統計・数値 - 単体）
{
  "type": "InfoCard",
  "props": {
    "title": "タイトル",
    "description": "説明",
    "count": "10",
    "countLabel": "か所",
    "icon": "info",
    "variant": "default"
  }
}

## InfoCardGrid（統計・数値 - 複数）
{
  "type": "InfoCardGrid",
  "props": {
    "columns": 2 | 3 | 4,
    "cards": [
      { "title": "タイトル", "count": "10", "countLabel": "か所" }
    ]
  }
}

## Blockquote（引用・法令等）
{
  "type": "Blockquote",
  "props": {
    "content": "引用テキスト",
    "cite": "出典（オプション）"
  }
}

## StatusBadge（ステータス表示）
{
  "type": "StatusBadge",
  "props": {
    "label": "受付中",
    "variant": "success" | "warning" | "error" | "info"
  }
}

## Sources（出典・参照元）
{
  "type": "Sources",
  "props": {
    "items": [
      { "id": 1, "title": "出典タイトル", "url": "#", "accessed": "2024-01-01" }
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
`;

/**
 * RichTextNodeの形式定義
 */
const RICHTEXT_NODE_FORMAT = `
【RichTextNodeの形式】
- { "type": "paragraph", "runs": [{ "text": "テキスト", "bold": true/false }] }
- { "type": "list", "ordered": true/false, "items": [[RichTextNode, ...], ...] }
- { "type": "heading", "level": 3, "text": "見出し" }
- { "type": "divider" }
`;

/**
 * セクション順序定義（参照用）
 */
const _SECTION_ORDER = `
【セクション順序】
1. 概要 (RichText with paragraph)
2. 重要なお知らせ (NotificationBanner - 50文字以上の場合のみ、それ以外はRichText)
3. 対象となる方 (Table または RichText with list)
4. 必要なもの (Table または Accordion)
5. 手続きの流れ (3ステップ以上: StepNavigation、1-2ステップ: RichText ordered list、1ステップのみ: RichText paragraph)
6. 費用 (Table または DescriptionList)
7. 届出先・受付時間 (Contact または DirectoryList)
8. ご注意ください (NotificationBanner - 50文字以上、それ以外はRichText with list)
9. よくある質問 (Accordion)
10. 問い合わせ先 (Contact または DirectoryList)
11. 関連情報 (ResourceList または RelatedLinks)
12. 関連書類 (Attachments)
13. 出典・参照元 (Sources)
`;

/**
 * ブロック生成プロンプト（改善版）
 * recommendedBlockを必ず使用させる
 */
function buildEnhancedBlockPrompt(sections: AnalyzedSection[]): string {
  // セクションごとに必要な情報のみを抽出
  const sectionsForLLM = sections.map(s => ({
    title: s.title,
    content: s.content,
    blockType: s.recommendedBlock, // 必ずこのタイプを使用
    stepCount: s.stepCount,
    itemCount: s.itemCount,
    hasConditions: s.hasConditions,
  }));

  return `各セクションを指定されたblockTypeに変換してください。

【重要】各セクションの「blockType」を必ず使用してください。変更は禁止です。

【変換対象】
${JSON.stringify(sectionsForLLM, null, 2)}

【ブロック定義】
${BLOCK_DEFINITIONS}

${RICHTEXT_NODE_FORMAT}

【出力形式】
{
  "blocks": [
    {
      "id": "block-1",
      "type": "blockTypeの値をそのまま使用",
      "props": { ... }
    }
  ]
}
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
    maxOutputTokens: 8192,
  });

  // Step 2: コードでブロックタイプ候補を決定
  const enrichedSections = enrichWithBlockRecommendations(analysis.sections);

  // Step 3: LLMでブロックに変換（推奨タイプを指定）
  const blockPrompt = buildEnhancedBlockPrompt(enrichedSections);

  interface BlockResult {
    blocks: Block[];
  }

  const result = await generateJSON<BlockResult>(blockPrompt, {
    maxOutputTokens: 16384,
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
      // Tableは「項目を並べて比較する必要がある時」のみ使用
      // 通常の必要書類リストはRichTextまたはDescriptionList
      if (hasConditions) {
        // 条件付きでも比較が必要な場合のみTable（大量データ=5項目以上）
        if (itemCount >= 5) return 'Accordion';
        return 'DescriptionList';
      }
      if (itemCount <= 3) return 'DescriptionList';
      return 'RichText'; // unordered list

    case 'eligibility':
      // 対象者条件はシンプルなリストで十分
      return 'RichText'; // unordered list

    case 'fees':
      // 手数料は「比較が必要」または「大量データ（5項目以上）」の場合のみTable
      if (itemCount >= 5) return 'Table';
      return 'DescriptionList';

    case 'schedule':
      // スケジュールは比較が必要な場合（複数の時間帯・曜日など）のみTable
      // 単純な営業時間等はDescriptionListで十分
      if (itemCount >= 3) return 'Table';
      return 'DescriptionList';

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
      // 類似したクリック可能なアイテムが複数ある場合はCardGrid
      if (itemCount >= 3) return 'CardGrid';
      return 'ResourceList';

    case 'related':
      // 関連サービス・類似したクリック可能アイテムはカード形式
      if (itemCount >= 2) return 'CardGrid';
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
