/**
 * COMPONENT_SELECTION_RULESに基づいてデータを再構成するスクリプト
 *
 * 変換ルール:
 * 1. callout (50文字以上) → NotificationBanner
 * 2. callout (50文字未満) → 削除（内容はRichText内のテキストとして残す）
 * 3. Table行数が1行 → DescriptionList
 * 4. シンプルな情報（3項目以下）→ DescriptionList
 *
 * 使用方法:
 * cd apps/web && npx tsx scripts/restructure-with-rules.ts
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
): { richTextNode: RichTextNode | null; notificationBlock: Block | null } {
  if (!node.content) {
    return { richTextNode: null, notificationBlock: null };
  }

  const textLength = getTextLength(node.content);

  if (textLength >= 50) {
    // 50文字以上: NotificationBannerとして独立ブロックに変換
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
    return { richTextNode: null, notificationBlock };
  } else {
    // 50文字未満: calloutのcontentをそのままRichTextノードとして展開
    // タイトルがある場合は太字のパラグラフとして追加
    const resultNodes: RichTextNode[] = [];

    if (node.title) {
      resultNodes.push({
        type: 'paragraph',
        runs: [{ text: node.title, bold: true }]
      });
    }

    // contentをそのまま追加
    resultNodes.push(...(node.content as RichTextNode[]));

    // 複数のノードがある場合、最初のノードを返し残りは別途処理が必要
    // 簡略化のため、dividerで区切って返す
    if (resultNodes.length === 1) {
      return { richTextNode: resultNodes[0], notificationBlock: null };
    }

    // 複数のノードをdivで囲む代わりに、最初のノードのみ返す
    // （実際のレンダリングは後方互換のcalloutハンドラーに任せる）
    return { richTextNode: node, notificationBlock: null };
  }
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
      const { richTextNode, notificationBlock } = transformCallout(node, blockId, calloutIndex++);

      if (notificationBlock) {
        newBlocks.push(notificationBlock);
      }
      if (richTextNode) {
        result.push(richTextNode);
      }
    } else {
      result.push(node);
    }
  }

  return result;
}

// Tableを最適化（1行のみの場合はDescriptionListに変換可能かチェック）
function optimizeTable(block: Block): Block | null {
  const rows = block.props.rows as Array<{ label: string; value: unknown }> | undefined;

  if (!rows || rows.length === 0) {
    return null; // 空のテーブルは削除
  }

  // 1行のテーブルで単純な値の場合、そのまま維持（DescriptionListへの変換は複雑なため）
  // 将来的にはDescriptionListへの変換を検討
  return block;
}

// Sectionの内容を最適化
function optimizeSection(block: Block, newBlocks: Block[]): Block {
  const content = block.props.content as RichTextNode[] | undefined;

  if (!content || !Array.isArray(content)) {
    return block;
  }

  const processedContent = processRichTextContent(content, block.id, newBlocks);

  return {
    ...block,
    props: {
      ...block.props,
      content: processedContent
    }
  };
}

// RichTextブロックを最適化
function optimizeRichText(block: Block, newBlocks: Block[]): Block {
  const content = block.props.content as RichTextNode[] | undefined;

  if (!content || !Array.isArray(content)) {
    return block;
  }

  const processedContent = processRichTextContent(content, block.id, newBlocks);

  return {
    ...block,
    props: {
      ...block.props,
      content: processedContent
    }
  };
}

// NotificationBannerを最適化（contentが空の場合は削除）
function optimizeNotificationBanner(block: Block): Block | null {
  const content = block.props.content as RichTextNode[] | undefined;
  const description = block.props.description as string | undefined;

  // contentもdescriptionもない場合は削除
  if ((!content || content.length === 0) && !description) {
    return null;
  }

  // contentがある場合、テキスト長をチェック
  if (content && content.length > 0) {
    const textLength = getTextLength(content);
    // テキストが空の場合は削除
    if (textLength === 0) {
      return null;
    }
  }

  return block;
}

// ブロック配列を処理
function processBlocks(blocks: Block[]): Block[] {
  const result: Block[] = [];

  for (const block of blocks) {
    const newBlocks: Block[] = [];

    switch (block.type) {
      case 'Section': {
        const optimized = optimizeSection(block, newBlocks);
        result.push(optimized);
        result.push(...newBlocks);
        break;
      }

      case 'RichText': {
        const optimized = optimizeRichText(block, newBlocks);
        result.push(optimized);
        result.push(...newBlocks);
        break;
      }

      case 'Table': {
        const optimized = optimizeTable(block);
        if (optimized) {
          result.push(optimized);
        }
        break;
      }

      case 'NotificationBanner': {
        const optimized = optimizeNotificationBanner(block);
        if (optimized) {
          result.push(optimized);
        }
        break;
      }

      default:
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
    const artifact: Artifact = JSON.parse(content);

    if (!artifact.blocks || !Array.isArray(artifact.blocks)) {
      return { modified: false, changes };
    }

    const originalBlockCount = artifact.blocks.length;
    const originalJson = JSON.stringify(artifact.blocks);

    const processedBlocks = processBlocks(artifact.blocks);
    const newJson = JSON.stringify(processedBlocks);

    // 変更がない場合はスキップ
    if (originalJson === newJson) {
      return { modified: false, changes };
    }

    // 変更内容を記録
    const newBlockCount = processedBlocks.length;
    if (newBlockCount !== originalBlockCount) {
      changes.push(`blocks: ${originalBlockCount} → ${newBlockCount}`);
    }

    // calloutからNotificationBannerへの変換をカウント
    const newNotifications = processedBlocks.filter(b =>
      b.type === 'NotificationBanner' && b.id.includes('-notification-')
    );
    if (newNotifications.length > 0) {
      changes.push(`callout → NotificationBanner: ${newNotifications.length}`);
    }

    // ファイルを書き込み
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
  const allChanges: { file: string; changes: string[] }[] = [];

  for (const dir of dirs) {
    const files = getJsonFiles(dir);

    for (const file of files) {
      processedCount++;
      const { modified, changes } = await processFile(file);
      if (modified) {
        modifiedCount++;
        const relativePath = path.relative(baseDir, file);
        console.log(`✓ Modified: ${relativePath}`);
        if (changes.length > 0) {
          changes.forEach(c => console.log(`    ${c}`));
          allChanges.push({ file: relativePath, changes });
        }
      }
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Processed: ${processedCount} files`);
  console.log(`Modified: ${modifiedCount} files`);

  if (allChanges.length > 0) {
    console.log(`\n=== Changes by type ===`);
    const calloutToNotification = allChanges.filter(c =>
      c.changes.some(ch => ch.includes('callout → NotificationBanner'))
    );
    console.log(`callout → NotificationBanner: ${calloutToNotification.length} files`);
  }
}

main().catch(console.error);
