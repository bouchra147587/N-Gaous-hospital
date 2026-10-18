import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Doctor sign-up. It NEVER logs anyone in: the account is created inactive and
// waits for the administrator's approval, so no cookies are set here. The
// browser cannot choose a role -- the backend always creates role = doctor.
export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null);
  const doctorId = Number(payload?.doctor_id);
  if (!payload?.email || !payload?.password || !Number.isInteger(doctorId)) {
    return NextResponse.json({ detail: "GENERIC" }, { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${API_URL}/api/auth/doctor-signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: payload.email, password: payload.password, doctor_id: doctorId }),
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
  return NextResponse.json({ status: "verify" });
}
