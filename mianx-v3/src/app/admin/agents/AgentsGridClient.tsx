"use client";

import { UserPlus, Shield } from "lucide-react";

type Agent = {
  id: string;
  name: string;
  role: string;
  capabilities: unknown;
  allowedTools: unknown;
  riskLevel: string;
  costProfile: number;
  isActive: boolean;
};

const RISK_STYLES: Record<string, { text: string; bg: string; border: string }> = {
  LOW: { text: "text-green-400", bg: "bg-green-400/10", border: "border-green-400/20" },
  MEDIUM: { text: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/20" },
  HIGH: { text: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/20" },
  CRITICAL: { text: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/20" },
};

const AGENT_GRADIENTS: Record<string, string> = {
  Atlas: "from-blue-500/20 to-indigo-500/20",
  Zen: "from-emerald-500/20 to-teal-500/20",
  Nexus: "from-red-500/20 to-orange-500/20",
  Sage: "from-purple-500/20 to-pink-500/20",
};

export default function AgentsGridClient({ agents }: { agents: Agent[] }) {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold">AI Workforce</h1>
        <p className="text-sm text-muted mt-1">
          Your available agents, their capabilities, and authorization levels.
        </p>
      </div>

      {agents.length === 0 ? (
        <p className="text-sm text-muted text-center py-12">No active agents found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {agents.map((agent) => {
            const caps = Array.isArray(agent.capabilities) ? agent.capabilities : [];
            const tools = Array.isArray(agent.allowedTools) ? agent.allowedTools : [];
            const risk = RISK_STYLES[agent.riskLevel] ?? RISK_STYLES.MEDIUM;
            const gradient = AGENT_GRADIENTS[agent.name] ?? "from-zinc-500/20 to-zinc-600/20";

            return (
              <div
                key={agent.id}
                className="bg-surface border border-border rounded-xl p-5 hover:border-accent/30 transition-colors group"
              >
                {/* Header: Avatar + Name + Status */}
                <div className="flex items-start gap-3 mb-4">
                  <div
                    className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 border border-white/5`}
                  >
                    <span className="text-sm font-bold text-white/80">
                      {agent.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold">{agent.name}</h3>
                      <div className="w-2 h-2 rounded-full bg-green-400" title="Active" />
                    </div>
                    <p className="text-xs text-muted mt-0.5">{agent.role}</p>
                  </div>
                </div>

                {/* Capabilities as chips */}
                <div className="mb-3">
                  <h4 className="text-[10px] font-medium text-muted uppercase tracking-wider mb-1.5">
                    Capabilities
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {caps.map((c) => (
                      <span
                        key={String(c)}
                        className="px-2 py-0.5 rounded-md bg-accent/10 text-accent-light text-[11px] font-medium"
                      >
                        {String(c)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Tools count + Risk level */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] text-muted">
                    {tools.length} tool{tools.length !== 1 ? "s" : ""} authorized
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-medium border ${risk.text} ${risk.bg} ${risk.border}`}
                  >
                    <Shield className="w-3 h-3 inline-block mr-0.5 -mt-0.5" />
                    {agent.riskLevel}
                  </span>
                </div>

                {/* Delegate button */}
                <button
                  className="
                    w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium
                    border border-border text-muted hover:text-foreground hover:border-accent/30 hover:bg-accent/5
                    transition-colors
                  "
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Delegate Task
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
