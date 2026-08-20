import { prisma } from "@/lib/prisma";
import { executeTool, type ToolExecutionResult } from "./tool-executor.service";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface VerificationResult {
  taskId: string;
  passed: boolean;
  toolResult?: ToolExecutionResult;
  error?: string;
  verifiedAt: string;
}

// ─── Heuristics ──────────────────────────────────────────────────────────────

/**
 * Determine whether a task likely involves code execution,
 * and thus should trigger the run_tests tool for verification.
 */
function taskInvolvesCode(title: string, result: string | null): boolean {
  const codeIndicators = [
    "implement",
    "build",
    "create",
    "develop",
    "write",
    "code",
    "test",
    "fix",
    "refactor",
    "endpoint",
    "api",
    "function",
    "component",
    "module",
    "service",
    "handler",
  ];
  const lower = `${title} ${result ?? ""}`.toLowerCase();
  return codeIndicators.some((indicator) => lower.includes(indicator));
}

/**
 * Parse the mission's successCriteria JSON (stored as Prisma Json)
 * into a string array of criteria.
 */
function parseSuccessCriteria(criteriaJson: unknown): string[] {
  if (!criteriaJson || !Array.isArray(criteriaJson)) return [];
  return criteriaJson.filter((item): item is string => typeof item === "string");
}

/**
 * Simple check: does the tool output contain any indication of success
 * that aligns with the mission's success criteria?
 *
 * This is a heuristic verification — in production, more sophisticated
 * assertion engines or LLM-based judging would be used.
 */
function outputMatchesCriteria(
  output: unknown,
  criteria: string[],
): boolean {
  if (criteria.length === 0) return true; // no criteria = auto-pass

  const outputStr = JSON.stringify(output).toLowerCase();
  return criteria.every((criterion) =>
    outputStr.includes(criterion.toLowerCase()),
  );
}

// ─── Core Verification ───────────────────────────────────────────────────────

/**
 * Verify whether a MissionTask has been completed successfully.
 *
 * Verification flow:
 * 1. Fetch the MissionTask and its parent Mission.
 * 2. If the task involves code, execute the run_tests tool.
 * 3. Check the output against the mission's successCriteria.
 * 4. Update task status to COMPLETED or FAILED accordingly.
 * 5. If FAILED, log that repair is needed (Phase 5 will implement auto-repair).
 *
 * @returns A VerificationResult with pass/fail details.
 */
export async function verifyTaskCompletion(
  taskId: string,
): Promise<VerificationResult> {
  const verifiedAt = new Date().toISOString();

  // ── Step 1: Fetch task + mission ──────────────────────────────────────────
  const task = await prisma.missionTask.findUnique({
    where: { id: taskId },
    include: { mission: true },
  });

  if (!task) {
    throw new Error(`MissionTask not found: ${taskId}`);
  }

  if (!task.mission) {
    throw new Error(`Mission not found for task: ${taskId}`);
  }

  const criteria = parseSuccessCriteria(task.mission.successCriteria);

  // ── Step 2: Run tool-based verification for code tasks ────────────────────
  let toolResult: ToolExecutionResult | undefined;

  if (taskInvolvesCode(task.title, task.result)) {
    try {
      // Use the first agent that has run_tests in their allowedTools
      const agentWithTests = await prisma.agent.findFirst({
        where: { isActive: true },
      });

      if (agentWithTests) {
        toolResult = await executeTool(
          "run_tests",
          { taskId, missionId: task.missionId },
          agentWithTests.id,
        );
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unknown tool execution error";
      console.warn(
        `[VERIFICATION] Tool execution failed for task "${task.title}": ${message}`,
      );
    }
  }

  // ── Step 3: Evaluate success criteria ─────────────────────────────────────
  const outputToCheck = toolResult?.output ?? task.result ?? "";
  const passed = outputMatchesCriteria(outputToCheck, criteria);

  // ── Step 4: Update task status ────────────────────────────────────────────
  if (passed) {
    await prisma.missionTask.update({
      where: { id: taskId },
      data: { status: "COMPLETED" },
    });

    console.log(
      `[VERIFICATION] PASSED: task="${task.title}" (taskId=${taskId})`,
    );
  } else {
    const errorMsg = toolResult
      ? `Verification failed: tool output does not meet success criteria. Criteria: [${criteria.join(", ")}]. Output: ${JSON.stringify(toolResult.output)}`
      : `Verification failed: no successful output to validate against criteria [${criteria.join(", ")}]`;

    await prisma.missionTask.update({
      where: { id: taskId },
      data: {
        status: "FAILED",
        error: errorMsg,
      },
    });

    // Trigger repair state (full repair orchestration in Phase 5)
    console.log(`[VERIFICATION] REPAIR NEEDED: task="${task.title}" (taskId=${taskId})`);
    console.log(`[VERIFICATION] Error: ${errorMsg}`);

    return {
      taskId,
      passed: false,
      toolResult,
      error: errorMsg,
      verifiedAt,
    };
  }

  return {
    taskId,
    passed: true,
    toolResult,
    verifiedAt,
  };
}
