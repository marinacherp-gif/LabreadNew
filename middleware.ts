import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const ADMIN_PATHS = ["/dashboard", "/catalog", "/settings", "/users"];
const SUPER_ADMIN_ONLY = ["/users"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const isAdminRoute = ADMIN_PATHS.some((p) => pathname.startsWith(p));
  if (!isAdminRoute) return NextResponse.next();

  if (!session?.user) {
    const signIn = new URL("/auth/signin", req.url);
    signIn.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signIn);
  }

  const isSuperAdminOnly = SUPER_ADMIN_ONLY.some((p) => pathname.startsWith(p));
  if (isSuperAdminOnly && session.user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/catalog/:path*", "/settings/:path*", "/users/:path*"],
};
