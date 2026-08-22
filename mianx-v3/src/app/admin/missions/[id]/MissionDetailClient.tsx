"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  Loader2,
  Wallet,
  Target,
  ShieldCheck,
  Play,
} from "lucide-react";
import Link from "next/link";

// ─── Types ───────────────────────────────────────────────────────────────────

type MissionTask = {
  id: string;
  title: string;
  agent: string;
  dependencies: string;
  riskLevel: string;
  status: string;
  sortOrder: number;
};

type Mission = {
  id: string;
  rawGoal: string;
  normalizedGoal: string;
  status: string;
  complexity: string;
  successCriteria: unknown;
  budget: number;
  budgetUsed: number;
  tasks: MissionTask[];
};

// ─── Status Config ──────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: typeof Circle }> = {
  PENDING: { color: "text-yellow-400", bg: "bg-yellow-400/10", icon: Circle },
  IN_PROGRESS: { color: "text-blue-400", bg: "bg-blue-400/10", icon: Loader2 },
  COMPLETED: { color: "text-green-400", bg: "bg-green-400/10", icon: CheckCircle2 },
  FAILED: { color: "text-red-400", bg: "bg-red-400/10", icon: AlertTriangle },
  SKIPPED: { color: "text-zinc-500", bg: "bg-zinc-500/10", icon: Circle },
};

const RISK_COLORS: Record<string, string> = {
  LOW: "text-green-400 bg-green-400/10 border-green-400/20",
  MEDIUM: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  HIGH: "text-orange-400 bg-orange-400/10 border-orange-400/20",
};

// ─── Component ─────────────────────────────────────────────────────────────

export default function MissionDetailClient({ mission: initialMission }: { mission: Mission }) {
  const [mission, setMission] = useState<Mission>(initialMission);
  const [isRunning, setIsRunning] = useState(initialMission.status === "EXECUTING");
  const [runError, setRunError] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isExecutable =
    mission.status === "PLANNING" || mission.status === "REPAIRING";
  const isLive = mission.status === "EXECUTING";

  // ── Polling ────────────────────────────────────────────────────────────
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/missions/${mission.id}`);
        if (!res.ok) return;
        const data = await res.json();
        setMission(data.mission);

        // Stop polling when mission is no longer executing
        const status: string = data.mission.status;
        if (status !== "EXECUTING") {
          setIsRunning(false);
          stopPolling();
        }
      } catch {
        // Silently retry on next interval
      }
    }, 3000);
  }, [mission.id, stopPolling]);

  // Start polling if mission is already executing on mount
  useEffect(() => {
    if (initialMission.status === "EXECUTING") {
      startPolling();
    }
    return stopPolling;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Run Mission Handler ────────────────────────────────────────────────
  async function handleRunMission() {
    setRunError(null);
    setIsRunning(true);

    try {
      const res = await fetch(`/api/missions/${mission.id}/run`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      // Start polling for status updates
      startPolling();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to start mission";
      setRunError(message);
      setIsRunning(false);
    }
  }

  const criteria = Array.isArray(mission.successCriteria) ? mission.successCriteria : [];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back link */}
      <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Command Center
      </Link>

      {/* Mission Header */}
      <div className="bg-surface border border-border rounded-xl p-6 mb-8">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold mb-1">{mission.normalizedGoal}</h1>
            <p className="text-sm text-muted line-clamp-2">{mission.rawGoal}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span
              className={`
                px-2.5 py-1 rounded-full text-xs font-medium border
                ${STATUS_CONFIG[mission.status]?.bg ?? "bg-zinc-500/10"} ${STATUS_CONFIG[mission.status]?.color ?? "text-zinc-400"}
                border-current/20
              `}
            >
              {isLive ? (
                <span className="inline-flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  EXECUTING
                </span>
              ) : (
                mission.status
              )}
            </span>
          </div>
        </div>

        {/* Meta row + Run button */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
          <div className="flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5" />
            <span>Budget: ${mission.budget.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5" />
            <span>Complexity: {mission.complexity}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>{mission.tasks.length} tasks</span>
          </div>
          <Link href={`/admin/missions/${mission.id}/trust-center`}
            className="inline-flex items-center gap-1.5 text-sm text-[var(--color-accent-light)] hover:text-[var(--color-accent)] transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Trust Center
          </Link>

          {/* Run Mission Button */}
          {isExecutable && (
            <button
              onClick={handleRunMission}
              disabled={isRunning}
              className="
                ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-light)]
                disabled:opacity-50 disabled:cursor-not-allowed transition-colors
              "
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Run Mission
                </>
              )}
            </button>
          )}
        </div>

        {/* Run error */}
        {runError && (
          <div className="mt-3 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            {runError}
          </div>
        )}

        {/* Success Criteria */}
        {criteria.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-2">
              Success Criteria
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {criteria.map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>{String(c)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Task Timeline */}
      <div>
        <h2 className="text-sm font-medium text-muted uppercase tracking-wider mb-4">
          Task Graph
          {isLive && (
            <span className="ml-2 inline-flex items-center gap-1 text-blue-400">
              <Loader2 className="w-3 h-3 animate-spin" />
              Live
            </span>
          )}
        </h2>

        {mission.tasks.length === 0 ? (
          <p className="text-sm text-muted text-center py-8">
            No tasks generated yet.
          </p>
        ) : (
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-5 top-3 bottom-3 w-px bg-border" />

            <div className="space-y-3">
              {mission.tasks.map((task) => {
                const cfg = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.PENDING;
                const StatusIcon = cfg.icon;

                return (
                  <div
                    key={task.id}
                    className="relative flex gap-4 p-4 rounded-xl bg-surface border border-border hover:bg-surface-hover transition-colors"
                  >
                    {/* Status dot */}
                    <div
                      className={`
                        relative z-10 w-10 h-10 rounded-full ${cfg.bg} border-2 border-background
                        flex items-center justify-center flex-shrink-0
                      `}
                    >
                      <StatusIcon
                        className={`w-4 h-4 ${cfg.color} ${task.status === "IN_PROGRESS" ? "animate-spin" : ""}`}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-medium">{task.title}</h3>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span
                            className={`
                              px-2 py-0.5 rounded text-[10px] font-medium border
                              ${RISK_COLORS[task.riskLevel] ?? "text-zinc-400 bg-zinc-400/10 border-zinc-400/20"}
                            `}
                          >
                            {task.riskLevel}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${cfg.bg} ${cfg.color}`}>
                            {task.status}
                          </span>
                        </div>
                      </div>

                      {/* Agent badge */}
                      <div className="mt-2 flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center">
                          <span className="text-[9px] font-bold text-accent-light">
                            {task.agent.charAt(0)}
                          </span>
                        </div>
                        <span className="text-xs text-muted">{task.agent}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
