import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { PromptTemplate } from '@langchain/core/prompts';
import type {
  MunicipalStructuredData,
  CrawlerOutput,
} from './schemas.js';

export interface TransformerConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  verbose?: boolean;
}

/**
 * LLMベースの自治体データTransformer
 */
export class MunicipalDataTransformer {
  private llm: ChatOpenAI | ChatAnthropic;
  private config: Required<TransformerConfig>;

  constructor(config: TransformerConfig = {}) {
    this.config = {
      model: config.model || process.env.LLM_MODEL || 'gpt-4o',
      temperature: config.temperature || parseFloat(process.env.LLM_TEMPERATURE || '0.1'),
      maxTokens: config.maxTokens || parseInt(process.env.LLM_MAX_TOKENS || '4000'),
      verbose: config.verbose || false,
    };

    // LLMの初期化
    this.llm = this.initializeLLM();
  }

  private initializeLLM(): ChatOpenAI | ChatAnthropic {
    const modelName = this.config.model;

    if (modelName.startsWith('gpt-') || modelName.startsWith('o1-')) {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY environment variable is required for OpenAI models');
      }
      return new ChatOpenAI({
        modelName,
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens,
        verbose: this.config.verbose,
      });
    } else if (modelName.startsWith('claude-')) {
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY environment variable is required for Claude models');
      }
      return new ChatAnthropic({
        modelName,
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens,
        verbose: this.config.verbose,
      });
    } else {
      throw new Error(`Unsupported model: ${modelName}`);
    }
  }

  /**
   * プロンプトテンプレートの作成
   */
  private createPromptTemplate(): PromptTemplate {
    const template = `あなたは日本の自治体Webサイトの情報を構造化するエキスパートです。

与えられた自治体サイトのクロールデータから、以下のカテゴリの情報を抽出し、構造化してください：

1. ニュース・お知らせ（news）
2. イベント情報（events）
3. 手続き・サービス（procedures）
4. 施設情報（facilities）
5. 連絡先（contacts）
6. 緊急情報（emergencyInfo）

## 重要な注意事項

### 日付の正規化
- 「令和6年」→「2024年」
- 「令和5年12月25日」→「2023-12-25」
- 「R6.1.15」→「2024-01-15」
- 曖昧な日付表現は可能な限り標準形式（YYYY-MM-DD）に変換

### カテゴリ分類
- 明確なカテゴリラベルを付与
- 複数カテゴリにまたがる場合は最も適切なものを選択

### 重要度判定
- 「重要」「緊急」「【重要】」等の明示的マークがある → high
- 期限が近い、影響範囲が広い → medium
- 一般的なお知らせ → low

### データ品質
- URL は必ず完全な形式で（相対URLは絶対URLに変換）
- 電話番号は統一フォーマット（ハイフン付き）
- 存在しない情報は無理に推測せず、オプショナルフィールドとして省略

### 元データ
URL: {url}
タイトル: {title}
メインテキスト:
{mainText}

上記のデータから情報を抽出し、以下のJSON形式で出力してください。
情報が見つからないカテゴリは空配列として返してください。

必ず以下の形式の有効なJSONのみを返してください（\`\`\`json\`\`\`タグは不要です）:
{{
  "metadata": {{
    "municipality": "自治体名",
    "prefecture": "都道府県名",
    "confidence": 0.8
  }},
  "news": [],
  "events": [],
  "procedures": [],
  "facilities": [],
  "contacts": [],
  "emergencyInfo": []
}}
`;

    return new PromptTemplate({
      template,
      inputVariables: ['url', 'title', 'mainText'],
    });
  }

  /**
   * クローラー出力を構造化データに変換
   */
  async transform(crawlerData: CrawlerOutput): Promise<MunicipalStructuredData> {
    const startTime = Date.now();

    try {
      // 入力データの準備
      const url = crawlerData.url;
      const title = crawlerData.metadata?.title || 'タイトルなし';
      const mainText = crawlerData.content?.mainText || JSON.stringify(crawlerData, null, 2);

      if (this.config.verbose) {
        console.log('🔄 Transforming data...');
        console.log(`  URL: ${url}`);
        console.log(`  Title: ${title}`);
        console.log(`  Text length: ${mainText.length} characters`);
      }

      // プロンプトの作成
      const promptTemplate = this.createPromptTemplate();
      const prompt = await promptTemplate.format({
        url,
        title,
        mainText: mainText.slice(0, 20000), // LLMトークン制限対策
      });

      if (this.config.verbose) {
        console.log(`  Prompt length: ${prompt.length} characters`);
      }

      // LLM実行
      const response = await this.llm.invoke(prompt);
      let content = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);

      // JSONコードブロックを削除
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      // パース
      const parsed = JSON.parse(content) as any;

      // メタデータの補完
      const processingTimeMs = Date.now() - startTime;
      const result: MunicipalStructuredData = {
        metadata: {
          sourceUrl: url,
          extractedAt: new Date().toISOString(),
          municipality: parsed.metadata?.municipality || '不明',
          prefecture: parsed.metadata?.prefecture,
          confidence: parsed.metadata?.confidence || 0.5,
          llmModel: this.config.model,
          processingTimeMs,
        },
        news: parsed.news || [],
        events: parsed.events || [],
        procedures: parsed.procedures || [],
        facilities: parsed.facilities || [],
        contacts: parsed.contacts || [],
        emergencyInfo: parsed.emergencyInfo || [],
      };

      if (this.config.verbose) {
        console.log(`✅ Transformation completed in ${processingTimeMs}ms`);
        console.log(`  News: ${result.news.length}`);
        console.log(`  Events: ${result.events.length}`);
        console.log(`  Procedures: ${result.procedures.length}`);
        console.log(`  Facilities: ${result.facilities.length}`);
        console.log(`  Contacts: ${result.contacts.length}`);
        console.log(`  Emergency: ${result.emergencyInfo.length}`);
      }

      return result;
    } catch (error) {
      console.error('❌ Transformation failed:', error);
      throw error;
    }
  }

  /**
   * 複数のクローラー出力を一括変換
   */
  async transformBatch(crawlerDataList: CrawlerOutput[]): Promise<MunicipalStructuredData[]> {
    if (this.config.verbose) {
      console.log(`🔄 Transforming ${crawlerDataList.length} items...`);
    }

    const results: MunicipalStructuredData[] = [];

    for (let i = 0; i < crawlerDataList.length; i++) {
      if (this.config.verbose) {
        console.log(`\n[${i + 1}/${crawlerDataList.length}]`);
      }

      try {
        const result = await this.transform(crawlerDataList[i]);
        results.push(result);
      } catch (error) {
        console.error(`Failed to transform item ${i + 1}:`, error);
        // エラーがあっても続行
      }

      // レート制限対策: 少し待機
      if (i < crawlerDataList.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    if (this.config.verbose) {
      console.log(`\n✅ Batch transformation completed`);
      console.log(`  Success: ${results.length}/${crawlerDataList.length}`);
    }

    return results;
  }
}