/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cb = searchParams.get("cb") || Date.now().toString();
    const upstream = `https://peerlist.io/api/v1/projects/embed/PRJHKKD8BD7OG6OMMCQQPROKJDEMME?showUpvote=true&theme=dark&_cb=${encodeURIComponent(cb)}`;

    const resp = await fetch(upstream, {
      // Always bypass caches
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
        // Disable caches at every layer
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
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