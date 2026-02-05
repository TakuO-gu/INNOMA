/**
 * テンプレートから自治体ファイルへのブロック同期スクリプト
 *
 * 指定されたブロックIDの内容をテンプレートから自治体ファイルにコピーする
 */

import * as fs from 'fs';
import * as path from 'path';

interface Block {
  id: string;
  type: string;
  props: Record<string, unknown>;
}

interface Artifact {
  blocks: Block[];
  [key: string]: unknown;
}

// 同期対象のテンプレートファイルとブロックID
const SYNC_TARGETS = [
  {
    templatePath: 'data/artifacts/_templates/services/business/financing.json',
    blockIds: ['section-seido'],
    municipalityFile: 'financing.json',
  },
  {
    templatePath: 'data/artifacts/_templates/services/civic/audit-request.json',
    blockIds: ['section-qs57m4lrp'],
    municipalityFile: 'audit-request.json',
  },
  {
    templatePath: 'data/artifacts/_templates/services/driving/weight-tax.json',
    blockIds: ['section-refund'],
    municipalityFile: 'weight-tax.json',
  },
  {
    templatePath: 'data/artifacts/_templates/services/housing/housing-benefit.json',
    blockIds: ['section-r27eafeqo'],
    municipalityFile: 'housing-benefit.json',
  },
  {
    templatePath: 'data/artifacts/_templates/services/land/fishery.json',
    blockIds: ['section-aj08fbavk'],
    municipalityFile: 'fishery.json',
  },
  {
    templatePath: 'data/artifacts/_templates/services/nationality/japanese-class.json',
    blockIds: ['section-u7erpso3h'],
    municipalityFile: 'japanese-class.json',
  },
  {
    templatePath: 'data/artifacts/_templates/services/registration/mynumber.json',
    blockIds: ['section-pliv8hon5'],
    municipalityFile: 'mynumber.json',
  },
  {
    templatePath: 'data/artifacts/_templates/services/welfare/seikatsu-hogo.json',
    blockIds: ['section-5uhf5dede'],
    municipalityFile: 'seikatsu-hogo.json',
  },
];

function syncBlocks(): void {
  const artifactsDir = path.join(process.cwd(), 'data/artifacts');
  let totalUpdated = 0;

  for (const target of SYNC_TARGETS) {
    const templateFullPath = path.join(process.cwd(), target.templatePath);

    if (!fs.existsSync(templateFullPath)) {
      console.log(`テンプレートが見つかりません: ${target.templatePath}`);
      continue;
    }

    const templateData: Artifact = JSON.parse(fs.readFileSync(templateFullPath, 'utf-8'));
    const templateBlocks = new Map<string, Block>();

    for (const blockId of target.blockIds) {
      const block = templateData.blocks.find(b => b.id === blockId);
      if (block) {
        templateBlocks.set(blockId, block);
      }
    }

    if (templateBlocks.size === 0) {
      console.log(`対象ブロックが見つかりません: ${target.templatePath}`);
      continue;
    }

    // 自治体ディレクトリを走査
    const entries = fs.readdirSync(artifactsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name.startsWith('_')) continue; // _templates, _drafts等をスキップ

      const municipalityFilePath = path.join(artifactsDir, entry.name, target.municipalityFile);

      if (!fs.existsSync(municipalityFilePath)) continue;

      try {
        const municipalityData: Artifact = JSON.parse(fs.readFileSync(municipalityFilePath, 'utf-8'));
        let updated = false;

        for (const [blockId, templateBlock] of templateBlocks) {
          const blockIndex = municipalityData.blocks.findIndex(b => b.id === blockId);

          if (blockIndex !== -1) {
            // ブロックを置き換え
            municipalityData.blocks[blockIndex] = { ...templateBlock };
            updated = true;
          }
        }

        if (updated) {
          fs.writeFileSync(municipalityFilePath, JSON.stringify(municipalityData, null, 2) + '\n');
          console.log(`更新: ${entry.name}/${target.municipalityFile}`);
          totalUpdated++;
        }
      } catch (e) {
        console.error(`エラー: ${municipalityFilePath}`, e);
      }
    }
  }

  console.log(`\n合計 ${totalUpdated} ファイルを更新しました`);
}

syncBlocks();
