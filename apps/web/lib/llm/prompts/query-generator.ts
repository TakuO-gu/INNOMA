/**
 * Search Query Generation Prompts
 */

import { generateContent } from '../gemini';

/**
 * Generate optimal search query for finding municipality service information
 */
export async function generateSearchQuery(
  municipalityName: string,
  serviceName: string,
  targetInfo: string[]
): Promise<string> {
  const prompt = `あなたは日本の自治体サービス情報を検索するアシスタントです。

以下の情報を取得するための最適なGoogle検索クエリを生成してください。

自治体名: ${municipalityName}
サービス: ${serviceName}
取得したい情報:
${targetInfo.map((info) => `- ${info}`).join('\n')}

要件:
- 検索クエリは1行のみ出力
- 公式サイトが見つかりやすいキーワードを使用
- 一般的な表現を使用（専門用語は避ける）
- 「site:」指定は含めない

出力: 検索クエリのみ（説明不要）`;

  const query = await generateContent(prompt, { temperature: 0.3 });
  return query.trim();
}

/**
 * Generate search queries for multiple variables in a service
 */
export async function generateServiceSearchQueries(
  municipalityName: string,
  serviceName: string,
  variables: { name: string; description: string }[]
): Promise<{ variableName: string; query: string }[]> {
  const prompt = `あなたは日本の自治体サービス情報を検索するアシスタントです。

以下の自治体・サービスの情報を取得するための検索クエリを生成してください。

自治体名: ${municipalityName}
サービス: ${serviceName}

取得したい情報:
${variables.map((v) => `- ${v.name}: ${v.description}`).join('\n')}

要件:
- 各変数に対して最適な検索クエリを生成
- 関連する情報はまとめて1つのクエリにしてよい
- 公式サイトが見つかりやすいキーワードを使用

JSON形式で出力:
[
  { "variableName": "変数名", "query": "検索クエリ" },
  ...
]`;

  const response = await generateContent(prompt, { temperature: 0.2 });

  // Parse JSON response
  let jsonString = response.trim();
  if (jsonString.startsWith('```json')) {
    jsonString = jsonString.slice(7);
  } else if (jsonString.startsWith('```')) {
    jsonString = jsonString.slice(3);
  }
  if (jsonString.endsWith('```')) {
    jsonString = jsonString.slice(0, -3);
  }

  try {
    return JSON.parse(jsonString.trim());
  } catch {
    // Fallback: generate individual queries
    return variables.map((v) => ({
      variableName: v.name,
      query: `${municipalityName} ${serviceName} ${v.description}`,
    }));
  }
}
