/**
 * Content Structurer Prompt
 *
 * LLMが取得した情報を適切なブロックタイプに構造化するためのプロンプト
 * ContentType（service/guide/answer）に応じた特化ルールを適用
 */

import { generateJSON } from '../gemini';
import type { Block } from '../../artifact/innoma-artifact-schema.v2';
import type { ContentType } from './content-type-classifier';

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
 * Service Page（行動ページ）専用ルール
 * docs/guides/CONTENT_ITEM_CREATION.md セクション2に準拠
 */
export const SERVICE_PAGE_RULES = `
## Service Page（行動ページ）の構造ルール

### 目的
利用者に具体的な行動を起こさせる（申請・登録・支払い・予約・提出など）

### 原則
- 文章ほぼなし
- スクロールさせない
- CTAが主役

### 必須構成（上から順に）
1. Title（動詞で始まる：「〜を申請する」「〜を届け出る」）
2. Summary（1-2行、40-60字、誰が・何をするかだけ）
3. NotificationBanner?（重要な注意1つだけ、省略可）
4. Section: 対象者（箇条書き、3項目以内）
5. Section: 必要なもの（箇条書き、3項目以内）
6. Section: 手数料（1行のみ）
7. ActionButton（CTA：「申請を開始する」「オンラインで請求する」等）
8. Contact（問い合わせ先）
9. RelatedLinks（Guide/Answerへのリンク：「詳しく知りたい方はこちら」）

### 禁止コンポーネント（絶対に使用しない）
- Table（シンプルなリストで十分）
- StepNavigation（長すぎる）
- Accordion（行動の妨げ）
- DescriptionList（複雑すぎる）
- FAQ・よくある質問
- 長文の説明
- 制度の背景説明
`;

/**
 * Guide Page（理解ページ）専用ルール
 * docs/guides/CONTENT_ITEM_CREATION.md セクション3に準拠
 */
export const GUIDE_PAGE_RULES = `
## Guide Page（理解ページ）の構造ルール

### 目的
制度や仕組みを理解させる（判断や行動の「前提理解」をつくる）

### 原則
- 読ませない前提で書く
- 見出しが8割
- 文章は補足
- 判断はさせない

### 必須構成（上から順に）
1. Title（名詞・制度名：「児童手当」「国民健康保険」）
2. Summary（2-3行、60-100字、誰向けか・何が起きるか）
3. Section: 〜とは（1-2文の説明）
4. Section: 受け取れる人（箇条書き）
5. Section: いくら受け取れるか（箇条書きまたは簡単な表）
6. Section: いつ届くか（1文）
7. Section: 申請が必要なとき（箇条書き）
8. NotificationBanner?（重要な注意1つだけ、省略可）
9. RelatedLinks（出口：「対象か確認する」→Answer、「申請する」→Service）
10. Contact（問い合わせ先）

### セクション設計ルール
- 見出し＝質問への短い答え（「概要」「詳細」などの抽象見出しは禁止）
- 1セクション80-120字以内
- 4行を超えたら分割

### 禁止コンポーネント（絶対に使用しない）
- ActionButton（Serviceで使う）
- StepNavigation（Serviceで使う）
- Accordion（長文化の原因）
- Table（比較が必要な場合のみ例外的に許可）
`;

/**
 * Answer Page（判定ページ）専用ルール
 * docs/guides/CONTENT_ITEM_CREATION.md セクション4に準拠
 */
export const ANSWER_PAGE_RULES = `
## Answer Page（判定ページ）の構造ルール

### 目的
対象かどうかを判定する（読むページではなく、操作して「判定結果を出す」ページ）

### 原則
- 説明しない
- 教えない
- 読ませない
- 迷わせない
- "決める"ことだけに集中

### 必須構成
1. Title（疑問形：「〜ですか？」「〜できますか？」）
2. SmartAnswer（質問フロー + 結果表示）

### SmartAnswer設計ルール
- 1問につき1つの判定軸（年齢、居住地、職業等）
- 「はい」が対象者に有利な回答になるよう設計
- 質問文は「〜ですか？」形式
- 最大5問まで
- 結果は1行で結論が分かる

### 禁止
- 長文の説明
- 複数の質問を同時表示
- 進行状況バー（不要）
- Table
- StepNavigation
- Accordion
- Section（SmartAnswerのみで完結）
`;

/**
 * ContentType別の禁止ブロックマップ
 */
export const FORBIDDEN_BLOCKS: Record<ContentType, string[]> = {
  service: ['Table', 'StepNavigation', 'Accordion', 'DescriptionList'],
  guide: ['ActionButton', 'StepNavigation', 'Accordion'],
  answer: ['Table', 'StepNavigation', 'Accordion', 'Section', 'NotificationBanner', 'DescriptionList'],
};

/**
 * 禁止ブロックのフォールバック先
 */
function getFallbackBlock(infoType: InformationType, contentType: ContentType): string {
  // Service: シンプルなリストに統一
  if (contentType === 'service') {
    switch (infoType) {
      case 'procedure':
      case 'requirements':
      case 'eligibility':
      case 'fees':
        return 'RichText'; // unordered/ordered list
      default:
        return 'RichText';
    }
  }

  // Guide: Sectionベースに統一
  if (contentType === 'guide') {
    return 'RichText';
  }

  // Answer: 基本的にSmartAnswerのみ
  return 'RichText';
}

/**
 * 情報分析プロンプト
 */
