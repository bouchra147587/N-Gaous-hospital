import { NextRequest, NextResponse } from "next/server";
import { setAuthCookies } from "@/lib/authCookies";

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null);
  if (!payload?.email || !payload?.password) {
    return NextResponse.json({ detail: "INVALID_CREDENTIALS" }, { status: 400 });
  }
  const accountType = payload.account_type === "doctor" || payload.account_type === "admin" ? payload.account_type : undefined;

  let upstream: Response;
  try {
    upstream = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: payload.email, password: payload.password, account_type: accountType }),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ detail: "GENERIC" }, { status: 502 });
  }

  const data = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    return NextResponse.json({ detail: typeof data.detail === "string" ? data.detail : "GENERIC" }, { status: upstream.status });
  }

  await setAuthCookies(data.access_token, data.user.role);
  return NextResponse.json({ user: data.user });
}
