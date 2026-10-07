import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/staff/login") {
    return NextResponse.next();
  }

  if (pathname.startsWith("/staff")) {
    const session = request.cookies.get("queueless_staff_session");
    if (!session) {
      return NextResponse.redirect(new URL("/staff/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/staff/:path*"],
};
