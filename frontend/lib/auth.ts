export type UserRole = "citizen" | "admin" | "doctor";
export type AccountType = "admin" | "doctor";

export type AuthUser = {
  id: number;
  full_name: string;
  email: string;
  role: UserRole;
  doctor_id?: number | null;
};

// The backend sends stable error codes (e.g. "INVALID_CREDENTIALS") in
// `detail`; the UI translates them (see lib/accountI18n.ts).
async function handle(res: Response) {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof body.detail === "string" ? body.detail : "GENERIC");
  }
  return body;
}

// These call our own Next.js route handlers (app/api/auth/*), never the
// FastAPI backend directly. The handlers set an httpOnly cookie server-side
// and only ever return the user object here -- the access token itself is
// never exposed to browser JavaScript.

/** Doctors claim their doctor profile. The account then waits for admin approval. */
export async function doctorSignup(payload: {
  email: string;
  password: string;
  doctor_id: number;
}): Promise<{ status: "verify" }> {
  const res = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handle(res);
}

export async function verifyEmail(payload: { email: string; code: string }): Promise<void> {
  const res = await fetch("/api/auth/verify-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  await handle(res);
}

export async function resendCode(email: string): Promise<void> {
  const res = await fetch("/api/auth/resend-code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  await handle(res);
}

export async function login(payload: {
  email: string;
  password: string;
  account_type: AccountType;
}): Promise<{ user: AuthUser }> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handle(res);
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" });
}

export async function getMe(): Promise<AuthUser | null> {
  const res = await fetch("/api/auth/me", { cache: "no-store" });
  const body = await handle(res);
  return body.user ?? null;
}
