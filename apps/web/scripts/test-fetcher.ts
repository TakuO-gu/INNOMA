/**
 * Test LLM Fetcher - With page fetch
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
config({ path: '.env.local' });

import { searchMunicipalitySite, isOfficialDomain } from '../lib/llm/google-search';
import { generateSearchQuery } from '../lib/llm/prompts/query-generator';
import { extractFromSnippets, extractVariables } from '../lib/llm/prompts/extractor';
import { fetchPage, isUsefulUrl } from '../lib/llm/page-fetcher';
import { getServiceDefinition, getVariableDefinition } from '../lib/llm/variable-priority';

async function main() {
  console.log('=== LLM Fetcher Test (with page fetch) ===\n');

  const service = getServiceDefinition('kokuho');
  if (!service) {
    console.log('Service not found');
    return;
  }

  console.log('Service:', service.nameJa);
  console.log('Variables:', service.variables);

  // Generate search query
  const query = await generateSearchQuery('高岡市', service.nameJa, service.searchKeywords);
  console.log('Query:', query);

  // Search
  console.log('\nSearching...');
  const results = await searchMunicipalitySite('高岡市', query, 'https://www.city.takaoka.toyama.jp/');
  console.log('Results:', results.length);

  if (results.length === 0) {
    console.log('No search results');
    return;
  }

  // Find URLs to fetch
  const urlsToFetch = results
    .filter(r => isUsefulUrl(r.link) && isOfficialDomain(r.link))
    .slice(0, 2) // Only fetch 2 pages to minimize API usage
    .map(r => r.link);

  console.log('\nURLs to fetch:');
  for (const url of urlsToFetch) {
    console.log(`  - ${url}`);
  }

  // Prepare variable requests
  const variableRequests = service.variables.map(name => {
    const def = getVariableDefinition(name);
    return {
      variableName: name,
      description: def?.description || name,
      examples: def?.examples,
    };
  });

  // Fetch pages and extract
  console.log('\nFetching pages and extracting...');

  for (const url of urlsToFetch) {
    console.log(`\n  Fetching: ${url}`);
    try {
      const pageResult = await fetchPage(url);
      const pageContent = pageResult.content;
      console.log(`  Title: ${pageResult.title}`);
      console.log(`  Content length: ${pageContent.length} chars`);
      console.log(`  Preview: ${pageContent.substring(0, 200).replace(/\n/g, ' ')}...`);

      console.log('\n  Extracting variables (calling Gemini API)...');
      const extracted = await extractVariables(pageContent, url, variableRequests);

      console.log('  Extracted:');
      for (const v of extracted) {
        if (v.value) {
          console.log(`    - ${v.variableName}: ${v.value} (confidence: ${v.confidence})`);
        }
      }
    } catch (error) {
      console.error(`  Error: ${error}`);
    }
  }
}

main().catch(console.error);
