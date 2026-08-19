import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { requireAiQuota, deductAiCredits } from "@/lib/ai-quota";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PlanTask {
  title: string;
  agent: string;
  dependencies: string[];
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
}

export interface MissionPlan {
  normalizedGoal: string;
  complexity: "LOW" | "MEDIUM" | "HIGH";
  successCriteria: string[];
  tasks: PlanTask[];
}

export interface PlannedMission {
  missionId: string;
  plan: MissionPlan;
}

// ─── System Prompt ────────────────────────────────────────────────────────────

const PLANNER_SYSTEM_PROMPT = `You are MianX.ai's Mission Planner. Your job is to take a user's natural-language goal and produce a structured mission plan.

You MUST respond with valid JSON matching this exact schema (no markdown fences, no extra text):

{
  "normalizedGoal": "<A clear, specific, actionable version of the user's goal>",
  "complexity": "<LOW | MEDIUM | HIGH>",
  "successCriteria": ["<measurable criterion 1>", "<measurable criterion 2>", "..."],
  "tasks": [
    {
      "title": "<Short task title>",
      "agent": "<Agent name: Atlas (backend/data), Zen (frontend/UI), Nexus (integration/DevOps)>",
      "dependencies": ["<Title of a task that must complete first>"],
      "riskLevel": "<LOW | MEDIUM | HIGH>"
    }
  ]
}

Rules:
- "dependencies" must reference the exact "title" of another task in the list, or be empty [].
- The task list should form a valid DAG (no circular dependencies).
- Aim for 3-10 tasks depending on complexity.
- Each success criterion should be independently verifiable.
- Assign agents based on the nature of the work (Atlas = data/backend, Zen = frontend/UI, Nexus = infra/integration).
- Return ONLY the JSON object. No commentary.`;

// ─── LLM Provider Abstraction ───────────────────────────────────────────────

/**
 * Call OpenAI GPT-4o to generate a mission plan.
 */
async function planWithOpenAI(userGoal: string): Promise<string> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: PLANNER_SYSTEM_PROMPT },
      { role: "user", content: userGoal },
    ],
    temperature: 0.2,
    max_tokens: 4096,
  });
  return response.choices[0]?.message?.content ?? "";
}

/**
 * Call Anthropic Claude to generate a mission plan.
 */
async function planWithAnthropic(userGoal: string): Promise<string> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: PLANNER_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userGoal }],
  });
  const block = response.content[0];
  return block?.type === "text" ? block.text : "";
}

/**
 * Mock planner for environments without LLM API keys.
 * Produces a deterministic plan structure for testing.
 */
function planWithMock(userGoal: string): string {
  return JSON.stringify({
    normalizedGoal: userGoal.trim(),
    complexity: "MEDIUM" as const,
    successCriteria: [
      "All generated files compile without errors",
      "Unit tests pass",
      "Linting passes with zero warnings",
    ],
    tasks: [
      {
        title: "Analyze requirements",
        agent: "Atlas",
        dependencies: [],
        riskLevel: "LOW" as const,
      },
      {
        title: "Design data models",
        agent: "Atlas",
        dependencies: ["Analyze requirements"],
        riskLevel: "MEDIUM" as const,
      },
      {
        title: "Implement core logic",
        agent: "Atlas",
        dependencies: ["Design data models"],
        riskLevel: "HIGH" as const,
      },
      {
        title: "Build user interface",
        agent: "Zen",
        dependencies: ["Design data models"],
        riskLevel: "MEDIUM" as const,
      },
      {
        title: "Integration testing",
        agent: "Nexus",
        dependencies: ["Implement core logic", "Build user interface"],
        riskLevel: "MEDIUM" as const,
      },
    ],
  });
}

// ─── Core Planner ────────────────────────────────────────────────────────────

/**
 * Call the configured LLM provider (or mock) and return the raw JSON string.
 */
export async function generatePlanFromLLM(userGoal: string): Promise<string> {
  const hasOpenAI = !!process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes("placeholder");
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY.includes("placeholder");

  // Prefer Anthropic (better at structured JSON), fall back to OpenAI, then mock
  if (hasAnthropic) {
    return planWithAnthropic(userGoal);
  }
  if (hasOpenAI) {
    return planWithOpenAI(userGoal);
  }

  console.warn("[Planner] No LLM API key configured — using mock planner");
  return planWithMock(userGoal);
}

/**
 * Parse and validate the raw LLM output into a typed MissionPlan.
 * Throws if the JSON is malformed or missing required fields.
 */
