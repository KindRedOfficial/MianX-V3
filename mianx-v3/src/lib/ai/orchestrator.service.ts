import { prisma } from "@/lib/prisma";
import { executeTool, type ToolExecutionResult } from "./tool-executor.service";
import { verifyTaskCompletion } from "./verification.service";
import { logAuditEvent } from "./audit.service";

// ─── Types ───────────────────────────────────────────────────────────────────

interface TaskWithDeps {
  id: string;
  title: string;
  agent: string;
  dependencies: string;
  riskLevel: string;
  status: string;
  result: string | null;
  sortOrder: number;
}

interface AgentInfo {
  id: string;
  name: string;
  allowedTools: string[];
}

interface ReActStep {
  role: "agent" | "tool" | "system";
  content: string;
}

interface LLMResponse {
  thought: string;
  toolCall?: { name: string; args: Record<string, unknown> };
  done: boolean;
  summary: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const MAX_TOOL_CALLS_PER_TASK = 3;

const EXECUTOR_SYSTEM_PROMPT = `You are an AI agent in the MianX.ai system. You are executing a single task as part of a larger mission.

You have access to tools. You can:
1. Think about the task and what to do next.
2. Call a tool by outputting a JSON object with "toolCall".
3. After receiving the tool result, decide whether to call another tool or finish.

You MUST respond with valid JSON matching one of these forms:

To use a tool:
{"thought": "<your reasoning>", "toolCall": {"name": "<tool_name>", "args": {<key>: <value>}}}

To finish:
{"thought": "<your reasoning>", "done": true, "summary": "<what you accomplished>"}

Rules:
- You can call at most ${MAX_TOOL_CALLS_PER_TASK} tools per task.
- If a tool call fails, explain why and try a different approach or mark done with the error.
- Be concise in your reasoning.`;

// ─── LLM Call (Mock + Real) ────────────────────────────────────────────────

/**
 * Call the LLM with the ReAct conversation history.
 * Falls back to mock execution if no API key is configured.
 */
async function callLLM(
  messages: Array<{ role: string; content: string }>,
): Promise<LLMResponse> {
  const hasAnthropic =
    !!process.env.ANTHROPIC_API_KEY &&
    !process.env.ANTHROPIC_API_KEY.includes("placeholder");
  const hasOpenAI =
    !!process.env.OPENAI_API_KEY &&
    !process.env.OPENAI_API_KEY.includes("placeholder");

  if (hasAnthropic) {
    return callAnthropic(messages);
  }
  if (hasOpenAI) {
    return callOpenAI(messages);
  }

  return mockLLMResponse(messages);
}

async function callAnthropic(
  messages: Array<{ role: string; content: string }>,
): Promise<LLMResponse> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const systemMsg = EXECUTOR_SYSTEM_PROMPT;
  const userMsgs = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: systemMsg,
    messages: userMsgs,
  });

  const text =
    response.content.find((b) => b.type === "text")?.text ?? "";
  return parseLLMJSON(text);
}

async function callOpenAI(
  messages: Array<{ role: string; content: string }>,
): Promise<LLMResponse> {
  const OpenAI = (await import("openai")).default;
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: EXECUTOR_SYSTEM_PROMPT },
      ...messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ],
    temperature: 0.3,
    max_tokens: 2048,
  });

  const text = response.choices[0]?.message?.content ?? "";
  return parseLLMJSON(text);
}

/**
 * Mock LLM that simulates a ReAct loop:
 * - First call: invokes a tool if the agent has one
 * - Second call: returns done with a summary
 */
function mockLLMResponse(
  messages: Array<{ role: string; content: string }>,
): LLMResponse {
  // Count how many tool results have been fed back
  const toolResults = messages.filter((m) => m.role === "tool");
  const isFirstCall = toolResults.length === 0;

  if (isFirstCall) {
    // Try to find a tool name from the last assistant message context
    const lastAssistant = [...messages]
      .reverse()
      .find((m) => m.role === "assistant");
    const hasToolMention = lastAssistant?.content.includes("tool");

    if (hasToolMention || messages.length <= 2) {
      return {
        thought: "I need to gather information to complete this task. Let me use the available tool.",
        toolCall: { name: "read_file", args: { path: "/workspace/project" } },
      };
    }
  }

  // After tool use or if no tools needed
  return {
    thought: "I have gathered the necessary information and completed the task.",
    done: true,
    summary: "Task completed successfully. All relevant data has been processed and the expected output produced.",
  };
}

/**
 * Parse the LLM's JSON response into a typed LLMResponse.
 */
