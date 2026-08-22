"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Crosshair, Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (res?.error) {
        setError("Invalid email or password");
      } else {
        router.push("/admin");
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--color-accent)] mb-4">
            <Crosshair className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold">Sign in to MianX</h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">Command Center access</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm text-[var(--color-muted)] mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted)]/50 focus:outline-none focus:border-[var(--color-accent)]"
              placeholder="founder@mianx.ai"
            />
          </div>
          <div>
            <label className="block text-sm text-[var(--color-muted)] mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 pr-10 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted)]/50 focus:outline-none focus:border-[var(--color-accent)]"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-sm font-medium bg-[var(--color-accent)] hover:bg-[var(--color-accent-light)] text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in...
              </span>
            ) : (
              "Sign in"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
