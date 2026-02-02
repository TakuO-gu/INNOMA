#!/usr/bin/env npx tsx
/**
 * INNOMA 自動アップデートボット v2（Claude Code統合版）
 *
 * 高度な機能:
 * 1. サービスページの妥当性検証・新規作成・UI動作確認
 * 2. 日本語テキストの読みやすさ検査
 * 3. UIスクリーンショット分析（Claude Vision活用）
 * 4. 認知構造と意味構造の一致確認
 * 5. 難解な行政用語の検出と説明有無の確認
 * 6. 申請方法の記載完全性チェック
 * 7. 外部電子申請サイトのヘルプリンク確認
 *
 * Usage:
 *   cd apps/web && npx tsx scripts/auto-update-bot.ts [command] [options]
 *
 * Commands:
 *   all            全ての処理を実行
 *   validate       基本検証
 *   analyze        AI分析（スクリーンショット+テキスト）
 *   create <topic> 新規サービスページ作成
 *   improve        問題のあるページを自動改善
 *   review         対話的レビュー
 *   report         分析レポート生成
 *
 * Options:
 *   --municipality <id>  対象自治体
 *   --port <number>      開発サーバーポート
 *   --headed             ブラウザ表示
 *   --ai-analyze         Claude APIで分析
 *   --auto-fix           問題を自動修正
 *   --verbose            詳細出力
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { chromium, Browser, Page, BrowserContext } from 'playwright';
import Anthropic from '@anthropic-ai/sdk';

// ============================================================================
// Types
// ============================================================================

interface BotConfig {
  command: string;
  targetPath: string;
  municipality: string;
  port: number;
  headed: boolean;
  dryRun: boolean;
  verbose: boolean;
  skipDocs: boolean;
  aiAnalyze: boolean;
  autoFix: boolean;
  createTopic?: string;
  watchInterval?: number;  // watch mode interval in ms
}

interface AnalysisResult {
  file: string;
  url: string;
  screenshot?: string;
  issues: AnalysisIssue[];
  suggestions: string[];
  score: {
    readability: number;      // 読みやすさ (0-100)
    usability: number;        // 操作しやすさ (0-100)
    completeness: number;     // 情報の完全性 (0-100)
    terminology: number;      // 用語の適切さ (0-100)
    cognitiveMatch: number;   // 認知構造の一致 (0-100)
  };
}

interface AnalysisIssue {
  type: 'critical' | 'warning' | 'info' | 'suggestion';
  category: 'readability' | 'usability' | 'terminology' | 'completeness' | 'cognitive' | 'accessibility';
  message: string;
  element?: string;
  suggestion?: string;
  autoFixable: boolean;
}

interface PageContent {
  title: string;
  sections: SectionContent[];
  links: LinkInfo[];
  terminology: string[];
  applicationForms: ApplicationInfo[];
}

interface SectionContent {
  heading: string;
  text: string;
  hasContent: boolean;
  level: number;
}

interface LinkInfo {
  text: string;
  href: string;
  isExternal: boolean;
  isApplicationSite: boolean;
  hasHelpLink: boolean;
}

interface ApplicationInfo {
  name: string;
  hasMethod: boolean;
  hasRequiredDocs: boolean;
  hasOnlineOption: boolean;
  hasDeadline: boolean;
}

interface Block {
  id: string;
  type: string;
  props: Record<string, unknown>;
}

interface RichTextRun {
  text: string;
  bold?: boolean;
  italic?: boolean;
  link?: string;
}

interface RichTextNode {
  type: string;
  runs?: RichTextRun[];
  ordered?: boolean;
  items?: RichTextNode[][];
}

interface Artifact {
  schema_version?: string;
  id?: string;
  title?: string;
  path?: string;
  blocks?: Block[];
  variables?: Record<string, unknown>;
  [key: string]: unknown;
}

// ============================================================================
// Constants - 行政用語辞書（専門性レベル付き）
// ============================================================================

/**
 * 用語の専門性レベル
 * - high: 一般市民にはなじみがなく、説明が必須
 * - medium: 文脈によっては説明が必要
 * - low: 一般的に理解されており、説明不要
 */
type TermLevel = 'high' | 'medium' | 'low';

interface TermDefinition {
  explanation: string;
  level: TermLevel;
}

const COMPLEX_TERMS: Record<string, TermDefinition> = {
  // HIGH: 専門的な行政用語（説明必須）
  '被保険者': { explanation: '保険に加入している方', level: 'high' },
  '賦課': { explanation: '税金を課すこと', level: 'high' },
  '還付': { explanation: '払い過ぎた税金を返すこと', level: 'high' },
  '所得割': { explanation: '収入に応じて計算される部分', level: 'high' },
  '均等割': { explanation: '全員同じ金額の部分', level: 'high' },
  '資産割': { explanation: '資産に応じて計算される部分', level: 'high' },
  '戸籍謄本': { explanation: '家族全員の戸籍の写し', level: 'high' },
  '戸籍抄本': { explanation: '本人だけの戸籍の写し', level: 'high' },
  '被扶養者': { explanation: '養われている人', level: 'high' },
  '拠出': { explanation: 'お金を出すこと', level: 'high' },
  '充当': { explanation: '別の支払いに使うこと', level: 'high' },
  '更正': { explanation: '間違いを直すこと', level: 'high' },
  '処分': { explanation: '行政が決定を下すこと', level: 'high' },
  '不服申立て': { explanation: '決定に納得できない場合の申し出', level: 'high' },
  '審査請求': { explanation: '不服申立ての正式な名前', level: 'high' },
  '課税証明書': { explanation: '税金がいくらか証明する書類', level: 'high' },
  '非課税証明書': { explanation: '税金がかからないことを証明する書類', level: 'high' },
  '所得証明書': { explanation: '収入を証明する書類', level: 'high' },
  '減免': { explanation: '税金や料金を減らすこと', level: 'high' },
  '猶予': { explanation: '支払いを待ってもらうこと', level: 'high' },
  '督促': { explanation: '支払いを促すこと', level: 'high' },

  // MEDIUM: やや専門的（文脈次第で説明）
  '控除': { explanation: '税金から差し引くこと', level: 'medium' },
  '扶養': { explanation: '養っていること', level: 'medium' },
  '滞納': { explanation: '支払いが遅れていること', level: 'medium' },
  '印鑑証明': { explanation: '登録した印鑑を証明する書類', level: 'medium' },

  // LOW: 一般的な用語（説明不要）
  '届出人': { explanation: '届出をする人', level: 'low' },
  '申請者': { explanation: '申請をする人', level: 'low' },
  '受給者': { explanation: '受け取る人', level: 'low' },
  '世帯主': { explanation: '住民票上の世帯のリーダー', level: 'low' },
  '続柄': { explanation: '家族関係', level: 'low' },
  '住民票': { explanation: '住所を証明する書類', level: 'low' },
  '委任状': { explanation: '代理人にお願いするための書類', level: 'low' },
  '本人確認書類': { explanation: '運転免許証やマイナンバーカードなど', level: 'low' },
  '給付': { explanation: 'お金やサービスを受け取ること', level: 'low' },
  '決定': { explanation: '正式に決まること', level: 'low' },
};

/**
 * 用語説明が必要かどうかを判定
 * high レベルの用語のみを説明対象とする
 */
function isTermRequiringExplanation(term: string): boolean {
  const def = COMPLEX_TERMS[term];
  return def?.level === 'high';
}

/**
 * 後方互換性のための簡易アクセス
 */
function getTermExplanation(term: string): string | undefined {
  return COMPLEX_TERMS[term]?.explanation;
}

const EXTERNAL_APPLICATION_SITES = [
  { pattern: /e-gov/i, name: 'e-Gov', helpUrl: 'https://shinsei.e-gov.go.jp/contents/help/' },
  { pattern: /マイナポータル|myna/i, name: 'マイナポータル', helpUrl: 'https://myna.go.jp/html/help.html' },
  { pattern: /ぴったりサービス/i, name: 'ぴったりサービス', helpUrl: 'https://app.oss.myna.go.jp/Application/help' },
  { pattern: /eLTAX|エルタックス/i, name: 'eLTAX', helpUrl: 'https://www.eltax.lta.go.jp/eltax/faq/' },
  { pattern: /gBizID|Gビズ/i, name: 'gBizID', helpUrl: 'https://gbiz-id.go.jp/top/help/help.html' },
];

