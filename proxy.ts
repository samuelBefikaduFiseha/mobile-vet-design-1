import { NextResponse, type NextRequest } from "next/server";

// Optimistic check only: real session validation happens in lib/auth.ts
// (every dashboard page and Server Action verifies the session in the database).
export function proxy(request: NextRequest) {
  if (!request.cookies.has("mv_session")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
