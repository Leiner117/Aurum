import { type NextRequest, NextResponse } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase/middleware";
import { PUBLIC_ROUTES, ROUTES } from "@/constants/routes.constants";

export async function middleware(request: NextRequest) {
  const { supabase, response } = await createMiddlewareClient(request);

  // Refresh session — required for Server Components to read auth state
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname === route);

  // Redirect unauthenticated users to login
  if (!user && !isPublicRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = ROUTES.LOGIN;
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect authenticated users away from auth pages
  if (user && isPublicRoute && pathname !== ROUTES.AUTH_CALLBACK) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = ROUTES.DASHBOARD;
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
