import { Button } from "antd";
import { redirect } from "next/navigation";
import { authEnabled, signIn } from "@/auth";

export default async function LoginPage({ searchParams }: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>
}) {
  if (!authEnabled) redirect("/");
  const { callbackUrl, error } = await searchParams;

  async function login() {
    "use server";
    await signIn("oidc", { redirectTo: callbackUrl || "/" });
  }

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
      {error && <p>Login failed, please try again.</p>}
      <form action={login}>
        <Button type="primary" size="large" htmlType="submit">Log in</Button>
      </form>
    </main>
  );
}