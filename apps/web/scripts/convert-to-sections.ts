/**
 * RichText内のheadingをSectionブロックに変換するスクリプト
 *
 * 変換ルール:
 * 1. RichText.content内のheadingを検出
 * 2. heading以降のコンテンツを次のheadingまで収集
 * 3. Sectionブロックに変換
 * 4. RichTextブロックが空になったら削除
 */

import * as fs from "fs";
import * as path from "path";

interface RichTextNode {
  type: string;
  level?: number;
  text?: string;
  runs?: unknown[];
  items?: unknown[];
  ordered?: boolean;
  [key: string]: unknown;
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

function generateId(): string {
  return `section-${Math.random().toString(36).substr(2, 9)}`;
}

function convertRichTextToSections(blocks: Block[]): Block[] {
  const newBlocks: Block[] = [];

  for (const block of blocks) {
    if (block.type !== "RichText") {
      newBlocks.push(block);
      continue;
    }

    const content = block.props.content as RichTextNode[] | undefined;
    if (!content || !Array.isArray(content)) {
      newBlocks.push(block);
      continue;
    }

    // headingがあるかチェック
    const hasHeading = content.some(node => node.type === "heading");
    if (!hasHeading) {
      newBlocks.push(block);
      continue;
    }

    // headingで分割してSectionブロックを生成
    let currentSection: { heading: string; level: number; content: RichTextNode[] } | null = null;
    let preHeadingContent: RichTextNode[] = [];

    for (const node of content) {
      if (node.type === "heading") {
        // 前のセクションを保存
        if (currentSection) {
          newBlocks.push({
            id: generateId(),
            type: "Section",
            props: {
              heading: currentSection.heading,
              level: currentSection.level,
              content: currentSection.content,
            },
          });
        } else if (preHeadingContent.length > 0) {
          // heading前のコンテンツがあればRichTextとして保持
          newBlocks.push({
            id: block.id,
            type: "RichText",
            props: {
              content: preHeadingContent,
            },
          });
        }

        // 新しいセクション開始
        currentSection = {
          heading: (node.text as string) || "",
          level: (node.level as number) || 2,
          content: [],
        };
      } else if (currentSection) {
        // セクション内のコンテンツ
        currentSection.content.push(node);
      } else {
        // heading前のコンテンツ
        preHeadingContent.push(node);
      }
    }

    // 最後のセクションを保存
    if (currentSection) {
      newBlocks.push({
        id: generateId(),
        type: "Section",
        props: {
          heading: currentSection.heading,
          level: currentSection.level,
          content: currentSection.content,
        },
      });
    }
  }

  return newBlocks;
}

function processFile(filePath: string): boolean {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const artifact: Artifact = JSON.parse(content);

    if (!artifact.blocks || !Array.isArray(artifact.blocks)) {
      return false;
    }

    // headingを含むRichTextがあるかチェック
    const hasHeadingInRichText = artifact.blocks.some(block => {
      if (block.type !== "RichText") return false;
      const content = block.props.content as RichTextNode[] | undefined;
      if (!content || !Array.isArray(content)) return false;
      return content.some(node => node.type === "heading");
    });

    if (!hasHeadingInRichText) {
      return false;
    }

    // 変換実行
    const newBlocks = convertRichTextToSections(artifact.blocks);
    artifact.blocks = newBlocks;

    // ファイル書き込み
    fs.writeFileSync(filePath, JSON.stringify(artifact, null, 2) + "\n");
    return true;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return false;
  }
}

function findJsonFiles(dir: string): string[] {
  const files: string[] = [];

  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // 特定のディレクトリをスキップ
      if (["history", "variables", "_jobs", "_drafts"].includes(item)) {
        continue;
      }
      files.push(...findJsonFiles(fullPath));
    } else if (item.endsWith(".json") && !["meta.json", "districts.json", "variables.json"].includes(item)) {
      files.push(fullPath);
    }
  }

  return files;
}

// メイン処理
const artifactsDir = path.join(__dirname, "../data/artifacts");
const files = findJsonFiles(artifactsDir);

console.log(`Found ${files.length} JSON files to check`);

let converted = 0;
for (const file of files) {
  if (processFile(file)) {
    console.log(`Converted: ${path.relative(artifactsDir, file)}`);
    converted++;
  }
}

console.log(`\nDone! Converted ${converted} files.`);
