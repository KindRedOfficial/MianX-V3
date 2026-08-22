import Link from "next/link";
import { Crosshair, Rocket, Shield, Zap } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)] flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 md:px-10 py-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)] flex items-center justify-center">
            <Crosshair className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg">MianX</span>
        </div>
        <Link
          href="/login"
          className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--color-accent)] hover:bg-[var(--color-accent-light)] text-white transition-colors"
        >
          Sign in
        </Link>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent-light)] text-xs font-medium mb-6">
          <Zap className="w-3 h-3" />
          AI-Powered Mission Planning
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
          Command Your
          <br />
          <span className="text-[var(--color-accent-light)]">AI Workforce</span>
        </h1>
        <p className="text-[var(--color-muted)] max-w-lg text-base md:text-lg mb-8">
          Describe your goal in plain English. MianX builds a structured plan,
          assembles the right agents, and executes — all from one command center.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium bg-[var(--color-accent)] hover:bg-[var(--color-accent-light)] text-white transition-colors"
        >
          <Rocket className="w-4 h-4" />
          Launch Command Center
        </Link>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-16 max-w-3xl w-full">
          {[
            {
              icon: Rocket,
              title: "Mission Planner",
              desc: "AI-driven goal decomposition into executable steps with agent assignment.",
            },
            {
              icon: Shield,
              title: "Trust Center",
              desc: "Real-time verification, confidence scoring, and audit trails for every action.",
            },
            {
              icon: Zap,
              title: "Agent Workforce",
              desc: "Specialized AI agents that execute tasks autonomously with full context.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-left"
            >
              <f.icon className="w-5 h-5 text-[var(--color-accent)] mb-3" />
              <h3 className="font-semibold text-sm mb-1">{f.title}</h3>
              <p className="text-xs text-[var(--color-muted)]">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-[var(--color-muted)] py-6">
        &copy; {new Date().getFullYear()} MianX.ai — All rights reserved.
      </footer>
    </div>
  );
}