function parseLLMJSON(raw: string): LLMResponse {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
  else if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
  if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
  cleaned = cleaned.trim();

  try {
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;
    return {
      thought: String(parsed.thought ?? ""),
      toolCall: parsed.toolCall
        ? {
            name: String((parsed.toolCall as Record<string, unknown>).name ?? ""),
            args: ((parsed.toolCall as Record<string, unknown>).args ??
              {}) as Record<string, unknown>,
          }
        : undefined,
      done: Boolean(parsed.done),
      summary: String(parsed.summary ?? ""),
    };
  } catch {
    // If LLM didn't return valid JSON, treat as done
    return {
      thought: raw,
      done: true,
      summary: raw.slice(0, 200),
    };
  }
}

// ─── Dependency Resolution ──────────────────────────────────────────────────

/**
 * Check if all of a task's dependencies are in the COMPLETED status.
 */
function areDependenciesMet(
  task: TaskWithDeps,
  allTasks: TaskWithDeps[],
): boolean {
  let deps: string[];
  try {
    deps = JSON.parse(task.dependencies) as string[];
  } catch {
    deps = [];
  }

  if (deps.length === 0) return true;

  return deps.every((depTitle) => {
    const depTask = allTasks.find((t) => t.title === depTitle);
    return depTask?.status === "COMPLETED";
  });
}

// ─── Single Task Execution ──────────────────────────────────────────────────

/**
 * Execute a single task using the ReAct loop.
 *
 * 1. Build the initial prompt with task context.
 * 2. Loop: call LLM → if tool call, execute tool → feed result back.
 * 3. Max 3 tool calls per task.
 * 4. After LLM says "done", run verification.
 * 5. Log to AuditLog.
 */
async function executeSingleTask(
  task: TaskWithDeps,
  agent: AgentInfo,
  missionId: string,
): Promise<void> {
  const messages: Array<{ role: string; content: string }> = [];
  let totalCost = 0;
  let toolCallsUsed = 0;
  const reactLog: ReActStep[] = [];

  // Build initial task prompt
  const taskPrompt = [
    `You are agent "${agent.name}".`,
    `Your assigned task: ${task.title}`,
    `Your available tools: [${agent.allowedTools.join(", ")}]`,
    `Execute this task. Use tools if needed, then report done when finished.`,
  ].join("\n");

  messages.push({ role: "user", content: taskPrompt });

  console.log(
    `[ORCHESTRATOR] Starting task: "${task.title}" → agent "${agent.name}"`,
  );

  // ReAct loop
  let isDone = false;
  while (!isDone && toolCallsUsed < MAX_TOOL_CALLS_PER_TASK) {
    const llmResponse = await callLLM(messages);

    reactLog.push({
      role: "agent",
      content: llmResponse.thought,
    });

    if (llmResponse.done || !llmResponse.toolCall) {
      isDone = true;

      // Save the result summary
      await prisma.missionTask.update({
        where: { id: task.id },
        data: { result: llmResponse.summary },
      });

      reactLog.push({
        role: "agent",
        content: `Task complete: ${llmResponse.summary}`,
      });

      console.log(
        `[ORCHESTRATOR] Task "${task.title}" completed (no more tool calls needed)`,
      );
      break;
    }

    // Execute the requested tool
    const { name: toolName, args } = llmResponse.toolCall;
    toolCallsUsed++;

    let toolResult: ToolExecutionResult;
    let toolOutputStr: string;

    try {
      toolResult = await executeTool(toolName, args, agent.id);
      toolOutputStr = JSON.stringify(toolResult.output);
      totalCost += 0.001; // estimated cost per tool call

      reactLog.push({
        role: "tool",
        content: `Executed ${toolName}: ${toolOutputStr.slice(0, 200)}`,
      });

      console.log(
        `[ORCHESTRATOR] Tool call #${toolCallsUsed}: ${toolName} → success (${toolResult.durationMs}ms)`,
      );
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Unknown tool error";
      toolOutputStr = `Error: ${errorMsg}`;

      reactLog.push({
        role: "system",
        content: `Tool ${toolName} failed: ${errorMsg}`,
      });

      console.warn(
        `[ORCHESTRATOR] Tool call #${toolCallsUsed}: ${toolName} → FAILED: ${errorMsg}`,
      );
    }

    // Feed the observation back to the LLM
    messages.push({
      role: "assistant",
      content: JSON.stringify({
        thought: llmResponse.thought,
        toolCall: llmResponse.toolCall,
      }),
    });
    messages.push({ role: "tool", content: toolOutputStr });
  }

  // ── Verification ───────────────────────────────────────────────────────
  console.log(`[ORCHESTRATOR] Verifying task: "${task.title}"`);
  const verification = await verifyTaskCompletion(task.id);

  // ── Audit Log ──────────────────────────────────────────────────────────
  const auditAction = verification.passed
    ? `Completed task: ${task.title}`
    : `Failed task: ${task.title}`;
  const auditResult = verification.passed
    ? reactLog
        .filter((s) => s.role !== "system")
        .map((s) => s.content)
        .join(" | ")
    : verification.error ?? "Verification failed";

  await logAuditEvent({
    missionId,
    agentName: agent.name,
    action: auditAction,
    result: auditResult.slice(0, 500),
    cost: totalCost,
  });
}