// ============================================================================
// Utilities
// ============================================================================

function getTimestamp(): string {
  return new Date().toISOString().slice(0, 10);
}

function getJsonFiles(dir: string): string[] {
  const files: string[] = [];
  if (!fs.existsSync(dir)) return files;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['data', '_drafts', '_jobs', 'history', 'variables'].includes(entry.name)) continue;
      files.push(...getJsonFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      if (['meta.json', 'districts.json', 'shelters.json', 'hazard-maps.json'].includes(entry.name)) continue;
      files.push(fullPath);
    }
  }
  return files;
}

function artifactPathToUrl(artifactPath: string, _municipality: string): string {
  const match = artifactPath.match(/data\/artifacts\/([^/]+)\/(.+)\.json$/);
  if (match) return `/${match[1]}/${match[2]}`;
  return `/`;
}

async function askQuestion(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// ============================================================================
// Browser Manager with Enhanced Analysis
// ============================================================================

class EnhancedBrowserManager {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private config: BotConfig;

  constructor(config: BotConfig) {
    this.config = config;
  }

  async launch(): Promise<void> {
    this.browser = await chromium.launch({
      headless: !this.config.headed,
      slowMo: this.config.headed ? 100 : 0,
    });
    this.context = await this.browser.newContext({
      viewport: { width: 1280, height: 900 },
      locale: 'ja-JP',
    });
    this.page = await this.context.newPage();
  }

  async close(): Promise<void> {
    if (this.browser) await this.browser.close();
  }

  getPage(): Page {
    if (!this.page) throw new Error('Browser not launched');
    return this.page;
  }

  async navigateTo(urlPath: string): Promise<void> {
    const page = this.getPage();
    const fullUrl = `http://localhost:${this.config.port}${urlPath}`;
    await page.goto(fullUrl, { waitUntil: 'networkidle', timeout: 30000 });
  }

  async screenshot(name: string): Promise<string> {
    const page = this.getPage();
    const dir = path.join(__dirname, '../screenshots');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const filename = `${name}-${Date.now()}.png`;
    const filepath = path.join(dir, filename);
    await page.screenshot({ path: filepath, fullPage: true });
    return filepath;
  }

  async extractPageContent(): Promise<PageContent> {
    const page = this.getPage();

    return await page.evaluate(() => {
      const title = document.querySelector('h1')?.textContent?.trim() || '';

      // セクション抽出
      const sections: { heading: string; text: string; hasContent: boolean; level: number }[] = [];
      document.querySelectorAll('h2, h3, h4').forEach((h) => {
        const heading = h.textContent?.trim() || '';
        const level = parseInt(h.tagName[1]);
        let text = '';
        let sibling = h.nextElementSibling;
        while (sibling && !['H2', 'H3', 'H4'].includes(sibling.tagName)) {
          text += sibling.textContent?.trim() + ' ';
          sibling = sibling.nextElementSibling;
        }
        sections.push({
          heading,
          text: text.trim(),
          hasContent: text.trim().length > 0,
          level
        });
      });

      // リンク抽出
      const links: { text: string; href: string; isExternal: boolean; isApplicationSite: boolean; hasHelpLink: boolean }[] = [];
      document.querySelectorAll('a[href]').forEach((a) => {
        const href = a.getAttribute('href') || '';
        const text = a.textContent?.trim() || '';
        const isExternal = href.startsWith('http') && !href.includes('localhost');
        links.push({
          text,
          href,
          isExternal,
          isApplicationSite: /申請|手続き|届出/.test(text) && isExternal,
          hasHelpLink: false
        });
      });

      // 用語抽出
      const terminology: string[] = [];
      const bodyText = document.body.textContent || '';
      const termPatterns = [
        /被保険者/g, /届出人/g, /申請者/g, /受給者/g, /控除/g, /賦課/g,
        /還付/g, /所得割/g, /均等割/g, /世帯主/g, /戸籍謄本/g, /戸籍抄本/g,
        /住民票/g, /印鑑証明/g, /委任状/g, /課税証明書/g, /非課税証明書/g,
        /扶養/g, /給付/g, /減免/g, /猶予/g, /督促/g, /滞納/g
      ];
      termPatterns.forEach(pattern => {
        const matches = bodyText.match(pattern);
        if (matches) terminology.push(...matches);
      });

      // 申請フォーム抽出
      const applicationForms: { name: string; hasMethod: boolean; hasRequiredDocs: boolean; hasOnlineOption: boolean; hasDeadline: boolean }[] = [];
      const formKeywords = ['届出', '申請', '届', '申込'];
      formKeywords.forEach(keyword => {
        const pattern = new RegExp(`${keyword}[^。、]+`, 'g');
        const matches = bodyText.match(pattern);
        if (matches) {
          matches.forEach(match => {
            applicationForms.push({
              name: match.slice(0, 20),
              hasMethod: /方法|手順|流れ/.test(bodyText),
              hasRequiredDocs: /必要.*書類|持ち物|必要なもの/.test(bodyText),
              hasOnlineOption: /オンライン|電子申請|インターネット/.test(bodyText),
              hasDeadline: /期限|締切|まで/.test(bodyText)
            });
          });
        }
      });

      return { title, sections, links, terminology: [...new Set(terminology)], applicationForms };
    });
  }

  async checkMissingVariables(): Promise<string[]> {
    const page = this.getPage();
    return await page.evaluate(() => {
      const content = document.body.innerHTML;
      return content.match(/\{\{[^}]+\}\}/g) || [];
    });
  }

  async checkEmptyElements(): Promise<{ type: string; heading: string }[]> {
    const page = this.getPage();
    return await page.evaluate(() => {
      const empty: { type: string; heading: string }[] = [];
      document.querySelectorAll('section').forEach((section) => {
        const hasContent = section.querySelector('p, ul, ol, table');
        if (!hasContent) {
          const heading = section.querySelector('h2, h3')?.textContent || '';
          empty.push({ type: 'empty-section', heading });
        }
      });
      document.querySelectorAll('td').forEach((td) => {
        if (!td.textContent?.trim()) {
          empty.push({ type: 'empty-table-cell', heading: '' });
        }
      });
      return empty;
    });
  }
}

// ============================================================================
// Analysis Engine
// ============================================================================

class AnalysisEngine {
  private config: BotConfig;

  constructor(config: BotConfig) {
    this.config = config;
  }

  analyzeReadability(content: PageContent): { score: number; issues: AnalysisIssue[] } {
    const issues: AnalysisIssue[] = [];
    let score = 100;

    // 1. 長すぎる文のチェック
    content.sections.forEach(section => {
      const sentences = section.text.split(/[。！？]/);
      sentences.forEach(sentence => {
        if (sentence.length > 80) {
          score -= 5;
          issues.push({
            type: 'warning',
            category: 'readability',
            message: `セクション「${section.heading}」に長すぎる文があります（${sentence.length}文字）`,
            element: sentence.slice(0, 50) + '...',
            suggestion: '文を2〜3つに分割することを推奨します',
            autoFixable: false
          });
        }
      });
    });

    // 2. 受動態の多用チェック
    const passivePatterns = ['されます', 'されています', 'されました'];
    content.sections.forEach(section => {
      let passiveCount = 0;
      passivePatterns.forEach(pattern => {
        const matches = section.text.match(new RegExp(pattern, 'g'));
        if (matches) passiveCount += matches.length;
      });
      if (passiveCount > 3) {
        score -= 3;
        issues.push({
          type: 'info',
          category: 'readability',
          message: `セクション「${section.heading}」に受動態が多用されています（${passiveCount}回）`,
          suggestion: '能動態で書き直すと、より分かりやすくなります',
          autoFixable: false
        });
      }
    });

    // 3. 否定表現のチェック
    const negativePatterns = ['ありません', 'できません', 'いません', 'しません'];
    content.sections.forEach(section => {
      negativePatterns.forEach(pattern => {
        if (section.text.includes(pattern)) {
          // 否定表現の後に肯定的な説明があるか確認
          const idx = section.text.indexOf(pattern);
          const after = section.text.slice(idx, idx + 50);
          if (!after.includes('ください') && !after.includes('場合は')) {
            score -= 2;
            issues.push({
              type: 'info',
              category: 'readability',
              message: `「${pattern}」の後に代替案の説明がありません`,
              element: section.heading,
              suggestion: '否定表現の後には、代わりにできることを説明してください',
              autoFixable: false
            });
          }
        }
      });
    });

    return { score: Math.max(0, score), issues };
  }

