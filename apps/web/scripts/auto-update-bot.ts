#!/usr/bin/env npx tsx
/**
 * INNOMA 自動アップデートボット（Playwright UI対応版）
 *
 * プロジェクトルール（CLAUDE.md）に従い、以下を自動で実行:
 * 1. サービスページJSONの検証・最適化
 * 2. 変数定義の検証・更新
 * 3. コンポーネント構成の最適化
 * 4. localhost上のUIを確認しながら調整
 * 5. docs/updates/ への変更履歴記録
 *
 * Usage:
 *   cd apps/web && npx tsx scripts/auto-update-bot.ts [command] [options]
 *
 * Commands:
 *   all          全ての処理を実行（デフォルト）
 *   validate     検証のみ（変更なし）
 *   optimize     コンポーネント最適化
 *   fix          自動修正可能な問題を修正
 *   inspect      UIを開いてインタラクティブに確認
 *   screenshot   全ページのスクリーンショットを取得
 *   review       UIを見ながらレビュー（対話モード）
 *
 * Options:
 *   --target <path>   対象パス（デフォルト: data/artifacts）
 *   --municipality <id> 対象自治体（例: takaoka, sample）
 *   --port <number>   開発サーバーのポート（デフォルト: 3000）
 *   --headed          ブラウザを表示（デフォルト: headless）
 *   --dry-run         変更せずにレポートのみ
 *   --verbose         詳細出力
 *   --no-docs         docs/updates への記録をスキップ
 *   --help            ヘルプ表示
 *
 * Examples:
 *   npx tsx scripts/auto-update-bot.ts
 *   npx tsx scripts/auto-update-bot.ts inspect --headed --municipality takaoka
 *   npx tsx scripts/auto-update-bot.ts screenshot --municipality sample
 *   npx tsx scripts/auto-update-bot.ts review --headed
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { chromium, Browser, Page, BrowserContext } from 'playwright';

// ============================================================================
// Types
// ============================================================================

interface BotConfig {
  command: 'all' | 'validate' | 'optimize' | 'fix' | 'report' | 'inspect' | 'screenshot' | 'review';
  targetPath: string;
  municipality: string;
  port: number;
  headed: boolean;
  dryRun: boolean;
  verbose: boolean;
  skipDocs: boolean;
}

interface ValidationIssue {
  file: string;
  type: 'error' | 'warning' | 'info';
  rule: string;
  message: string;
  autoFixable: boolean;
  fix?: () => void;
}

interface OptimizationResult {
  file: string;
  changes: string[];
  modified: boolean;
}

interface BotReport {
  timestamp: string;
  config: BotConfig;
  summary: {
    filesProcessed: number;
    issuesFound: number;
    issuesFixed: number;
    optimizationsApplied: number;
    screenshotsTaken: number;
  };
  issues: ValidationIssue[];
  optimizations: OptimizationResult[];
  screenshots: string[];
}

interface RichTextNode {
  type: string;
  text?: string;
  runs?: Array<{ text: string; bold?: boolean; link?: { href: string } }>;
  content?: RichTextNode[];
  items?: RichTextNode[][];
  ordered?: boolean;
}

interface Block {
  id: string;
  type: string;
  props: Record<string, unknown>;
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

interface UIElement {
  selector: string;
  type: string;
  text: string;
  visible: boolean;
  boundingBox?: { x: number; y: number; width: number; height: number };
}

// ============================================================================
// Constants
// ============================================================================

const SECTION_ORDER = [
  'Summary',
  'NotificationBanner',
  '対象となる方',
  '対象者',
  '必要なもの',
  '必要書類',
  '持ち物',
  '手続きの流れ',
  '申請方法',
  '費用',
  '手数料',
  '届出先',
  '受付時間',
  'ご注意ください',
  '注意事項',
  'よくある質問',
  'FAQ',
  'Contact',
  '問い合わせ',
  'RelatedLinks',
  '関連情報',
  'Sources',
  '出典',
];

const PROCEDURE_KEYWORDS = ['手順', '流れ', 'ステップ', '手続き', '方法', '申請'];

// ============================================================================
// Utilities
// ============================================================================

function getTimestamp(): string {
  return new Date().toISOString().slice(0, 10);
}

function getJsonFiles(dir: string): string[] {
  const files: string[] = [];

  if (!fs.existsSync(dir)) {
    return files;
  }

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

function extractTextFromRichText(node: RichTextNode): string {
  if (node.type === 'paragraph' && node.runs) {
    return node.runs.map(r => r.text || '').join('');
  }
  if (node.content) {
    return node.content.map(extractTextFromRichText).join(' ');
  }
  return node.text || '';
}

function extractTextFromListItem(item: RichTextNode[]): string {
  return item.map(extractTextFromRichText).join('');
}

function artifactPathToUrl(artifactPath: string, municipality: string): string {
  // Convert file path to URL path
  // e.g., data/artifacts/takaoka/services/registration/juminhyo.json
  //    -> /takaoka/services/registration/juminhyo
  const match = artifactPath.match(/data\/artifacts\/([^/]+)\/(.+)\.json$/);
  if (match) {
    return `/${match[1]}/${match[2]}`;
  }
  return `/`;
}

async function askQuestion(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// ============================================================================
// Playwright Browser Manager
// ============================================================================

class BrowserManager {
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
    });
    this.page = await this.context.newPage();
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
    }
  }

  getPage(): Page {
    if (!this.page) throw new Error('Browser not launched');
    return this.page;
  }

  async navigateTo(urlPath: string): Promise<void> {
    const page = this.getPage();
    const fullUrl = `http://localhost:${this.config.port}${urlPath}`;
    console.log(`🌐 Navigating to: ${fullUrl}`);
    await page.goto(fullUrl, { waitUntil: 'networkidle' });
  }

  async screenshot(name: string, fullPage: boolean = true): Promise<string> {
    const page = this.getPage();
    const dir = path.join(__dirname, '../screenshots');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const filename = `${name}-${Date.now()}.png`;
    const filepath = path.join(dir, filename);
    await page.screenshot({ path: filepath, fullPage });
    console.log(`📸 Screenshot saved: screenshots/${filename}`);
    return filepath;
  }

  async getPageElements(): Promise<UIElement[]> {
    const page = this.getPage();

    return await page.evaluate(() => {
      const elements: UIElement[] = [];

      // Find all DADS components and sections
      const selectors = [
        '[data-block-type]',
        'section',
        '.notification-banner',
        'table',
        'nav[aria-label]',
        '.accordion',
        '.step-navigation',
      ];

      for (const selector of selectors) {
        document.querySelectorAll(selector).forEach((el, index) => {
          const rect = el.getBoundingClientRect();
          elements.push({
            selector: `${selector}:nth-of-type(${index + 1})`,
            type: el.getAttribute('data-block-type') || el.tagName.toLowerCase(),
            text: el.textContent?.slice(0, 100) || '',
            visible: rect.height > 0 && rect.width > 0,
            boundingBox: {
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height,
            },
          });
        });
      }

      return elements;
    });
  }

  async highlightElement(selector: string): Promise<void> {
    const page = this.getPage();
    await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (el) {
        (el as HTMLElement).style.outline = '3px solid red';
        (el as HTMLElement).style.outlineOffset = '2px';
      }
    }, selector);
  }

  async scrollToElement(selector: string): Promise<void> {
    const page = this.getPage();
    await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, selector);
  }

  async checkForMissingVariables(): Promise<string[]> {
    const page = this.getPage();
    return await page.evaluate(() => {
      const missing: string[] = [];
      const content = document.body.innerHTML;
      const matches = content.match(/\{\{[^}]+\}\}/g) || [];
      return matches;
    });
  }

  async checkForEmptyElements(): Promise<UIElement[]> {
    const page = this.getPage();
    return await page.evaluate(() => {
      const emptyElements: UIElement[] = [];

      // Check for empty table cells
      document.querySelectorAll('td').forEach((td, index) => {
        if (!td.textContent?.trim()) {
          const rect = td.getBoundingClientRect();
          emptyElements.push({
            selector: `td:nth-of-type(${index + 1})`,
            type: 'empty-table-cell',
            text: '',
            visible: true,
            boundingBox: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
          });
        }
      });

      // Check for empty sections
      document.querySelectorAll('section').forEach((section, index) => {
        const hasContent = section.querySelector('p, ul, ol, table, .step-navigation');
        if (!hasContent) {
          const rect = section.getBoundingClientRect();
          emptyElements.push({
            selector: `section:nth-of-type(${index + 1})`,
            type: 'empty-section',
            text: section.querySelector('h2, h3')?.textContent || '',
            visible: true,
            boundingBox: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
          });
        }
      });

      return emptyElements;
    });
  }

  async getPageStructure(): Promise<{ title: string; sections: string[] }> {
    const page = this.getPage();
    return await page.evaluate(() => {
      const title = document.querySelector('h1')?.textContent || '';
      const sections: string[] = [];
      document.querySelectorAll('h2, h3').forEach((h) => {
        sections.push(h.textContent || '');
      });
      return { title, sections };
    });
  }
}

// ============================================================================
// Validation Rules
// ============================================================================

function validateSchemaVersion(artifact: Artifact, filePath: string): ValidationIssue | null {
  if (!artifact.schema_version) {
    return {
      file: filePath,
      type: 'error',
      rule: 'schema_version',
      message: 'Missing schema_version field',
      autoFixable: true,
      fix: () => {
        artifact.schema_version = '2.0';
      }
    };
  }
  return null;
}

function validateTableValues(blocks: Block[], filePath: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const block of blocks) {
    if (block.type === 'Table') {
      const rows = block.props.rows as Array<{ label: string; value: string }> | undefined;
      if (rows) {
        const emptyValueRows = rows.filter(r => !r.value || r.value.trim() === '');
        if (emptyValueRows.length > 0) {
          issues.push({
            file: filePath,
            type: 'warning',
            rule: 'table_empty_value',
            message: `Table block "${block.id}" has ${emptyValueRows.length} row(s) with empty values`,
            autoFixable: false,
          });
        }
      }
    }
  }

  return issues;
}

function validateStepNavigation(blocks: Block[], filePath: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const block of blocks) {
    if (block.type === 'Section') {
      const heading = block.props.heading as string || '';
      const content = block.props.content as RichTextNode[] | undefined;

      if (!content) continue;

      const isProcedureSection = PROCEDURE_KEYWORDS.some(kw => heading.includes(kw));
      if (!isProcedureSection) continue;

      for (const node of content) {
        if (node.type === 'list' && node.ordered && node.items && node.items.length >= 3) {
          issues.push({
            file: filePath,
            type: 'info',
            rule: 'step_navigation_candidate',
            message: `"${heading}" has ${node.items.length} steps - consider StepNavigation`,
            autoFixable: false,
          });
        }
      }
    }
  }

  return issues;
}

function validateSectionOrder(blocks: Block[], filePath: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  const actualOrder: string[] = [];
  for (const block of blocks) {
    if (block.type === 'Section') {
      const heading = block.props.heading as string;
      if (heading) actualOrder.push(heading);
    } else if (['Summary', 'NotificationBanner', 'Contact', 'RelatedLinks', 'Sources'].includes(block.type)) {
      actualOrder.push(block.type);
    }
  }

  let lastIndex = -1;
  for (const item of actualOrder) {
    const expectedIndex = SECTION_ORDER.findIndex(s =>
      item.includes(s) || s.includes(item)
    );
    if (expectedIndex !== -1 && expectedIndex < lastIndex) {
      issues.push({
        file: filePath,
        type: 'info',
        rule: 'section_order',
        message: `Section "${item}" may be out of order`,
        autoFixable: false,
      });
    }
    if (expectedIndex !== -1) {
      lastIndex = expectedIndex;
    }
  }

  return issues;
}

function validateVariables(artifact: Artifact, filePath: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const content = JSON.stringify(artifact);
  const variablePattern = /\{\{([^}]+)\}\}/g;
  let match;

  while ((match = variablePattern.exec(content)) !== null) {
    const varName = match[1].trim();
    if (artifact.variables && !artifact.variables[varName]) {
      issues.push({
        file: filePath,
        type: 'warning',
        rule: 'undefined_variable',
        message: `Variable "{{${varName}}}" used but not defined`,
        autoFixable: false,
      });
    }
  }

  return issues;
}

// ============================================================================
// Optimization Functions
// ============================================================================

function optimizeEmptySections(blocks: Block[]): { blocks: Block[]; changes: string[] } {
  const result: Block[] = [];
  const changes: string[] = [];
  let i = 0;

  while (i < blocks.length) {
    const block = blocks[i];

    if (block.type === 'Section') {
      const content = block.props.content as RichTextNode[] | undefined;
      const isEmptySection = !content || (Array.isArray(content) && content.length === 0);

      if (isEmptySection) {
        const nextBlock = blocks[i + 1];
        if (nextBlock && ['Table', 'StepNavigation', 'Accordion', 'DescriptionList'].includes(nextBlock.type)) {
          const heading = block.props.heading as string;
          if (heading && !nextBlock.props.heading) {
            nextBlock.props.heading = heading;
          }
          changes.push(`Merged empty Section "${heading}" with ${nextBlock.type}`);
          i++;
          continue;
        }
      }
    }

    result.push(block);
    i++;
  }

  return { blocks: result, changes };
}

// ============================================================================
// Main Processing Functions
// ============================================================================

function validateArtifact(filePath: string, config: BotConfig): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const artifact: Artifact = JSON.parse(content);

    const schemaIssue = validateSchemaVersion(artifact, filePath);
    if (schemaIssue) issues.push(schemaIssue);

    if (artifact.blocks) {
      issues.push(...validateTableValues(artifact.blocks, filePath));
      issues.push(...validateStepNavigation(artifact.blocks, filePath));
      issues.push(...validateSectionOrder(artifact.blocks, filePath));
    }

    issues.push(...validateVariables(artifact, filePath));

  } catch (error) {
    issues.push({
      file: filePath,
      type: 'error',
      rule: 'parse_error',
      message: `Failed to parse JSON: ${(error as Error).message}`,
      autoFixable: false,
    });
  }

  return issues;
}

function optimizeArtifact(filePath: string, config: BotConfig): OptimizationResult {
  const result: OptimizationResult = {
    file: filePath,
    changes: [],
    modified: false,
  };

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const artifact: Artifact = JSON.parse(content);

    if (!artifact.blocks) return result;

    const emptyResult = optimizeEmptySections(artifact.blocks);
    artifact.blocks = emptyResult.blocks;
    result.changes.push(...emptyResult.changes);

    if (result.changes.length > 0) {
      result.modified = true;
      if (!config.dryRun) {
        fs.writeFileSync(filePath, JSON.stringify(artifact, null, 2) + '\n');
      }
    }

  } catch (error) {
    result.changes.push(`Error: ${(error as Error).message}`);
  }

  return result;
}

// ============================================================================
// UI Inspection Functions
// ============================================================================

async function inspectUI(browser: BrowserManager, files: string[], config: BotConfig): Promise<void> {
  console.log('\n🔍 Starting UI inspection...\n');

  for (const file of files) {
    const urlPath = artifactPathToUrl(file, config.municipality);
    console.log(`\n📄 File: ${path.basename(file)}`);
    console.log(`   URL: ${urlPath}`);

    try {
      await browser.navigateTo(urlPath);

      // Check for missing variables
      const missingVars = await browser.checkForMissingVariables();
      if (missingVars.length > 0) {
        console.log(`   ⚠️  Missing variables: ${missingVars.join(', ')}`);
      }

      // Check for empty elements
      const emptyElements = await browser.checkForEmptyElements();
      if (emptyElements.length > 0) {
        console.log(`   ⚠️  Empty elements found: ${emptyElements.length}`);
        for (const el of emptyElements) {
          console.log(`      - ${el.type}: ${el.text || '(no heading)'}`);
        }
      }

      // Get page structure
      const structure = await browser.getPageStructure();
      console.log(`   📑 Title: ${structure.title}`);
      console.log(`   📋 Sections: ${structure.sections.length}`);

    } catch (error) {
      console.log(`   ❌ Error: ${(error as Error).message}`);
    }
  }
}

async function takeScreenshots(browser: BrowserManager, files: string[], config: BotConfig): Promise<string[]> {
  const screenshots: string[] = [];
  console.log('\n📸 Taking screenshots...\n');

  for (const file of files) {
    const urlPath = artifactPathToUrl(file, config.municipality);
    const pageName = urlPath.replace(/\//g, '-').slice(1) || 'index';

    try {
      await browser.navigateTo(urlPath);
      const filepath = await browser.screenshot(pageName);
      screenshots.push(filepath);
    } catch (error) {
      console.log(`   ❌ Error screenshotting ${pageName}: ${(error as Error).message}`);
    }
  }

  return screenshots;
}

async function interactiveReview(browser: BrowserManager, files: string[], config: BotConfig): Promise<void> {
  console.log('\n🎮 Interactive Review Mode');
  console.log('Commands: next, prev, screenshot, elements, highlight <selector>, open <path>, quit\n');

  let currentIndex = 0;

  const showCurrentPage = async () => {
    const file = files[currentIndex];
    const urlPath = artifactPathToUrl(file, config.municipality);
    console.log(`\n[${currentIndex + 1}/${files.length}] ${path.basename(file)}`);
    await browser.navigateTo(urlPath);

    const structure = await browser.getPageStructure();
    console.log(`Title: ${structure.title}`);
    console.log(`Sections: ${structure.sections.join(' | ')}`);

    const missingVars = await browser.checkForMissingVariables();
    if (missingVars.length > 0) {
      console.log(`⚠️  Missing variables: ${missingVars.join(', ')}`);
    }
  };

  await showCurrentPage();

  while (true) {
    const input = await askQuestion('\n> ');
    const [cmd, ...args] = input.split(' ');

    switch (cmd.toLowerCase()) {
      case 'next':
      case 'n':
        if (currentIndex < files.length - 1) {
          currentIndex++;
          await showCurrentPage();
        } else {
          console.log('Already at last page');
        }
        break;

      case 'prev':
      case 'p':
        if (currentIndex > 0) {
          currentIndex--;
          await showCurrentPage();
        } else {
          console.log('Already at first page');
        }
        break;

      case 'screenshot':
      case 's':
        const urlPath = artifactPathToUrl(files[currentIndex], config.municipality);
        const pageName = urlPath.replace(/\//g, '-').slice(1) || 'index';
        await browser.screenshot(pageName);
        break;

      case 'elements':
      case 'e':
        const elements = await browser.getPageElements();
        console.log(`\nFound ${elements.length} elements:`);
        for (const el of elements.slice(0, 10)) {
          console.log(`  - ${el.type}: ${el.text.slice(0, 50)}...`);
        }
        if (elements.length > 10) {
          console.log(`  ... and ${elements.length - 10} more`);
        }
        break;

      case 'highlight':
      case 'h':
        if (args.length > 0) {
          await browser.highlightElement(args.join(' '));
          console.log('Element highlighted');
        } else {
          console.log('Usage: highlight <selector>');
        }
        break;

      case 'open':
      case 'o':
        if (args.length > 0) {
          await browser.navigateTo(args[0]);
        } else {
          console.log('Usage: open <path>');
        }
        break;

      case 'check':
      case 'c':
        const emptyElements = await browser.checkForEmptyElements();
        if (emptyElements.length > 0) {
          console.log(`\n⚠️  Found ${emptyElements.length} empty elements:`);
          for (const el of emptyElements) {
            console.log(`  - ${el.type}: ${el.text || '(no heading)'}`);
          }
        } else {
          console.log('✅ No empty elements found');
        }
        break;

      case 'quit':
      case 'q':
        console.log('Exiting review mode...');
        return;

      case 'help':
        console.log(`
Commands:
  next/n          - Go to next page
  prev/p          - Go to previous page
  screenshot/s    - Take screenshot
  elements/e      - List page elements
  highlight/h <s> - Highlight element by selector
  open/o <path>   - Navigate to path
  check/c         - Check for empty elements
  quit/q          - Exit review mode
  help            - Show this help
`);
        break;

      default:
        console.log('Unknown command. Type "help" for available commands.');
    }
  }
}

// ============================================================================
// Report Generation
// ============================================================================

function generateReport(report: BotReport): string {
  const lines: string[] = [];

  lines.push(`# INNOMA Auto-Update Bot Report`);
  lines.push(`\nGenerated: ${report.timestamp}`);
  lines.push(`\n## Summary\n`);
  lines.push(`- Files processed: ${report.summary.filesProcessed}`);
  lines.push(`- Issues found: ${report.summary.issuesFound}`);
  lines.push(`- Issues fixed: ${report.summary.issuesFixed}`);
  lines.push(`- Optimizations applied: ${report.summary.optimizationsApplied}`);
  if (report.summary.screenshotsTaken > 0) {
    lines.push(`- Screenshots taken: ${report.summary.screenshotsTaken}`);
  }

  if (report.issues.length > 0) {
    lines.push(`\n## Issues\n`);

    const byType = {
      error: report.issues.filter(i => i.type === 'error'),
      warning: report.issues.filter(i => i.type === 'warning'),
      info: report.issues.filter(i => i.type === 'info'),
    };

    if (byType.error.length > 0) {
      lines.push(`### Errors (${byType.error.length})\n`);
      for (const issue of byType.error) {
        lines.push(`- **${path.basename(issue.file)}**: ${issue.message}`);
      }
    }

    if (byType.warning.length > 0) {
      lines.push(`\n### Warnings (${byType.warning.length})\n`);
      for (const issue of byType.warning) {
        lines.push(`- **${path.basename(issue.file)}**: ${issue.message}`);
      }
    }

    if (byType.info.length > 0) {
      lines.push(`\n### Info (${byType.info.length})\n`);
      for (const issue of byType.info) {
        lines.push(`- **${path.basename(issue.file)}**: ${issue.message}`);
      }
    }
  }

  if (report.optimizations.filter(o => o.modified).length > 0) {
    lines.push(`\n## Optimizations Applied\n`);
    for (const opt of report.optimizations.filter(o => o.modified)) {
      lines.push(`### ${path.basename(opt.file)}\n`);
      for (const change of opt.changes) {
        lines.push(`- ${change}`);
      }
    }
  }

  return lines.join('\n');
}

function writeUpdateDoc(report: BotReport, config: BotConfig): void {
  if (config.skipDocs) return;

  const today = getTimestamp();
  const docsDir = path.join(__dirname, '../../docs/updates');
  const docPath = path.join(docsDir, `${today}.md`);

  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  let existingContent = '';
  if (fs.existsSync(docPath)) {
    existingContent = fs.readFileSync(docPath, 'utf-8');
  }

  const newSection: string[] = [];
  newSection.push(`\n## 自動アップデートボット実行\n`);
  newSection.push(`- 処理ファイル数: ${report.summary.filesProcessed}`);
  newSection.push(`- 検出された問題: ${report.summary.issuesFound}`);
  newSection.push(`- 自動修正: ${report.summary.issuesFixed}`);
  newSection.push(`- 最適化適用: ${report.summary.optimizationsApplied}`);

  if (report.optimizations.filter(o => o.modified).length > 0) {
    newSection.push(`\n### 最適化詳細\n`);
    for (const opt of report.optimizations.filter(o => o.modified)) {
      newSection.push(`- ${path.basename(opt.file)}: ${opt.changes.join(', ')}`);
    }
  }

  if (existingContent) {
    fs.writeFileSync(docPath, existingContent + newSection.join('\n') + '\n');
  } else {
    const header = `# ${today} 更新履歴\n`;
    fs.writeFileSync(docPath, header + newSection.join('\n') + '\n');
  }

  console.log(`\n📝 Updated: docs/updates/${today}.md`);
}

// ============================================================================
// CLI
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
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case 'all':
      case 'validate':
      case 'optimize':
      case 'fix':
      case 'report':
      case 'inspect':
      case 'screenshot':
      case 'review':
        config.command = arg;
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
      case '--no-docs':
        config.skipDocs = true;
        break;
      case '--help':
        printHelp();
        process.exit(0);
    }
  }

  // Update target path to include municipality
  if (!config.targetPath.includes(config.municipality)) {
    config.targetPath = path.join(config.targetPath, config.municipality);
  }

  return config;
}

function printHelp(): void {
  console.log(`
INNOMA 自動アップデートボット（Playwright UI対応版）

プロジェクトルール（CLAUDE.md）に従い、以下を自動で実行:
- サービスページJSONの検証・最適化
- 変数定義の検証・更新
- コンポーネント構成の最適化
- localhost上のUIを確認しながら調整
- docs/updates/ への変更履歴記録

Usage:
  cd apps/web && npx tsx scripts/auto-update-bot.ts [command] [options]

Commands:
  all          全ての処理を実行（デフォルト）
  validate     検証のみ（変更なし）
  optimize     コンポーネント最適化
  fix          自動修正可能な問題を修正
  inspect      UIを確認して問題を検出
  screenshot   全ページのスクリーンショットを取得
  review       UIを見ながら対話的にレビュー

Options:
  --target <path>      対象パス（デフォルト: data/artifacts）
  --municipality <id>  対象自治体（デフォルト: takaoka）
  --port <number>      開発サーバーのポート（デフォルト: 3000）
  --headed             ブラウザを表示（デフォルト: headless）
  --dry-run            変更せずにレポートのみ
  --verbose            詳細出力
  --no-docs            docs/updates への記録をスキップ
  --help               ヘルプ表示

Examples:
  npx tsx scripts/auto-update-bot.ts
  npx tsx scripts/auto-update-bot.ts inspect --headed --municipality takaoka
  npx tsx scripts/auto-update-bot.ts screenshot --municipality sample
  npx tsx scripts/auto-update-bot.ts review --headed

UI Inspection Commands (review mode):
  next/n          次のページへ
  prev/p          前のページへ
  screenshot/s    スクリーンショット取得
  elements/e      ページ要素一覧
  highlight/h <s> 要素をハイライト
  open/o <path>   パスへ移動
  check/c         空要素チェック
  quit/q          終了

NOTE: UIコマンド（inspect, screenshot, review）を使用する前に、
      別ターミナルで開発サーバーを起動しておく必要があります:
      cd apps/web && npm run dev
`);
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
  const config = parseArgs();

  console.log(`\n🤖 INNOMA Auto-Update Bot (Playwright Edition)`);
  console.log(`   Command: ${config.command}`);
  console.log(`   Target: ${config.targetPath}`);
  console.log(`   Municipality: ${config.municipality}`);
  if (config.dryRun) console.log(`   Mode: Dry run (no changes)`);
  if (config.headed) console.log(`   Browser: Headed`);
  console.log('');

  // Check if target exists, fallback to templates
  if (!fs.existsSync(config.targetPath)) {
    console.log(`⚠️  Target not found: ${config.targetPath}`);
    const templatesPath = path.join(__dirname, '../data/artifacts/_templates');
    if (fs.existsSync(templatesPath)) {
      console.log(`   Using templates instead: ${templatesPath}`);
      config.targetPath = templatesPath;
    }
  }

  const files = getJsonFiles(config.targetPath);
  console.log(`📁 Found ${files.length} artifact files\n`);

  if (files.length === 0) {
    console.log('No artifact files found.');
    return;
  }

  const report: BotReport = {
    timestamp: new Date().toISOString(),
    config,
    summary: {
      filesProcessed: files.length,
      issuesFound: 0,
      issuesFixed: 0,
      optimizationsApplied: 0,
      screenshotsTaken: 0,
    },
    issues: [],
    optimizations: [],
    screenshots: [],
  };

  // Browser-based commands
  const browserCommands = ['inspect', 'screenshot', 'review'];
  let browser: BrowserManager | null = null;

  if (browserCommands.includes(config.command)) {
    browser = new BrowserManager(config);
    try {
      await browser.launch();

      switch (config.command) {
        case 'inspect':
          await inspectUI(browser, files, config);
          break;
        case 'screenshot':
          report.screenshots = await takeScreenshots(browser, files, config);
          report.summary.screenshotsTaken = report.screenshots.length;
          break;
        case 'review':
          await interactiveReview(browser, files, config);
          break;
      }
    } finally {
      await browser.close();
    }
  }

  // File-based commands
  if (['all', 'validate', 'fix', 'optimize', 'report'].includes(config.command)) {
    for (const file of files) {
      const relativePath = path.relative(config.targetPath, file);

      // Validate
      if (['all', 'validate', 'fix'].includes(config.command)) {
        const issues = validateArtifact(file, config);
        report.issues.push(...issues);

        if (config.verbose && issues.length > 0) {
          console.log(`🔍 ${relativePath}: ${issues.length} issue(s)`);
          for (const issue of issues) {
            const icon = issue.type === 'error' ? '❌' : issue.type === 'warning' ? '⚠️' : 'ℹ️';
            console.log(`   ${icon} [${issue.rule}] ${issue.message}`);
          }
        }
      }

      // Optimize
      if (['all', 'optimize'].includes(config.command)) {
        const result = optimizeArtifact(file, config);
        if (result.modified || result.changes.length > 0) {
          report.optimizations.push(result);

          if (config.verbose && result.changes.length > 0) {
            console.log(`✨ ${relativePath}: ${result.changes.length} optimization(s)`);
            for (const change of result.changes) {
              console.log(`   ${result.modified ? '✅' : '📝'} ${change}`);
            }
          }
        }
      }
    }

    // Apply fixes
    if (['all', 'fix'].includes(config.command)) {
      for (const issue of report.issues) {
        if (issue.autoFixable && issue.fix && !config.dryRun) {
          issue.fix();
          report.summary.issuesFixed++;
        }
      }
    }
  }

  // Calculate summary
  report.summary.issuesFound = report.issues.length;
  report.summary.optimizationsApplied = report.optimizations.filter(o => o.modified).length;

  // Output report
  if (!['review'].includes(config.command)) {
    console.log('\n' + '='.repeat(60));
    console.log(generateReport(report));
  }

  // Write to docs/updates
  if (!config.dryRun && report.summary.optimizationsApplied > 0) {
    writeUpdateDoc(report, config);
  }

  const hasErrors = report.issues.some(i => i.type === 'error');
  if (hasErrors) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Bot failed:', error);
  process.exit(1);
});
