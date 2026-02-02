/**
 * Google Gemini API Client
 */

import { GeminiResponse } from './types';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_MODEL = 'gemini-2.0-flash';

/**
 * Gemini generation configuration
 */
interface GenerationConfig {
  temperature?: number;
  maxOutputTokens?: number;
  topP?: number;
  topK?: number;
}

/**
 * Generate content result with metadata
 */
interface GenerateContentResult {
  text: string;
  finishReason: string;
  truncated: boolean;
}

/**
 * Generate content using Gemini
 */
export async function generateContent(
  prompt: string,
  config: GenerationConfig = {}
): Promise<string> {
  const result = await generateContentWithMetadata(prompt, config);
  return result.text;
}

/**
 * Generate content with metadata (including finish reason)
 */
async function generateContentWithMetadata(
  prompt: string,
  config: GenerationConfig = {}
): Promise<GenerateContentResult> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GOOGLE_GEMINI_API_KEY is not set');
  }

  const url = `${GEMINI_API_URL}/${DEFAULT_MODEL}:generateContent?key=${apiKey}`;

  const body = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: config.temperature ?? 0.3,
      maxOutputTokens: config.maxOutputTokens ?? 2048,
      topP: config.topP ?? 0.8,
      topK: config.topK ?? 40,
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data: GeminiResponse = await response.json();

  if (data.error) {
    throw new Error(`Gemini API Error: ${data.error.message}`);
  }

  if (!data.candidates || data.candidates.length === 0) {
    throw new Error('No response from Gemini');
  }

  const candidate = data.candidates[0];
  if (!candidate.content?.parts?.[0]?.text) {
    throw new Error('Invalid response format from Gemini');
  }

  const finishReason = candidate.finishReason || 'UNKNOWN';
  const truncated = finishReason === 'MAX_TOKENS' || finishReason === 'LENGTH';

  return {
    text: candidate.content.parts[0].text,
    finishReason,
    truncated,
  };
}

/**
 * Generate structured JSON output
 */
export async function generateJSON<T>(
  prompt: string,
  config: GenerationConfig = {}
): Promise<T> {
  const jsonPrompt = `${prompt}

重要: JSON形式のみで回答してください。説明文やマークダウンは含めないでください。`;

  // デフォルトで8192トークンを確保（JSONは長くなりがち）
  const effectiveConfig = {
    ...config,
    temperature: config.temperature ?? 0.1,
    maxOutputTokens: config.maxOutputTokens ?? 8192,
  };

  const result = await generateContentWithMetadata(jsonPrompt, effectiveConfig);

  // 出力が途中で切れた場合は警告
  if (result.truncated) {
    console.warn(`[Gemini] Output truncated (finishReason: ${result.finishReason}). Consider increasing maxOutputTokens.`);
  }

  // Clean up response (remove markdown code blocks if present)
  let jsonString = result.text.trim();
  if (jsonString.startsWith('```json')) {
    jsonString = jsonString.slice(7);
  } else if (jsonString.startsWith('```')) {
    jsonString = jsonString.slice(3);
  }
  if (jsonString.endsWith('```')) {
    jsonString = jsonString.slice(0, -3);
  }
  jsonString = jsonString.trim();

  try {
    return JSON.parse(jsonString) as T;
  } catch {
    // 出力が途中で切れた場合は明確なエラーメッセージ
    if (result.truncated) {
      throw new Error(
        `Failed to parse Gemini response as JSON (output was truncated at ${result.finishReason}). ` +
        `Try increasing maxOutputTokens. Partial output: ${jsonString.slice(0, 200)}`
      );
    }
    throw new Error(`Failed to parse Gemini response as JSON: ${jsonString.slice(0, 200)}`);
  }
}
