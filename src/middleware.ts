import { NextResponse } from "next/server";
import { auth, authEnabled } from "@/auth";

// return simple 401 for api calls and login-page for all other requests
export default authEnabled
  ? auth((req) => {
      if (req.auth) return;

      if (req.nextUrl.pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const login = new URL("/login", req.nextUrl.origin);
      login.searchParams.set("callbackUrl", req.nextUrl.href);
      return NextResponse.redirect(login);
    })
  : () => NextResponse.next();

export const config = {
  // Everything except the login page, Auth.js' own routes and static assets.
  matcher: ["/((?!login|api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpe?g|svg|ico|ttf)$).*)"],
};