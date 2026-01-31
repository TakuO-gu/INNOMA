/**
 * calloutをDADSコンポーネントに変換するスクリプト
 *
 * COMPONENT_SELECTION_RULESに基づく変換ルール:
 * - 50文字以上の重要な情報 → NotificationBanner（独立ブロックとして追加）
 * - 50文字未満の短い情報 → そのままRichText内に残す（後方互換のため単純なdivで表示）
 *
 * 使用方法:
 * cd apps/web && npx tsx scripts/convert-callout-to-dads.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface RichTextNode {
  type: string;
  text?: string;
  runs?: Array<{ text: string; bold?: boolean }>;
  content?: RichTextNode[];
  items?: RichTextNode[][];
  ordered?: boolean;
  severity?: string;
  title?: string;
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

// callout内のテキストの総文字数を計算
function getCalloutTextLength(content: RichTextNode[]): number {
  let totalLength = 0;

  for (const node of content) {
    if (node.type === 'paragraph' && node.runs) {
      for (const run of node.runs) {
        totalLength += run.text?.length || 0;
      }
    } else if (node.type === 'list' && node.items) {
      for (const item of node.items) {
        totalLength += getCalloutTextLength(item);
      }
    } else if (node.text) {
      totalLength += node.text.length;
    }
  }

  return totalLength;
}

// severityをNotificationBannerのseverityに変換
function convertSeverity(severity: string): 'info' | 'warning' | 'danger' | 'success' {
  switch (severity) {
    case 'warning':
      return 'warning';
    case 'danger':
    case 'error':
      return 'danger';
    case 'success':
      return 'success';
    case 'info':
    default:
      return 'info';
  }
}

// RichText content内のcalloutを処理
function processRichTextContent(
  content: RichTextNode[],
  blockId: string,
  newBlocks: Block[]
): RichTextNode[] {
  const result: RichTextNode[] = [];
  let calloutIndex = 0;

  for (const node of content) {
    if (node.type === 'callout' && node.content) {
      const textLength = getCalloutTextLength(node.content);

      if (textLength >= 50) {
        // 50文字以上: NotificationBannerとして独立ブロックに変換
        const notificationBlock: Block = {
          id: `${blockId}-notification-${calloutIndex++}`,
          type: 'NotificationBanner',
          props: {
            severity: convertSeverity(node.severity || 'info'),
            title: node.title,
            content: node.content
          }
        };
        newBlocks.push(notificationBlock);
        // RichTextからは削除（NotificationBannerブロックとして追加される）
      } else {
        // 50文字未満: そのままRichText内に残す（RichTextRendererで単純なdivとして表示）
        result.push(node);
      }
    } else {
      result.push(node);
    }
  }

  return result;
}

// ブロック配列を処理
function processBlocks(blocks: Block[]): Block[] {
  const result: Block[] = [];

  for (const block of blocks) {
    if (block.type === 'Section' || block.type === 'RichText') {
      const content = block.props.content as RichTextNode[] | undefined;

      if (content && Array.isArray(content)) {
        const newBlocks: Block[] = [];
        const processedContent = processRichTextContent(content, block.id, newBlocks);

        // 処理済みのcontentでブロックを更新
        result.push({
          ...block,
          props: {
            ...block.props,
            content: processedContent
          }
        });

        // 新しいNotificationBannerブロックを追加
        result.push(...newBlocks);
      } else {
        result.push(block);
      }
    } else {
      result.push(block);
    }
  }

  return result;
}

// ファイルを処理
async function processFile(filePath: string): Promise<boolean> {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const artifact: Artifact = JSON.parse(content);

    if (!artifact.blocks || !Array.isArray(artifact.blocks)) {
      return false;
    }

    // calloutが含まれているか確認
    const hasCallout = content.includes('"type": "callout"') || content.includes('"type":"callout"');
    if (!hasCallout) {
      return false;
    }

    const processedBlocks = processBlocks(artifact.blocks);

    // 変更がある場合のみ書き込み
    const newArtifact = {
      ...artifact,
      blocks: processedBlocks
    };

    fs.writeFileSync(filePath, JSON.stringify(newArtifact, null, 2) + '\n');
    return true;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return false;
  }
}

// ディレクトリを再帰的に探索してJSONファイルを取得
function getJsonFiles(dir: string): string[] {
  const files: string[] = [];

  if (!fs.existsSync(dir)) {
    return files;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
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

  for (const dir of dirs) {
    const files = getJsonFiles(dir);

    for (const file of files) {
      processedCount++;
      const modified = await processFile(file);
      if (modified) {
        modifiedCount++;
        console.log(`✓ Modified: ${path.relative(baseDir, file)}`);
      }
    }
  }

  console.log(`\nProcessed ${processedCount} files, modified ${modifiedCount} files`);
}

main().catch(console.error);
