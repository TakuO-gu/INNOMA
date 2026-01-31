/**
 * COMPONENT_SELECTION_RULESに基づいてブロック構造を最適化するスクリプト
 *
 * 最適化ルール:
 * 1. 空のSection（content が空配列）を検出し、次のブロックと統合または削除
 * 2. 手順が3ステップ以上のリスト → StepNavigation
 * 3. 条件分岐あり（「の場合」「場合は」を含む）のリスト → Table
 * 4. シンプルなリスト（3項目以下）→ DescriptionList
 * 5. 定義リスト形式（太字 + 説明）→ DescriptionList
 *
 * 使用方法:
 * cd apps/web && npx tsx scripts/optimize-blocks-with-rules.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface RichTextRun {
  text: string;
  bold?: boolean;
  link?: { href: string };
}

interface RichTextNode {
  type: string;
  text?: string;
  runs?: RichTextRun[];
  content?: RichTextNode[];
  items?: RichTextNode[][];
  ordered?: boolean;
  level?: number;
}

interface Block {
  id: string;
  type: string;
  props: Record<string, unknown>;
}

interface Artifact {
  blocks: Block[];
  [key: string]: unknown;
}

interface OptimizationResult {
  modified: boolean;
  changes: string[];
}

// リストアイテムからテキストを抽出
function extractTextFromListItem(item: RichTextNode[]): string {
  return item.map(node => {
    if (node.type === 'paragraph' && node.runs) {
      return node.runs.map(r => r.text || '').join('');
    }
    return '';
  }).join('');
}

// 条件分岐パターンを検出
function hasConditionalPattern(items: RichTextNode[][]): boolean {
  const conditionalPatterns = [
    /の場合[：:]/,
    /場合は/,
    /〜の方/,
    /の方は/,
    /本人/,
    /代理人/,
  ];

  for (const item of items) {
    const text = extractTextFromListItem(item);
    for (const pattern of conditionalPatterns) {
      if (pattern.test(text)) {
        return true;
      }
    }
  }
  return false;
}

// 定義リスト形式（太字 + 説明）を検出
function isDefinitionListPattern(items: RichTextNode[][]): boolean {
  // 全アイテムが「太字部分：説明」のパターンか確認
  for (const item of items) {
    if (item.length !== 1 || item[0].type !== 'paragraph') {
      return false;
    }
    const runs = item[0].runs;
    if (!runs || runs.length < 2) {
      return false;
    }
    // 最初のrunが太字であること
    if (!runs[0].bold) {
      return false;
    }
    // 説明部分が「：」または「:」で始まるか確認
    const descRun = runs[1];
    if (!descRun?.text || (!descRun.text.startsWith('：') && !descRun.text.startsWith(':'))) {
      return false;
    }
  }
  return true;
}

// 定義リストとして変換
function convertToDescriptionList(items: RichTextNode[][], blockId: string): Block | null {
  const descItems: { term: string; description: string | RichTextNode[] }[] = [];

  for (const item of items) {
    if (item.length !== 1 || item[0].type !== 'paragraph' || !item[0].runs) {
      return null;
    }
    const runs = item[0].runs;
    if (runs.length < 2 || !runs[0].bold) {
      return null;
    }

    const term = runs[0].text || '';
    // 説明は2番目以降のrunを結合（先頭の「：」を除去）
    let description = runs.slice(1).map(r => r.text || '').join('');
    if (description.startsWith('：') || description.startsWith(':')) {
      description = description.slice(1);
    }

    descItems.push({ term, description: description.trim() });
  }

  if (descItems.length === 0) {
    return null;
  }

  return {
    id: `${blockId}-desclist`,
    type: 'DescriptionList',
    props: {
      items: descItems
    }
  };
}

// 手順リストをStepNavigationに変換
function convertToStepNavigation(items: RichTextNode[][], blockId: string): Block {
  const steps = items.map((item, index) => {
    const text = extractTextFromListItem(item);
    return {
      title: `ステップ${index + 1}`,
      body: text
    };
  });

  return {
    id: `${blockId}-step`,
    type: 'StepNavigation',
    props: {
      steps
    }
  };
}

// 条件分岐リストをTableに変換
function convertToTable(items: RichTextNode[][], blockId: string): Block {
  const rows = items.map(item => {
    const text = extractTextFromListItem(item);
    // 「：」「:」「→」で分割を試みる
    const separators = ['：', ':', '→', '…'];
    for (const sep of separators) {
      const idx = text.indexOf(sep);
      if (idx > 0) {
        return {
          label: text.slice(0, idx).trim(),
          value: text.slice(idx + 1).trim()
        };
      }
    }
    // 分割できない場合はそのまま
    return {
      label: text,
      value: ''
    };
  });

  return {
    id: `${blockId}-table`,
    type: 'Table',
    props: {
      rows
    }
  };
}

// Section内のリストを最適化
function optimizeSectionContent(block: Block): { optimized: Block; newBlocks: Block[]; changes: string[] } {
  const changes: string[] = [];
  const newBlocks: Block[] = [];
  const content = block.props.content as RichTextNode[] | undefined;

  if (!content || !Array.isArray(content) || content.length === 0) {
    return { optimized: block, newBlocks, changes };
  }

  const heading = block.props.heading as string || '';
  const optimizedContent: RichTextNode[] = [];

  for (let i = 0; i < content.length; i++) {
    const node = content[i];

    if (node.type === 'list' && node.items && node.items.length > 0) {
      const items = node.items;
      const isOrdered = node.ordered || false;

      // 手順系のセクション見出しで、3ステップ以上の番号付きリスト
      const procedureKeywords = ['手順', '流れ', 'ステップ', '手続き', '方法', '申請'];
      const isProcedureSection = procedureKeywords.some(kw => heading.includes(kw));

      if (isOrdered && items.length >= 3 && isProcedureSection) {
        // StepNavigationに変換
        const stepNav = convertToStepNavigation(items, block.id);
        newBlocks.push(stepNav);
        changes.push(`ordered list (${items.length}items) → StepNavigation`);
        continue;
      }

      // 条件分岐パターン
      if (hasConditionalPattern(items)) {
        const table = convertToTable(items, block.id);
        newBlocks.push(table);
        changes.push(`conditional list (${items.length}items) → Table`);
        continue;
      }

      // 定義リストパターン（太字 + 説明）
      if (isDefinitionListPattern(items)) {
        const descList = convertToDescriptionList(items, block.id);
        if (descList) {
          if (items.length <= 3) {
            newBlocks.push(descList);
            changes.push(`definition list (${items.length}items) → DescriptionList`);
            continue;
          }
        }
      }

      // 3項目以下のシンプルリスト → DescriptionListを検討
      // ただし、定義形式でない場合はそのまま維持
    }

    optimizedContent.push(node);
  }

  return {
    optimized: {
      ...block,
      props: {
        ...block.props,
        content: optimizedContent
      }
    },
    newBlocks,
    changes
  };
}

// 空のSectionを検出し、次のブロックと統合
function mergeEmptySections(blocks: Block[]): { merged: Block[]; changes: string[] } {
  const result: Block[] = [];
  const changes: string[] = [];
  let i = 0;

  while (i < blocks.length) {
    const block = blocks[i];

    if (block.type === 'Section') {
      const content = block.props.content as RichTextNode[] | undefined;
      const isEmptySection = !content || (Array.isArray(content) && content.length === 0);

      if (isEmptySection) {
        // 次のブロックを確認
        const nextBlock = blocks[i + 1];

        if (nextBlock && (nextBlock.type === 'Table' || nextBlock.type === 'StepNavigation' ||
            nextBlock.type === 'DescriptionList' || nextBlock.type === 'Accordion')) {
          // Sectionのheadingを次のブロックに付与
          const heading = block.props.heading as string;
          if (heading && !nextBlock.props.heading) {
            nextBlock.props.heading = heading;
          }
          // 空のSectionをスキップ
          changes.push(`empty Section "${heading}" merged with next ${nextBlock.type}`);
          i++;
          continue;
        } else if (nextBlock && nextBlock.type === 'NotificationBanner') {
          // NotificationBannerの直前の空Sectionは削除
          changes.push(`empty Section "${block.props.heading}" before NotificationBanner removed`);
          i++;
          continue;
        }
      }
    }

    result.push(block);
    i++;
  }

  return { merged: result, changes };
}

// ブロック配列を最適化
function processBlocks(blocks: Block[]): { optimized: Block[]; changes: string[] } {
  const allChanges: string[] = [];

  // Phase 1: 各Sectionのコンテンツを最適化
  let result: Block[] = [];
  for (const block of blocks) {
    if (block.type === 'Section') {
      const { optimized, newBlocks, changes } = optimizeSectionContent(block);
      result.push(optimized);
      result.push(...newBlocks);
      allChanges.push(...changes);
    } else {
      result.push(block);
    }
  }

  // Phase 2: 空のSectionを統合・削除
  const { merged, changes } = mergeEmptySections(result);
  result = merged;
  allChanges.push(...changes);

  return { optimized: result, changes: allChanges };
}

// ファイルを処理
async function processFile(filePath: string): Promise<OptimizationResult> {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const artifact: Artifact = JSON.parse(content);

    if (!artifact.blocks || !Array.isArray(artifact.blocks)) {
      return { modified: false, changes: [] };
    }

    const originalJson = JSON.stringify(artifact.blocks);
    const { optimized, changes } = processBlocks(artifact.blocks);
    const newJson = JSON.stringify(optimized);

    if (originalJson === newJson) {
      return { modified: false, changes: [] };
    }

    const newArtifact = {
      ...artifact,
      blocks: optimized
    };

    fs.writeFileSync(filePath, JSON.stringify(newArtifact, null, 2) + '\n');
    return { modified: true, changes };
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return { modified: false, changes: [`error: ${error}`] };
  }
}

// ディレクトリを再帰的に探索
function getJsonFiles(dir: string): string[] {
  const files: string[] = [];

  if (!fs.existsSync(dir)) {
    return files;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // dataディレクトリはスキップ
      if (entry.name === 'data') continue;
      files.push(...getJsonFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      files.push(fullPath);
    }
  }

  return files;
}

// メイン処理
async function main() {
  const baseDir = path.join(__dirname, '../data/artifacts');
  const dirs = [
    path.join(baseDir, '_templates'),
    path.join(baseDir, 'sample'),
    path.join(baseDir, 'takaoka')
  ];

  let processedCount = 0;
  let modifiedCount = 0;
  const changeStats: Record<string, number> = {};

  for (const dir of dirs) {
    const files = getJsonFiles(dir);

    for (const file of files) {
      processedCount++;
      const { modified, changes } = await processFile(file);
      if (modified) {
        modifiedCount++;
        const relativePath = path.relative(baseDir, file);
        console.log(`✓ Modified: ${relativePath}`);
        changes.forEach(c => {
          console.log(`    ${c}`);
          // 統計を記録
          const key = c.split(' → ')[1] || c;
          changeStats[key] = (changeStats[key] || 0) + 1;
        });
      }
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Processed: ${processedCount} files`);
  console.log(`Modified: ${modifiedCount} files`);

  if (Object.keys(changeStats).length > 0) {
    console.log(`\n=== Changes by type ===`);
    for (const [key, count] of Object.entries(changeStats)) {
      console.log(`${key}: ${count}`);
    }
  }
}

main().catch(console.error);
