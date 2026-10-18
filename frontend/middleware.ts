import { NextRequest, NextResponse } from "next/server";

const ADMIN_PREFIX = "/admin";
const CITIZEN_PREFIXES = ["/profile"];

// This middleware only ever *redirects for a better UX*. It must never be
// the sole gate: every admin/citizen API route independently re-checks the
// real JWT and role on the FastAPI backend (see spec sections 17 and 19).
// A user who bypasses this middleware entirely gains nothing — the backend
// still returns 401/403.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = request.cookies.get("auth_role")?.value;
  const isLoggedIn = Boolean(role);

  const isAdminRoute = pathname.startsWith(ADMIN_PREFIX) && pathname !== "/admin/login";
  const isCitizenRoute = CITIZEN_PREFIXES.some((p) => pathname.startsWith(p));

  if (isAdminRoute) {
    if (!isLoggedIn) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    if (role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/403";
      return NextResponse.redirect(url);
    }
  }

  if (isCitizenRoute && !isLoggedIn) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/profile/:path*"],
};
