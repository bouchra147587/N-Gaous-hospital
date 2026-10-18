import { NextResponse } from "next/server";
import { getAuthToken, clearAuthCookies } from "@/lib/authCookies";

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function GET() {
  const token = await getAuthToken();
  if (!token) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  if (upstream.status === 401) {
    // Token expired or invalid — clear the stale cookie rather than leaving
    // the client stuck believing it's logged in.
    await clearAuthCookies();
    return NextResponse.json({ user: null }, { status: 200 });
  }

  if (!upstream.ok) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  const user = await upstream.json();
  return NextResponse.json({ user });
}
