/**
 * Draft Source Content API
 * GET: Fetch and return the content of a source URL
 */

import { NextRequest } from "next/server";
import { fetchPage } from "@/lib/llm/page-fetcher";

interface RouteParams {
  params: Promise<{
    municipalityId: string;
    service: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { municipalityId, service } = await params;
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return Response.json(
      { error: "URL parameter is required" },
      { status: 400 }
    );
  }

  // Validate URL
  try {
    new URL(url);
  } catch {
    return Response.json(
      { error: "Invalid URL format" },
      { status: 400 }
    );
  }

  try {
    const pageContent = await fetchPage(url);

    return Response.json({
      municipalityId,
      service,
      url: pageContent.url,
      title: pageContent.title,
      content: pageContent.content,
      contentType: pageContent.contentType || "html",
      fetchedAt: pageContent.fetchedAt,
      error: pageContent.error,
    });
  } catch (error) {
    console.error("Error fetching source content:", error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch source content",
        url,
      },
      { status: 500 }
    );
  }
}
