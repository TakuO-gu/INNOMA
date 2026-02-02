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
  const prompt = `${municipalityName} ${serviceName}の公式情報を検索するクエリを生成。
取得対象: ${targetInfo.join(', ')}
出力: 検索クエリのみ（1行）`;

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
  const variableList = variables.map((v) => `${v.name}: ${v.description}`).join(', ');

  const prompt = `${municipalityName} ${serviceName}の公式情報を検索するクエリを生成。
取得対象: ${variableList}
関連情報はまとめて1クエリにしてよい。
JSON出力: [{ "variableName": "変数名", "query": "検索クエリ" }, ...]`;

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
