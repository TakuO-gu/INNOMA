/**
 * Main LLM Fetcher
 * Orchestrates the information retrieval process
 */

import { searchMunicipalitySite, isOfficialDomain, calculateUrlCredibility } from './google-search';
import { generateSearchQuery } from './prompts/query-generator';
import { extractVariables, extractFromSnippets } from './prompts/extractor';
import { fetchPage, isUsefulUrl } from './page-fetcher';
import { validateVariable, calculateValidationConfidence } from './validators';
import { getServiceDefinition, serviceDefinitions, getVariableDefinition } from './variable-priority';
import { ExtractedVariable, ExtractionError, ExtractionResult, LLMFetchConfig, FetchJob, SearchResult } from './types';
import { isConcreteValue, deepSearch, executeRefinedSearch } from './deep-search';

/**
 * Fetch variables for a municipality service
 */
export async function fetchServiceVariables(
  municipalityName: string,
  serviceId: string,
  officialUrl?: string
): Promise<ExtractionResult> {
  const service = getServiceDefinition(serviceId);
  if (!service) {
    return {
      success: false,
      variables: [],
      errors: [{ code: 'EXTRACTION_FAILED', message: `Unknown service: ${serviceId}`, retryable: false }],
    };
  }

  const variables: ExtractedVariable[] = [];
  const errors: ExtractionError[] = [];

  try {
    // Generate search query for the service
    const query = await generateSearchQuery(municipalityName, service.nameJa, service.searchKeywords);

    // Search for relevant pages
    const searchResults = await searchMunicipalitySite(municipalityName, query, officialUrl);

    if (searchResults.length === 0) {
      errors.push({
        code: 'SEARCH_FAILED',
        message: `No search results for ${service.nameJa}`,
        retryable: true,
      });
      return { success: false, variables, errors };
    }

    // Try to extract from snippets first
    const snippetData = searchResults.map((r: SearchResult) => ({
      title: r.title,
      snippet: r.snippet,
      url: r.link,
    }));

    const variableRequests = service.variables.map((name) => {
      const def = getVariableDefinition(name);
      return {
        variableName: name,
        description: def?.description || name,
        examples: def?.examples,
      };
    });

    const snippetResult = await extractFromSnippets(snippetData, variableRequests);

    // Add extracted variables with confidence adjustment
    for (const extracted of snippetResult.extracted) {
      if (extracted.value) {
        const urlCredibility = calculateUrlCredibility(extracted.sourceUrl);
        const validationConfidence = calculateValidationConfidence(
          extracted.variableName,
          extracted.value,
          extracted.confidence
        );
        extracted.confidence = Math.min((extracted.confidence + urlCredibility + validationConfidence) / 3, 1.0);
      }
      variables.push(extracted);
    }

    // Fetch full pages for variables that need more context
    if (snippetResult.needsPageFetch.length > 0) {
      // Find useful URLs to fetch
      const urlsToFetch = searchResults
        .filter((r: SearchResult) => isUsefulUrl(r.link) && isOfficialDomain(r.link))
        .slice(0, 3)
        .map((r: SearchResult) => r.link);

      for (const url of urlsToFetch) {
        try {
          const pageContent = await fetchPage(url);

          const remainingVars = snippetResult.needsPageFetch.map((name) => {
            const def = getVariableDefinition(name);
            return {
              variableName: name,
              description: def?.description || name,
              examples: def?.examples,
            };
          });

          const pageExtracted = await extractVariables(pageContent.content, url, remainingVars);

          for (const extracted of pageExtracted) {
            if (extracted.value) {
              const urlCredibility = calculateUrlCredibility(url);
              const validationResult = validateVariable(extracted.variableName, extracted.value);

              if (validationResult.valid) {
                extracted.confidence = Math.min(extracted.confidence + 0.2, 1.0);
                if (validationResult.normalized) {
                  extracted.value = validationResult.normalized;
                }
              }

              extracted.confidence = Math.min((extracted.confidence + urlCredibility) / 2, 1.0);

              // Only add if not already extracted
              if (!variables.some((v) => v.variableName === extracted.variableName && v.value)) {
                variables.push(extracted);
              }
            }
          }
        } catch (error) {
          errors.push({
            code: 'PAGE_FETCH_FAILED',
            message: `Failed to fetch ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            retryable: true,
          });
        }
      }
    }

    // Deep search: 具体的でない値があれば深堀り検索
    const vagueVariables = variables.filter(
      v => v.value && !isConcreteValue(v.variableName, v.value)
    );
    const missingVariables = service.variables.filter(
      name => !variables.some(v => v.variableName === name && v.value)
    );

    if ((vagueVariables.length > 0 || missingVariables.length > 0) && searchResults.length > 0) {
      const targetVars = [
        ...vagueVariables.map(v => {
          const def = getVariableDefinition(v.variableName);
          return {
            name: v.variableName,
            description: def?.description || v.variableName,
            examples: def?.examples,
          };
        }),
        ...missingVariables.map(name => {
          const def = getVariableDefinition(name);
          return {
            name,
            description: def?.description || name,
            examples: def?.examples,
          };
        }),
      ];

      // ページ内リンク探索による深堀り
      if (targetVars.length > 0) {
        const firstUrl = searchResults[0].link;
        const deepResult = await deepSearch(
          municipalityName,
          firstUrl,
          targetVars,
          { maxDepth: 2, maxPagesPerLevel: 2, officialUrl }
        );

        // 深堀りで取得した変数を追加
        for (const deepVar of deepResult.variables) {
          const existingIndex = variables.findIndex(
            v => v.variableName === deepVar.variableName
          );
          if (existingIndex >= 0) {
            // 既存の曖昧な値を上書き
            variables[existingIndex] = deepVar;
          } else {
            variables.push(deepVar);
          }
        }

        // まだ取得できていない変数があれば再検索
        const stillMissing = targetVars.filter(
          tv => !deepResult.variables.some(v => v.variableName === tv.name && isConcreteValue(v.variableName, v.value))
        );

        if (stillMissing.length > 0 && deepResult.suggestedQueries.length > 0) {
          // 最大2つの再検索を実行
          for (const query of deepResult.suggestedQueries.slice(0, 2)) {
            const refinedVars = await executeRefinedSearch(
              municipalityName,
              query,
              officialUrl
            );

            for (const refinedVar of refinedVars) {
              const existingIndex = variables.findIndex(
                v => v.variableName === refinedVar.variableName
              );
              if (existingIndex >= 0) {
                if (!isConcreteValue(variables[existingIndex].variableName, variables[existingIndex].value)) {
                  variables[existingIndex] = refinedVar;
                }
              } else {
                variables.push(refinedVar);
              }
            }
          }
        }
      }
    }

    return {
      success: errors.length === 0 || variables.length > 0,
      variables,
      errors,
    };
  } catch (error) {
    errors.push({
      code: 'EXTRACTION_FAILED',
      message: error instanceof Error ? error.message : 'Unknown error',
      retryable: true,
    });
    return { success: false, variables, errors };
  }
}

/**
 * Fetch all variables for a municipality
 */
export async function fetchAllVariables(config: LLMFetchConfig): Promise<FetchJob> {
  const jobId = `fetch-${config.municipalityId}-${Date.now()}`;
  const now = new Date().toISOString();

  const job: FetchJob = {
    id: jobId,
    municipalityId: config.municipalityId,
    status: 'running',
    progress: 0,
    totalVariables: 0,
    fetchedVariables: 0,
    errors: [],
    createdAt: now,
    updatedAt: now,
  };

  const allVariables: ExtractedVariable[] = [];
  const servicesToFetch = config.services || serviceDefinitions.map((s) => s.id);

  // Calculate total variables
  for (const serviceId of servicesToFetch) {
    const service = getServiceDefinition(serviceId);
    if (service) {
      job.totalVariables += service.variables.length;
    }
  }

  // Fetch each service
  for (let i = 0; i < servicesToFetch.length; i++) {
    const serviceId = servicesToFetch[i];

    try {
      const result = await fetchServiceVariables(
        config.municipalityName,
        serviceId,
        config.officialUrl
      );

      allVariables.push(...result.variables);
      job.fetchedVariables = allVariables.filter((v) => v.value !== null).length;
      job.errors.push(...result.errors);
    } catch (error) {
      job.errors.push({
        code: 'EXTRACTION_FAILED',
        message: `Service ${serviceId} failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        retryable: true,
      });
    }

    job.progress = Math.round(((i + 1) / servicesToFetch.length) * 100);
    job.updatedAt = new Date().toISOString();

    // Rate limiting between services
    if (i < servicesToFetch.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  job.status = job.errors.length > 0 && job.fetchedVariables === 0 ? 'failed' : 'completed';
  job.completedAt = new Date().toISOString();
  job.updatedAt = job.completedAt;

  return job;
}

/**
 * Fetch specific variables by name
 */
export async function fetchSpecificVariables(
  municipalityName: string,
  variableNames: string[],
  officialUrl?: string
): Promise<ExtractionResult> {
  const variables: ExtractedVariable[] = [];
  const errors: ExtractionError[] = [];

  // Group variables by service
  const variablesByService = new Map<string, string[]>();

  for (const varName of variableNames) {
    let foundService = false;
    for (const service of serviceDefinitions) {
      if (service.variables.includes(varName)) {
        const existing = variablesByService.get(service.id) || [];
        existing.push(varName);
        variablesByService.set(service.id, existing);
        foundService = true;
        break;
      }
    }

    if (!foundService) {
      // Variable not in any service, try generic search
      try {
        const def = getVariableDefinition(varName);
        const query = `${municipalityName} ${def?.description || varName}`;
        const searchResults = await searchMunicipalitySite(municipalityName, query, officialUrl);

        if (searchResults.length > 0) {
          const pageContent = await fetchPage(searchResults[0].link);
          const extracted = await extractVariables(pageContent.content, searchResults[0].link, [
            { variableName: varName, description: def?.description || varName },
          ]);
          variables.push(...extracted);
        }
      } catch (error) {
        errors.push({
          variableName: varName,
          code: 'EXTRACTION_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
          retryable: true,
        });
      }
    }
  }

  // Fetch variables grouped by service
  for (const [serviceId, vars] of variablesByService) {
    try {
      const result = await fetchServiceVariables(municipalityName, serviceId, officialUrl);

      // Filter to only requested variables
      const filtered = result.variables.filter((v) => vars.includes(v.variableName));
      variables.push(...filtered);
      errors.push(...result.errors);
    } catch (error) {
      errors.push({
        code: 'EXTRACTION_FAILED',
        message: `Service ${serviceId} failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        retryable: true,
      });
    }
  }

  return {
    success: variables.some((v) => v.value !== null),
    variables,
    errors,
  };
}
