import { prisma } from "@/lib/prisma";
import type { AgentRiskLevel } from "@/generated/prisma/enums";

// ─── Risk Level Hierarchy ─────────────────────────────────────────────────────

export const RISK_HIERARCHY: Record<string, number> = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
  CRITICAL: 3,
};

/**
 * Check whether `candidateLevel` is sufficient for `requiredLevel`.
 * An agent can only handle tasks at or below its own risk level.
 */
function isRiskSufficient(candidateLevel: string, requiredLevel: string): boolean {
  return (RISK_HIERARCHY[candidateLevel] ?? -1) >= (RISK_HIERARCHY[requiredLevel] ?? 999);
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TaskRequirements {
  capabilities: string[];
  riskLevel: string;
}

export interface AgentWithParsedFields {
  id: string;
  name: string;
  role: string;
  capabilities: string[];
  allowedTools: string[];
  riskLevel: AgentRiskLevel;
  costProfile: number;
  isActive: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Safely parse a Prisma Json field into a string array.
 */
export function parseStringArray(json: unknown): string[] {
  if (Array.isArray(json)) {
    return json.filter((item): item is string => typeof item === "string");
  }
  return [];
}

// ─── Core Selector ───────────────────────────────────────────────────────────

/**
 * Select the best agent for a given set of task requirements.
 *
 * Algorithm:
 * 1. Fetch all active agents from the DB.
 * 2. Filter to agents whose capabilities are a superset of the required capabilities.
 * 3. Filter to agents whose riskLevel is sufficient for the task's riskLevel.
 * 4. Rank by: (a) fewest excess capabilities (tightest fit), (b) lowest cost, (c) lowest risk.
 * 5. Return the top-ranked agent, or throw if none qualify.
 */
export async function selectAgentForTask(
  taskRequirements: TaskRequirements,
): Promise<AgentWithParsedFields> {
  const { capabilities: requiredCaps, riskLevel: requiredRisk } = taskRequirements;

  if (requiredCaps.length === 0) {
    throw new Error("Agent selection requires at least one capability");
  }

  const agents = await prisma.agent.findMany({
    where: { isActive: true },
  });

  // Parse and type-check all agents
  const typed: AgentWithParsedFields[] = agents.map((a) => ({
    id: a.id,
    name: a.name,
    role: a.role,
    capabilities: parseStringArray(a.capabilities),
    allowedTools: parseStringArray(a.allowedTools),
    riskLevel: a.riskLevel,
    costProfile: a.costProfile,
    isActive: a.isActive,
  }));

  // Filter: must have ALL required capabilities
  const capable = typed.filter((agent) =>
    requiredCaps.every((cap) => agent.capabilities.includes(cap)),
  );

  // Filter: risk level must be sufficient
  const eligible = capable.filter((agent) =>
    isRiskSufficient(agent.riskLevel, requiredRisk),
  );

  if (eligible.length === 0) {
    const capsStr = requiredCaps.join(", ");
    throw new Error(
      `No active agent found with capabilities [${capsStr}] and risk >= ${requiredRisk}`,
    );
  }

  // Rank: tightest capability fit → lowest cost → lowest risk
  eligible.sort((a, b) => {
    const excessA = a.capabilities.length - requiredCaps.length;
    const excessB = b.capabilities.length - requiredCaps.length;
    if (excessA !== excessB) return excessA - excessB;
    if (a.costProfile !== b.costProfile) return a.costProfile - b.costProfile;
    return (RISK_HIERARCHY[a.riskLevel] ?? 0) - (RISK_HIERARCHY[b.riskLevel] ?? 0);
  });

  return eligible[0]!;
}

// ─── Direct Lookup ───────────────────────────────────────────────────────────

/**
 * Fetch a single agent by ID with parsed JSON fields.
 */
export async function getAgentById(agentId: string): Promise<AgentWithParsedFields> {
  const agent = await prisma.agent.findUnique({ where: { id: agentId } });
  if (!agent) {
    throw new Error(`Agent not found: ${agentId}`);
  }
  return {
    id: agent.id,
    name: agent.name,
    role: agent.role,
    capabilities: parseStringArray(agent.capabilities),
    allowedTools: parseStringArray(agent.allowedTools),
    riskLevel: agent.riskLevel,
    costProfile: agent.costProfile,
    isActive: agent.isActive,
  };
}