  analyzeTerminology(content: PageContent): { score: number; issues: AnalysisIssue[] } {
    const issues: AnalysisIssue[] = [];
    let score = 100;

    const allText = content.sections.map(s => s.text).join(' ');

    // 難解な用語のチェック（highレベルの用語のみ）
    Object.entries(COMPLEX_TERMS).forEach(([term, def]) => {
      // highレベルの用語のみを説明必須とする
      if (!isTermRequiringExplanation(term)) return;

      if (allText.includes(term)) {
        // その用語の説明があるか確認
        const hasExplanation = allText.includes(def.explanation) ||
          allText.includes(`${term}とは`) ||
          allText.includes(`${term}（`);

        if (!hasExplanation) {
          score -= 5;
          issues.push({
            type: 'warning',
            category: 'terminology',
            message: `「${term}」の説明がありません`,
            suggestion: `「${term}」は「${def.explanation}」のように説明を追加してください`,
            autoFixable: true
          });
        }
      }
    });

    return { score: Math.max(0, score), issues };
  }

  analyzeCompleteness(content: PageContent): { score: number; issues: AnalysisIssue[] } {
    const issues: AnalysisIssue[] = [];
    let score = 100;

    // 1. 必須セクションの確認（複数キーワードで検出）
    const requiredSections = [
      { keywords: ['対象'], name: '対象となる方' },
      { keywords: ['必要', '持ち物', '書類'], name: '必要なもの' },
      { keywords: ['方法', '手順', '流れ', 'ステップ'], name: '手続き方法' }
    ];
    const headings = content.sections.map(s => s.heading);

    requiredSections.forEach(required => {
      const hasSection = headings.some(h =>
        required.keywords.some(keyword => h.includes(keyword))
      );
      if (!hasSection) {
        score -= 10;
        issues.push({
          type: 'warning',
          category: 'completeness',
          message: `「${required.name}」に関するセクションがありません`,
          suggestion: `「${required.name}」セクションの追加を検討してください`,
          autoFixable: false
        });
      }
    });

    // 2. 空セクションの確認（警告レベル - 多くはコンポーネント構造の問題で実害なし）
    content.sections.forEach(section => {
      if (!section.hasContent) {
        score -= 5;
        issues.push({
          type: 'info',
          category: 'completeness',
          message: `セクション「${section.heading}」にコンテンツがありません`,
          suggestion: 'コンテンツを追加するか、セクションを削除してください',
          autoFixable: false
        });
      }
    });

    // 3. 申請方法の完全性
    content.applicationForms.forEach(form => {
      if (!form.hasMethod) {
        score -= 10;
        issues.push({
          type: 'warning',
          category: 'completeness',
          message: `「${form.name}」の申請方法が記載されていません`,
          suggestion: '申請の手順や方法を追加してください',
          autoFixable: false
        });
      }
      if (!form.hasRequiredDocs) {
        score -= 5;
        issues.push({
          type: 'info',
          category: 'completeness',
          message: `「${form.name}」の必要書類が記載されていません`,
          suggestion: '必要な書類のリストを追加してください',
          autoFixable: false
        });
      }
    });

    return { score: Math.max(0, score), issues };
  }

  analyzeExternalLinks(content: PageContent): { score: number; issues: AnalysisIssue[] } {
    const issues: AnalysisIssue[] = [];
    let score = 100;

    content.links.forEach(link => {
      if (!link.isExternal) return;

      // 外部電子申請サイトかチェック
      EXTERNAL_APPLICATION_SITES.forEach(site => {
        if (site.pattern.test(link.href) || site.pattern.test(link.text)) {
          // ヘルプページへのリンクがあるか確認
          const hasHelpLink = content.links.some(l =>
            l.href.includes('help') || l.href.includes('faq') || l.text.includes('ヘルプ')
          );

          if (!hasHelpLink) {
            score -= 10;
            issues.push({
              type: 'warning',
              category: 'usability',
              message: `${site.name}へのリンクがありますが、ヘルプページへのリンクがありません`,
              suggestion: `${site.helpUrl} へのリンクを追加することを推奨します`,
              autoFixable: true
            });
          }
        }
      });
    });

    return { score: Math.max(0, score), issues };
  }

  analyzeCognitiveStructure(content: PageContent): { score: number; issues: AnalysisIssue[] } {
    const issues: AnalysisIssue[] = [];
    let score = 100;

    // 1. セクション順序の確認（市民の思考順序に沿っているか）
    const expectedOrder = ['対象', '概要', '必要', '方法', '手順', '費用', '届出', '注意', '問い合わせ'];
    let lastIndex = -1;

    content.sections.forEach(section => {
      const matchedIndex = expectedOrder.findIndex(expected =>
        section.heading.includes(expected)
      );
      if (matchedIndex !== -1 && matchedIndex < lastIndex) {
        score -= 5;
        issues.push({
          type: 'info',
          category: 'cognitive',
          message: `セクション「${section.heading}」の位置が市民の思考順序と一致していません`,
          suggestion: '「何をするのか」→「誰が対象か」→「何が必要か」→「どうやるか」の順序を推奨',
          autoFixable: false
        });
      }
      if (matchedIndex !== -1) lastIndex = matchedIndex;
    });

    // 2. 見出しの具体性確認
    content.sections.forEach(section => {
      if (section.heading.length < 3) {
        score -= 3;
        issues.push({
          type: 'info',
          category: 'cognitive',
          message: `見出し「${section.heading}」が短すぎます`,
          suggestion: 'より具体的な見出しに変更してください（例：「対象」→「対象となる方」）',
          autoFixable: false
        });
      }
    });

    // 3. 階層構造の確認
    let prevLevel = 1;
    content.sections.forEach(section => {
      if (section.level - prevLevel > 1) {
        score -= 3;
        issues.push({
          type: 'info',
          category: 'cognitive',
          message: `見出し「${section.heading}」のレベルが飛んでいます（h${prevLevel}→h${section.level}）`,
          suggestion: '見出しの階層を整理してください',
          autoFixable: false
        });
      }
      prevLevel = section.level;
    });

    return { score: Math.max(0, score), issues };
  }

  async runFullAnalysis(browser: EnhancedBrowserManager, urlPath: string, filePath: string): Promise<AnalysisResult> {
    await browser.navigateTo(urlPath);

    const content = await browser.extractPageContent();
    const missingVars = await browser.checkMissingVariables();
    const emptyElements = await browser.checkEmptyElements();

    // 各分析を実行
    const readability = this.analyzeReadability(content);
    const terminology = this.analyzeTerminology(content);
    const completeness = this.analyzeCompleteness(content);
    const externalLinks = this.analyzeExternalLinks(content);
    const cognitive = this.analyzeCognitiveStructure(content);

    // 追加の問題を検出
    const additionalIssues: AnalysisIssue[] = [];

    // 未置換変数
    missingVars.forEach(v => {
      additionalIssues.push({
        type: 'critical',
        category: 'completeness',
        message: `未置換の変数: ${v}`,
        autoFixable: false
      });
    });

    // 空要素
    emptyElements.forEach(e => {
      additionalIssues.push({
        type: 'warning',
        category: 'completeness',
        message: `空の要素: ${e.type}${e.heading ? ` (${e.heading})` : ''}`,
        autoFixable: false
      });
    });

    // スクリーンショット
    let screenshot: string | undefined;
    if (this.config.aiAnalyze) {
      const pageName = urlPath.replace(/\//g, '-').slice(1) || 'index';
      screenshot = await browser.screenshot(pageName);
    }

    const allIssues = [
      ...readability.issues,
      ...terminology.issues,
      ...completeness.issues,
      ...externalLinks.issues,
      ...cognitive.issues,
      ...additionalIssues
    ];

    // 改善提案を生成
    const suggestions = this.generateSuggestions(allIssues);

    return {
      file: filePath,
      url: urlPath,
      screenshot,
      issues: allIssues,
      suggestions,
      score: {
        readability: readability.score,
        usability: Math.round((externalLinks.score + cognitive.score) / 2),
        completeness: completeness.score,
        terminology: terminology.score,
        cognitiveMatch: cognitive.score
      }
    };
  }

  private generateSuggestions(issues: AnalysisIssue[]): string[] {
    const suggestions: string[] = [];

    // カテゴリ別に集計
    const byCategory = new Map<string, number>();
    issues.forEach(issue => {
      byCategory.set(issue.category, (byCategory.get(issue.category) || 0) + 1);
    });

    // 優先度の高い改善提案
    if ((byCategory.get('completeness') || 0) > 3) {
      suggestions.push('情報の完全性に問題があります。必須セクション（対象者、必要なもの、手続き方法）の追加を優先してください。');
    }
    if ((byCategory.get('terminology') || 0) > 2) {
      suggestions.push('難解な行政用語が説明なしで使用されています。「用語とは〜」の形式で説明を追加してください。');
    }
    if ((byCategory.get('readability') || 0) > 3) {
      suggestions.push('文章の読みやすさを改善してください。長い文は分割し、受動態は能動態に変更することを推奨します。');
    }
    if ((byCategory.get('usability') || 0) > 0) {
      suggestions.push('外部電子申請サイトへのリンクがある場合は、そのサイトのヘルプページへのリンクも追加してください。');
    }

    return suggestions;
  }
}

// ============================================================================
// Service Page Creator
// ============================================================================

class ServicePageCreator {
  private config: BotConfig;

