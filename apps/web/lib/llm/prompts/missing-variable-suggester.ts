/**
 * Prompt generator for missing variable suggestions
 */

import type { SearchAttempt } from "@/lib/drafts/types";

interface VariableInfo {
  variableName: string;
  description: string;
  examples?: string[];
}

interface SuggestionInput {
  municipalityName: string;
  serviceName: string;
  variables: VariableInfo[];
  searchAttempts: Record<string, SearchAttempt[]>;
  relatedPdfs: string[];
}

export function buildMissingVariableSuggestionPrompt(input: SuggestionInput): string {
  const attemptsSummary = Object.entries(input.searchAttempts).map(([name, attempts]) => {
    return {
      variableName: name,
      attempts: attempts.map((a) => ({
        query: a.query,
        resultsCount: a.resultsCount,
        urls: a.urls.slice(0, 3),
        snippets: a.snippets.slice(0, 2),
        reason: a.reason,
      })),
    };
  });

  return [
    "あなたは自治体サイトの情報収集を補助するAIです。",
    "見つからなかった変数に対して、管理者が判断できるように「理由」と「代替案」を提案してください。",
    "",
    "制約:",
    "- 事実が確認できない値は断定しない。",
    "- メールアドレスが見つからない場合は、問い合わせフォームURLを提案してよい。",
    "- 電話や住所などが不明な場合は、担当課の代表連絡先や公式ページURLを提案してよい。",
    "- 代替案がない場合は suggestedValue を null にする。",
    "- relatedUrls/relatedPdfs は入力から妥当なものを選ぶ。",
    "",
    `自治体: ${input.municipalityName}`,
    `サービス: ${input.serviceName}`,
    "",
    "未取得変数:",
    JSON.stringify(input.variables, null, 2),
    "",
    "検索試行:",
    JSON.stringify(attemptsSummary, null, 2),
    "",
    "関連PDF候補:",
    JSON.stringify(input.relatedPdfs.slice(0, 10), null, 2),
    "",
    "出力フォーマット（JSON）:",
    `{
  "suggestions": [
    {
      "variableName": "string",
      "reason": "string",
      "suggestedValue": "string | null",
      "suggestedSourceUrl": "string | null",
      "relatedUrls": ["string"],
      "relatedPdfs": ["string"],
      "confidence": 0.0
    }
  ]
}`
  ].join("\n");
}
