import { prisma } from "@/lib/prisma";
import type { OutcomeStatus } from "@/generated/prisma/enums";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface OutcomeSnapshot {
  missionId: string;
  baseline: number;
  target: number;
  current: number;
  status: OutcomeStatus;
  progressPct: number; // 0–100
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Determine the new OutcomeStatus based on current value vs target.
 *
 * - ACHIEVED:      current >= target
 * - NEAR_TARGET:   current >= target * 0.9  (within 10%)
 * - IN_PROGRESS:   otherwise (and current > 0)
 * - NOT_STARTED:   current === 0
 */
function computeStatus(
  current: number,
  target: number,
): OutcomeStatus {
  if (current <= 0) return "NOT_STARTED";
  if (current >= target) return "ACHIEVED";
  if (current >= target * 0.9) return "NEAR_TARGET";
  return "IN_PROGRESS";
}

/**
 * Calculate progress as a percentage: clamp 0–100.
 * Handles edge cases where baseline >= target (improvement goal where lower is better)
 * by using absolute distance from baseline.
 */
function computeProgress(baseline: number, target: number, current: number): number {
  const totalDelta = Math.abs(target - baseline);
  if (totalDelta === 0) return current >= target ? 100 : 0;
  const currentDelta = Math.abs(current - baseline);
  const pct = (currentDelta / totalDelta) * 100;
  return Math.min(Math.max(Math.round(pct), 0), 100);
}

// ─── Core Service ────────────────────────────────────────────────────────────

/**
 * Update the Outcome for a mission with a new measured value.
 *
 * If no Outcome record exists yet, one is created with NOT_STARTED status.
 * The status is automatically recomputed based on the proximity to target.
 *
 * @returns The updated Outcome snapshot including computed progress %.
 * @throws Error if the mission does not exist.
 */
export async function updateMissionOutcome(
  missionId: string,
  newCurrentValue: number,
): Promise<OutcomeSnapshot> {
  // Verify mission exists
  const mission = await prisma.mission.findUnique({
    where: { id: missionId },
  });
  if (!mission) {
    throw new Error(`Mission not found: ${missionId}`);
  }

  // Upsert the Outcome record
  const outcome = await prisma.outcome.upsert({
    where: { missionId },
    update: {
      current: newCurrentValue,
      status: "IN_PROGRESS", // will be overwritten by computeStatus below
    },
    create: {
      missionId,
      baseline: newCurrentValue, // first measurement becomes the baseline
      target: 0, // caller should set target separately
      current: newCurrentValue,
      status: "NOT_STARTED",
    },
  });

  // Recompute status
  const newStatus = computeStatus(outcome.current, outcome.target);

  const updated = await prisma.outcome.update({
    where: { missionId },
    data: { status: newStatus },
  });

  const progress = computeProgress(updated.baseline, updated.target, updated.current);

  console.log(
    `[OUTCOME] mission=${missionId} baseline=${updated.baseline} current=${updated.current} target=${updated.target} status=${updated.status} progress=${progress}%`,
  );

  return {
    missionId,
    baseline: updated.baseline,
    target: updated.target,
    current: updated.current,
    status: updated.status,
    progressPct: progress,
  };
}

/**
 * Create or update the Outcome with explicit baseline and target values.
 * Useful during mission planning when the user defines success metrics.
 */
export async function setOutcomeTarget(
  missionId: string,
  baseline: number,
  target: number,
): Promise<OutcomeSnapshot> {
  const outcome = await prisma.outcome.upsert({
    where: { missionId },
    update: { baseline, target },
    create: {
      missionId,
      baseline,
      target,
      current: baseline,
      status: "NOT_STARTED",
    },
  });

  const status = computeStatus(outcome.current, outcome.target);
  const updated = await prisma.outcome.update({
    where: { missionId },
    data: { status },
  });

  const progress = computeProgress(updated.baseline, updated.target, updated.current);

  return {
    missionId,
    baseline: updated.baseline,
    target: updated.target,
    current: updated.current,
    status: updated.status,
    progressPct: progress,
  };
}

/**
 * Fetch the current Outcome snapshot for a mission.
 * Returns null if no outcome has been set up yet.
 */
export async function getMissionOutcome(
  missionId: string,
): Promise<OutcomeSnapshot | null> {
  const outcome = await prisma.outcome.findUnique({
    where: { missionId },
  });
  if (!outcome) return null;

  const progress = computeProgress(outcome.baseline, outcome.target, outcome.current);

  return {
    missionId: outcome.missionId,
    baseline: outcome.baseline,
    target: outcome.target,
    current: outcome.current,
    status: outcome.status,
    progressPct: progress,
  };
}