  constructor(config: BotConfig) {
    this.config = config;
  }

  async createServicePage(topic: string): Promise<{ success: boolean; filePath?: string; message: string }> {
    // テンプレートを読み込む
    const templateDir = path.join(__dirname, '../data/artifacts/_templates');
    const templateFiles = getJsonFiles(templateDir);

    if (templateFiles.length === 0) {
      return { success: false, message: 'テンプレートが見つかりません' };
    }

    // 類似のテンプレートを探す
    const similarTemplate = templateFiles.find(f =>
      f.toLowerCase().includes(topic.toLowerCase())
    );

    const baseTemplate = similarTemplate || templateFiles[0];
    const templateContent = JSON.parse(fs.readFileSync(baseTemplate, 'utf-8'));

    // 新しいページを生成
    const newPage: Artifact = {
      schema_version: '2.0',
      id: `new-${topic}-${Date.now()}`,
      title: `${topic}について`,
      path: `/services/${topic}`,
      blocks: this.generateDefaultBlocks(topic),
      variables: {}
    };

    // 保存先パス
    const outputDir = path.join(__dirname, `../data/artifacts/${this.config.municipality}/services`);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    const outputPath = path.join(outputDir, `${topic}.json`);

    if (!this.config.dryRun) {
      fs.writeFileSync(outputPath, JSON.stringify(newPage, null, 2) + '\n');
    }

    return {
      success: true,
      filePath: outputPath,
      message: `サービスページを作成しました: ${outputPath}`
    };
  }

  private generateDefaultBlocks(topic: string): Block[] {
    return [
      {
        id: 'breadcrumbs',
        type: 'Breadcrumbs',
        props: {
          items: [
            { label: 'ホーム', href: '/' },
            { label: 'サービス', href: '/services' },
            { label: topic }
          ]
        }
      },
      {
        id: 'title',
        type: 'Title',
        props: { text: `${topic}について` }
      },
      {
        id: 'summary',
        type: 'Summary',
        props: {
          text: `${topic}に関する情報をご案内します。`
        }
      },
      {
        id: 'section-target',
        type: 'Section',
        props: {
          heading: '対象となる方',
          content: [
            {
              type: 'paragraph',
              runs: [{ text: '対象となる方の条件を記載してください。' }]
            }
          ]
        }
      },
      {
        id: 'section-required',
        type: 'Section',
        props: {
          heading: '必要なもの',
          content: [
            {
              type: 'list',
              ordered: false,
              items: [
                [{ type: 'paragraph', runs: [{ text: '必要書類1' }] }],
                [{ type: 'paragraph', runs: [{ text: '必要書類2' }] }]
              ]
            }
          ]
        }
      },
      {
        id: 'section-method',
        type: 'Section',
        props: {
          heading: '手続きの流れ',
          content: [
            {
              type: 'list',
              ordered: true,
              items: [
                [{ type: 'paragraph', runs: [{ text: 'ステップ1: 申請書を入手' }] }],
                [{ type: 'paragraph', runs: [{ text: 'ステップ2: 必要事項を記入' }] }],
                [{ type: 'paragraph', runs: [{ text: 'ステップ3: 窓口に提出' }] }]
              ]
            }
          ]
        }
      },
      {
        id: 'contact',
        type: 'Contact',
        props: {
          department: '{{shimin_department}}',
          phone: '{{shimin_phone}}',
          email: '{{shimin_email}}'
        }
      },
      {
        id: 'sources',
        type: 'Sources',
        props: { sources: [] }
      }
    ];
  }
}

// ============================================================================
// Report Generator
// ============================================================================

class ReportGenerator {
  generateReport(results: AnalysisResult[]): string {
    const lines: string[] = [];

    lines.push('# INNOMA 品質分析レポート');
    lines.push(`\n生成日時: ${new Date().toISOString()}`);
    lines.push(`分析ページ数: ${results.length}`);

    // 全体スコア
    const avgScores = {
      readability: 0,
      usability: 0,
      completeness: 0,
      terminology: 0,
      cognitiveMatch: 0
    };

    results.forEach(r => {
      avgScores.readability += r.score.readability;
      avgScores.usability += r.score.usability;
      avgScores.completeness += r.score.completeness;
      avgScores.terminology += r.score.terminology;
      avgScores.cognitiveMatch += r.score.cognitiveMatch;
    });

    const count = results.length || 1;
    lines.push('\n## 全体スコア\n');
    lines.push(`| 項目 | スコア |`);
    lines.push(`|------|--------|`);
    lines.push(`| 読みやすさ | ${Math.round(avgScores.readability / count)}/100 |`);
    lines.push(`| 操作しやすさ | ${Math.round(avgScores.usability / count)}/100 |`);
    lines.push(`| 情報の完全性 | ${Math.round(avgScores.completeness / count)}/100 |`);
    lines.push(`| 用語の適切さ | ${Math.round(avgScores.terminology / count)}/100 |`);
    lines.push(`| 認知構造の一致 | ${Math.round(avgScores.cognitiveMatch / count)}/100 |`);

    // 問題サマリー
    const allIssues = results.flatMap(r => r.issues);
    const criticalCount = allIssues.filter(i => i.type === 'critical').length;
    const warningCount = allIssues.filter(i => i.type === 'warning').length;
    const infoCount = allIssues.filter(i => i.type === 'info').length;

    lines.push('\n## 問題サマリー\n');
    lines.push(`- 重大な問題: ${criticalCount}件`);
    lines.push(`- 警告: ${warningCount}件`);
    lines.push(`- 情報: ${infoCount}件`);

    // 問題の多いページ
    const problemPages = results
      .filter(r => r.issues.length > 0)
      .sort((a, b) => b.issues.length - a.issues.length)
      .slice(0, 10);

    if (problemPages.length > 0) {
      lines.push('\n## 問題の多いページ（上位10件）\n');
      problemPages.forEach((page, idx) => {
        lines.push(`### ${idx + 1}. ${path.basename(page.file)}`);
        lines.push(`URL: ${page.url}`);
        lines.push(`問題数: ${page.issues.length}件`);
        lines.push('');
        page.issues.slice(0, 5).forEach(issue => {
          const icon = issue.type === 'critical' ? '🔴' : issue.type === 'warning' ? '🟡' : '🔵';
          lines.push(`${icon} ${issue.message}`);
        });
        if (page.issues.length > 5) {
          lines.push(`...他 ${page.issues.length - 5}件`);
        }
        lines.push('');
      });
    }

    // 改善提案
    const allSuggestions = [...new Set(results.flatMap(r => r.suggestions))];
    if (allSuggestions.length > 0) {
      lines.push('\n## 改善提案\n');
      allSuggestions.forEach((suggestion, idx) => {
        lines.push(`${idx + 1}. ${suggestion}`);
      });
    }

    return lines.join('\n');
  }

