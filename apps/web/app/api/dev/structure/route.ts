/**
 * Content Structure API (Development/Testing)
 *
 * URLまたは生コンテンツからブロック構造を生成するテスト用API
 * ContentType（service/guide/answer）に応じた特化ルールを適用
 *
 * POST /api/dev/structure
 * Body: { url?, content?, serviceName, municipalityName, contentType? }
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyzeAndStructure, generateSmartAnswer, type StructureResultWithPassInfo } from '@/lib/llm';
import { fetchPage } from '@/lib/llm/page-fetcher';
import type { ContentType } from '@/lib/llm/prompts/content-type-classifier';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface RequestBody {
  url?: string;
  content?: string;
  serviceName: string;
  municipalityName: string;
  contentType?: ContentType;
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { url, content, serviceName, municipalityName, contentType } = body;

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

    // コンテンツを構造化（ContentTypeに応じてルーティング）
    const startTime = Date.now();
    let result: { blocks: unknown[]; summary: string; passInfo?: StructureResultWithPassInfo['passInfo'] };

    if (contentType === 'answer') {
      // Answer Page: SmartAnswer専用生成
      result = await generateSmartAnswer(rawContent, serviceName, municipalityName);
    } else {
      // Service/Guide Page: 既存ロジック + ページタイプ特化ルール + Pass情報
      const structureResult = await analyzeAndStructure(rawContent, serviceName, municipalityName, contentType);
      result = {
        blocks: structureResult.blocks,
        summary: structureResult.summary,
        passInfo: structureResult.passInfo,
      };
    }

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      sourceUrl,
      serviceName,
      municipalityName,
      contentType: contentType || 'guide', // デフォルトはguide
      summary: result.summary,
      blocks: result.blocks,
      blockCount: result.blocks.length,
      processingTimeMs: processingTime,
      // Pass情報（デバッグ用）
      passInfo: result.passInfo ? {
        initialBlockCount: result.passInfo.initialBlocks.length,
        pass1BlockCount: result.passInfo.pass1Blocks.length,
        pass1LongTextCount: result.passInfo.pass1LongTexts.length,
        pass1LongTexts: result.passInfo.pass1LongTexts,
        pass2BlockCount: result.passInfo.pass2Blocks.length,
        pass2LongTextCount: result.passInfo.pass2LongTexts.length,
        pass2LongTexts: result.passInfo.pass2LongTexts,
        // 詳細ブロック（オプション）
        initialBlocks: result.passInfo.initialBlocks,
        pass1Blocks: result.passInfo.pass1Blocks,
        pass2Blocks: result.passInfo.pass2Blocks,
      } : undefined,
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
    description: 'URLまたは生コンテンツからINNOMAブロック構造を生成（ContentType対応）',
    method: 'POST',
    body: {
      url: 'string (optional) - 取得するURL',
      content: 'string (optional) - 生コンテンツ（urlが指定されていない場合に使用）',
      serviceName: 'string (required) - サービス名（例: 住民票の写しの交付）',
      municipalityName: 'string (required) - 自治体名（例: 高岡市）',
      contentType: 'string (optional) - "service" | "guide" | "answer"（デフォルト: guide）',
    },
    response: {
      success: 'boolean',
      sourceUrl: 'string',
      contentType: 'string - 適用されたページタイプ',
      summary: 'string - サービスの概要',
      blocks: 'Block[] - 生成されたブロック配列',
      blockCount: 'number',
      processingTimeMs: 'number',
    },
    contentTypes: {
      service: '行動ページ - 申請・登録などの行動を促す。CTAが主役。',
      guide: '理解ページ - 制度や仕組みを理解させる。見出しで80%理解。',
      answer: '判定ページ - 対象かどうかを判定。SmartAnswerで質問→結果。',
    },
    example: {
      request: {
        url: 'https://www.city.takaoka.toyama.jp/shimin/juminhyo.html',
        serviceName: '住民票の写しの交付',
        municipalityName: '高岡市',
        contentType: 'service',
      },
    },
  });
}
