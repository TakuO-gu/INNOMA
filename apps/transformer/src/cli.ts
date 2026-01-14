#!/usr/bin/env node
import { Command } from 'commander';
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, basename } from 'path';
import { config } from 'dotenv';
import chalk from 'chalk';
import { MunicipalDataTransformer } from './transformer.js';
import type { CrawlerOutput } from './schemas.js';

// 環境変数の読み込み
config();

const program = new Command();

program
  .name('innoma-transform')
  .description('Transform crawler output to structured JSON using LLM')
  .version('1.0.0');

program
  .option('-i, --input <file>', 'Input JSON file from crawler')
  .option('--input-dir <dir>', 'Input directory containing multiple JSON files')
  .option('-o, --output <file>', 'Output JSON file (default: structured-data.json)')
  .option('--output-dir <dir>', 'Output directory for batch processing')
  .option('-m, --model <model>', 'LLM model to use (default: gpt-4o)', process.env.LLM_MODEL || 'gpt-4o')
  .option('-t, --temperature <number>', 'Temperature for LLM (default: 0.1)', '0.1')
  .option('-v, --verbose', 'Verbose output', false)
  .action(async (options) => {
    try {
      console.log(chalk.bold.cyan('\n🚀 INNOMA Transformer\n'));

      // バリデーション
      if (!options.input && !options.inputDir) {
        console.error(chalk.red('Error: Either --input or --input-dir must be specified'));
        process.exit(1);
      }

      if (options.input && options.inputDir) {
        console.error(chalk.red('Error: Cannot specify both --input and --input-dir'));
        process.exit(1);
      }

      // Transformerの初期化
      const transformer = new MunicipalDataTransformer({
        model: options.model,
        temperature: parseFloat(options.temperature),
        verbose: options.verbose,
      });

      console.log(chalk.gray(`Model: ${options.model}`));
      console.log(chalk.gray(`Temperature: ${options.temperature}\n`));

      // 単一ファイル処理
      if (options.input) {
        await processSingleFile(transformer, options.input, options.output, options.verbose);
      }

      // ディレクトリ一括処理
      if (options.inputDir) {
        await processDirectory(
          transformer,
          options.inputDir,
          options.outputDir || 'structured-output',
          options.verbose
        );
      }

      console.log(chalk.bold.green('\n✨ Transformation completed successfully!\n'));
    } catch (error) {
      console.error(chalk.red('\n❌ Error:'), error);
      process.exit(1);
    }
  });

/**
 * 単一ファイルの処理
 */
async function processSingleFile(
  transformer: MunicipalDataTransformer,
  inputFile: string,
  outputFile: string | undefined,
  verbose: boolean
) {
  if (verbose) {
    console.log(chalk.blue(`📖 Reading: ${inputFile}`));
  }

  const inputData: CrawlerOutput = JSON.parse(readFileSync(inputFile, 'utf-8'));

  if (verbose) {
    console.log(chalk.blue('🔄 Transforming...'));
  }

  const result = await transformer.transform(inputData);

  const output = outputFile || 'structured-data.json';
  writeFileSync(output, JSON.stringify(result, null, 2), 'utf-8');

  console.log(chalk.green(`✅ Output saved to: ${output}`));
  printSummary(result);
}

/**
 * ディレクトリ一括処理
 */
async function processDirectory(
  transformer: MunicipalDataTransformer,
  inputDir: string,
  outputDir: string,
  verbose: boolean
) {
  if (verbose) {
    console.log(chalk.blue(`📂 Processing directory: ${inputDir}`));
  }

  // JSONファイルの検索
  const files = findJsonFiles(inputDir);

  if (files.length === 0) {
    console.log(chalk.yellow('⚠️  No JSON files found in the input directory'));
    return;
  }

  console.log(chalk.blue(`Found ${files.length} JSON files\n`));

  // 出力ディレクトリの作成
  const { mkdirSync } = await import('fs');
  mkdirSync(outputDir, { recursive: true });

  // 一括処理
  const crawlerDataList: CrawlerOutput[] = files.map((file) => JSON.parse(readFileSync(file, 'utf-8')));

  const results = await transformer.transformBatch(crawlerDataList);

  // 結果の保存
  results.forEach((result, index) => {
    const inputFileName = basename(files[index], '.json');
    const outputFileName = join(outputDir, `${inputFileName}_structured.json`);
    writeFileSync(outputFileName, JSON.stringify(result, null, 2), 'utf-8');

    if (verbose) {
      console.log(chalk.green(`  ✅ ${outputFileName}`));
    }
  });

  console.log(chalk.green(`\n✅ Processed ${results.length} files`));
  console.log(chalk.gray(`Output directory: ${outputDir}`));

  // 合計サマリー
  const totalSummary = {
    news: results.reduce((sum, r) => sum + r.news.length, 0),
    events: results.reduce((sum, r) => sum + r.events.length, 0),
    procedures: results.reduce((sum, r) => sum + r.procedures.length, 0),
    facilities: results.reduce((sum, r) => sum + r.facilities.length, 0),
    contacts: results.reduce((sum, r) => sum + r.contacts.length, 0),
    emergencyInfo: results.reduce((sum, r) => sum + r.emergencyInfo.length, 0),
  };

  console.log(chalk.cyan('\n📊 Total Summary:'));
  console.log(chalk.gray(`  News: ${totalSummary.news}`));
  console.log(chalk.gray(`  Events: ${totalSummary.events}`));
  console.log(chalk.gray(`  Procedures: ${totalSummary.procedures}`));
  console.log(chalk.gray(`  Facilities: ${totalSummary.facilities}`));
  console.log(chalk.gray(`  Contacts: ${totalSummary.contacts}`));
  console.log(chalk.gray(`  Emergency: ${totalSummary.emergencyInfo}`));
}

/**
 * ディレクトリ内のJSONファイルを再帰的に検索
 */
function findJsonFiles(dir: string): string[] {
  const results: string[] = [];
  const files = readdirSync(dir);

  for (const file of files) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      results.push(...findJsonFiles(filePath));
    } else if (file.endsWith('.json')) {
      results.push(filePath);
    }
  }

  return results;
}

/**
 * サマリー表示
 */
function printSummary(result: any) {
  console.log(chalk.cyan('\n📊 Summary:'));
  console.log(chalk.gray(`  Municipality: ${result.metadata.municipality}`));
  console.log(chalk.gray(`  Confidence: ${(result.metadata.confidence * 100).toFixed(1)}%`));
  console.log(chalk.gray(`  Processing time: ${result.metadata.processingTimeMs}ms`));
  console.log(chalk.cyan('\n📋 Extracted data:'));
  console.log(chalk.gray(`  News: ${result.news.length}`));
  console.log(chalk.gray(`  Events: ${result.events.length}`));
  console.log(chalk.gray(`  Procedures: ${result.procedures.length}`));
  console.log(chalk.gray(`  Facilities: ${result.facilities.length}`));
  console.log(chalk.gray(`  Contacts: ${result.contacts.length}`));
  console.log(chalk.gray(`  Emergency: ${result.emergencyInfo.length}`));
}

program.parse();