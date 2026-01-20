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
 * Generate content using Gemini
 */
export async function generateContent(
  prompt: string,
  config: GenerationConfig = {}
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set');
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

  return candidate.content.parts[0].text;
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

  const result = await generateContent(jsonPrompt, {
    ...config,
    temperature: config.temperature ?? 0.1, // Lower temperature for structured output
  });

  // Clean up response (remove markdown code blocks if present)
  let jsonString = result.trim();
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
    throw new Error(`Failed to parse Gemini response as JSON: ${jsonString.slice(0, 200)}`);
  }
}
