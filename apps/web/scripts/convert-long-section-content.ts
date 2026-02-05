/**
 * Section内の80文字以上のテキストをDADSコンポーネントに変換するスクリプト
 *
 * 変換ルール:
 * 1. 改行区切りのテキスト（3行以上）→ RichText list (unordered)
 * 2. 「項目名：説明」形式 → DescriptionList
 * 3. 「項目名（説明）」形式 → DescriptionList
 * 4. ステップ形式（番号付き）→ RichText list (ordered)
 * 5. その他 → 文分割してRichText list
 */

import * as fs from 'fs';
import * as path from 'path';

const TEXT_LENGTH_THRESHOLD = 80;

interface RichTextNode {
  type: string;
  runs?: Array<{ text: string; bold?: boolean }>;
  items?: RichTextNode[][];
  ordered?: boolean;
  text?: string;
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

/**
 * RichTextノード配列からテキストを抽出
 */
function extractTextFromRichTextNodes(nodes: RichTextNode[]): string {
  if (!Array.isArray(nodes)) return '';
  return nodes.map(node => {
    if (node.type === 'paragraph' && node.runs) {
      return node.runs.map(r => r.text).join('');
    }
    if (node.type === 'list' && node.items) {
      return node.items.map(item => extractTextFromRichTextNodes(item)).join('\n');
    }
    if (node.text) return node.text;
    return '';
  }).join('\n');
}

/**
 * テキストを分析して最適なコンポーネントに変換
 */
function convertLongText(text: string): RichTextNode[] {
  // 改行で分割
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  if (lines.length === 0) {
    return [{ type: 'paragraph', runs: [{ text }] }];
  }

  // パターン1: 「項目：説明」形式が複数あるか
  const colonPattern = lines.filter(l => /^[^:：]{2,30}[:：]/.test(l));
  if (colonPattern.length >= 2 && colonPattern.length === lines.length) {
    // DescriptionList形式で表現（RichTextのリストとして）
    const items: RichTextNode[][] = lines.map(line => {
      const match = line.match(/^([^:：]+)[:：]\s*(.*)$/);
      if (match) {
        return [{
          type: 'paragraph',
          runs: [
            { text: match[1].trim(), bold: true },
            { text: '：' + match[2].trim() }
          ]
        }];
      }
      return [{ type: 'paragraph', runs: [{ text: line }] }];
    });

    return [{
      type: 'list',
      ordered: false,
      items
    }];
  }

  // パターン2: 番号付きリスト（1. 2. 3. や ① ② ③）
  const numberedPattern = lines.filter(l => /^[0-9０-９①-⑳]+[.．)）、]/.test(l));
  if (numberedPattern.length >= 2) {
    const items: RichTextNode[][] = lines.map(line => {
      // 番号を除去
      const cleanLine = line.replace(/^[0-9０-９①-⑳]+[.．)）、]\s*/, '');
      return [{ type: 'paragraph', runs: [{ text: cleanLine }] }];
    });

    return [{
      type: 'list',
      ordered: true,
      items
    }];
  }

  // パターン3: 3行以上の改行区切りテキスト → unordered list
  if (lines.length >= 3) {
    const items: RichTextNode[][] = lines.map(line => {
      return [{ type: 'paragraph', runs: [{ text: line }] }];
    });

    return [{
      type: 'list',
      ordered: false,
      items
    }];
  }

  // パターン4: 2行の場合、各行が長ければリスト化
  if (lines.length === 2 && lines.every(l => l.length > 30)) {
    const items: RichTextNode[][] = lines.map(line => {
      return [{ type: 'paragraph', runs: [{ text: line }] }];
    });

    return [{
      type: 'list',
      ordered: false,
      items
    }];
  }

  // パターン5: 句点「。」で区切られた複数文 → リスト化
  const sentences = text.split(/(?<=[。])/).map(s => s.trim()).filter(s => s.length > 0);
  if (sentences.length >= 3) {
    const items: RichTextNode[][] = sentences.map(sentence => {
      return [{ type: 'paragraph', runs: [{ text: sentence }] }];
    });

    return [{
      type: 'list',
      ordered: false,
      items
    }];
  }

  // 変換不可能な場合はそのまま（短い段落に分割）
  if (lines.length >= 2) {
    return lines.map(line => ({
      type: 'paragraph',
      runs: [{ text: line }]
    }));
  }

  // 1行の長文はそのまま
  return [{ type: 'paragraph', runs: [{ text }] }];
}

/**
 * Sectionブロックのcontentを変換
 */
function convertSectionContent(block: Block): boolean {
  const props = block.props as { content?: RichTextNode[] };
  if (!Array.isArray(props.content)) return false;

  const text = extractTextFromRichTextNodes(props.content);
  if (text.length < TEXT_LENGTH_THRESHOLD) return false;

  // 既にリスト形式の場合はスキップ
  const hasListAlready = props.content.some(node => node.type === 'list');
  if (hasListAlready) return false;

  // 変換
  const newContent = convertLongText(text);

  // 変換後もparagraphのみなら変化なし
  if (newContent.every(n => n.type === 'paragraph')) {
    return false;
  }

  props.content = newContent;
  return true;
}

/**
 * ファイルを処理
 */
function processFile(filePath: string): { converted: number; total: number } {
  const content = fs.readFileSync(filePath, 'utf-8');
  const artifact: Artifact = JSON.parse(content);

  if (!artifact.blocks || !Array.isArray(artifact.blocks)) {
    return { converted: 0, total: 0 };
  }

  let converted = 0;
  let total = 0;

  for (const block of artifact.blocks) {
    if (block.type === 'Section') {
      const props = block.props as { content?: RichTextNode[] };
      if (Array.isArray(props.content)) {
        const text = extractTextFromRichTextNodes(props.content);
        if (text.length >= TEXT_LENGTH_THRESHOLD) {
          total++;
          if (convertSectionContent(block)) {
            converted++;
          }
        }
      }
    }
  }

  if (converted > 0) {
    fs.writeFileSync(filePath, JSON.stringify(artifact, null, 2) + '\n', 'utf-8');
  }

  return { converted, total };
}

/**
 * ディレクトリを再帰的に処理
 */
function processDirectory(dir: string, stats: { files: number; converted: number; total: number }): void {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (!['_drafts', '_jobs', 'history', 'variables', 'data'].includes(entry.name)) {
        processDirectory(fullPath, stats);
      }
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      try {
        const result = processFile(fullPath);
        if (result.total > 0) {
          stats.files++;
          stats.converted += result.converted;
          stats.total += result.total;
          console.log(`  ${path.relative(process.cwd(), fullPath)}: ${result.converted}/${result.total} 変換`);
        }
      } catch (e) {
        console.error(`  エラー: ${fullPath}`, e);
      }
    }
  }
}

// メイン処理
const artifactsDir = path.join(process.cwd(), 'data/artifacts');
const stats = { files: 0, converted: 0, total: 0 };

console.log('80文字以上のSection contentをDADSリストコンポーネントに変換中...\n');

processDirectory(artifactsDir, stats);

console.log('\n' + '='.repeat(60));
console.log(`処理完了:`);
console.log(`  ファイル数: ${stats.files}`);
console.log(`  対象セクション: ${stats.total}`);
console.log(`  変換成功: ${stats.converted}`);
console.log(`  変換率: ${stats.total > 0 ? ((stats.converted / stats.total) * 100).toFixed(1) : 0}%`);
