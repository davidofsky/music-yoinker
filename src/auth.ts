import NextAuth from "next-auth";

// Login is only enabled when an OIDC provider is configured.
export const authEnabled = !!process.env.AUTH_OIDC_ISSUER;

export const { handlers, auth, signIn } = NextAuth({
  trustHost: true,
  pages: { signIn: "/login", error: "/login" },
  providers: [{
    id: "oidc",
    name: "SSO",
    type: "oidc",
    issuer: process.env.AUTH_OIDC_ISSUER,
    clientId: process.env.AUTH_OIDC_CLIENT_ID,
    clientSecret: process.env.AUTH_OIDC_CLIENT_SECRET,
    checks: ["pkce", "state"], // Auth.js only sends PKCE for "oidc" by default; providers like Pocket ID also require `state`.
    authorization: { params: { scope: "openid" } },
    profile: (profile) => ({ id: profile.sub ?? undefined }),
  }],
});