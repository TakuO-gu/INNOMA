/**
 * LLM Fetcher System
 * Main entry point for LLM-based information retrieval
 */

// Types
export * from './types';

// API Clients
export {
  googleSearch,
  searchMunicipalitySite,
  searchServiceInfo,
  isOfficialDomain,
  calculateUrlCredibility,
  getSearchProviderStatus,
  type SearchProvider,
  type SearchProviderStatus,
} from './google-search';
export { generateContent, generateJSON } from './gemini';

// Prompts
export { generateSearchQuery, generateServiceSearchQueries } from './prompts/query-generator';
export { extractVariables, extractFromSnippets, extractContactInfo, extractFeeInfo } from './prompts/extractor';
export {
  analyzeAndStructure,
  generateSmartAnswer,
  getRecommendedBlockType,
  COMPONENT_SELECTION_RULES,
  SERVICE_PAGE_RULES,
  GUIDE_PAGE_RULES,
  ANSWER_PAGE_RULES,
  FORBIDDEN_BLOCKS,
  type InformationType,
  type StructuredInfo,
  type StructureResultWithPassInfo,
  type LongTextInfo,
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

// Taxonomy Classifier (service_category判定)
export {
  classifyContent,
  classifyContentBatch,
  classifyByKeywords,
  toPageRegistryFormat,
  INNOMA_TAXONOMY,
  type TaxonomyCategory,
  type TaxonomyClassification,
  type ContentForClassification,
} from './prompts/taxonomy-classifier';

// Content Type Classifier (content_type判定: service/guide/answer)
export {
  // 基本分類
  classifyContentType,
  classifyContentTypeBatch,
  classifyContentTypeByKeywords,
  guessContentTypeFromTitle,
  // ページ分割分析
  analyzePageSplit,
  analyzePageSplitByKeywords,
  classifyAndSplitIfNeeded,
  classifyAndSplitBatch,
  // 追加ページ推奨
  recommendAdditionalPages,
  recommendAdditionalPagesBatch,
  recommendAdditionalPagesWithLLM,
  // 型定義
  type ContentType,
  type ContentTypeClassification,
  type ContentForTypeClassification,
  type PageSplitAnalysis,
  type SplitPageSuggestion,
  type AdditionalPageRecommendation,
  type PageAnalysisWithRecommendations,
} from './prompts/content-type-classifier';
