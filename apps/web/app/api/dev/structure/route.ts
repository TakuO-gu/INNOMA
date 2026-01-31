/**
 * Content Structure API (Development/Testing)
 *
 * URLまたは生コンテンツからブロック構造を生成するテスト用API
 *
 * POST /api/dev/structure
 * Body: { url?: string, content?: string, serviceName: string, municipalityName: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyzeAndStructure } from '@/lib/llm';
import { fetchPage } from '@/lib/llm/page-fetcher';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface RequestBody {
  url?: string;
  content?: string;
  serviceName: string;
  municipalityName: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { url, content, serviceName, municipalityName } = body;

    if (!serviceName || !municipalityName) {
      return NextResponse.json(
        { error: 'serviceName and municipalityName are required' },
        { status: 400 }
      );
    }

    if (!url && !content) {
      return NextResponse.json(
        { error: 'Either url or content is required' },
        { status: 400 }
      );
    }

    // URLが指定されている場合はページを取得
    let rawContent = content || '';
    let sourceUrl = url || '';

    if (url && !content) {
      try {
        const page = await fetchPage(url);
        rawContent = page.content;
        sourceUrl = url;
      } catch (fetchError) {
        return NextResponse.json(
          {
            error: 'Failed to fetch URL',
            details: fetchError instanceof Error ? fetchError.message : 'Unknown error',
          },
          { status: 400 }
        );
      }
    }

    // コンテンツを構造化
    const startTime = Date.now();
    const result = await analyzeAndStructure(rawContent, serviceName, municipalityName);
    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      sourceUrl,
      serviceName,
      municipalityName,
      summary: result.summary,
      blocks: result.blocks,
      blockCount: result.blocks.length,
      processingTimeMs: processingTime,
    });
  } catch (error) {
    console.error('Structure API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to structure content',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/dev/structure
 * API情報を返す
 */
export async function GET() {
  return NextResponse.json({
    name: 'Content Structure API',
    description: 'URLまたは生コンテンツからINNOMAブロック構造を生成',
    method: 'POST',
    body: {
      url: 'string (optional) - 取得するURL',
      content: 'string (optional) - 生コンテンツ（urlが指定されていない場合に使用）',
      serviceName: 'string (required) - サービス名（例: 住民票の写しの交付）',
      municipalityName: 'string (required) - 自治体名（例: 高岡市）',
    },
    response: {
      success: 'boolean',
      sourceUrl: 'string',
      summary: 'string - サービスの概要',
      blocks: 'Block[] - 生成されたブロック配列',
      blockCount: 'number',
      processingTimeMs: 'number',
    },
    example: {
      request: {
        url: 'https://www.city.takaoka.toyama.jp/shimin/juminhyo.html',
        serviceName: '住民票の写しの交付',
        municipalityName: '高岡市',
      },
    },
  });
}