export function buildAnalysisPrompt(
  rawContent: string,
  serviceName: string,
  municipalityName: string,
  contentType?: ContentType
): string {
  // ContentType別のルールを取得
  let pageTypeRules = '';
  if (contentType === 'service') {
    pageTypeRules = SERVICE_PAGE_RULES;
  } else if (contentType === 'guide') {
    pageTypeRules = GUIDE_PAGE_RULES;
  }
  // answer の場合は別ルート（generateSmartAnswer）で処理

  return `あなたは自治体サービスページのコンテンツ構造化エキスパートです。

以下のコンテンツを分析し、情報タイプごとに分類してください。

【サービス名】${serviceName}
【自治体名】${municipalityName}
${contentType ? `【ページタイプ】${contentType}` : ''}

【コンテンツ】
${rawContent}

${pageTypeRules ? `【ページタイプ別ルール】\n${pageTypeRules}\n` : ''}
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
      "stepCount": 数値,            // ステップ数（手順の場合）
      "maxItemLength": 数値         // 最長アイテムの文字数（リストの場合）
    }
  ],
  "summary": "サービスの概要（1-2文）"
}

注意:
- 各情報タイプは複数回出現可能
- 重要度は市民にとっての重要度で判断
- 同じ情報を複数のタイプに分類しない
- maxItemLengthはリスト内の最長項目の文字数
${contentType === 'service' ? '- Serviceページは最小限の情報に絞り、詳細はGuideに委ねる' : ''}
${contentType === 'guide' ? '- Guideページは見出しで80%理解できる構成にする' : ''}
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
    maxItemLength?: number;
  }>,
  contentType?: ContentType
): AnalyzedSection[] {
  return sections.map(section => {
    const recommended = getRecommendedBlockType(section.type, {
      hasConditions: section.hasConditions,
      itemCount: section.itemCount,
      stepCount: section.stepCount,
      importance: section.importance,
      contentLength: section.content.length, // 文字数を渡す
      contentType, // ページタイプを渡す
      maxItemLength: section.maxItemLength, // 最長アイテムの文字数
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

【重要ルール】
各セクションの「blockType」を必ず使用してください。変更は禁止です。

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
 * 40文字ルール検証の結果（Pass情報付き）
 */
export interface Validate40CharResult {
  blocks: Block[];
  pass1Blocks: Block[];
  pass2Blocks: Block[];
  pass1LongTexts: LongTextInfo[];
  pass2LongTexts: LongTextInfo[];
}

/**
 * 構造化結果の拡張型（Pass情報付き）
 */
export interface StructureResultWithPassInfo {
  blocks: Block[];
  summary: string;
  passInfo: {
    initialBlocks: Block[];
    pass1Blocks: Block[];
    pass1LongTexts: LongTextInfo[];
    pass2Blocks: Block[];
    pass2LongTexts: LongTextInfo[];
  };
}

/**
 * コンテンツを分析してブロックに変換
 * contentTypeが指定された場合、ページタイプ特化のルールを適用
 */
export async function analyzeAndStructure(
  rawContent: string,
  serviceName: string,
  municipalityName: string,
  contentType?: ContentType
): Promise<StructureResultWithPassInfo> {
  // Step 1: コンテンツを分析
  const analysisPrompt = buildAnalysisPrompt(rawContent, serviceName, municipalityName, contentType);

  interface AnalysisResult {
    sections: Array<{
      type: InformationType;
      title?: string;
      content: string;
      importance: 'high' | 'medium' | 'low';
      hasConditions?: boolean;
      itemCount?: number;
      stepCount?: number;
      maxItemLength?: number; // 最長アイテムの文字数
    }>;
    summary: string;
  }

  const analysis = await generateJSON<AnalysisResult>(analysisPrompt, {
    maxOutputTokens: 8192,
  });

  // Step 2: コードでブロックタイプ候補を決定
  const enrichedSections = enrichWithBlockRecommendations(analysis.sections, contentType);

  // Step 3: LLMでブロックに変換（推奨タイプを指定）
  const blockPrompt = buildEnhancedBlockPrompt(enrichedSections);

  interface BlockResult {
    blocks: Block[];
  }

  const result = await generateJSON<BlockResult>(blockPrompt, {
    maxOutputTokens: 16384,
  });

  // Step 4: 40文字ルール検証・修正（LLM使用の非同期処理、Pass情報付き）
  const validationResult = await validate40CharRule(result.blocks);

  return {
    blocks: validationResult.blocks,
    summary: analysis.summary,
    passInfo: {
      initialBlocks: result.blocks,
      pass1Blocks: validationResult.pass1Blocks,
      pass1LongTexts: validationResult.pass1LongTexts,
      pass2Blocks: validationResult.pass2Blocks,
      pass2LongTexts: validationResult.pass2LongTexts,
    },
  };
}

/**
 * 40文字ルールを検証し、違反があれば別コンポーネントへの変換を検討
 * テキストの単純分割は行わない（コンポーネント変換のみ）
 *
 * Pass 1: 標準的なパターンマッチングで変換を試みる（全ブロックタイプ対象）
 * Pass 2: まだ40文字超えが残っていれば、LLMを使ってより積極的な変換を試みる
 */
async function validate40CharRule(blocks: Block[]): Promise<Validate40CharResult> {
  // Pass 1: 標準変換（同期処理）- 全ブロックタイプを対象
  const pass1Result: Block[] = [];
  for (const block of blocks) {
    const transformed = transformLongTextInBlock(block);
    pass1Result.push(...transformed);
  }

  // Pass 1後の長いテキストを収集（デバッグ用）
  const pass1LongTexts = collectLongTextsFromAllBlocks(pass1Result);

  // Pass 2: まだ40文字超えが残っていれば、LLMを使って積極的に変換
  let pass2Result = pass1Result;
  const pass2LongTexts: LongTextInfo[] = [];

  if (pass1LongTexts.length > 0) {
    // LLMで長いテキストを別コンポーネントに変換
    const conversions = await convertLongTextsWithLLM(pass1LongTexts);

    // 変換結果を適用
    pass2Result = applyLLMConversions(pass1Result, conversions);

    // Pass 2後の長いテキストを収集（デバッグ用）
    pass2LongTexts.push(...collectLongTextsFromAllBlocks(pass2Result));
  }

  return {
    blocks: pass2Result,
    pass1Blocks: pass1Result,
    pass2Blocks: pass2Result,
    pass1LongTexts,
    pass2LongTexts,
  };
}

/**
 * 40文字を超えるテキストの情報（Pass 2用）
 */
export interface LongTextInfo {
  blockIndex: number;
  blockId: string;
  blockType: string;
  nodeIndex: number;
  nodeType: 'paragraph' | 'list-item' | 'table-value' | 'accordion-content' | 'notification-content' | 'description-list';
  text: string;
  // list-itemの場合のみ
  itemIndex?: number;
  // table/accordion/description-listの場合のみ
  rowIndex?: number;
}

/**
 * 全ブロックタイプから40文字を超えるテキストを収集
 * DescriptionListなどスキーマ外のブロックタイプも対応するため、block.typeをstring扱い
 */
function collectLongTextsFromAllBlocks(blocks: Block[]): LongTextInfo[] {
  const longTexts: LongTextInfo[] = [];

  for (let blockIndex = 0; blockIndex < blocks.length; blockIndex++) {
    const block = blocks[blockIndex];
    const blockType = block.type as string; // スキーマ外のタイプにも対応

    switch (blockType) {
      case 'RichText': {
        const content = (block.props as { content?: unknown[] }).content as Array<{
          type: string;
          runs?: Array<{ text: string }>;
          items?: unknown[][];
        }> | undefined;
        if (!Array.isArray(content)) break;

        for (let nodeIndex = 0; nodeIndex < content.length; nodeIndex++) {
          const node = content[nodeIndex];

          if (node.type === 'paragraph' && node.runs) {
            const fullText = node.runs.map(r => r.text).join('');
            if (fullText.length > 40) {
              longTexts.push({
                blockIndex,
                blockId: block.id,
                blockType: 'RichText',
                nodeIndex,
                nodeType: 'paragraph',
                text: fullText,
              });
            }
          }

          if (node.type === 'list' && node.items) {
            for (let itemIndex = 0; itemIndex < node.items.length; itemIndex++) {
              const item = node.items[itemIndex];
              const itemText = extractTextFromItem(item as unknown[]);
              if (itemText.length > 40) {
                longTexts.push({
                  blockIndex,
                  blockId: block.id,
                  blockType: 'RichText',
                  nodeIndex,
                  nodeType: 'list-item',
                  text: itemText,
                  itemIndex,
                });
              }
            }
          }
        }
        break;
      }

      case 'Table': {
        const rows = (block.props as { rows?: Array<{ label: string; value: string | unknown[] }> }).rows;
        if (!Array.isArray(rows)) break;

        for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
          const row = rows[rowIndex];
          // valueが文字列の場合
          if (typeof row.value === 'string' && row.value.length > 40) {
            longTexts.push({
              blockIndex,
              blockId: block.id,
              blockType: 'Table',
              nodeIndex: rowIndex,
              nodeType: 'table-value',
              text: row.value,
              rowIndex,
            });
          }
          // labelも長い場合
          if (row.label.length > 40) {
            longTexts.push({
              blockIndex,
              blockId: block.id,
              blockType: 'Table',
              nodeIndex: rowIndex,
              nodeType: 'table-value',
              text: row.label,
              rowIndex,
            });
          }
        }
        break;
      }

      case 'Accordion': {
        const items = (block.props as { items?: Array<{ title: string; content: unknown[] }> }).items;
        if (!Array.isArray(items)) break;

        for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
          const item = items[itemIndex];
          // contentからテキストを抽出
          const contentText = extractTextFromRichTextNodes(item.content);
          if (contentText.length > 40) {
            longTexts.push({
              blockIndex,
              blockId: block.id,
              blockType: 'Accordion',
              nodeIndex: itemIndex,
              nodeType: 'accordion-content',
              text: contentText,
              itemIndex,
            });
          }
        }
        break;
      }

      case 'NotificationBanner': {
        const content = (block.props as { content?: unknown[] }).content;
        if (!Array.isArray(content)) break;

        const contentText = extractTextFromRichTextNodes(content);
        if (contentText.length > 40) {
          longTexts.push({
            blockIndex,
            blockId: block.id,
            blockType: 'NotificationBanner',
            nodeIndex: 0,
            nodeType: 'notification-content',
            text: contentText,
          });
        }
        break;
      }

      case 'DescriptionList': {
        const items = (block.props as { items?: Array<{ term: string; description: string }> }).items;
        if (!Array.isArray(items)) break;

        for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
          const item = items[itemIndex];
          // descriptionが長い場合
          if (item.description && item.description.length > 40) {
            longTexts.push({
              blockIndex,
              blockId: block.id,
              blockType: 'DescriptionList',
              nodeIndex: itemIndex,
              nodeType: 'description-list',
              text: item.description,
              itemIndex,
            });
          }
          // termも長い場合
          if (item.term && item.term.length > 40) {
            longTexts.push({
              blockIndex,
              blockId: block.id,
              blockType: 'DescriptionList',
              nodeIndex: itemIndex,
              nodeType: 'description-list',
              text: item.term,
              itemIndex,
            });
          }
        }
        break;
      }
    }
  }

  return longTexts;
}

/**
 * RichTextノード配列からテキストを抽出
 */
function extractTextFromRichTextNodes(nodes: unknown[]): string {
  if (!Array.isArray(nodes)) return '';

  return nodes.map(node => {
    const typedNode = node as { type: string; runs?: Array<{ text: string }>; text?: string; items?: unknown[][] };
    if (typedNode.type === 'paragraph' && typedNode.runs) {
      return typedNode.runs.map(r => r.text).join('');
    }
    if (typedNode.type === 'list' && typedNode.items) {
      return typedNode.items.map(item => extractTextFromItem(item as unknown[])).join('');
    }
    if (typedNode.text) return typedNode.text;
    return '';
  }).join('');
}

/**
 * 全ブロックタイプの長いテキストを変換（Pass 1）
 */
function transformLongTextInBlock(block: Block): Block[] {
  const blockType = block.type as string; // スキーマ外のタイプにも対応

  switch (blockType) {
    case 'RichText':
      return transformLongRichText(block);

    case 'Table':
      return transformLongTable(block);

    case 'Accordion':
      return transformLongAccordion(block);

    case 'NotificationBanner':
      return transformLongNotificationBanner(block);

    case 'DescriptionList':
      return transformLongDescriptionList(block);

    default:
      return [block];
  }
}

/**
 * Tableブロックの長いテキストを変換
 */
function transformLongTable(block: Block): Block[] {
  const props = block.props as { rows?: Array<{ label: string; value: string | unknown[] }> };
  if (!props.rows) return [block];

  const hasLongValue = props.rows.some(row =>
    typeof row.value === 'string' && row.value.length > 40
  );

  if (!hasLongValue) return [block];

  // 長いvalueを持つ行をAccordionに変換することを検討
  // ただし、3行以上ある場合のみ
  if (props.rows.length >= 3) {
    const longRows = props.rows.filter(row => typeof row.value === 'string' && row.value.length > 40);
    const shortRows = props.rows.filter(row => typeof row.value !== 'string' || row.value.length <= 40);

    if (longRows.length >= 2) {
      // 長い行をAccordionに変換
      const result: Block[] = [];

      if (shortRows.length > 0) {
        result.push({
          ...block,
          id: `${block.id}-short`,
          props: { rows: shortRows }
        } as Block);
      }

      result.push({
        id: `${block.id}-accordion`,
        type: 'Accordion',
        props: {
          items: longRows.map(row => ({
            title: row.label,
            content: [{
              type: 'paragraph',
              runs: [{ text: row.value as string, bold: false }]
            }]
          }))
        }
      } as Block);

      return result;
    }
  }

  return [block];
}

/**
 * Accordionブロックの長いテキストを変換
 */
function transformLongAccordion(block: Block): Block[] {
  // Accordionは折りたたみなので長いテキストは許容
  return [block];
}

/**
 * NotificationBannerの長いテキストを変換
 */
function transformLongNotificationBanner(block: Block): Block[] {
  // NotificationBannerは重要な情報なので長いテキストは許容
  return [block];
}

/**
 * DescriptionListブロックの長いテキストを変換
 */
function transformLongDescriptionList(block: Block): Block[] {
  // DescriptionListは定義リストなので長いテキストは許容（Pass 2でLLMが判断）
  return [block];
}

/**
 * LLMによる長いテキストの変換結果
 */
interface LLMConversionResult {
  originalText: string;
  blockType: 'Table' | 'RichText' | 'NotificationBanner' | 'Accordion' | 'DescriptionList';
  props: Record<string, unknown>;
}

/**
 * LLMを使って長いテキストを適切なコンポーネントに変換
 */
async function convertLongTextsWithLLM(longTexts: LongTextInfo[]): Promise<Map<string, LLMConversionResult>> {
  if (longTexts.length === 0) return new Map();

  // LLMに渡すテキストリスト
  const textsForLLM = longTexts.map(lt => ({
    id: `${lt.blockId}-${lt.nodeIndex}${lt.itemIndex !== undefined ? `-${lt.itemIndex}` : ''}`,
    text: lt.text,
  }));

  const prompt = `以下のテキストを、より適切なコンポーネントに変換してください。
各テキストは40文字を超えており、別のコンポーネントで表現することで読みやすくなります。

【変換対象テキスト】
${JSON.stringify(textsForLLM, null, 2)}

【変換ルール】
1. 「項目名：説明」や「見出し（説明）」形式 → Table (label/value形式)
2. 「〜の場合、〜」形式の条件付き説明 → Table (label/value形式)
3. 複数の文や列挙がある場合（3アイテム以上の場合のみ）→ RichText (list)
4. 重要な注意事項 → NotificationBanner (severity: info/warning)
5. Q&A形式 → Accordion
6. 変換不可能な場合、または2アイテム以下の列挙 → そのままRichText (paragraph)

【コンポーネント形式】

## Table (label/value形式)
{
  "blockType": "Table",
  "props": {
    "rows": [{ "label": "項目名", "value": "説明" }]
  }
}

## RichText (list)
{
  "blockType": "RichText",
  "props": {
    "content": [{
      "type": "list",
      "ordered": false,
      "items": [[{ "type": "paragraph", "runs": [{ "text": "項目1" }] }], [...]]
    }]
  }
}

## NotificationBanner
{
  "blockType": "NotificationBanner",
  "props": {
    "severity": "info",
    "title": "注意事項のタイトル",
    "content": [{ "type": "paragraph", "runs": [{ "text": "説明" }] }]
  }
}

## Accordion
{
  "blockType": "Accordion",
  "props": {
    "items": [{ "title": "質問", "content": [{ "type": "paragraph", "runs": [{ "text": "回答" }] }] }]
  }
}

【出力形式】
{
  "conversions": [
    {
      "id": "元のテキストID",
      "originalText": "元のテキスト",
      "blockType": "変換先コンポーネント",
      "props": { ... }
    }
  ]
}

重要:
- 必ず全てのテキストに対して変換結果を返してください
- 変換できない場合もRichText (paragraph)として返してください
- 各テキストの構造を分析し、最も適切なコンポーネントを選択してください
`;

  try {
    interface ConversionResponse {
      conversions: Array<{
        id: string;
        originalText: string;
        blockType: 'Table' | 'RichText' | 'NotificationBanner' | 'Accordion' | 'DescriptionList';
        props: Record<string, unknown>;
      }>;
    }

    const result = await generateJSON<ConversionResponse>(prompt, {
      maxOutputTokens: 8192,
    });

    const conversionsMap = new Map<string, LLMConversionResult>();
    for (const conversion of result.conversions) {
      conversionsMap.set(conversion.id, {
        originalText: conversion.originalText,
        blockType: conversion.blockType,
        props: conversion.props,
      });
    }

    return conversionsMap;
  } catch (error) {
    console.error('LLM conversion failed:', error);
    return new Map();
  }
}

/**
 * LLM変換結果をブロック配列に適用
 */
function applyLLMConversions(
  blocks: Block[],
  conversions: Map<string, LLMConversionResult>
): Block[] {
  if (conversions.size === 0) return blocks;

  const result: Block[] = [];
  let conversionCounter = 0;

  for (let blockIndex = 0; blockIndex < blocks.length; blockIndex++) {
    const block = blocks[blockIndex];
    const blockType = block.type as string; // スキーマ外のタイプにも対応

    switch (blockType) {
      case 'RichText': {
        // RichTextブロックのcontentを取得（型安全のためasを使用）
        const richTextProps = block.props as { content: unknown[] };
        const content = richTextProps.content as Array<{
          type: string;
          runs?: Array<{ text: string; bold?: boolean }>;
          items?: unknown[][];
        }>;
        if (!Array.isArray(content)) {
          result.push(block);
          break;
        }

        const remainingContent: typeof content = [];
        const insertedBlocks: Block[] = [];

        for (let nodeIndex = 0; nodeIndex < content.length; nodeIndex++) {
          const node = content[nodeIndex];

          if (node.type === 'paragraph' && node.runs) {
            const conversionId = `${block.id}-${nodeIndex}`;
            const conversion = conversions.get(conversionId);

            if (conversion && conversion.blockType !== 'RichText') {
              // 変換されたブロックを追加（LLMからの動的データなので型アサーション）
              insertedBlocks.push({
                id: `${block.id}-conv-${conversionCounter++}`,
                type: conversion.blockType,
                props: conversion.props,
              } as Block);
            } else {
              // 変換されなかった場合はそのまま
              remainingContent.push(node);
            }
          } else if (node.type === 'list' && node.items) {
            const remainingItems: unknown[][] = [];
            const convertedFromList: Block[] = [];

            for (let itemIndex = 0; itemIndex < node.items.length; itemIndex++) {
              const conversionId = `${block.id}-${nodeIndex}-${itemIndex}`;
              const conversion = conversions.get(conversionId);

              if (conversion && conversion.blockType !== 'RichText') {
                // 変換されたブロックを追加（LLMからの動的データなので型アサーション）
                convertedFromList.push({
                  id: `${block.id}-conv-${conversionCounter++}`,
                  type: conversion.blockType,
                  props: conversion.props,
                } as Block);
              } else {
                // 変換されなかった場合はリストに残す
                remainingItems.push(node.items[itemIndex]);
              }
            }

            // 残ったリストアイテムがあれば追加
            if (remainingItems.length > 0) {
              remainingContent.push({ ...node, items: remainingItems });
            }

            // 変換されたブロックを追加
            insertedBlocks.push(...convertedFromList);
          } else {
            remainingContent.push(node);
          }
        }

        // 残りのコンテンツがあればRichTextとして追加
        if (remainingContent.length > 0) {
          result.push({
            ...block,
            id: insertedBlocks.length > 0 ? `${block.id}-remaining` : block.id,
            props: { content: remainingContent },
          } as Block);
        }

        // 変換されたブロックを追加
        result.push(...insertedBlocks);
        break;
      }

      case 'Table': {
        // Tableブロックのrowsを取得
        const tableProps = block.props as { rows?: Array<{ label: string; value: string | unknown[] }> };
        const rows = tableProps.rows;
        if (!Array.isArray(rows)) {
          result.push(block);
          break;
        }

        const remainingRows: Array<{ label: string; value: string | unknown[] }> = [];
        const insertedBlocks: Block[] = [];
        let hasConversion = false;

        for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
          const row = rows[rowIndex];
          const conversionId = `${block.id}-${rowIndex}`;
          const conversion = conversions.get(conversionId);

          if (conversion && conversion.blockType !== 'Table') {
            // 変換されたブロックを追加
            hasConversion = true;
            insertedBlocks.push({
              id: `${block.id}-conv-${conversionCounter++}`,
              type: conversion.blockType,
              props: conversion.props,
            } as Block);
          } else {
            // 変換されなかった場合はテーブルに残す
            remainingRows.push(row);
          }
        }

        // 残りの行があればTableとして追加
        if (remainingRows.length > 0) {
          result.push({
            ...block,
            id: hasConversion ? `${block.id}-remaining` : block.id,
            props: { ...tableProps, rows: remainingRows },
          } as Block);
        }

        // 変換されたブロックを追加
        result.push(...insertedBlocks);
        break;
      }

      case 'Accordion': {
        // Accordionブロックのitemsを取得
        const accordionProps = block.props as { items?: Array<{ title: string; content: unknown[] }> };
        const items = accordionProps.items;
        if (!Array.isArray(items)) {
          result.push(block);
          break;
        }

        const remainingItems: Array<{ title: string; content: unknown[] }> = [];
        const insertedBlocks: Block[] = [];
        let hasConversion = false;

        for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
          const item = items[itemIndex];
          const conversionId = `${block.id}-${itemIndex}`;
          const conversion = conversions.get(conversionId);

          if (conversion && conversion.blockType !== 'Accordion') {
            // 変換されたブロックを追加
            hasConversion = true;
            insertedBlocks.push({
              id: `${block.id}-conv-${conversionCounter++}`,
              type: conversion.blockType,
              props: conversion.props,
            } as Block);
          } else {
            // 変換されなかった場合はAccordionに残す
            remainingItems.push(item);
          }
        }

        // 残りのアイテムがあればAccordionとして追加
        if (remainingItems.length > 0) {
          result.push({
            ...block,
            id: hasConversion ? `${block.id}-remaining` : block.id,
            props: { ...accordionProps, items: remainingItems },
          } as Block);
        }

        // 変換されたブロックを追加
        result.push(...insertedBlocks);
        break;
      }

      case 'NotificationBanner': {
        // NotificationBannerのcontentを取得
        const conversionId = `${block.id}-0`;
        const conversion = conversions.get(conversionId);

        if (conversion && conversion.blockType !== 'NotificationBanner') {
          // 変換されたブロックに置き換え
          result.push({
            id: `${block.id}-conv-${conversionCounter++}`,
            type: conversion.blockType,
            props: conversion.props,
          } as Block);
        } else {
          // 変換されなかった場合はそのまま
          result.push(block);
        }
        break;
      }

      case 'DescriptionList': {
        // DescriptionListブロックのitemsを取得
        const dlProps = block.props as { items?: Array<{ term: string; description: string }> };
        const items = dlProps.items;
        if (!Array.isArray(items)) {
          result.push(block);
          break;
        }

        const remainingItems: Array<{ term: string; description: string }> = [];
        const insertedBlocks: Block[] = [];
        let hasConversion = false;

        for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
          const item = items[itemIndex];
          const conversionId = `${block.id}-${itemIndex}`;
          const conversion = conversions.get(conversionId);

          if (conversion && conversion.blockType !== 'DescriptionList') {
            // 変換されたブロックを追加
            hasConversion = true;
            insertedBlocks.push({
              id: `${block.id}-conv-${conversionCounter++}`,
              type: conversion.blockType,
              props: conversion.props,
            } as Block);
          } else {
            // 変換されなかった場合はDescriptionListに残す
            remainingItems.push(item);
          }
        }

        // 残りのアイテムがあればDescriptionListとして追加
        if (remainingItems.length > 0) {
          result.push({
            ...block,
            id: hasConversion ? `${block.id}-remaining` : block.id,
            props: { ...dlProps, items: remainingItems },
          } as unknown as Block);
        }

        // 変換されたブロックを追加
        result.push(...insertedBlocks);
        break;
      }

      default:
        // その他のブロックタイプはそのまま
        result.push(block);
    }
  }

  return result;
}

/**
 * RichTextブロックの長い段落を分析し、適切なコンポーネントに変換 (Pass 1)
 * 変換できない場合はそのまま維持（テキスト分割は行わない）
 * Pass 2でLLMによる変換が行われる
 */
function transformLongRichText(block: Block): Block[] {
  // RichTextブロックのcontentを取得（型安全のためasを使用）
  const richTextProps = block.props as { content?: unknown[] };
  const content = richTextProps.content as Array<{
    type: string;
    runs?: Array<{ text: string; bold?: boolean }>;
    items?: unknown[][];
    text?: string;
  }> | undefined;

  if (!Array.isArray(content)) return [block];

  const result: Block[] = [];
  const remainingContent: typeof content = [];
  let blockCounter = 0;

  for (const node of content) {
    if (node.type === 'paragraph' && node.runs) {
      const fullText = node.runs.map(r => r.text).join('');

      // 40文字以下ならそのまま
      if (fullText.length <= 40) {
        remainingContent.push(node);
        continue;
      }

      // 長い段落の変換を試みる（Pass 1: 標準パターンマッチング）
      const conversion = analyzeAndConvertParagraph(fullText, block.id, blockCounter);

      if (conversion.converted) {
        // 変換成功: 既存のRichTextコンテンツを先にフラッシュ
        if (remainingContent.length > 0) {
          result.push({
            ...block,
            id: `${block.id}-remaining-${blockCounter}`,
            props: { content: [...remainingContent] }
          } as Block);
          remainingContent.length = 0;
        }
        result.push(...conversion.blocks);
        blockCounter++;
      } else {
        // 変換失敗: そのまま維持（テキスト分割は行わない）
        remainingContent.push(node);
      }
    } else if (node.type === 'list' && node.items) {
      // リストアイテムも変換を試みる (Pass 1: 標準パターンマッチング)
      const { convertedBlocks, remainingItems } = transformLongListItems(
        node.items as unknown[][],
        block.id,
        blockCounter
      );

      if (convertedBlocks.length > 0) {
        // 変換されたブロックがある場合
        if (remainingContent.length > 0) {
          result.push({
            ...block,
            id: `${block.id}-remaining-${blockCounter}`,
            props: { content: [...remainingContent] }
          } as Block);
          remainingContent.length = 0;
        }
        result.push(...convertedBlocks);
        blockCounter++;
      }

      // 残りのリストアイテムがあれば追加
      if (remainingItems.length > 0) {
        remainingContent.push({ ...node, items: remainingItems });
      }
    } else {
      remainingContent.push(node);
    }
  }

  // 残りのコンテンツがあれば追加
  if (remainingContent.length > 0) {
    result.push({
      ...block,
      id: result.length > 0 ? `${block.id}-final` : block.id,
      props: { content: remainingContent }
    } as Block);
  }

  return result.length > 0 ? result : [block];
}

/**
 * 長いリストアイテムをDescriptionListに変換できるか試みる (Pass 1)
 */
function transformLongListItems(
  items: unknown[][],
  baseId: string,
  counter: number
): { convertedBlocks: Block[]; remainingItems: unknown[][] } {
  const convertedItems: Array<{ term: string; description: string }> = [];
  const remainingItems: unknown[][] = [];

  for (const item of items) {
    const itemText = extractTextFromItem(item);

    if (itemText.length <= 40) {
      remainingItems.push(item);
      continue;
    }

    // 長いアイテムの変換を試みる
    const conversion = tryConvertToDescriptionListItem(itemText);
    if (conversion) {
      convertedItems.push(conversion);
    } else {
      // 変換できない場合はそのまま維持
      remainingItems.push(item);
    }
  }

  const convertedBlocks: Block[] = [];
  if (convertedItems.length > 0) {
    // DescriptionListはスキーマに存在しないため、Tableで代替（label/value形式）
    convertedBlocks.push({
      id: `${baseId}-table-${counter}`,
      type: 'Table',
      props: {
        rows: convertedItems.map(item => ({
          label: item.term,
          value: item.description
        }))
      }
    } as Block);
  }

  return { convertedBlocks, remainingItems };
}

/**
 * テキストをDescriptionListのアイテムに変換できるか試みる
 */
function tryConvertToDescriptionListItem(text: string): { term: string; description: string } | null {
  // パターン1: 「見出し：説明」形式
  const colonMatch = text.match(/^([^:：]{2,20})[:：]\s*(.+)$/);
  if (colonMatch && colonMatch[2].length > 5) {
    return {
      term: colonMatch[1].trim(),
      description: colonMatch[2].trim()
    };
  }

  // パターン2: 「見出し（説明）」形式
  const bracketMatch = text.match(/^([^（(]{2,20})[（(](.+)[）)]$/);
  if (bracketMatch && bracketMatch[2].length > 5) {
    return {
      term: bracketMatch[1].trim(),
      description: bracketMatch[2].trim()
    };
  }

  // パターン3: 「〜の場合、〜」形式
  const conditionMatch = text.match(/^(.+?)(の場合|のとき|の際)[、:：は]\s*(.+)$/);
  if (conditionMatch && conditionMatch[1].length <= 20 && conditionMatch[3].length > 5) {
    return {
      term: conditionMatch[1] + conditionMatch[2],
      description: conditionMatch[3].trim()
    };
  }

  return null;
}

/**
 * 長い段落を分析して適切なコンポーネントに変換
 */
function analyzeAndConvertParagraph(
  text: string,
  baseId: string,
  counter: number
): { converted: boolean; blocks: Block[] } {
  // パターン1: 「見出し：説明」または「見出し（説明）」形式 → DescriptionList
  const colonMatch = text.match(/^([^:：（(]{2,20})[:：]\s*(.+)$/);
  const bracketMatch = text.match(/^([^（(]{2,20})[（(](.+)[）)]$/);

  // DescriptionListはスキーマに存在しないため、Tableで代替（label/value形式）
  if (colonMatch && colonMatch[2].length > 10) {
    return {
      converted: true,
      blocks: [{
        id: `${baseId}-table-${counter}`,
        type: 'Table',
        props: {
          rows: [{
            label: colonMatch[1].trim(),
            value: colonMatch[2].trim()
          }]
        }
      } as Block]
    };
  }

  if (bracketMatch && bracketMatch[2].length > 10) {
    return {
      converted: true,
      blocks: [{
        id: `${baseId}-table-${counter}`,
        type: 'Table',
        props: {
          rows: [{
            label: bracketMatch[1].trim(),
            value: bracketMatch[2].trim()
          }]
        }
      } as Block]
    };
  }

  // パターン2: 複数の文（3文以上）を含む長文 → 箇条書きリストに変換
  const sentences = text.split(/(?<=[。])/).filter(s => s.trim());
  if (sentences.length >= 3) {
    return {
      converted: true,
      blocks: [{
        id: `${baseId}-list-${counter}`,
        type: 'RichText',
        props: {
          content: [{
            type: 'list',
            ordered: false,
            items: sentences.map(s => [{
              type: 'paragraph',
              runs: [{ text: s.trim(), bold: false }]
            }])
          }]
        }
      } as Block]
    };
  }

  // パターン3: 「〜の場合」「〜のとき」など条件付きの説明 → Table（label/value形式）
  const conditionMatch = text.match(/^(.+?)(の場合|のとき|の際)[、:：は]\s*(.+)$/);
  if (conditionMatch && conditionMatch[1].length <= 20) {
    return {
      converted: true,
      blocks: [{
        id: `${baseId}-table-${counter}`,
        type: 'Table',
        props: {
          rows: [{
            label: conditionMatch[1] + conditionMatch[2],
            value: conditionMatch[3].trim()
          }]
        }
      } as Block]
    };
  }

  // パターン4: 箇条書き記号を含む（「・」「●」「※」など） → リストに変換（3アイテム以上の場合のみ）
  const bulletPoints = text.split(/[・●※▪︎▸]/).filter(s => s.trim());
  if (bulletPoints.length >= 3) {
    return {
      converted: true,
      blocks: [{
        id: `${baseId}-list-${counter}`,
        type: 'RichText',
        props: {
          content: [{
            type: 'list',
            ordered: false,
            items: bulletPoints.map(s => [{
              type: 'paragraph',
              runs: [{ text: s.trim(), bold: false }]
            }])
          }]
        }
      } as Block]
    };
  }

  // 変換パターンに該当しない → そのまま維持
  return { converted: false, blocks: [] };
}

/**
 * リストアイテムからテキストを抽出
 */
function extractTextFromItem(item: unknown[]): string {
  if (!Array.isArray(item)) return '';

  return item.map(node => {
    const typedNode = node as { type: string; runs?: Array<{ text: string }>; text?: string };
    if (typedNode.type === 'paragraph' && typedNode.runs) {
      return typedNode.runs.map(r => r.text).join('');
    }
    if (typedNode.text) return typedNode.text;
    return '';
  }).join('');
}

/**
 * 情報タイプから推奨ブロックタイプを取得
 * contentTypeが指定された場合、禁止ブロックはフォールバック先に変換
 */
export function getRecommendedBlockType(
  infoType: InformationType,
  options: {
    hasConditions?: boolean;
    itemCount?: number;
    stepCount?: number;
    importance?: 'high' | 'medium' | 'low';
    contentLength?: number; // コンテンツの文字数
    contentType?: ContentType; // ページタイプ
    maxItemLength?: number; // 最長アイテムの文字数
  } = {}
): string {
  const { hasConditions, itemCount = 0, stepCount = 0, importance = 'medium', contentType, maxItemLength = 0 } = options;

  // 40文字ルール: リスト項目が長い場合はより適切なコンポーネントに変更
  const hasLongItems = maxItemLength > 40;

  // 推奨ブロックを決定
  let recommended: string;

  switch (infoType) {
    case 'procedure':
      if (stepCount >= 3) {
        recommended = 'StepNavigation';
      } else {
        recommended = 'RichText'; // ordered list
      }
      break;

    case 'requirements':
      // Tableは「項目を並べて比較する必要がある時」のみ使用
      // 通常の必要書類リストはRichTextまたはDescriptionList
      if (hasConditions) {
        // 条件付きでも比較が必要な場合のみTable（大量データ=5項目以上）
        if (itemCount >= 5) {
          recommended = 'Accordion';
        } else {
          recommended = 'DescriptionList';
        }
      } else if (hasLongItems) {
        // 40文字超: 長い項目はDescriptionListで見やすく
        recommended = 'DescriptionList';
      } else if (itemCount <= 3) {
        recommended = 'DescriptionList';
      } else {
        recommended = 'RichText'; // unordered list
      }
      break;

    case 'eligibility':
      // 対象者条件
      if (hasLongItems) {
        // 40文字超: 長い条件はDescriptionListで見やすく
        recommended = 'DescriptionList';
      } else {
        recommended = 'RichText'; // unordered list
      }
      break;

    case 'fees':
      // 手数料は「比較が必要」または「大量データ（5項目以上）」の場合のみTable
      if (itemCount >= 5) {
        recommended = 'Table';
      } else {
        recommended = 'DescriptionList';
      }
      break;

    case 'schedule':
      // スケジュールは比較が必要な場合（複数の時間帯・曜日など）のみTable
      // 単純な営業時間等はDescriptionListで十分
      if (itemCount >= 3) {
        recommended = 'Table';
      } else {
        recommended = 'DescriptionList';
      }
      break;

    case 'contact':
      if (itemCount >= 4) {
        recommended = 'Card'; // 多数の窓口はカード形式
      } else if (itemCount >= 2) {
        recommended = 'DirectoryList';
      } else {
        recommended = 'Contact';
      }
      break;

    case 'warning':
      // NotificationBannerは適切な文章量（50文字以上）がある場合のみ使用
      // 短い注意事項はcalloutで十分
      if (importance === 'high' && options.contentLength && options.contentLength >= 50) {
        recommended = 'NotificationBanner';
      } else {
        recommended = 'RichText'; // with callout
      }
      break;

    case 'emergency':
      // 緊急情報は常にEmergencyBanner
      recommended = 'EmergencyBanner';
      break;

    case 'faq':
      recommended = 'Accordion';
      break;

    case 'links':
      if (importance === 'high') {
        recommended = 'ActionButton';
      } else if (itemCount >= 3) {
        // 類似したクリック可能なアイテムが複数ある場合はCardGrid
        recommended = 'CardGrid';
      } else {
        recommended = 'ResourceList';
      }
      break;

    case 'related':
      // 関連サービス・類似したクリック可能アイテムはカード形式
      if (itemCount >= 2) {
        recommended = 'CardGrid';
      } else {
        recommended = 'Card';
      }
      break;

    case 'quote':
      // 法令引用はBlockquote
      recommended = 'Blockquote';
      break;

    case 'status':
      // ステータス情報はStatusBadge
      recommended = 'StatusBadge';
      break;

    case 'definition':
      // シンプルな定義リスト
      recommended = 'DescriptionList';
      break;

    case 'description':
    default:
      // 40文字超の説明はSectionに分割を検討
      if (hasLongItems && itemCount >= 2) {
        // 複数の長い段落 → Accordionで整理
        recommended = 'Accordion';
      } else {
        recommended = 'RichText';
      }
      break;
  }

  // ContentTypeが指定されている場合、禁止ブロックをフォールバック
  if (contentType && FORBIDDEN_BLOCKS[contentType]?.includes(recommended)) {
    return getFallbackBlock(infoType, contentType);
  }

  return recommended;
}

/**
 * SmartAnswer生成用のプロンプト
 */
function buildSmartAnswerPrompt(
  rawContent: string,
  serviceName: string,
  municipalityName: string
): string {
  return `あなたは自治体サービスの対象者判定ロジックを設計するエキスパートです。

以下のコンテンツから、Yes/No形式の判定フローを設計してください。

【サービス名】${serviceName}
【自治体名】${municipalityName}

【コンテンツ】
${rawContent}

${ANSWER_PAGE_RULES}

## 設計ルール

### 質問設計
1. 1問につき1つの判定軸（年齢、居住地、職業、収入等）
2. 「はい」が対象者に有利な回答になるよう設計
   - 良い例: 「18歳の年度末までですか？」→「はい」で次へ進む
   - 悪い例: 「18歳の年度末を過ぎていますか？」→「いいえ」で次へ進む
3. 質問文は「〜ですか？」形式
4. 最大5問まで（それ以上は分岐で処理）
5. 最も多くの人が対象となる分岐を先に
6. 早期に振り分けられる条件を先に

### 結果設計
1. result-yes: 対象である場合
   - title: 肯定的な結論（「受け取れます」「対象です」等）
   - description: 1-2行の補足
   - actionLabel: CTAボタンのラベル（「申請手続きを開始する」等）
   - actionHref: 申請ページへのパス（例: "/${serviceName.replace(/を.+$/, '')}-apply"）
   - relatedLinks: 関連リンク
2. result-no-*: 対象外の各パターン
   - title: 明確な結論（「受け取れません」「別の窓口で申請してください」等）
   - description: 1-2行の理由・補足
   - relatedLinks: 代替案があれば

## 出力形式（JSON）
{
  "title": "ページタイトル（疑問形：〜ですか？〜できますか？）",
  "questions": [
    {
      "id": "q1",
      "text": "質問文（〜ですか？）",
      "options": [
        { "label": "はい", "nextQuestionId": "q2" },
        { "label": "いいえ", "resultId": "result-no-reason" }
      ]
    },
    {
      "id": "q2",
      "text": "次の質問文",
      "options": [
        { "label": "はい", "resultId": "result-yes" },
        { "label": "いいえ", "resultId": "result-no-other" }
      ]
    }
  ],
  "results": [
    {
      "id": "result-yes",
      "title": "受け取れます",
      "description": "あなたは対象です。申請から15日以内に届きます。",
      "actionLabel": "申請手続きを開始する",
      "actionHref": "/apply",
      "relatedLinks": [
        { "title": "詳しく見る", "href": "/guide" }
      ]
    },
    {
      "id": "result-no-reason",
      "title": "受け取れません",
      "description": "理由の説明",
      "relatedLinks": [
        { "title": "関連する制度を見る", "href": "/related" }
      ]
    }
  ],
  "summary": "検索用の概要（1-2文）"
}

注意:
- 質問は最小限に絞る（通常2-4問）
- 全ての分岐パターンに結果を用意する
- 結果のtitleは1行で結論が分かるようにする
- actionHrefとrelatedLinksのhrefは相対パスで指定
`;
}

/**
 * SmartAnswer生成のLLM出力型
 */
interface SmartAnswerLLMOutput {
  title: string;
  questions: Array<{
    id: string;
    text: string;
    options: Array<{
      label: string;
      nextQuestionId?: string;
      resultId?: string;
    }>;
  }>;
  results: Array<{
    id: string;
    title: string;
    description?: string;
    actionLabel?: string;
    actionHref?: string;
    relatedLinks?: Array<{
      title: string;
      href: string;
    }>;
  }>;
  summary: string;
}

/**
 * Answer Page（判定ページ）用のSmartAnswerブロックを生成
 * コンテンツから質問→分岐→結果のツリーを自動生成
 */
export async function generateSmartAnswer(
  rawContent: string,
  serviceName: string,
  municipalityName: string
): Promise<{ blocks: Block[]; summary: string }> {
  const prompt = buildSmartAnswerPrompt(rawContent, serviceName, municipalityName);

  const result = await generateJSON<SmartAnswerLLMOutput>(prompt, {
    maxOutputTokens: 8192,
  });

  // SmartAnswerブロックを組み立て
  const blocks: Block[] = [
    {
      id: 'title-1',
      type: 'Title',
      props: {
        text: result.title,
      },
    },
    {
      id: 'smart-answer-1',
      type: 'SmartAnswer',
      props: {
        questions: result.questions,
        results: result.results,
      },
    },
  ];

  return {
    blocks,
    summary: result.summary,
  };
}
