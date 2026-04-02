"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginAdmin } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@feedpulse.dev");
  const [password, setPassword] = useState("Admin@123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      setLoading(true);
      const result = await loginAdmin(email, password);
      localStorage.setItem("feedpulse_admin_token", result.token);
      router.push("/dashboard");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-wrap">
      <section className="hero">
        <h1>Admin Access</h1>
        <p>Use the seeded admin credentials from your backend environment to access dashboard controls.</p>
        <Link href="/" className="button ghost" style={{ display: "inline-block", marginTop: 10 }}>
          Back to Public Form
        </Link>
      </section>

      <section className="card" style={{ marginTop: 20, maxWidth: 560 }}>
        <h2>Sign in</h2>
        <form onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="error">{error}</p>}

          <button className="button primary" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}
