/**
 * 80文字以上のテキスト要素をスキャンして詳細を出力するスクリプト
 */

import * as fs from 'fs';
import * as path from 'path';

const TEXT_LENGTH_THRESHOLD = 80;

interface LongTextInfo {
  file: string;
  blockIndex: number;
  blockId: string;
  blockType: string;
  nodeType: string;
  text: string;
  length: number;
}

interface Block {
  id: string;
  type: string;
  props: Record<string, unknown>;
}

function extractTextFromRichTextNodes(nodes: unknown[]): string {
  if (!Array.isArray(nodes)) return '';
  return nodes.map(node => {
    const typedNode = node as { type: string; runs?: Array<{ text: string }>; text?: string; items?: unknown[][] };
    if (typedNode.type === 'paragraph' && typedNode.runs) {
      return typedNode.runs.map(r => r.text).join('');
    }
    if (typedNode.type === 'list' && typedNode.items) {
      return typedNode.items.map(item => extractTextFromItem(item as unknown[])).join('\n');
    }
    if (typedNode.text) return typedNode.text;
    return '';
  }).join('\n');
}

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

function collectLongTextsFromBlocks(blocks: Block[], filePath: string): LongTextInfo[] {
  const longTexts: LongTextInfo[] = [];

  for (let blockIndex = 0; blockIndex < blocks.length; blockIndex++) {
    const block = blocks[blockIndex];
    const blockType = block.type as string;

    switch (blockType) {
      case 'RichText': {
        const content = (block.props as { content?: unknown[] }).content as Array<{
          type: string;
          runs?: Array<{ text: string }>;
          items?: unknown[][];
        }> | undefined;
        if (!Array.isArray(content)) break;

        for (const node of content) {
          if (node.type === 'paragraph' && node.runs) {
            const fullText = node.runs.map(r => r.text).join('');
            if (fullText.length >= TEXT_LENGTH_THRESHOLD) {
              longTexts.push({
                file: filePath,
                blockIndex,
                blockId: block.id,
                blockType: 'RichText',
                nodeType: 'paragraph',
                text: fullText,
                length: fullText.length,
              });
            }
          }

          if (node.type === 'list' && node.items) {
            for (const item of node.items) {
              const itemText = extractTextFromItem(item as unknown[]);
              if (itemText.length >= TEXT_LENGTH_THRESHOLD) {
                longTexts.push({
                  file: filePath,
                  blockIndex,
                  blockId: block.id,
                  blockType: 'RichText',
                  nodeType: 'list-item',
                  text: itemText,
                  length: itemText.length,
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

        for (const row of rows) {
          if (typeof row.value === 'string' && row.value.length >= TEXT_LENGTH_THRESHOLD) {
            longTexts.push({
              file: filePath,
              blockIndex,
              blockId: block.id,
              blockType: 'Table',
              nodeType: 'table-value',
              text: row.value,
              length: row.value.length,
            });
          }
          if (row.label.length >= TEXT_LENGTH_THRESHOLD) {
            longTexts.push({
              file: filePath,
              blockIndex,
              blockId: block.id,
              blockType: 'Table',
              nodeType: 'table-label',
              text: row.label,
              length: row.label.length,
            });
          }
        }
        break;
      }

      case 'Section': {
        const props = block.props as { heading?: string; content?: unknown[] };
        if (Array.isArray(props.content)) {
          const contentText = extractTextFromRichTextNodes(props.content);
          if (contentText.length >= TEXT_LENGTH_THRESHOLD) {
            longTexts.push({
              file: filePath,
              blockIndex,
              blockId: block.id,
              blockType: 'Section',
              nodeType: 'section-content',
              text: contentText,
              length: contentText.length,
            });
          }
        }
        break;
      }
    }
  }

  return longTexts;
}

function scanDirectory(dir: string, results: LongTextInfo[]): void {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (!['_drafts', '_jobs', 'history', 'variables', 'data'].includes(entry.name)) {
        scanDirectory(fullPath, results);
      }
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const data = JSON.parse(content);

        if (data.blocks && Array.isArray(data.blocks)) {
          const relativePath = path.relative(process.cwd(), fullPath);
          const longTexts = collectLongTextsFromBlocks(data.blocks, relativePath);
          results.push(...longTexts);
        }
      } catch {
        // ignore
      }
    }
  }
}

// 全体スキャン
const artifactsDir = path.join(process.cwd(), 'data/artifacts');
const results: LongTextInfo[] = [];

console.log(`スキャン対象: ${artifactsDir}`);
console.log(`閾値: ${TEXT_LENGTH_THRESHOLD}文字以上\n`);

scanDirectory(artifactsDir, results);

// 全ての長いテキスト
const targetResults = results;

console.log('='.repeat(80));
console.log(`対象: ${targetResults.length}件（${TEXT_LENGTH_THRESHOLD}文字以上テキスト）\n`);

// ブロックタイプ別集計
const byBlockType = new Map<string, number>();
for (const item of targetResults) {
  byBlockType.set(item.blockType, (byBlockType.get(item.blockType) || 0) + 1);
}
console.log('【ブロックタイプ別】');
for (const [type, count] of [...byBlockType.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${type}: ${count}件`);
}

// ファイル別にグループ化
const byFile = new Map<string, LongTextInfo[]>();
for (const item of targetResults) {
  if (!byFile.has(item.file)) {
    byFile.set(item.file, []);
  }
  byFile.get(item.file)!.push(item);
}

// テンプレートのみ詳細出力
const templateFiles = [...byFile.keys()].filter(f => f.includes('_templates'));
console.log(`\n【テンプレートファイル詳細】（${templateFiles.length}ファイル）`);

for (const file of templateFiles) {
  const items = byFile.get(file)!;
  console.log(`\n${'='.repeat(80)}`);
  console.log(`ファイル: ${file}`);
  console.log(`件数: ${items.length}`);
  console.log('-'.repeat(80));

  for (const item of items) {
    console.log(`  [${item.blockType}/${item.nodeType}] ${item.length}文字`);
    console.log(`  blockId: ${item.blockId}`);
    console.log(`  テキスト: ${item.text.substring(0, 120)}${item.text.length > 120 ? '...' : ''}`);
    console.log('');
  }
}
