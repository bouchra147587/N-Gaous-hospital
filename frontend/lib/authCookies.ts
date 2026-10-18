import { cookies } from "next/headers";

// The JWT itself is httpOnly: JavaScript in the browser can never read it,
// which is what "avoid exposing long-lived credentials unnecessarily to
// JavaScript" (spec section 18) actually requires. `auth_role` is a small,
// non-sensitive companion cookie (just "citizen" | "admin") that middleware
// reads to make a fast redirect decision before a page renders. It carries
// no authority by itself — every admin API call is still independently
// authorized on the FastAPI backend using the real token.
const TOKEN_COOKIE = "access_token";
const ROLE_COOKIE = "auth_role";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days, should mirror ACCESS_TOKEN_EXPIRE_MINUTES

export async function setAuthCookies(token: string, role: string) {
  const store = await cookies();
  store.set(TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
  store.set(ROLE_COOKIE, role, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearAuthCookies() {
  const store = await cookies();
  store.delete(TOKEN_COOKIE);
  store.delete(ROLE_COOKIE);
}

export async function getAuthToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(TOKEN_COOKIE)?.value;
}

export { TOKEN_COOKIE, ROLE_COOKIE };
