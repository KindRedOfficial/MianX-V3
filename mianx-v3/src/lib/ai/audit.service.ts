import { prisma } from "@/lib/prisma";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AuditEventInput {
  missionId: string;
  agentName: string;
  action: string;
  result: string;
  cost: number;
}

export interface AuditLogEntry {
  id: string;
  missionId: string;
  agentName: string;
  action: string;
  result: string;
  cost: number;
  createdAt: string;
}

// ─── Core Service ────────────────────────────────────────────────────────────

/**
 * Log an audit event for the Trust Center.
 *
 * Only records high-level, user-facing actions — never private
 * chain-of-thought or internal reasoning.
 *
 * @returns The created AuditLog record.
 */
export async function logAuditEvent(
  data: AuditEventInput,
): Promise<AuditLogEntry> {
  const record = await prisma.auditLog.create({
    data: {
      missionId: data.missionId,
      agentName: data.agentName,
      action: data.action,
      result: data.result,
      cost: data.cost,
    },
  });

  console.log(
    `[AUDIT] mission=${record.missionId} agent="${record.agentName}" action="${record.action}" cost=$${record.cost.toFixed(4)}`,
  );

  return toEntry(record);
}

/**
 * Fetch all audit logs for a mission, newest first.
 *
 * @param missionId The mission to fetch logs for.
 * @returns Ordered list of audit log entries.
 */
export async function getAuditLogs(
  missionId: string,
): Promise<AuditLogEntry[]> {
  const records = await prisma.auditLog.findMany({
    where: { missionId },
    orderBy: { createdAt: "desc" },
  });

  return records.map(toEntry);
}

// ─── Internal ───────────────────────────────────────────────────────────────

function toEntry(record: {
  id: string;
  missionId: string;
  agentName: string;
  action: string;
  result: string;
  cost: number;
  createdAt: Date;
}): AuditLogEntry {
  return {
    id: record.id,
    missionId: record.missionId,
    agentName: record.agentName,
    action: record.action,
    result: record.result,
    cost: record.cost,
    createdAt: record.createdAt.toISOString(),
  };
}
