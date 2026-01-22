/**
 * Draft Template API
 * GET: Return the sample service page with variable locations from template
 */

import { NextRequest } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

interface RouteParams {
  params: Promise<{
    municipalityId: string;
    service: string;
  }>;
}

interface Block {
  id: string;
  type: string;
  props: Record<string, unknown>;
}

interface PageData {
  title: string;
  description: string;
  blocks: Block[];
}

interface VariableLocation {
  blockId: string;
  blockType: string;
  propPath: string;
  context: string;
}

/**
 * Find all variable occurrences in a value (from template)
 */
function findVariablesInValue(
  value: unknown,
  blockId: string,
  blockType: string,
  propPath: string
): VariableLocation[] {
  const locations: VariableLocation[] = [];

  if (typeof value === "string") {
    const regex = /\{\{([^}]+)\}\}/g;
    while (regex.exec(value) !== null) {
      locations.push({
        blockId,
        blockType,
        propPath,
        context: value,
      });
    }
  } else if (Array.isArray(value)) {
    value.forEach((item, index) => {
      locations.push(
        ...findVariablesInValue(item, blockId, blockType, `${propPath}[${index}]`)
      );
    });
  } else if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, val]) => {
      locations.push(
        ...findVariablesInValue(val, blockId, blockType, `${propPath}.${key}`)
      );
    });
  }

  return locations;
}

/**
 * Service ID to page path mapping
 * Maps service IDs from variable-priority.ts to their page locations
 * First entry is the main/sample page, additional entries are related templates
 */
const serviceToPagePaths: Record<string, string[]> = {
  // Registration/Citizen services
  registration: ["registration/juminhyo.json"],
  // Health services
  health: ["health/kenshin.json", "health/kokuho.json", "health/kouki.json"],
  // Tax services
  tax: ["tax/juminzei.json"],
  // Childcare services
  childcare: ["childcare/nursery.json"],
  // Welfare services
  welfare: ["welfare/kaigo.json"],
  // Environment services - multiple templates with different variables
  environment: [
    "environment/gomi.json",
    "environment/sodaigomi.json",
    "environment/kaden-recycle.json",
  ],
  // Disaster prevention
  disaster: ["disaster/hinanjo.json"],
};

// Legacy mapping for backwards compatibility
const serviceToPagePath: Record<string, string> = {
  registration: "registration/juminhyo.json",
  health: "health/kenshin.json",
  tax: "tax/juminzei.json",
  childcare: "childcare/nursery.json",
  welfare: "welfare/kaigo.json",
  environment: "environment/gomi.json",
  disaster: "disaster/hinanjo.json",
};

/**
 * Get sample page path for a service
 */
function getSamplePagePath(service: string): string {
  const basePath = path.join(
    process.cwd(),
    "data",
    "artifacts",
    "sample",
    "services"
  );

  const mappedPath = serviceToPagePath[service];
  if (mappedPath) {
    return path.join(basePath, mappedPath);
  }

  // Fallback: try to find in a category folder with the same name
  return path.join(basePath, service, `${service}.json`);
}

/**
 * Get all template paths for a service (for collecting all variable locations)
 */
function getAllTemplatePaths(service: string): string[] {
  const basePath = path.join(
    process.cwd(),
    "data",
    "artifacts",
    "_templates",
    "services"
  );

  const mappedPaths = serviceToPagePaths[service];
  if (mappedPaths && mappedPaths.length > 0) {
    return mappedPaths.map((p) => path.join(basePath, p));
  }

  // Fallback: try to find in a category folder with the same name
  return [path.join(basePath, service, `${service}.json`)];
}

interface VariableLocationWithPage extends VariableLocation {
  pageId: string;
  pageTitle: string;
  pagePath: string;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { service } = await params;

  try {
    // Load the sample page (with actual values) - main template
    const samplePagePath = getSamplePagePath(service);
    const samplePageContent = await readFile(samplePagePath, "utf-8");
    const samplePage: PageData = JSON.parse(samplePageContent);

    // Load ALL templates for this service to find variable locations
    const templatePaths = getAllTemplatePaths(service);
    const variableLocations: Record<string, VariableLocationWithPage[]> = {};
    const relatedPages: Array<{
      pageId: string;
      pageTitle: string;
      pagePath: string;
    }> = [];

    for (const templatePath of templatePaths) {
      try {
        const templateContent = await readFile(templatePath, "utf-8");
        const template = JSON.parse(templateContent) as {
          page_id?: string;
          title?: string;
          path?: string;
          blocks: Block[];
        };

        const pageId = template.page_id || path.basename(templatePath, ".json");
        const pageTitle = template.title || pageId;
        const pagePath = template.path || `/${service}`;

        // Track related pages
        relatedPages.push({ pageId, pageTitle, pagePath });

        // Find all variable locations from this template
        for (const block of template.blocks) {
          const locations = findVariablesInValue(
            block.props,
            block.id,
            block.type,
            "props"
          );

          for (const location of locations) {
            const regex = /\{\{([^}]+)\}\}/g;
            let match;
            while ((match = regex.exec(location.context)) !== null) {
              const varName = match[1];
              if (!variableLocations[varName]) {
                variableLocations[varName] = [];
              }
              variableLocations[varName].push({
                ...location,
                pageId,
                pageTitle,
                pagePath,
              });
            }
          }
        }
      } catch {
        // Skip templates that can't be loaded
        console.warn(`Could not load template: ${templatePath}`);
      }
    }

    return Response.json({
      title: samplePage.title,
      description: samplePage.description,
      blocks: samplePage.blocks, // Use sample page blocks (with actual values)
      variableLocations, // Variable locations from ALL templates
      relatedPages, // List of all related pages for this service
      isSample: true,
    });
  } catch (error) {
    console.error("Error loading page:", error);
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to load page",
        service,
      },
      { status: 500 }
    );
  }
}