  saveReport(report: string, filename: string): void {
    const dir = path.join(__dirname, '../reports');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const filepath = path.join(dir, filename);
    fs.writeFileSync(filepath, report);
    console.log(`📄 レポートを保存しました: ${filepath}`);
  }
}

// ============================================================================
// CLI & Main
// ============================================================================

function parseArgs(): BotConfig {
  const args = process.argv.slice(2);

  const config: BotConfig = {
    command: 'all',
    targetPath: path.join(__dirname, '../data/artifacts'),
    municipality: 'takaoka',
    port: 3000,
    headed: false,
    dryRun: false,
    verbose: false,
    skipDocs: false,
    aiAnalyze: false,
    autoFix: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case 'all':
      case 'validate':
      case 'analyze':
      case 'improve':
      case 'review':
      case 'report':
      case 'watch':
      case 'populate':
        config.command = arg;
        break;
      case 'create':
        config.command = 'create';
        config.createTopic = args[++i];
        break;
      case '--target':
        config.targetPath = args[++i] || config.targetPath;
        break;
      case '--municipality':
        config.municipality = args[++i] || config.municipality;
        break;
      case '--port':
        config.port = parseInt(args[++i]) || config.port;
        break;
      case '--headed':
        config.headed = true;
        break;
      case '--dry-run':
        config.dryRun = true;
        break;
      case '--verbose':
        config.verbose = true;
        break;
      case '--ai-analyze':
        config.aiAnalyze = true;
        break;
      case '--auto-fix':
        config.autoFix = true;
        break;
      case '--interval':
        config.watchInterval = parseInt(args[++i]) || 60000;
        break;
      case '--help':
        printHelp();
        process.exit(0);
    }
  }

  if (!config.targetPath.includes(config.municipality)) {
    config.targetPath = path.join(config.targetPath, config.municipality);
  }

  return config;
}

function printHelp(): void {
  console.log(`
INNOMA 自動アップデートボット v2（Claude Code統合版）

高度な機能:
- サービスページの妥当性検証・新規作成・UI動作確認
- 日本語テキストの読みやすさ検査
- UIスクリーンショット分析
- 認知構造と意味構造の一致確認
- 難解な行政用語の検出と説明有無の確認
- 申請方法の記載完全性チェック
- 外部電子申請サイトのヘルプリンク確認

Usage:
  cd apps/web && npx tsx scripts/auto-update-bot.ts [command] [options]

Commands:
  all            全ての処理を実行
  validate       基本検証
  analyze        AI分析（スクリーンショット+テキスト）
  create <topic> 新規サービスページ作成
  improve        問題のあるページを自動改善
  review         対話的レビュー
  report         分析レポート生成
  populate       プレースホルダー変数をLLMで埋める

Options:
  --municipality <id>  対象自治体（デフォルト: takaoka）
  --port <number>      開発サーバーポート（デフォルト: 3000）
  --headed             ブラウザ表示
  --ai-analyze         スクリーンショット分析を有効化
  --auto-fix           問題を自動修正
  --dry-run            変更せずにレポートのみ
  --verbose            詳細出力
  --help               ヘルプ表示

Examples:
  npx tsx scripts/auto-update-bot.ts analyze --headed
  npx tsx scripts/auto-update-bot.ts create 生活保護
  npx tsx scripts/auto-update-bot.ts report
  npx tsx scripts/auto-update-bot.ts improve --auto-fix

分析項目:
  📖 読みやすさ: 文の長さ、受動態、否定表現
  📋 用語: 難解な行政用語の説明有無
  ✅ 完全性: 必須セクション、申請方法の記載
  🔗 リンク: 外部電子申請サイトのヘルプリンク
  🧠 認知構造: セクション順序、見出しの具体性
`);
}

async function runAnalysis(browser: EnhancedBrowserManager, engine: AnalysisEngine, files: string[], config: BotConfig): Promise<AnalysisResult[]> {
  const results: AnalysisResult[] = [];

  console.log('\n📊 品質分析を開始します...\n');

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const urlPath = artifactPathToUrl(file, config.municipality);
    const relativePath = path.basename(file);

    process.stdout.write(`[${i + 1}/${files.length}] ${relativePath}... `);

    try {
      const result = await engine.runFullAnalysis(browser, urlPath, file);
      results.push(result);

      const criticalCount = result.issues.filter(i => i.type === 'critical').length;
      const warningCount = result.issues.filter(i => i.type === 'warning').length;

      if (criticalCount > 0) {
        console.log(`🔴 ${criticalCount}件の重大な問題`);
      } else if (warningCount > 0) {
        console.log(`🟡 ${warningCount}件の警告`);
      } else {
        console.log('✅ OK');
      }

      if (config.verbose && result.issues.length > 0) {
        result.issues.slice(0, 3).forEach(issue => {
          console.log(`   - ${issue.message}`);
        });
      }
    } catch (error) {
      console.log(`❌ エラー: ${(error as Error).message}`);
    }
  }

  return results;
}

