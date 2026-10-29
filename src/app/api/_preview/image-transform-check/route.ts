import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SAMPLE_OBJECT_PATH =
  "artworks-public/artworks/dd1f12b2-94e7-4d8e-bfef-64aab96826ba/155c0dc3-7efa-4043-9ce6-20c41dcdbd35.webp";

/**
 * Preview-only diagnostic. Remove this route before merging.
 * Confirms whether Supabase Image Transformation is enabled for this project.
 */
export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    return NextResponse.json({ enabled: false, reason: "SUPABASE_URL missing" }, { status: 500 });
  }

  const url = new URL(`/storage/v1/render/image/public/${SAMPLE_OBJECT_PATH}`, supabaseUrl);
  url.searchParams.set("width", "384");
  url.searchParams.set("quality", "85");
  url.searchParams.set("resize", "contain");

  try {
    const response = await fetch(url, { cache: "no-store" });
    const body = await response.arrayBuffer();
    return NextResponse.json({
      enabled: response.ok,
      status: response.status,
      contentType: response.headers.get("content-type"),
      contentLength: response.headers.get("content-length"),
      bytesReceived: body.byteLength,
      cacheControl: response.headers.get("cache-control"),
      reason: response.ok ? undefined : new TextDecoder().decode(body.slice(0, 500)),
    });
  } catch (error) {
    return NextResponse.json({
      enabled: false,
      reason: error instanceof Error ? error.message : "Unknown fetch failure",
    }, { status: 502 });
  }
}
