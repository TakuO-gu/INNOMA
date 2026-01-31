/**
 * 残存するcalloutを適切なコンポーネントに変換するスクリプト
 *
 * 変換ルール:
 * - severity: warning/danger → NotificationBanner（文字数関係なく）
 * - severity: info で50文字以上 → NotificationBanner
 * - severity: info で50文字未満 → RichText内のテキストに展開
 *
 * 使用方法:
 * cd apps/web && npx tsx scripts/convert-remaining-callouts.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface RichTextNode {
  type: string;
  text?: string;
  runs?: Array<{ text: string; bold?: boolean; link?: { href: string } }>;
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

// RichTextNode内のテキストの総文字数を計算
function getTextLength(nodes: RichTextNode[]): number {
  let totalLength = 0;

  for (const node of nodes) {
    if (node.type === 'paragraph' && node.runs) {
      for (const run of node.runs) {
        totalLength += run.text?.length || 0;
      }
    } else if (node.type === 'list' && node.items) {
      for (const item of node.items) {
        totalLength += getTextLength(item);
      }
    } else if (node.text) {
      totalLength += node.text.length;
    } else if (node.content) {
      totalLength += getTextLength(node.content);
    }
  }

  return totalLength;
}

// calloutを適切なコンポーネントに変換
function transformCallout(
  node: RichTextNode,
  blockId: string,
  calloutIndex: number
): { expandedNodes: RichTextNode[]; notificationBlock: Block | null } {
  if (!node.content) {
    return { expandedNodes: [], notificationBlock: null };
  }

  const textLength = getTextLength(node.content);
  const isWarningOrDanger = node.severity === 'warning' || node.severity === 'danger' || node.severity === 'error';

  // 警告/危険、または50文字以上の場合 → NotificationBanner
  if (isWarningOrDanger || textLength >= 50) {
    const severity = node.severity === 'warning' ? 'warning' :
                     node.severity === 'danger' || node.severity === 'error' ? 'danger' :
                     node.severity === 'success' ? 'success' : 'info';

    const notificationBlock: Block = {
      id: `${blockId}-notification-${calloutIndex}`,
      type: 'NotificationBanner',
      props: {
        severity,
        title: node.title,
        content: node.content
      }
    };
    return { expandedNodes: [], notificationBlock };
  }

  // 50文字未満のinfo → RichText内に展開
  const expandedNodes: RichTextNode[] = [];

  // タイトルがある場合は太字パラグラフとして追加
  if (node.title) {
    expandedNodes.push({
      type: 'paragraph',
      runs: [{ text: node.title, bold: true }]
    });
  }

  // contentをそのまま追加
  expandedNodes.push(...(node.content as RichTextNode[]));

  return { expandedNodes, notificationBlock: null };
}

// RichText content内を処理
function processRichTextContent(
  content: RichTextNode[],
  blockId: string,
  newBlocks: Block[]
): RichTextNode[] {
  const result: RichTextNode[] = [];
  let calloutIndex = 0;

  for (const node of content) {
    if (node.type === 'callout') {
      const { expandedNodes, notificationBlock } = transformCallout(node, blockId, calloutIndex++);

      if (notificationBlock) {
        newBlocks.push(notificationBlock);
      }
      if (expandedNodes.length > 0) {
        result.push(...expandedNodes);
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
        // calloutが含まれているか確認
        const hasCallout = JSON.stringify(content).includes('"type":"callout"') ||
                          JSON.stringify(content).includes('"type": "callout"');

        if (hasCallout) {
          const newBlocks: Block[] = [];
          const processedContent = processRichTextContent(content, block.id, newBlocks);

          result.push({
            ...block,
            props: {
              ...block.props,
              content: processedContent
            }
          });

          result.push(...newBlocks);
        } else {
          result.push(block);
        }
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
async function processFile(filePath: string): Promise<{ modified: boolean; changes: string[] }> {
  const changes: string[] = [];

  try {
    const content = fs.readFileSync(filePath, 'utf-8');

    // calloutが含まれているか確認
    if (!content.includes('"type": "callout"') && !content.includes('"type":"callout"')) {
      return { modified: false, changes };
    }

    const artifact: Artifact = JSON.parse(content);

    if (!artifact.blocks || !Array.isArray(artifact.blocks)) {
      return { modified: false, changes };
    }

    const originalJson = JSON.stringify(artifact.blocks);
    const processedBlocks = processBlocks(artifact.blocks);
    const newJson = JSON.stringify(processedBlocks);

    if (originalJson === newJson) {
      return { modified: false, changes };
    }

    // 変更内容を記録
    const newNotifications = processedBlocks.filter(b =>
      b.type === 'NotificationBanner' && b.id.includes('-notification-')
    );
    if (newNotifications.length > 0) {
      changes.push(`callout → NotificationBanner: ${newNotifications.length}`);
    }

    // calloutが展開されたかカウント
    const originalCalloutCount = (content.match(/"type":\s*"callout"/g) || []).length;
    const newCalloutCount = (newJson.match(/"type":\s*"callout"/g) || []).length;
    const expandedCount = originalCalloutCount - newCalloutCount - newNotifications.length;
    if (expandedCount > 0) {
      changes.push(`callout → RichText展開: ${expandedCount}`);
    }

    const newArtifact = {
      ...artifact,
      blocks: processedBlocks
    };

    fs.writeFileSync(filePath, JSON.stringify(newArtifact, null, 2) + '\n');
    return { modified: true, changes };
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return { modified: false, changes: [`error: ${error}`] };
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
  let notificationCount = 0;
  let expandedCount = 0;

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
          if (c.includes('NotificationBanner')) {
            notificationCount += parseInt(c.match(/\d+/)?.[0] || '0');
          }
          if (c.includes('RichText展開')) {
            expandedCount += parseInt(c.match(/\d+/)?.[0] || '0');
          }
        });
      }
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Processed: ${processedCount} files`);
  console.log(`Modified: ${modifiedCount} files`);
  console.log(`callout → NotificationBanner: ${notificationCount}`);
  console.log(`callout → RichText展開: ${expandedCount}`);

  // 残存calloutをカウント
  let remainingCallouts = 0;
  for (const dir of dirs) {
    const files = getJsonFiles(dir);
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const count = (content.match(/"type":\s*"callout"/g) || []).length;
      remainingCallouts += count;
    }
  }
  console.log(`Remaining callouts: ${remainingCallouts}`);
}

main().catch(console.error);
