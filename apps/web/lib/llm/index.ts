/**
 * LLM Fetcher System
 * Main entry point for LLM-based information retrieval
 */

// Types
export * from './types';

// API Clients
export { googleSearch, searchMunicipalitySite, searchServiceInfo, isOfficialDomain, calculateUrlCredibility } from './google-search';
export { generateContent, generateJSON } from './gemini';

// Prompts
export { generateSearchQuery, generateServiceSearchQueries } from './prompts/query-generator';
export { extractVariables, extractFromSnippets, extractContactInfo, extractFeeInfo } from './prompts/extractor';
export {
  analyzeAndStructure,
  getRecommendedBlockType,
  COMPONENT_SELECTION_RULES,
  type InformationType,
  type StructuredInfo,
} from './prompts/content-structurer';

// Validators
export {
  validatePhone,
  validateEmail,
  validateUrl,
  validateFee,
  validateDate,
  validateTime,
  validatePercent,
  validatePostalCode,
  validateVariable,
  getValidator,
  calculateValidationConfidence,
} from './validators';

// Page Fetcher
export { fetchPage, fetchPages, isUsefulUrl } from './page-fetcher';
