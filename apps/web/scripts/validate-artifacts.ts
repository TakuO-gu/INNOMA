#!/usr/bin/env npx tsx
/**
 * Artifact Schema Validation & Auto-Fix CLI
 * CI用のスキーマバリデーションスクリプト
 *
 * Usage:
 *   npx tsx scripts/validate-artifacts.ts [options] [path]
 *   npm run validate:artifacts
 *
 * Options:
 *   --fix       Auto-fix common issues
 *   --verbose   Show detailed validation errors
 *   --help      Show help
 *
 * Examples:
 *   npx tsx scripts/validate-artifacts.ts data/artifacts/
 *   npx tsx scripts/validate-artifacts.ts --fix data/artifacts/sample-v2/
 */

import fs from "node:fs/promises";
import path from "node:path";
import { safeValidateArtifact } from "../lib/artifact/schema";

interface ValidationResult {
  file: string;
  valid: boolean;
  errors?: string[];
  fixes?: string[];
  fixed?: boolean;
}

interface FixContext {
  modified: boolean;
  fixes: string[];
}

// Category migration map (old values -> new service_category values)
const CATEGORY_MIGRATION: Record<string, string> = {
  childcare_parenting: "children",
  childcare: "children",
  parenting: "children",
  health: "welfare",
  elderly: "welfare",
  disability: "welfare",
  environment: "housing",
  business: "industry",
  tourism: "industry",
  safety: "disaster",
  uncategorized: "other",
};

// Valid service_category values (from schema.ts)
const VALID_SERVICE_CATEGORIES = new Set([
  "welfare",
  "health",
  "children",
  "housing",
  "environment",
  "business",
  "community",
  "safety",
  "government",
  "other",
]);

// Valid category values
const VALID_CATEGORIES = new Set([
  "life_event",
  "service",
  "facility",
  "emergency",
  "news",
  "other",
]);

async function findJsonFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  try {
    const stat = await fs.stat(dir);

    if (stat.isFile() && dir.endsWith(".json")) {
      return [dir];
    }

    if (!stat.isDirectory()) {
      return files;
    }

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

/**
 * Fix nested list items: [[{...}]] -> [{...}]
 */
function fixListItems(obj: unknown, ctx: FixContext): unknown {
  if (Array.isArray(obj)) {
    return obj.map((item) => fixListItems(item, ctx));
  }

  if (obj && typeof obj === "object") {
    const record = obj as Record<string, unknown>;

    // Fix list items nesting
    if (record.type === "list" && Array.isArray(record.items)) {
      const newItems: unknown[] = [];
      let modified = false;

      for (const item of record.items) {
        if (
          Array.isArray(item) &&
          item.length === 1 &&
          Array.isArray(item[0])
        ) {
          // [[{...}]] -> [{...}]
          newItems.push(item[0]);
          modified = true;
        } else {
          newItems.push(item);
        }
      }

      if (modified) {
        ctx.modified = true;
        ctx.fixes.push("Fixed nested list items structure");
        record.items = newItems;
      }
    }

    // Recursively process all properties
    for (const key of Object.keys(record)) {
      record[key] = fixListItems(record[key], ctx);
    }
  }

  return obj;
}

/**
 * Apply automatic fixes to artifact data
 */
function fixArtifact(data: Record<string, unknown>, ctx: FixContext): void {
  // Fix 1: category -> service_category migration
  if (data.category && !data.service_category) {
    const oldCategory = data.category as string;

    // Check if it needs migration
    if (CATEGORY_MIGRATION[oldCategory]) {
      data.service_category = CATEGORY_MIGRATION[oldCategory];
      delete data.category;
      ctx.modified = true;
      ctx.fixes.push(
        `Migrated category "${oldCategory}" to service_category "${data.service_category}"`
      );
    } else if (
      VALID_SERVICE_CATEGORIES.has(oldCategory) &&
      !VALID_CATEGORIES.has(oldCategory)
    ) {
      // It's a valid service_category value in wrong field
      data.service_category = oldCategory;
      delete data.category;
      ctx.modified = true;
      ctx.fixes.push(`Moved category "${oldCategory}" to service_category`);
    }
  }

  // Fix 2: Ensure schema_version exists
  if (!data.schema_version) {
    data.schema_version = "2.0";
    ctx.modified = true;
    ctx.fixes.push('Added missing schema_version "2.0"');
  }

  // Fix 3: Fix Title block props (title -> text)
  if (Array.isArray(data.blocks)) {
    for (const block of data.blocks) {
      if (
        block &&
        typeof block === "object" &&
        (block as Record<string, unknown>).type === "Title"
      ) {
        const props = (block as Record<string, unknown>).props as Record<
          string,
          unknown
        >;
        if (props && props.title && !props.text) {
          props.text = props.title;
          delete props.title;
          ctx.modified = true;
          ctx.fixes.push("Fixed Title block: props.title -> props.text");
        }
      }
    }

    // Fix 4: Fix list items nesting in blocks
    data.blocks = fixListItems(data.blocks, ctx) as unknown[];
  }
}

async function validateFile(
  filePath: string,
  options: { fix: boolean; verbose: boolean }
): Promise<ValidationResult> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    let data: unknown;

    try {
      data = JSON.parse(content);
    } catch (parseError) {
      return {
        file: filePath,
        valid: false,
        errors: [`Invalid JSON: ${(parseError as Error).message}`],
      };
    }

    if (typeof data !== "object" || data === null) {
      return {
        file: filePath,
        valid: false,
        errors: ["JSON root must be an object"],
      };
    }

    const record = data as Record<string, unknown>;
    const fixes: string[] = [];
    let fixed = false;

    // Apply fixes if requested
    if (options.fix) {
      const ctx: FixContext = { modified: false, fixes: [] };
      fixArtifact(record, ctx);

      if (ctx.modified) {
        fixes.push(...ctx.fixes);
        fixed = true;

        // Write back fixed content
        await fs.writeFile(filePath, JSON.stringify(record, null, 2) + "\n");
      }
    }

    // Validate against schema
    const result = safeValidateArtifact(record);

    if (result.success) {
      return { file: filePath, valid: true, fixes, fixed };
    }

    const errors = options.verbose
      ? result.error?.issues.map(
          (issue) => `${issue.path.join(".")}: ${issue.message}`
        )
      : [
          `${result.error?.issues.length} validation error(s)`,
          ...result.error!.issues.slice(0, 3).map(
            (issue) => `  - ${issue.path.join(".")}: ${issue.message}`
          ),
          ...(result.error!.issues.length > 3
            ? [`  ... and ${result.error!.issues.length - 3} more`]
            : []),
        ];

    return {
      file: filePath,
      valid: false,
      errors,
      fixes,
      fixed,
    };
  } catch (error) {
    return {
      file: filePath,
      valid: false,
      errors: [`Error: ${(error as Error).message}`],
    };
  }
}

