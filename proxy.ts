import { NextResponse, type NextRequest } from "next/server";
import { DEMO_USER_COOKIE } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";
import { updateSupabaseSession } from "@/lib/supabase/proxy";

function isPublicPath(pathname: string) {
  return (
    pathname === "/login" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  );
}

export async function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-acams-pathname", request.nextUrl.pathname);

  if (isPublicPath(request.nextUrl.pathname)) {
    if (hasSupabaseEnv()) {
      return updateSupabaseSession(request);
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  if (hasSupabaseEnv()) {
    const response = await updateSupabaseSession(request);
    const hasSessionCookie = request.cookies
      .getAll()
      .some((cookie) => cookie.name.startsWith("sb-"));

    if (!hasSessionCookie) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    return response;
  }

  if (!request.cookies.get(DEMO_USER_COOKIE)?.value) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
