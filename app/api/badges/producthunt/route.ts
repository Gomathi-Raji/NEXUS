import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cb = searchParams.get("t") || Date.now().toString();
    const upstream = `https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1004213&theme=dark&t=${encodeURIComponent(cb)}`;

    const resp = await fetch(upstream, {
      cache: "no-store",
      headers: {
        "User-Agent": "what-to-build-badge-proxy/1.0",
        "Accept": "image/svg+xml,image/*;q=0.8,*/*;q=0.5",
      },
    });

    const contentType = resp.headers.get("content-type") || "image/svg+xml";
    const arrayBuffer = await resp.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      status: resp.status,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_err) {
    return new NextResponse("", {
      status: 502,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "image/svg+xml",
      },
    });
  }
} 