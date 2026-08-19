"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Rocket, Sparkles } from "lucide-react";

export default function CommandCenterPage() {
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleStartMission() {
    const trimmed = goal.trim();
    if (!trimmed) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/missions/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: trimmed }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Planning failed");
      }

      const data = (await res.json()) as { missionId: string };
      router.push(`/missions/${data.missionId}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] max-w-2xl mx-auto w-full">
      {/* Heading */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent-light text-xs font-medium mb-4">
          <Sparkles className="w-3 h-3" />
          AI-Powered Mission Planner
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
          What do you want to{" "}
          <span className="text-accent-light glow-text">accomplish</span> today?
        </h1>
        <p className="text-muted text-sm">
          Describe your goal in plain English. Our AI will build a structured plan and assign the right agents.
        </p>
      </div>

      {/* Input Area */}
      <div className="w-full relative">
        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="Build a SaaS dashboard with user auth, a PostgreSQL database, and Stripe billing integration..."
          rows={4}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleStartMission();
          }}
          className={`
            w-full bg-surface border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted/60
            resize-none focus:outline-none transition-all
            ${
              error
                ? "border-red-500/50 focus:border-red-500"
                : "border-border focus:border-accent glow-border"
            }
          `}
          disabled={loading}
        />

        {/* Error message */}
        {error && (
          <p className="text-red-400 text-xs mt-2 px-1">{error}</p>
        )}

        {/* Action bar */}
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-muted">
            Press <kbd className="px-1.5 py-0.5 rounded bg-surface-hover border border-border text-[10px]">Ctrl+Enter</kbd> to launch
          </span>
          <button
            onClick={handleStartMission}
            disabled={loading || !goal.trim()}
            className="
              inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium
              bg-accent hover:bg-accent-light text-white
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-colors
            "
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Planning...
              </>
            ) : (
              <>
                <Rocket className="w-4 h-4" />
                Start Mission
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
