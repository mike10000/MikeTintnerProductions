"use client";

import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center">
          <p className="text-muted">Loading...</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/portal";
  const initialTab = searchParams.get("tab") === "signup" ? "signup" : "login";

  const [tab, setTab] = useState<"login" | "signup">(initialTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const err = searchParams.get("error");
    if (err === "auth_failed") setError("Authentication failed. Please try again.");
  }, [searchParams]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.refresh();
    // Full page navigation ensures cookies propagate correctly in production (Vercel)
    window.location.href = redirect;
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          company_name: companyName,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.refresh();
    // Full page navigation ensures cookies propagate correctly in production (Vercel)
    window.location.href = redirect;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <Image
              src="/images/logo.png"
              alt="Mike Tintner Productions"
              width={80}
              height={80}
              className="mx-auto mb-4"
            />
          </Link>
          <h1 className="text-2xl font-bold text-white">Client Portal</h1>
          <p className="text-muted text-sm mt-1">
            Manage your projects, quotes, and invoices
          </p>
        </div>

        <div className="bg-slate-800/60 border border-blue-900/50 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex mb-6">
            <button
              onClick={() => setTab("login")}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                tab === "login"
                  ? "bg-primary text-white"
                  : "text-muted hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setTab("signup")}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                tab === "signup"
                  ? "bg-primary text-white"
                  : "text-muted hover:text-white"
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3 mb-4">
              {error}
            </div>
          )}

          {tab === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-white text-sm font-medium mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-white placeholder-muted focus:outline-none focus:border-primary transition-colors"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-white text-sm font-medium mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-white placeholder-muted focus:outline-none focus:border-primary transition-colors"
                  placeholder="Your password"
                />
                <Link
                  href={`/forgot-password${redirect !== "/portal" ? `?redirect=${encodeURIComponent(redirect)}` : ""}`}
                  className="block text-primary-light hover:text-white text-sm mt-1.5"
                >
                  Forgot password?
                </Link>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary-dark disabled:opacity-50 text-white py-2.5 rounded-lg font-medium transition-colors"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-white text-sm font-medium mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-white placeholder-muted focus:outline-none focus:border-primary transition-colors"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="block text-white text-sm font-medium mb-1.5">
                  Company / Organization
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-white placeholder-muted focus:outline-none focus:border-primary transition-colors"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-white text-sm font-medium mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-white placeholder-muted focus:outline-none focus:border-primary transition-colors"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-white text-sm font-medium mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-white placeholder-muted focus:outline-none focus:border-primary transition-colors"
                  placeholder="Min 6 characters"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary-dark disabled:opacity-50 text-white py-2.5 rounded-lg font-medium transition-colors"
              >
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-muted text-sm mt-6">
          <Link href="/" className="hover:text-white transition-colors">
            &larr; Back to website
          </Link>
        </p>
      </div>
    </div>
  );
}
