#!/usr/bin/env npx tsx
/**
 * Artifact Schema Validation CLI
 * CI用のスキーマバリデーションスクリプト
 *
 * Usage:
 *   npx tsx scripts/validate-artifacts.ts [path]
 *   npm run validate:artifacts
 */

import fs from "node:fs/promises";
import path from "node:path";
import { safeValidateArtifact } from "../lib/artifact/schema";

interface ValidationResult {
  file: string;
  valid: boolean;
  errors?: string[];
}

async function findJsonFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        const subFiles = await findJsonFiles(fullPath);
        files.push(...subFiles);
      } else if (entry.isFile() && entry.name.endsWith(".json")) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }

  return files;
}

async function validateFile(filePath: string): Promise<ValidationResult> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    const data = JSON.parse(content);
    const result = safeValidateArtifact(data);

    if (result.success) {
      return { file: filePath, valid: true };
    }

    return {
      file: filePath,
      valid: false,
      errors: result.error?.issues.map(
        (issue) => `${issue.path.join(".")}: ${issue.message}`
      ),
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return {
        file: filePath,
        valid: false,
        errors: [`Invalid JSON: ${error.message}`],
      };
    }
    throw error;
  }
}

async function main(): Promise<void> {
  const targetPath = process.argv[2] || "./data/artifacts";

  console.log(`\n🔍 Validating artifacts in: ${targetPath}\n`);

  const files = await findJsonFiles(targetPath);

  if (files.length === 0) {
    console.log("No artifact files found.");
    process.exit(0);
  }

  const results: ValidationResult[] = [];

  for (const file of files) {
    const result = await validateFile(file);
    results.push(result);

    if (result.valid) {
      console.log(`✅ ${file}`);
    } else {
      console.log(`❌ ${file}`);
      result.errors?.forEach((err) => console.log(`   └─ ${err}`));
    }
  }

  const valid = results.filter((r) => r.valid).length;
  const invalid = results.filter((r) => !r.valid).length;

  console.log(`\n📊 Results: ${valid} valid, ${invalid} invalid\n`);

  if (invalid > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Validation failed:", error);
  process.exit(1);
});
