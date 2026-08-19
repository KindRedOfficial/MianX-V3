import { prisma } from "@/lib/prisma";
import {
  selectAgentForTask,
  getAgentById,
  RISK_HIERARCHY,
  type AgentWithParsedFields,
} from "./agent-selector.service";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DelegationTaskData {
  title: string;
  capabilities: string[];
  riskLevel: string;
  dependencies?: string[];
  missionId: string;
}

export class DelegationSecurityError extends Error {
  constructor(
    message: string,
    public readonly parentAgent: string,
    public readonly childAgent: string,
  ) {
    super(message);
    this.name = "DelegationSecurityError";
  }
}

// ─── Subset Check ────────────────────────────────────────────────────────────

/**
 * Returns true if every element in `subset` also exists in `superset`.
 */
function isSubset(subset: string[], superset: string[]): boolean {
  const supersetSet = new Set(superset);
  return subset.every((item) => supersetSet.has(item));
}

// ─── Security Validation ─────────────────────────────────────────────────────

/**
 * Verify that a child agent's permissions are strictly within the parent's.
 * Throws DelegationSecurityError with detailed diagnostics on failure.
 */
function validateDelegationSecurity(
  parent: AgentWithParsedFields,
  child: AgentWithParsedFields,
): void {
  // Rule 1: Child's allowedTools must be a subset of Parent's allowedTools
  const toolEscalation = child.allowedTools.filter(
    (tool) => !parent.allowedTools.includes(tool),
  );
  if (toolEscalation.length > 0) {
    throw new DelegationSecurityError(
      `PRIVILEGE ESCALATION: Child agent "${child.name}" has tools not allowed by parent "${parent.name}": [${toolEscalation.join(", ")}]`,
      parent.name,
      child.name,
    );
  }

  // Rule 2: Child's riskLevel must be <= Parent's riskLevel
  const parentRank = RISK_HIERARCHY[parent.riskLevel] ?? -1;
  const childRank = RISK_HIERARCHY[child.riskLevel] ?? 999;
  if (childRank > parentRank) {
    throw new DelegationSecurityError(
      `PRIVILEGE ESCALATION: Child agent "${child.name}" (risk: ${child.riskLevel}) exceeds parent "${parent.name}" (risk: ${parent.riskLevel})`,
      parent.name,
      child.name,
    );
  }
}

// ─── Core Delegation ─────────────────────────────────────────────────────────

/**
 * Delegate a task from a parent agent to a suitable child agent.
 *
 * Security flow:
 * 1. Fetch parent agent from DB.
 * 2. Use agent-selector to find the best child agent for the task.
 * 3. Validate child's allowedTools ⊆ parent's allowedTools.
 * 4. Validate child's riskLevel ≤ parent's riskLevel.
 * 5. If safe, create a new MissionTask linked to the same mission.
 *
 * @returns The newly created MissionTask.
 * @throws DelegationSecurityError on privilege escalation attempt.
 * @throws Error if parent not found or no suitable child exists.
 */
export async function delegateTask(
  parentAgentId: string,
  taskData: DelegationTaskData,
) {
  const { title, capabilities, riskLevel, dependencies = [], missionId } = taskData;

  // 1. Fetch and validate parent agent
  const parentAgent = await getAgentById(parentAgentId);

  if (!parentAgent.isActive) {
    throw new Error(`Parent agent "${parentAgent.name}" is not active and cannot delegate`);
  }

  // 2. Find best child agent via the selection algorithm
  const childAgent = await selectAgentForTask({ capabilities, riskLevel });

  // 3. Security check — log all delegation attempts for audit
  console.log(
    `[DELEGATION] Parent="${parentAgent.name}" (${parentAgent.riskLevel}) → Child="${childAgent.name}" (${childAgent.riskLevel}) | Task="${title}"`,
  );

  try {
    validateDelegationSecurity(parentAgent, childAgent);
  } catch (err: unknown) {
    // Log security warning before re-throwing
    if (err instanceof DelegationSecurityError) {
      console.warn(
        `[SECURITY] Delegation blocked: ${err.message} | Parent tools=[${parentAgent.allowedTools.join(", ")}] | Child tools=[${childAgent.allowedTools.join(", ")}]`,
      );
    }
    throw err;
  }

  // 4. Verify the mission exists and belongs to a valid context
  const mission = await prisma.mission.findUnique({ where: { id: missionId } });
  if (!mission) {
    throw new Error(`Mission not found: ${missionId}`);
  }

  // 5. Determine the next sort order
  const maxSort = await prisma.missionTask.aggregate({
    where: { missionId },
    _max: { sortOrder: true },
  });
  const nextSort = (maxSort._max.sortOrder ?? -1) + 1;

  // 6. Create the delegated MissionTask
  const delegatedTask = await prisma.missionTask.create({
    data: {
      missionId,
      title,
      agent: childAgent.name,
      dependencies: JSON.stringify(dependencies),
      riskLevel: riskLevel as "LOW" | "MEDIUM" | "HIGH",
      sortOrder: nextSort,
    },
  });

  console.log(
    `[DELEGATION] Created task "${title}" → agent "${childAgent.name}" (taskId=${delegatedTask.id})`,
  );

  return delegatedTask;
}