function printHelp(): void {
  console.log(`
Artifact Schema Validation & Auto-Fix CLI

Usage:
  npx tsx scripts/validate-artifacts.ts [options] [path]

Options:
  --fix       Auto-fix common issues:
              - category -> service_category migration
              - List items nesting fixes [[{...}]] -> [{...}]
              - Title block props fixes (title -> text)
              - Missing schema_version
  --verbose   Show all validation errors (not just first 3)
  --help      Show this help

Examples:
  npx tsx scripts/validate-artifacts.ts data/artifacts/
  npx tsx scripts/validate-artifacts.ts --fix data/artifacts/sample-v2/
  npx tsx scripts/validate-artifacts.ts --verbose data/artifacts/sample-v2/page1.json
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  const options = {
    fix: args.includes("--fix"),
    verbose: args.includes("--verbose"),
    help: args.includes("--help"),
  };

  if (options.help) {
    printHelp();
    process.exit(0);
  }

  // Get path argument (non-flag argument)
  const targetPath =
    args.find((arg) => !arg.startsWith("--")) || "./data/artifacts";

  console.log(`\n🔍 Validating artifacts in: ${targetPath}`);
  if (options.fix) {
    console.log("   Auto-fix mode enabled");
  }
  console.log("");

  const files = await findJsonFiles(targetPath);

  if (files.length === 0) {
    console.log("No artifact files found.");
    process.exit(0);
  }

  const results: ValidationResult[] = [];

  for (const file of files) {
    const result = await validateFile(file, options);
    results.push(result);

    const relativePath = path.relative(process.cwd(), file);
    const fixedLabel = result.fixed ? " (fixed)" : "";

    if (result.valid) {
      console.log(`✅ ${relativePath}${fixedLabel}`);
      if (result.fixes && result.fixes.length > 0) {
        result.fixes.forEach((fix) => console.log(`   └─ Fixed: ${fix}`));
      }
    } else {
      console.log(`❌ ${relativePath}${fixedLabel}`);
      if (result.fixes && result.fixes.length > 0) {
        result.fixes.forEach((fix) => console.log(`   └─ Fixed: ${fix}`));
      }
      result.errors?.forEach((err) => console.log(`   └─ ${err}`));
    }
  }

  const valid = results.filter((r) => r.valid).length;
  const invalid = results.filter((r) => !r.valid).length;
  const fixed = results.filter((r) => r.fixed).length;

  console.log(`\n📊 Results: ${valid} valid, ${invalid} invalid`);
  if (options.fix && fixed > 0) {
    console.log(`   ${fixed} file(s) were auto-fixed`);
  }
  console.log("");

  if (invalid > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Validation failed:", error);
  process.exit(1);
});
