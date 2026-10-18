import { NextRequest, NextResponse } from "next/server";
import { getAuthToken } from "@/lib/authCookies";

const API_URL =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000";

async function forward(request: NextRequest, path: string[]) {
  // Security: only plain path segments; block "..", encoded slashes, etc.
  if (!path.every((seg) => /^[A-Za-z0-9_\-.]+$/.test(seg) && seg !== ".." && seg !== ".")) {
    return NextResponse.json({ detail: "Bad request" }, { status: 400 });
  }
  const token = await getAuthToken();
  if (!token) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  const search = request.nextUrl.search;

  // The proxy lives at /api/proxy/[...path].
  // We map /api/proxy/<path> → ${API_URL}/api/<path>
  //   e.g. /api/proxy/uploads/departments
  //     →  http://localhost:8000/api/uploads/departments
  const targetUrl = `${API_URL}/api/${path.join("/")}${search}`;

  const method = request.method;
  const hasBody = method !== "GET" && method !== "HEAD";

  // ArrayBuffer (not .text()) so binary payloads — image uploads sent as
  // multipart/form-data — pass through byte-for-byte instead of being
  // corrupted by a UTF-8 decode/re-encode round trip.
  const body = hasBody ? await request.arrayBuffer() : undefined;

  // Forward the exact Content-Type header the client sent. For multipart
  // uploads this includes the boundary parameter, which is critical.
  const incomingContentType = request.headers.get("content-type");

  // Forward the Accept header so content negotiation works (JSON vs PDF).
  const accept = request.headers.get("accept");

  let upstream: Response;
  try {
    upstream = await fetch(targetUrl, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(hasBody && incomingContentType
          ? { "Content-Type": incomingContentType }
          : {}),
        ...(accept ? { Accept: accept } : {}),
      },
      body,
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ detail: "Backend unavailable" }, { status: 502 });
  }

  // Preserve the upstream content type and status.
  const contentType =
    upstream.headers.get("content-type") || "application/json";

  // Use arrayBuffer() so binary responses (future PDFs, images served
  // directly through the proxy) are not corrupted by a UTF-8 round trip.
  const buffer = await upstream.arrayBuffer();

  return new NextResponse(buffer, {
    status: upstream.status,
    headers: { "Content-Type": contentType },
  });
}

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
) {
  return forward(request, (await ctx.params).path);
}

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
) {
  return forward(request, (await ctx.params).path);
}

export async function PUT(
  request: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
) {
  return forward(request, (await ctx.params).path);
}

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
) {
  return forward(request, (await ctx.params).path);
}

export async function DELETE(
  request: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
) {
  return forward(request, (await ctx.params).path);
}