// ─── Main Orchestrator ──────────────────────────────────────────────────────

/**
 * Execute a full Mission by processing all its tasks in dependency order.
 *
 * Algorithm:
 * 1. Fetch Mission + all tasks ordered by sortOrder.
 * 2. Set Mission status to EXECUTING.
 * 3. Loop: find next task whose dependencies are all COMPLETED.
 * 4. For each ready task:
 *    a. Set status to IN_PROGRESS (we reuse IN_PROGRESS as "EXECUTING" at task level).
 *    b. Find the assigned Agent.
 *    c. Run the ReAct loop (LLM + tools).
 *    d. Verify completion.
 * 5. After all tasks are processed, set Mission to COMPLETED or FAILED.
 */
export async function executeMission(missionId: string): Promise<void> {
  // 1. Fetch mission + tasks
  const mission = await prisma.mission.findUnique({
    where: { id: missionId },
    include: {
      tasks: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!mission) {
    throw new Error(`Mission not found: ${missionId}`);
  }

  if (mission.status === "EXECUTING") {
    console.log(`[ORCHESTRATOR] Mission ${missionId} is already executing — skipping`);
    return;
  }

  // 2. Set mission to EXECUTING
  await prisma.mission.update({
    where: { id: missionId },
    data: { status: "EXECUTING" },
  });

  console.log(
    `[ORCHESTRATOR] Mission "${mission.normalizedGoal}" (${missionId}) → EXECUTING with ${mission.tasks.length} tasks`,
  );

  const tasks = mission.tasks as unknown as TaskWithDeps[];

  // 3. Process tasks respecting dependencies
  while (true) {
    // Find the next task that is PENDING and has all deps met
    const readyTask = tasks.find(
      (t) =>
        (t.status === "PENDING" || t.status === "FAILED") &&
        areDependenciesMet(t, tasks),
    );

    if (!readyTask) break; // No more tasks to process

    // 4a. Set task to IN_PROGRESS
    await prisma.missionTask.update({
      where: { id: readyTask.id },
      data: { status: "IN_PROGRESS" },
    });

    // Update local cache
    readyTask.status = "IN_PROGRESS";

    // 4b. Find the assigned agent
    const agent = await prisma.agent.findFirst({
      where: {
        name: readyTask.agent,
        isActive: true,
      },
    });

    if (!agent) {
      const errorMsg = `Agent "${readyTask.agent}" not found or inactive`;
      await prisma.missionTask.update({
        where: { id: readyTask.id },
        data: { status: "FAILED", error: errorMsg },
      });
      readyTask.status = "FAILED";

      await logAuditEvent({
        missionId,
        agentName: readyTask.agent,
        action: `Failed task: ${readyTask.title}`,
        result: errorMsg,
        cost: 0,
      });
      continue;
    }

    const agentInfo: AgentInfo = {
      id: agent.id,
      name: agent.name,
      allowedTools: JSON.parse(JSON.stringify(agent.allowedTools)) as string[],
    };

    // 4c+d. Execute with ReAct loop + verification
    try {
      await executeSingleTask(readyTask, agentInfo, missionId);

      // Refresh task status from DB (verification may have updated it)
      const updated = await prisma.missionTask.findUnique({
        where: { id: readyTask.id },
      });
      if (updated) {
        readyTask.status = updated.status;
        if (updated.status === "FAILED") hasFailure = true;
      }
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Unknown execution error";

      await prisma.missionTask.update({
        where: { id: readyTask.id },
        data: { status: "FAILED", error: errorMsg },
      });
      readyTask.status = "FAILED";

      console.error(
        `[ORCHESTRATOR] Task "${readyTask.title}" threw: ${errorMsg}`,
      );
    }
  }

  // 5. Finalize mission status
  const allTasks = await prisma.missionTask.findMany({
    where: { missionId },
  });
  const allDone = allTasks.every(
    (t) => t.status === "COMPLETED" || t.status === "SKIPPED",
  );
  const anyFailed = allTasks.some((t) => t.status === "FAILED");

  const finalStatus = anyFailed ? "REPAIRING" : allDone ? "COMPLETED" : "VERIFYING";

  await prisma.mission.update({
    where: { id: missionId },
    data: { status: finalStatus },
  });

  console.log(
    `[ORCHESTRATOR] Mission ${missionId} → ${finalStatus} (${allTasks.length} tasks processed)`,
  );
}
