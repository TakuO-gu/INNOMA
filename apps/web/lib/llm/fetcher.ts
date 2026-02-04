/**
 * Main LLM Fetcher
 * Orchestrates the information retrieval process
 */

import { searchMunicipalitySite, isOfficialDomain, calculateUrlCredibility } from './google-search';
import { generateSearchQuery } from './prompts/query-generator';
import { extractVariables, extractFromSnippets } from './prompts/extractor';
import { fetchPage, fetchPageWithPdfs, isUsefulUrl } from './page-fetcher';
import { validateVariable, calculateValidationConfidence } from './validators';
import { getServiceDefinition, serviceDefinitions, getVariableDefinition } from './variable-priority';
import { ExtractedVariable, ExtractionError, ExtractionResult, LLMFetchConfig, FetchJob, SearchResult, SearchAttemptRecord } from './types';
import { isConcreteValue } from './deep-search';
import { crawlForVariables } from './playwright-crawler';
import { generateJSON } from './gemini';
import { buildMissingVariableSuggestionPrompt } from './prompts/missing-variable-suggester';
import type { MissingVariableSuggestion } from '../drafts/types';

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
  const searchAttempts: Record<string, SearchAttemptRecord[]> = {};
  const relatedPdfUrls = new Set<string>();

  // Helper to record a search attempt for missing variables
  const recordSearchAttempt = (
    variableNames: string[],
    query: string,
    results: SearchResult[],
    reason: SearchAttemptRecord['reason']
  ) => {
    const attempt: SearchAttemptRecord = {
      query,
      searchedAt: new Date().toISOString(),
      resultsCount: results.length,
      urls: results.slice(0, 5).map(r => r.link),
      snippets: results.slice(0, 3).map(r => r.snippet),
      reason,
    };
    for (const varName of variableNames) {
      if (!searchAttempts[varName]) {
        searchAttempts[varName] = [];
      }
      searchAttempts[varName].push(attempt);
    }
  };

  try {
    // Generate search query for the service
    const query = await generateSearchQuery(municipalityName, service.nameJa, service.searchKeywords);

    // Search for relevant pages
    const searchResults = await searchMunicipalitySite(municipalityName, query, officialUrl);

    if (searchResults.length === 0) {
      // Record that no results were found for all variables in this service
      recordSearchAttempt(service.variables, query, [], 'not_found');
      errors.push({
        code: 'SEARCH_FAILED',
        message: `No search results for ${service.nameJa}`,
        retryable: true,
      });
      return { success: false, variables, errors, searchAttempts };
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
      // Find useful URLs to fetch (increased from 3 to 5)
      const urlsToFetch = searchResults
        .filter((r: SearchResult) => isUsefulUrl(r.link) && isOfficialDomain(r.link))
        .slice(0, 5)
        .map((r: SearchResult) => r.link);

      for (const url of urlsToFetch) {
        try {
          // ページとPDFリンクを取得 (increased from 2 to 4)
          const { page: pageContent, pdfContents } = await fetchPageWithPdfs(url, {
            fetchPdfs: true,
            maxPdfs: 4,
          });

          for (const pdf of pdfContents) {
            if (pdf.url) {
              relatedPdfUrls.add(pdf.url);
            }
          }

          const remainingVars = snippetResult.needsPageFetch.map((name) => {
            const def = getVariableDefinition(name);
            return {
              variableName: name,
              description: def?.description || name,
              examples: def?.examples,
            };
          });

          // まずHTMLページから抽出
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

          // HTMLから取得できなかった変数をPDFから抽出
          const stillMissingVars = remainingVars.filter(
            (v) => !variables.some((ev) => ev.variableName === v.variableName && ev.value)
          );

          if (stillMissingVars.length > 0 && pdfContents.length > 0) {
            for (const pdfContent of pdfContents) {
              if (stillMissingVars.length === 0) break;

              const pdfExtracted = await extractVariables(
                pdfContent.content,
                pdfContent.url,
                stillMissingVars
              );

              for (const extracted of pdfExtracted) {
                if (extracted.value) {
                  const urlCredibility = calculateUrlCredibility(pdfContent.url);
                  const validationResult = validateVariable(extracted.variableName, extracted.value);

                  if (validationResult.valid) {
                    extracted.confidence = Math.min(extracted.confidence + 0.2, 1.0);
                    if (validationResult.normalized) {
                      extracted.value = validationResult.normalized;
                    }
                  }

                  extracted.confidence = Math.min((extracted.confidence + urlCredibility) / 2, 1.0);

                  if (!variables.some((v) => v.variableName === extracted.variableName && v.value)) {
                    variables.push(extracted);
                    // 取得できた変数をリストから除外
                    const idx = stillMissingVars.findIndex(
                      (v) => v.variableName === extracted.variableName
                    );
                    if (idx >= 0) stillMissingVars.splice(idx, 1);
                  }
                }
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

    // Playwright Crawler: 具体的でない値があればページ内リンクを辿って探索
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

      // Playwright でページ内リンクを辿って探索
      if (targetVars.length > 0) {
        const firstUrl = searchResults[0].link;
        const crawlerResult = await crawlForVariables(
          firstUrl,
          targetVars,
          { maxPages: 3, maxLinksPerPage: 5, officialUrl }
        );

        // 取得した変数を追加
        for (const crawledVar of crawlerResult.variables) {
          const existingIndex = variables.findIndex(
            v => v.variableName === crawledVar.variableName
          );
          if (existingIndex >= 0) {
            // 既存の曖昧な値を上書き
            variables[existingIndex] = crawledVar;
          } else {
            variables.push(crawledVar);
          }
        }

        // Step 5b: Playwrightクローラーで発見したPDFから変数を抽出
        if (crawlerResult.pdfUrls && crawlerResult.pdfUrls.length > 0) {
          // まだ取得できていない変数を確認
          const stillMissingAfterCrawl = targetVars.filter(
            v => !variables.some(ev => ev.variableName === v.name && ev.value && isConcreteValue(v.name, ev.value))
          );

          if (stillMissingAfterCrawl.length > 0) {
            console.log(`[Fetcher] Processing ${crawlerResult.pdfUrls.length} PDFs found by crawler for ${stillMissingAfterCrawl.length} missing variables`);

            for (const pdfUrl of crawlerResult.pdfUrls.slice(0, 5)) {
              if (stillMissingAfterCrawl.length === 0) break;

              try {
                const pdfContent = await fetchPage(pdfUrl);
                if (pdfContent.error) continue;

                relatedPdfUrls.add(pdfUrl);

                const pdfExtracted = await extractVariables(
                  pdfContent.content,
                  pdfUrl,
                  stillMissingAfterCrawl.map(v => ({
                    variableName: v.name,
                    description: v.description,
                    examples: v.examples,
                  }))
                );

                for (const extracted of pdfExtracted) {
                  if (extracted.value && isConcreteValue(extracted.variableName, extracted.value)) {
                    const urlCredibility = calculateUrlCredibility(pdfUrl);
                    const validationResult = validateVariable(extracted.variableName, extracted.value);

                    if (validationResult.valid) {
                      extracted.confidence = Math.min(extracted.confidence + 0.2, 1.0);
                      if (validationResult.normalized) {
                        extracted.value = validationResult.normalized;
                      }
                    }

                    extracted.confidence = Math.min((extracted.confidence + urlCredibility) / 2, 1.0);

                    const existingIdx = variables.findIndex(v => v.variableName === extracted.variableName);
                    if (existingIdx >= 0) {
                      variables[existingIdx] = extracted;
                    } else {
                      variables.push(extracted);
                    }

                    // 取得できた変数をリストから除外
                    const idx = stillMissingAfterCrawl.findIndex(v => v.name === extracted.variableName);
                    if (idx >= 0) stillMissingAfterCrawl.splice(idx, 1);

                    console.log(`[Fetcher] Extracted from PDF: ${extracted.variableName} = ${extracted.value}`);
                  }
                }
              } catch (error) {
                console.error(`[Fetcher] Failed to process PDF ${pdfUrl}:`, error);
              }
            }
          }
        }
      }
    }

    // Record search attempts for variables that were not successfully extracted
    const extractedVarNames = new Set(variables.filter(v => v.value).map(v => v.variableName));
    let missingVarNames = service.variables.filter(name => !extractedVarNames.has(name));

    // 個別変数ごとの追加検索 (変数名を含む専用クエリで検索)
    if (missingVarNames.length > 0) {
      for (const varName of missingVarNames) {
        const def = getVariableDefinition(varName);
        if (!def) continue;

        // 変数専用の検索クエリを生成
        const varSpecificQuery = `${municipalityName} ${def.description}`;

        try {
          const varSearchResults = await searchMunicipalitySite(municipalityName, varSpecificQuery, officialUrl);

          if (varSearchResults.length > 0) {
            // 最大3つのURLを試行
            for (const result of varSearchResults.slice(0, 3)) {
              if (!isUsefulUrl(result.link)) continue;

              try {
                const { page: pageContent, pdfContents } = await fetchPageWithPdfs(result.link, {
                  fetchPdfs: true,
                  maxPdfs: 2,
                });
                for (const pdf of pdfContents) {
                  if (pdf.url) {
                    relatedPdfUrls.add(pdf.url);
                  }
                }

                const varExtracted = await extractVariables(
                  pageContent.content,
                  result.link,
                  [{ variableName: varName, description: def.description, examples: def.examples }]
                );

                for (const extracted of varExtracted) {
                  if (extracted.value && isConcreteValue(extracted.variableName, extracted.value)) {
                    const urlCredibility = calculateUrlCredibility(result.link);
                    const validationResult = validateVariable(extracted.variableName, extracted.value);

                    if (validationResult.valid) {
                      extracted.confidence = Math.min(extracted.confidence + 0.2, 1.0);
                      if (validationResult.normalized) {
                        extracted.value = validationResult.normalized;
                      }
                    }

                    extracted.confidence = Math.min((extracted.confidence + urlCredibility) / 2, 1.0);

                    if (!variables.some((v) => v.variableName === extracted.variableName && v.value)) {
                      variables.push(extracted);
                      // 取得できたので次の変数へ
                      break;
                    }
                  }
                }

                // PDFからも探索
                if (!variables.some((v) => v.variableName === varName && v.value)) {
                  for (const pdfContent of pdfContents) {
                    const pdfExtracted = await extractVariables(
                      pdfContent.content,
                      pdfContent.url,
                      [{ variableName: varName, description: def.description, examples: def.examples }]
                    );

                    for (const extracted of pdfExtracted) {
                      if (extracted.value && isConcreteValue(extracted.variableName, extracted.value)) {
                        const urlCredibility = calculateUrlCredibility(pdfContent.url);
                        extracted.confidence = Math.min((extracted.confidence + urlCredibility) / 2, 1.0);

                        if (!variables.some((v) => v.variableName === extracted.variableName && v.value)) {
                          variables.push(extracted);
                          break;
                        }
                      }
                    }

                    if (variables.some((v) => v.variableName === varName && v.value)) break;
                  }
                }

                // 取得できたら次の変数へ
                if (variables.some((v) => v.variableName === varName && v.value)) break;
              } catch {
                // Individual URL fetch failed, continue to next
              }
            }

            // 検索試行を記録
            recordSearchAttempt(
              [varName],
              varSpecificQuery,
              varSearchResults,
              variables.some((v) => v.variableName === varName && v.value) ? 'no_match' : 'no_match'
            );
          } else {
            recordSearchAttempt([varName], varSpecificQuery, [], 'not_found');
          }
        } catch {
          // Variable-specific search failed
          recordSearchAttempt([varName], varSpecificQuery, [], 'not_found');
        }
      }
    }

    // Step 6b: これまでに収集したすべてのPDFから、まだ取得できていない変数を抽出
    const afterStep6ExtractedVarNames = new Set(variables.filter(v => v.value).map(v => v.variableName));
    const afterStep6MissingVarNames = service.variables.filter(name => !afterStep6ExtractedVarNames.has(name));

    if (afterStep6MissingVarNames.length > 0 && relatedPdfUrls.size > 0) {
      console.log(`[Fetcher] Final PDF pass: ${relatedPdfUrls.size} PDFs for ${afterStep6MissingVarNames.length} missing variables`);

      const remainingVarsForPdf = afterStep6MissingVarNames.map(name => {
        const def = getVariableDefinition(name);
        return {
          variableName: name,
          description: def?.description || name,
          examples: def?.examples,
        };
      });

      // 未処理のPDFを優先（すでに抽出を試みたPDFは除外）
      for (const pdfUrl of Array.from(relatedPdfUrls).slice(0, 8)) {
        if (remainingVarsForPdf.length === 0) break;

        try {
          const pdfContent = await fetchPage(pdfUrl);
          if (pdfContent.error) continue;

          const pdfExtracted = await extractVariables(
            pdfContent.content,
            pdfUrl,
            remainingVarsForPdf
          );

          for (const extracted of pdfExtracted) {
            if (extracted.value && isConcreteValue(extracted.variableName, extracted.value)) {
              const urlCredibility = calculateUrlCredibility(pdfUrl);
              const validationResult = validateVariable(extracted.variableName, extracted.value);

              if (validationResult.valid) {
                extracted.confidence = Math.min(extracted.confidence + 0.2, 1.0);
                if (validationResult.normalized) {
                  extracted.value = validationResult.normalized;
                }
              }

              extracted.confidence = Math.min((extracted.confidence + urlCredibility) / 2, 1.0);

              if (!variables.some(v => v.variableName === extracted.variableName && v.value)) {
                variables.push(extracted);
                // 取得できた変数をリストから除外
                const idx = remainingVarsForPdf.findIndex(v => v.variableName === extracted.variableName);
                if (idx >= 0) remainingVarsForPdf.splice(idx, 1);

                console.log(`[Fetcher] Final PDF extraction: ${extracted.variableName} = ${extracted.value}`);
              }
            }
          }
        } catch (error) {
          console.error(`[Fetcher] Final PDF pass failed for ${pdfUrl}:`, error);
        }
      }
    }

    // 最終的な未取得変数を更新
    const finalExtractedVarNames = new Set(variables.filter(v => v.value).map(v => v.variableName));
    missingVarNames = service.variables.filter(name => !finalExtractedVarNames.has(name));

    // If there are missing variables that don't have search attempts yet, record the main query
    for (const varName of missingVarNames) {
      if (!searchAttempts[varName] || searchAttempts[varName].length === 0) {
        recordSearchAttempt([varName], query, searchResults, 'no_match');
      }
    }

    let missingSuggestions: Record<string, MissingVariableSuggestion> | undefined;
    if (missingVarNames.length > 0) {
      try {
        const prompt = buildMissingVariableSuggestionPrompt({
          municipalityName,
          serviceName: service.nameJa,
          variables: missingVarNames.map((name) => {
            const def = getVariableDefinition(name);
            return {
              variableName: name,
              description: def?.description || name,
              examples: def?.examples,
            };
          }),
          searchAttempts,
          relatedPdfs: Array.from(relatedPdfUrls),
        });

        const suggestionResponse = await generateJSON<{
          suggestions: Array<{
            variableName: string;
            reason: string;
            suggestedValue?: string | null;
            suggestedSourceUrl?: string | null;
            relatedUrls?: string[];
            relatedPdfs?: string[];
            confidence?: number;
          }>;
        }>(prompt, { maxOutputTokens: 1200 });

        missingSuggestions = {};
        for (const suggestion of suggestionResponse.suggestions || []) {
          if (!missingVarNames.includes(suggestion.variableName)) {
            continue;
          }
          missingSuggestions[suggestion.variableName] = {
            variableName: suggestion.variableName,
            reason: suggestion.reason,
            suggestedValue: suggestion.suggestedValue ?? null,
            suggestedSourceUrl: suggestion.suggestedSourceUrl ?? null,
            relatedUrls: suggestion.relatedUrls || [],
            relatedPdfs: suggestion.relatedPdfs || [],
            confidence: suggestion.confidence ?? 0.3,
            status: "suggested",
          };
        }
      } catch (error) {
        console.warn("Failed to generate missing variable suggestions:", error);
      }
    }

    return {
      success: errors.length === 0 || variables.length > 0,
      variables,
      errors,
      searchAttempts,
      missingSuggestions,
    };
  } catch (error) {
    errors.push({
      code: 'EXTRACTION_FAILED',
      message: error instanceof Error ? error.message : 'Unknown error',
      retryable: true,
    });
    return { success: false, variables, errors, searchAttempts };
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
