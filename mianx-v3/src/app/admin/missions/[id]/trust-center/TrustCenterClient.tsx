"use client";

import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Target,
} from "lucide-react";
import Link from "next/link";

// ─── Types ─────────────────────────────────────────────────────────────────

type OutcomeStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "NEAR_TARGET"
  | "ACHIEVED"
  | "FAILED";

interface MissionData {
  id: string;
  normalizedGoal: string;
  status: string;
}

interface AuditLogRow {
  id: string;
  missionId: string;
  agentName: string;
  action: string;
  result: string;
  cost: number;
  createdAt: string;
}

interface OutcomeData {
  id: string;
  missionId: string;
  baseline: number;
  target: number;
  current: number;
  status: OutcomeStatus;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function computeProgress(baseline: number, target: number, current: number): number {
  const totalDelta = Math.abs(target - baseline);
  if (totalDelta === 0) return current >= target ? 100 : 0;
  const currentDelta = Math.abs(current - baseline);
  return Math.min(Math.max(Math.round((currentDelta / totalDelta) * 100), 0), 100);
}

const STATUS_CONFIG: Record<
  OutcomeStatus,
  { label: string; color: string; bg: string; icon: typeof CheckCircle2 }
> = {
  NOT_STARTED: {
    label: "Not Started",
    color: "text-zinc-400",
    bg: "bg-zinc-800/60",
    icon: Clock,
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "text-blue-400",
    bg: "bg-blue-900/30",
    icon: Target,
  },
  NEAR_TARGET: {
    label: "Near Target",
    color: "text-amber-400",
    bg: "bg-amber-900/30",
    icon: AlertTriangle,
  },
  ACHIEVED: {
    label: "Achieved",
    color: "text-emerald-400",
    bg: "bg-emerald-900/30",
    icon: CheckCircle2,
  },
  FAILED: {
    label: "Failed",
    color: "text-red-400",
    bg: "bg-red-900/30",
    icon: XCircle,
  },
};

function formatCost(cost: number): string {
  return `$${cost.toFixed(4)}`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function TrustCenterClient({
  mission,
  auditLogs,
  outcome,
}: {
  mission: MissionData;
  auditLogs: AuditLogRow[];
  outcome: OutcomeData | null;
}) {
  const progress = outcome
    ? computeProgress(outcome.baseline, outcome.target, outcome.current)
    : 0;
  const statusCfg = outcome ? STATUS_CONFIG[outcome.status] : null;
  const StatusIcon = statusCfg?.icon ?? Clock;

  return (
    <div className="space-y-8">
      {/* Back link */}
      <Link
        href={`/admin/missions/${mission.id}`}
        className="inline-flex items-center gap-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Mission
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Trust Center</h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Transparent audit log for mission: &ldquo;{mission.normalizedGoal}&rdquo;
        </p>
      </div>

      {/* Outcome Card */}
      {outcome && (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Mission Outcome</h2>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${statusCfg?.bg ?? ""} ${statusCfg?.color ?? ""}`}
            >
              <StatusIcon className="h-3.5 w-3.5" />
              {statusCfg?.label ?? "Unknown"}
            </span>
          </div>

          {/* Metrics row */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider">
                Baseline
              </p>
              <p className="mt-1 text-2xl font-bold">
                {outcome.baseline.toFixed(1)}
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider">
                Current
              </p>
              <p className="mt-1 text-2xl font-bold text-[var(--color-accent-light)]">
                {outcome.current.toFixed(1)}
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider">
                Target
              </p>
              <p className="mt-1 text-2xl font-bold text-emerald-400">
                {outcome.target.toFixed(1)}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-[var(--color-muted)]">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progress}%`,
                  backgroundColor:
                    progress >= 100
                      ? "#34d399"
                      : progress >= 90
                        ? "#fbbf24"
                        : "var(--color-accent)",
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Audit Log Table */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--color-border)]">
          <h2 className="text-lg font-semibold">Activity Log</h2>
          <p className="mt-0.5 text-xs text-[var(--color-muted)]">
            {auditLogs.length} event{auditLogs.length !== 1 ? "s" : ""} recorded
          </p>
        </div>

        {auditLogs.length === 0 ? (
          <div className="px-6 py-16 text-center text-[var(--color-muted)]">
            <Clock className="mx-auto h-8 w-8 mb-3 opacity-40" />
            <p className="text-sm">No audit events recorded yet.</p>
            <p className="text-xs mt-1">
              Events will appear here as agents work on this mission.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-left text-xs text-[var(--color-muted)] uppercase tracking-wider">
                  <th className="px-6 py-3 font-medium">Timestamp</th>
                  <th className="px-6 py-3 font-medium">Agent</th>
                  <th className="px-6 py-3 font-medium">Action</th>
                  <th className="px-6 py-3 font-medium">Result</th>
                  <th className="px-6 py-3 font-medium text-right">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {auditLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-[var(--color-surface-hover)] transition-colors"
                  >
                    <td className="px-6 py-3.5 whitespace-nowrap text-[var(--color-muted)]">
                      {formatTime(log.createdAt)}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-accent)]/20 text-xs font-bold text-[var(--color-accent-light)]">
                          {log.agentName.charAt(0)}
                        </span>
                        {log.agentName}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-medium">{log.action}</td>
                    <td className="px-6 py-3.5 text-[var(--color-muted)] max-w-xs truncate">
                      {log.result}
                    </td>
                    <td className="px-6 py-3.5 text-right font-mono text-xs text-[var(--color-muted)]">
                      {formatCost(log.cost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