export function parseMissionPlan(raw: string): MissionPlan {
  // Strip markdown code fences if the LLM wrapped them
  let cleaned = raw.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();

  const parsed = JSON.parse(cleaned) as Record<string, unknown>;

  // Validate top-level fields
  if (typeof parsed.normalizedGoal !== "string" || !parsed.normalizedGoal) {
    throw new Error("Planner output missing 'normalizedGoal'");
  }
  if (!["LOW", "MEDIUM", "HIGH"].includes(parsed.complexity as string)) {
    throw new Error("Planner output has invalid 'complexity'");
  }
  if (!Array.isArray(parsed.successCriteria) || parsed.successCriteria.length === 0) {
    throw new Error("Planner output missing or empty 'successCriteria'");
  }
  if (!Array.isArray(parsed.tasks) || parsed.tasks.length === 0) {
    throw new Error("Planner output missing or empty 'tasks'");
  }

  // Validate each task
  const tasks = (parsed.tasks as PlanTask[]).map((t, i) => {
    if (typeof t.title !== "string" || !t.title) {
      throw new Error(`Task[${i}] missing 'title'`);
    }
    if (typeof t.agent !== "string" || !t.agent) {
      throw new Error(`Task[${i}] missing 'agent'`);
    }
    if (!Array.isArray(t.dependencies)) {
      throw new Error(`Task[${i}] 'dependencies' must be an array`);
    }
    if (!["LOW", "MEDIUM", "HIGH"].includes(t.riskLevel as string)) {
      throw new Error(`Task[${i}] has invalid 'riskLevel'`);
    }
    return {
      title: t.title,
      agent: t.agent,
      dependencies: t.dependencies as string[],
      riskLevel: t.riskLevel as "LOW" | "MEDIUM" | "HIGH",
    };
  });

  return {
    normalizedGoal: parsed.normalizedGoal as string,
    complexity: parsed.complexity as "LOW" | "MEDIUM" | "HIGH",
    successCriteria: parsed.successCriteria as string[],
    tasks,
  };
}

// ─── Full Orchestration: Plan → Persist ───────────────────────────────────────

/**
 * End-to-end: take a user's natural-language goal, call the LLM planner,
 * validate the output, persist the Mission + MissionTasks to the DB,
 * deduct AI credits, and return the planned mission.
 *
 * This is the main entry point that API routes should call.
 */
export async function createMissionFromGoal(params: {
  userId: string;
  userGoal: string;
  budget?: number;
}): Promise<PlannedMission> {
  const { userId, userGoal, budget = 0 } = params;

  // 1. Check AI quota
  const { organizationId } = await requireAiQuota(userId);

  // 2. Create Mission record in DRAFT status
  const mission = await prisma.mission.create({
    data: {
      userId,
      rawGoal: userGoal,
      normalizedGoal: userGoal, // placeholder — updated after LLM call
      status: "DRAFT",
      complexity: "MEDIUM",
      successCriteria: [],
      budget,
      budgetUsed: 0,
    },
  });

  try {
    // 3. Call the LLM planner
    const rawPlan = await generatePlanFromLLM(userGoal);

    // 4. Parse & validate
    const plan = parseMissionPlan(rawPlan);

    // 5. Update Mission with parsed plan data
    await prisma.mission.update({
      where: { id: mission.id },
      data: {
        normalizedGoal: plan.normalizedGoal,
        complexity: plan.complexity,
        successCriteria: plan.successCriteria as unknown as Parameters<typeof prisma.mission.update>['0']['data']['successCriteria'],
        status: "PLANNING",
      },
    });

    // 6. Persist tasks — build a title→index map for validation
    const titleIndex = new Map(plan.tasks.map((t, i) => [t.title, i]));
    for (let i = 0; i < plan.tasks.length; i++) {
      const task = plan.tasks[i]!;

      // Validate that all dependency titles reference real tasks
      const validDeps = task.dependencies.filter((dep) => titleIndex.has(dep));
      const invalidDeps = task.dependencies.filter((dep) => !titleIndex.has(dep));
      if (invalidDeps.length > 0) {
        console.warn(
          `[Planner] Task "${task.title}" references unknown dependencies: ${invalidDeps.join(", ")}. They will be ignored.`,
        );
      }

      await prisma.missionTask.create({
        data: {
          missionId: mission.id,
          title: task.title,
          agent: task.agent,
          dependencies: JSON.stringify(validDeps),
          riskLevel: task.riskLevel,
          sortOrder: i,
        },
      });
    }

    // 7. Estimate token usage for this planning call (~1500 tokens typical)
    const estimatedTokens = 1500;
    await deductAiCredits(organizationId, estimatedTokens);

    await prisma.aiUsageLog.create({
      data: {
        userId,
        organizationId,
        tokensUsed: estimatedTokens,
        model: "planner-v1",
      },
    });

    return { missionId: mission.id, plan };
  } catch (err: unknown) {
    // On failure, mark the mission as FAILED and re-throw
    const message = err instanceof Error ? err.message : "Unknown planning error";
    await prisma.mission.update({
      where: { id: mission.id },
      data: { status: "FAILED" },
    });
    throw new Error(`Mission planning failed: ${message}`);
  }
}
