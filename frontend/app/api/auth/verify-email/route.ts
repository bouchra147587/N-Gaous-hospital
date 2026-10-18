import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Public endpoint (no cookies involved): forwards only the expected fields.
export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null);
  if (!payload?.email || typeof payload.email !== "string") {
    return NextResponse.json({ detail: "GENERIC" }, { status: 400 });
  }
  const body: Record<string, string> = { email: payload.email };
  if ("verify-email" === "verify-email") body.code = String(payload.code ?? "");

  let upstream: Response;
  try {
    upstream = await fetch(`${API_URL}/api/auth/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ detail: "GENERIC" }, { status: 502 });
  }
  const data = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    return NextResponse.json(
      { detail: typeof data.detail === "string" ? data.detail : "GENERIC" },
      { status: upstream.status }
    );
  }
  return NextResponse.json({ ok: true });
}