async function interactiveReview(browser: EnhancedBrowserManager, engine: AnalysisEngine, files: string[], config: BotConfig): Promise<void> {
  console.log('\n🎮 対話的レビューモード');
  console.log('コマンド: next, prev, analyze, screenshot, fix, quit\n');

  let currentIndex = 0;

  const showCurrentPage = async () => {
    const file = files[currentIndex];
    const urlPath = artifactPathToUrl(file, config.municipality);
    console.log(`\n[${currentIndex + 1}/${files.length}] ${path.basename(file)}`);
    await browser.navigateTo(urlPath);

    const content = await browser.extractPageContent();
    console.log(`タイトル: ${content.title}`);
    console.log(`セクション数: ${content.sections.length}`);
    console.log(`用語数: ${content.terminology.length}`);
  };

  await showCurrentPage();

  while (true) {
    const input = await askQuestion('\n> ');
    const [cmd] = input.split(' ');

    switch (cmd.toLowerCase()) {
      case 'next':
      case 'n':
        if (currentIndex < files.length - 1) {
          currentIndex++;
          await showCurrentPage();
        } else {
          console.log('最後のページです');
        }
        break;

      case 'prev':
      case 'p':
        if (currentIndex > 0) {
          currentIndex--;
          await showCurrentPage();
        } else {
          console.log('最初のページです');
        }
        break;

      case 'analyze':
      case 'a':
        console.log('分析中...');
        const urlPath = artifactPathToUrl(files[currentIndex], config.municipality);
        const result = await engine.runFullAnalysis(browser, urlPath, files[currentIndex]);
        console.log(`\nスコア:`);
        console.log(`  読みやすさ: ${result.score.readability}/100`);
        console.log(`  操作しやすさ: ${result.score.usability}/100`);
        console.log(`  完全性: ${result.score.completeness}/100`);
        console.log(`  用語: ${result.score.terminology}/100`);
        console.log(`  認知構造: ${result.score.cognitiveMatch}/100`);
        console.log(`\n問題 (${result.issues.length}件):`);
        result.issues.forEach(issue => {
          const icon = issue.type === 'critical' ? '🔴' : issue.type === 'warning' ? '🟡' : '🔵';
          console.log(`  ${icon} ${issue.message}`);
        });
        break;

      case 'screenshot':
      case 's':
        const pageName = artifactPathToUrl(files[currentIndex], config.municipality).replace(/\//g, '-').slice(1);
        const filepath = await browser.screenshot(pageName);
        console.log(`📸 保存: ${filepath}`);
        break;

      case 'terms':
      case 't':
        const contentForTerms = await browser.extractPageContent();
        console.log(`\n使用されている専門用語:`);
        contentForTerms.terminology.forEach(term => {
          const def = COMPLEX_TERMS[term];
          if (def) {
            const levelIcon = def.level === 'high' ? '🔴' : def.level === 'medium' ? '🟡' : '🟢';
            console.log(`  ${levelIcon} ${term}: ${def.explanation}`);
          } else {
            console.log(`  ⚪ ${term}`);
          }
        });
        break;

      case 'quit':
      case 'q':
        console.log('終了します...');
        return;

      case 'help':
        console.log(`
コマンド:
  next/n      - 次のページへ
  prev/p      - 前のページへ
  analyze/a   - 現在のページを分析
  screenshot/s - スクリーンショット取得
  terms/t     - 使用されている専門用語を表示
  quit/q      - 終了
  help        - ヘルプ表示
`);
        break;

      default:
        console.log('不明なコマンドです。"help"でコマンド一覧を表示');
    }
  }
}

async function main(): Promise<void> {
  const config = parseArgs();

  console.log(`\n🤖 INNOMA 自動アップデートボット v2`);
  console.log(`   コマンド: ${config.command}`);
  console.log(`   対象: ${config.targetPath}`);
  console.log(`   自治体: ${config.municipality}`);
  if (config.dryRun) console.log(`   モード: ドライラン`);
  if (config.aiAnalyze) console.log(`   AI分析: 有効`);
  console.log('');

  // サービスページ作成
  if (config.command === 'create' && config.createTopic) {
    const creator = new ServicePageCreator(config);
    const result = await creator.createServicePage(config.createTopic);
    console.log(result.message);
    return;
  }

  // ターゲットの存在確認
  if (!fs.existsSync(config.targetPath)) {
    const templatesPath = path.join(__dirname, '../data/artifacts/_templates');
    if (fs.existsSync(templatesPath)) {
      console.log(`⚠️  ${config.targetPath} が見つかりません。テンプレートを使用します。`);
      config.targetPath = templatesPath;
    }
  }

  const files = getJsonFiles(config.targetPath);
  console.log(`📁 ${files.length}件のファイルを検出\n`);

  if (files.length === 0) {
    console.log('ファイルが見つかりません。');
    return;
  }

  // ブラウザベースのコマンド
  const browserCommands = ['analyze', 'review', 'all', 'report'];

  if (browserCommands.includes(config.command)) {
    const browser = new EnhancedBrowserManager(config);
    const engine = new AnalysisEngine(config);
    const reporter = new ReportGenerator();

    try {
      await browser.launch();

      if (config.command === 'review') {
        await interactiveReview(browser, engine, files, config);
      } else {
        const results = await runAnalysis(browser, engine, files, config);

        // レポート生成
        const report = reporter.generateReport(results);
        console.log('\n' + '='.repeat(60));
        console.log(report);

        if (config.command === 'report' || config.command === 'all') {
          reporter.saveReport(report, `analysis-${getTimestamp()}.md`);
        }
      }
    } finally {
      await browser.close();
    }
  }

  // 基本検証（ブラウザ不要）
  if (config.command === 'validate') {
    console.log('基本検証を実行中...');
    // 既存の検証ロジックを実行
    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf-8');
        const artifact: Artifact = JSON.parse(content);

        const issues: string[] = [];

        if (!artifact.schema_version) {
          issues.push('schema_version がありません');
        }

        if (artifact.blocks) {
          artifact.blocks.forEach(block => {
            if (block.type === 'Table') {
              const rows = block.props.rows as Array<{ label: string; value: string }> | undefined;
              if (rows) {
                const emptyRows = rows.filter(r => !r.value?.trim());
                if (emptyRows.length > 0) {
                  issues.push(`Tableに空のvalueが${emptyRows.length}件あります`);
                }
              }
            }
          });
        }

        const relativePath = path.basename(file);
        if (issues.length > 0) {
          console.log(`⚠️  ${relativePath}: ${issues.join(', ')}`);
        } else if (config.verbose) {
          console.log(`✅ ${relativePath}`);
        }
      } catch (error) {
        console.log(`❌ ${path.basename(file)}: ${(error as Error).message}`);
      }
    }
  }

  // 自動修正（improve）
  if (config.command === 'improve') {
    console.log('🔧 自動修正を実行中...\n');
    let totalFixed = 0;
    let totalFiles = 0;

    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf-8');
        const artifact: Artifact = JSON.parse(content);
        const relativePath = path.basename(file);
        const fixes: string[] = [];
        let modified = false;

        // 修正1: 空のTableのvalue → labelだけのDescriptionListに変換、または削除
        if (artifact.blocks) {
          const newBlocks: Block[] = [];

          for (let i = 0; i < artifact.blocks.length; i++) {
            const block = artifact.blocks[i];

            if (block.type === 'Table') {
              const rows = block.props.rows as Array<{ label: string; value: string }> | undefined;
              if (rows) {
                // 空のvalueを持つ行をフィルタリング
                const emptyRows = rows.filter(r => !r.value?.trim());
                const validRows = rows.filter(r => r.value?.trim());

                if (emptyRows.length > 0) {
                  if (validRows.length === 0) {
                    // 全て空の場合、Tableを箇条書きリストに変換
                    const listContent = emptyRows.map(r => r.label).filter(Boolean);
                    if (listContent.length > 0) {
                      const richTextBlock: Block = {
                        id: block.id,
                        type: 'Section',
                        props: {
                          heading: block.props.heading || '',
                          content: [{
                            type: 'list',
                            ordered: false,
                            items: listContent.map(text => [{
                              type: 'paragraph',
                              runs: [{ text }]
                            }])
                          }]
                        }
                      };
                      newBlocks.push(richTextBlock);
                      fixes.push(`Table→箇条書きリストに変換（${emptyRows.length}項目）`);
                      modified = true;
                      continue;
                    }
                  } else {
                    // 一部空の場合、空の行を削除
                    block.props.rows = validRows;
                    fixes.push(`Tableから空の行を${emptyRows.length}件削除`);
                    modified = true;
                  }
                }
              }
            }

            // 修正2: 長すぎる文を分割（Sectionのcontentで80文字超を検出）
            if (block.type === 'Section') {
              const content = block.props.content as RichTextNode[] | undefined;
              if (content) {
                for (const node of content) {
                  if (node.type === 'paragraph' && node.runs) {
                    // 文を分割して読みやすくする処理
                    const newRuns: RichTextRun[] = [];
                    for (const run of node.runs) {
                      if (run.text && run.text.length > 80) {
                        // 句点で分割
                        const sentences = run.text.split(/([。！？])/);
                        let currentSentence = '';
                        for (let j = 0; j < sentences.length; j++) {
                          currentSentence += sentences[j];
                          if (/[。！？]/.test(sentences[j]) || j === sentences.length - 1) {
                            if (currentSentence.trim()) {
                              newRuns.push({ ...run, text: currentSentence });
                            }
                            currentSentence = '';
                          }
                        }
                        if (newRuns.length > 1) {
                          node.runs = newRuns;
                          fixes.push(`長文を${newRuns.length}つの文に分割`);
                          modified = true;
                        }
                      }
                    }
                  }
                }
              }
            }

            newBlocks.push(block);
          }

          artifact.blocks = newBlocks;
        }

        // 修正3: schema_version がない場合追加
        if (!artifact.schema_version) {
          artifact.schema_version = '2.0';
          fixes.push('schema_version を追加');
          modified = true;
        }

        // 修正4: 申請系ページのみに必須セクションを追加
        // 情報提供のみのページ（index、カテゴリページ、一覧ページ等）には追加しない
        const isApplicationPage = (() => {
          const fileName = path.basename(file);
          const filePath = file;

          // 情報提供ページのパターン（追加しない）
          const infoOnlyPatterns = [
            /index\.json$/,                    // トップページ
            /\/topics\/[^/]+\.json$/,          // カテゴリインデックス（topics/benefits.json等）
            /hazard-map\.json$/,               // ハザードマップ
            /hinanjo\.json$/,                  // 避難所一覧
            /nursery\.json$/,                  // 保育園一覧（申請は nursery-apply）
            /gomi\.json$/,                     // ごみ分別情報
            /traffic-safety\.json$/,           // 交通安全情報
            /hello-work\.json$/,               // ハローワーク情報
            /silver-center\.json$/,            // シルバー人材センター情報
            /bosai-mail\.json$/,               // 防災メール情報
            /moving-checklist\.json$/,         // 引越しチェックリスト
            /kaden-recycle\.json$/,            // 家電リサイクル情報
            /sodaigomi\.json$/,                // 粗大ごみ情報
            /information-disclosure\.json$/,   // 情報公開制度
            /privacy\.json$/,                  // 個人情報保護
          ];

          // 情報提供のみのファイル名パターン
          if (infoOnlyPatterns.some(pattern => pattern.test(filePath))) {
            return false;
          }

          // サービスカテゴリのインデックスページ（servicesディレクトリ直下のJSON）
          if (/\/services\/[^/]+\.json$/.test(filePath) && !filePath.includes('/services/') ) {
            return false;
          }

          // コンテンツから判定：申請・届出・手続きに関する記述があるか
          const contentText = JSON.stringify(artifact.blocks || []);
          const hasApplicationContent =
            /申請|届出|届け出|手続き|申込|申し込み|登録|届/.test(contentText) &&
            !/一覧|案内|情報|概要のみ/.test(artifact.title || '');

          return hasApplicationContent;
        })();

        if (artifact.blocks && isApplicationPage) {
          const existingHeadings = artifact.blocks
            .filter(b => b.type === 'Section')
            .map(b => (b.props.heading as string) || '');

          // ページタイトルから手続き名を抽出
          const extractProcedureName = (title: string): string => {
            // タイトルから手続き名を抽出するパターン
            // 例: "出生届" → "出生届", "児童手当の申請" → "児童手当", "転入届・転出届" → "転入届・転出届"
            const patterns = [
              /^(.+?の)?(申請|届出|届け出|届|登録|手続き?|受給|請求|給付|取得|発行)$/,  // 「○○の申請」→「○○」
              /^(.+?)(申請|届出|届け出|届|登録|手続き?|受給|請求|給付|取得|発行)$/,     // 「○○申請」→「○○」
              /^(.+?)(?:について|に関して|のご案内)$/,  // 「○○について」→「○○」
            ];

            for (const pattern of patterns) {
              const match = title.match(pattern);
              if (match) {
                // 「の」で終わる場合は「の」を削除
                let procedureName = match[1].replace(/の$/, '');
                // 手続き名が短すぎる場合はタイトル全体を使用
                if (procedureName.length >= 2) {
                  // 「○○届」「○○申請」などの形式に統一
                  const suffix = match[2] || '';
                  if (suffix && !procedureName.endsWith(suffix)) {
                    return procedureName + suffix;
                  }
                  return procedureName;
                }
              }
            }

            // パターンにマッチしない場合はタイトルをそのまま使用
            return title;
          };

          const procedureName = extractProcedureName(artifact.title || '');

          // 完全性を高めるための必須セクション定義（keywords: 任意のキーワードがマッチすればOK）
          // headingTemplate: {procedure}がプロシージャ名に置換される
          const requiredSections: { keywords: string[]; headingTemplate: string; defaultContent: RichTextNode[] }[] = [
            {
              keywords: ['対象'],
              headingTemplate: '{procedure}の対象となる方',
              defaultContent: [{
                type: 'paragraph',
                runs: [{ text: '詳細は担当課にお問い合わせください。' }]
              }]
            },
            {
              keywords: ['必要', '持ち物', '書類'],
              headingTemplate: '{procedure}に必要なもの',
              defaultContent: [{
                type: 'list',
                ordered: false,
                items: [
                  [{ type: 'paragraph', runs: [{ text: '本人確認書類（マイナンバーカード、運転免許証など）' }] }],
                  [{ type: 'paragraph', runs: [{ text: '印鑑（認印可）' }] }]
                ]
              }]
            },
            {
              keywords: ['方法', '手順', '流れ', 'ステップ'],
              headingTemplate: '{procedure}の手続き方法',
              defaultContent: [{
                type: 'list',
                ordered: true,
                items: [
                  [{ type: 'paragraph', runs: [{ text: '必要書類を準備します。' }] }],
                  [{ type: 'paragraph', runs: [{ text: '窓口で申請書を記入します。' }] }],
                  [{ type: 'paragraph', runs: [{ text: '書類を提出し、確認を受けます。' }] }]
                ]
              }]
            }
          ];

          // 不足セクションを特定して追加
          for (const required of requiredSections) {
            const hasSection = existingHeadings.some(h =>
              required.keywords.some(keyword => h.includes(keyword))
            );
            if (!hasSection) {
              // Contactブロックの前、またはSourcesブロックの前に挿入
              const contactIndex = artifact.blocks.findIndex(b => b.type === 'Contact');
              const sourcesIndex = artifact.blocks.findIndex(b => b.type === 'Sources');
              const insertIndex = contactIndex >= 0 ? contactIndex : (sourcesIndex >= 0 ? sourcesIndex : artifact.blocks.length);

              // 見出しにプロシージャ名を含める
              const heading = required.headingTemplate.replace('{procedure}', procedureName);

              const newSection: Block = {
                id: `section-${required.keywords[0]}-${Date.now()}`,
                type: 'Section',
                props: {
                  heading: heading,
                  content: required.defaultContent
                }
              };

              artifact.blocks.splice(insertIndex, 0, newSection);
              fixes.push(`「${heading}」セクションを追加`);
              modified = true;
            }
          }
          // 既存のデフォルト見出しをコンテキスト付きに更新
          const headingMappings: { [key: string]: string } = {
            '対象となる方': `${procedureName}の対象となる方`,
            '必要なもの': `${procedureName}に必要なもの`,
            '手続き方法': `${procedureName}の手続き方法`,
            '申請の流れ': `${procedureName}の申請の流れ`,
          };

          for (const block of artifact.blocks) {
            if (block.type === 'Section') {
              const currentHeading = (block.props.heading as string) || '';
              // デフォルトの見出しがあり、まだプロシージャ名が含まれていない場合
              if (headingMappings[currentHeading] && !currentHeading.includes(procedureName)) {
                const newHeading = headingMappings[currentHeading];
                fixes.push(`見出しを更新: 「${currentHeading}」→「${newHeading}」`);
                block.props.heading = newHeading;
                modified = true;
              }
            }
          }
        }

        // 修正4b: 情報提供ページから不要な自動追加セクションを削除
        const autoAddedSectionHeadings = ['対象となる方', '必要なもの', '手続き方法', '申請の流れ', '用語の説明'];
        if (artifact.blocks && !isApplicationPage) {
          const originalLength = artifact.blocks.length;
          artifact.blocks = artifact.blocks.filter(block => {
            if (block.type !== 'Section') return true;
            const heading = (block.props.heading as string) || '';
            // 自動追加されたデフォルトセクションで、内容がデフォルトのままの場合のみ削除
            if (autoAddedSectionHeadings.includes(heading)) {
              const content = JSON.stringify(block.props.content || []);
              const isDefaultContent =
                content.includes('詳細は担当課にお問い合わせください') ||
                content.includes('本人確認書類（マイナンバーカード、運転免許証など）') ||
                content.includes('必要書類を準備します') ||
                content.includes('窓口にて申請手続きを行ってください') ||
                content.includes('{{shimin_department}}') ||  // 変数のまま残っている
                (heading === '用語の説明');  // 情報提供ページには用語説明も不要
              if (isDefaultContent) {
                fixes.push(`不要なセクション「${heading}」を削除（情報提供ページ）`);
                return false;
              }
            }
            return true;
          });
          if (artifact.blocks.length !== originalLength) {
            modified = true;
          }
        }

        // 重複セクションを削除
        if (artifact.blocks) {
          const seenHeadings = new Set<string>();
          artifact.blocks = artifact.blocks.filter(block => {
            if (block.type !== 'Section') return true;
            const heading = (block.props.heading as string) || '';
            if (seenHeadings.has(heading)) {
              fixes.push(`重複セクション「${heading}」を削除`);
              modified = true;
              return false;
            }
            seenHeadings.add(heading);
            return true;
          });
        }

        // 修正5: 行政用語に説明を追加（申請系ページのみ、専門性の高い用語のみ）
        if (artifact.blocks && config.autoFix && isApplicationPage) {
          const allText = JSON.stringify(artifact.blocks);
          const usedTerms: string[] = [];

          for (const [term, def] of Object.entries(COMPLEX_TERMS)) {
            // highレベルの用語のみを対象とする
            if (!isTermRequiringExplanation(term)) continue;

            if (allText.includes(term)) {
              // その用語の説明が既にあるか確認
              const hasExplanation = allText.includes(`${term}とは`) ||
                                    allText.includes(`${term}：`) ||
                                    allText.includes(def.explanation.slice(0, 20));
              if (!hasExplanation) {
                usedTerms.push(term);
              }
            }
          }

          // 未説明の専門用語が2つ以上ある場合のみ、用語説明セクションを追加
          if (usedTerms.length >= 2) {
            const termsContent: RichTextNode[] = usedTerms.slice(0, 5).map(term => ({
              type: 'paragraph',
              runs: [
                { text: `${term}`, bold: true },
                { text: `：${getTermExplanation(term)}` }
              ]
            }));

            // Sourcesブロックの前に挿入
            const sourcesIndex = artifact.blocks.findIndex(b => b.type === 'Sources');
            const insertIndex = sourcesIndex >= 0 ? sourcesIndex : artifact.blocks.length;

            const termsBlock: Block = {
              id: `terms-${Date.now()}`,
              type: 'Section',
              props: {
                heading: '用語の説明',
                content: termsContent
              }
            };

            artifact.blocks.splice(insertIndex, 0, termsBlock);
            fixes.push(`用語説明セクションを追加（${usedTerms.slice(0, 5).join('、')}）`);
            modified = true;
          }
        }

        // ファイルを保存
        if (modified && config.autoFix) {
          fs.writeFileSync(file, JSON.stringify(artifact, null, 2) + '\n');
          totalFixed++;
          console.log(`✅ ${relativePath}`);
          fixes.forEach(fix => console.log(`   └─ ${fix}`));
        } else if (fixes.length > 0 && !config.autoFix) {
          console.log(`📋 ${relativePath} (ドライラン)`);
          fixes.forEach(fix => console.log(`   └─ ${fix}`));
        }

        totalFiles++;
      } catch (error) {
        console.log(`❌ ${path.basename(file)}: ${(error as Error).message}`);
      }
    }

    console.log(`\n📊 修正完了: ${totalFixed}/${totalFiles} ファイル`);
  }

  // Watchモード: 継続的に分析と改善を実行
  if (config.command === 'watch') {
    const interval = config.watchInterval || 60000;
    console.log(`\n👁️ Watchモード開始（間隔: ${interval / 1000}秒）`);
    console.log('Ctrl+C で停止\n');

    const runCycle = async () => {
      const timestamp = new Date().toISOString();
      console.log(`\n[${timestamp}] サイクル開始...`);

      const browser = new EnhancedBrowserManager(config);
      const engine = new AnalysisEngine(config);
      const reporter = new ReportGenerator();

      try {
        await browser.launch();
        const results = await runAnalysis(browser, engine, files, config);

        // スコア計算
        const avgCompleteness = Math.round(
          results.reduce((sum, r) => sum + r.score.completeness, 0) / results.length
        );
        const criticalCount = results.flatMap(r => r.issues).filter(i => i.type === 'critical').length;
        const warningCount = results.flatMap(r => r.issues).filter(i => i.type === 'warning').length;

        console.log(`\n📊 スコア: 完全性 ${avgCompleteness}/100 | 重大: ${criticalCount}件 | 警告: ${warningCount}件`);

        // 改善が必要な場合、自動修正を実行
        if (config.autoFix && (criticalCount > 0 || avgCompleteness < 90)) {
          console.log('🔧 自動修正を実行中...');

          for (const file of files) {
            try {
              const content = fs.readFileSync(file, 'utf-8');
              const artifact: Artifact = JSON.parse(content);
              let modified = false;

              // 基本的な修正ロジック（improve と同じ）
              if (!artifact.schema_version) {
                artifact.schema_version = '2.0';
                modified = true;
              }

              if (modified) {
                fs.writeFileSync(file, JSON.stringify(artifact, null, 2) + '\n');
              }
            } catch (_e) {
              // Skip errors silently in watch mode
            }
          }
        }

        // レポート保存
        const report = reporter.generateReport(results);
        reporter.saveReport(report, `watch-${getTimestamp()}.md`);

      } finally {
        await browser.close();
      }

      console.log(`[${new Date().toISOString()}] サイクル完了。次回: ${interval / 1000}秒後`);
    };

    // 初回実行
    await runCycle();

    // 定期実行
    setInterval(runCycle, interval);

    // プロセスを維持
    await new Promise(() => {});
  }

  // 変数のプレースホルダーをLLMで埋める
  if (config.command === 'populate') {
    await populateVariables(config);
  }
}

// ============================================================================
// Populate Variables with LLM
// ============================================================================

interface VariableValue {
  value: string;
  source: string;
  sourceUrl?: string;
  confidence: number;
  updatedAt: string;
}

interface VariableFile {
  [key: string]: VariableValue;
}

async function populateVariables(config: BotConfig): Promise<void> {
  console.log('\n📝 プレースホルダー変数をLLMで埋めます...\n');

  const variablesDir = path.join(__dirname, `../data/artifacts/${config.municipality}/variables`);

  if (!fs.existsSync(variablesDir)) {
    console.log(`❌ 変数ディレクトリが見つかりません: ${variablesDir}`);
    return;
  }

  // 変数ファイルを読み込む
  const variableFiles = fs.readdirSync(variablesDir)
    .filter(f => f.endsWith('.json'))
    .map(f => path.join(variablesDir, f));

  // プレースホルダー変数を収集
  const placeholderVars: { file: string; key: string; value: VariableValue }[] = [];

  for (const file of variableFiles) {
    const content = JSON.parse(fs.readFileSync(file, 'utf-8')) as VariableFile;

    for (const [key, value] of Object.entries(content)) {
      // プレースホルダーを検出（source: templateまたはconfidence: 0）
      if (value.source === 'template' || value.confidence === 0 ||
          value.value.includes('【') || value.value.includes('入力してください')) {
        placeholderVars.push({ file, key, value });
      }
    }
  }

  console.log(`📊 ${placeholderVars.length}件のプレースホルダー変数を検出\n`);

  if (placeholderVars.length === 0) {
    console.log('✅ プレースホルダー変数はありません');
    return;
  }

  // Anthropic API クライアント初期化
  const anthropic = new Anthropic();

  // 変数をカテゴリごとにグループ化
  const varsByFile = new Map<string, typeof placeholderVars>();
  for (const v of placeholderVars) {
    const existing = varsByFile.get(v.file) || [];
    existing.push(v);
    varsByFile.set(v.file, existing);
  }

  let totalPopulated = 0;

  for (const [file, vars] of varsByFile) {
    const fileName = path.basename(file, '.json');
    console.log(`\n📁 ${fileName}.json (${vars.length}件)`);

    // ファイルの内容を読み込む
    const fileContent = JSON.parse(fs.readFileSync(file, 'utf-8')) as VariableFile;

    // 自治体情報を取得
    const coreFile = path.join(variablesDir, 'core.json');
    const coreContent = fs.existsSync(coreFile)
      ? JSON.parse(fs.readFileSync(coreFile, 'utf-8'))
      : {};
    const municipalityName = coreContent.municipality_name?.value || '高岡市';

    // バッチ処理（最大10件ずつ）
    const batchSize = 10;
    for (let i = 0; i < vars.length; i += batchSize) {
      const batch = vars.slice(i, i + batchSize);

      // プロンプト生成
      const variableDescriptions = batch.map(v => {
        // 変数名から手続き名とセクション種別を推測
        const parts = v.key.split('_');
        const sectionType = parts.pop() || '';
        const serviceName = parts.join('_');

        const sectionTypeMap: Record<string, string> = {
          taisho: '対象となる方',
          hitsuyou: '必要なもの',
          houhou: '手続き方法',
          nagare: '申請の流れ',
        };

        const sectionLabel = sectionTypeMap[sectionType] || sectionType;

        return `- ${v.key}: ${serviceName}の「${sectionLabel}」セクションの内容`;
      }).join('\n');

      const prompt = `あなたは${municipalityName}の行政サービス情報の専門家です。

以下の変数のプレースホルダー値を、一般的な行政サービスの情報に基づいて埋めてください。
具体的で実用的な情報を提供してください。

変数リスト:
${variableDescriptions}

注意事項:
- 一般的な行政サービスの流れや必要書類に基づいて回答してください
- 具体的な電話番号や住所は含めないでください（それらは別の変数で管理されています）
- 簡潔で分かりやすい日本語で記述してください
- 各変数の値は50-150文字程度を目安にしてください

以下のJSON形式で回答してください:
{
  "変数名": "値",
  ...
}`;

      try {
        const response = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          messages: [{ role: 'user', content: prompt }],
        });

        // レスポンスからJSONを抽出
        const responseText = response.content
          .filter((block): block is Anthropic.TextBlock => block.type === 'text')
          .map(block => block.text)
          .join('');

        // JSONを抽出（```json...```形式の場合も対応）
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const values = JSON.parse(jsonMatch[0]) as Record<string, string>;

          for (const v of batch) {
            if (values[v.key]) {
              fileContent[v.key] = {
                value: values[v.key],
                source: 'llm',
                confidence: 0.8,
                updatedAt: new Date().toISOString(),
              };
              totalPopulated++;
              console.log(`  ✅ ${v.key}`);
            }
          }
        }
      } catch (error) {
        console.log(`  ❌ APIエラー: ${(error as Error).message}`);
      }

      // レート制限対策
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // ファイルを保存
    fs.writeFileSync(file, JSON.stringify(fileContent, null, 2) + '\n');
  }

  console.log(`\n📊 完了: ${totalPopulated}/${placeholderVars.length} 変数を更新`);
}

main().catch((error) => {
  console.error('ボットがエラーで終了しました:', error);
  process.exit(1);
});
