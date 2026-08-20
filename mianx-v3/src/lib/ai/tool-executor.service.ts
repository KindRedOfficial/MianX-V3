import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { parseStringArray } from "./agent-selector.service";

// ─── Error Types ─────────────────────────────────────────────────────────────

export class ToolDisabledError extends Error {
  constructor(public readonly toolName: string) {
    super(`Tool "${toolName}" is disabled and cannot be executed`);
    this.name = "ToolDisabledError";
  }
}

export class ToolInputValidationError extends Error {
  constructor(
    public readonly toolName: string,
    public readonly validationErrors: z.ZodError,
  ) {
    super(
      `Input validation failed for tool "${toolName}": ${validationErrors.message}`,
    );
    this.name = "ToolInputValidationError";
  }
}

export class ToolNotAuthorizedError extends Error {
  constructor(
    public readonly toolName: string,
    public readonly agentId: string,
    public readonly agentName: string,
  ) {
    super(
      `Agent "${agentName}" (${agentId}) is not authorized to use tool "${toolName}"`,
    );
    this.name = "ToolNotAuthorizedError";
  }
}

export class ToolNotFoundError extends Error {
  constructor(public readonly toolName: string) {
    super(`Tool "${toolName}" not found in registry`);
    this.name = "ToolNotFoundError";
  }
}

// ─── Output Type ─────────────────────────────────────────────────────────────

export interface ToolExecutionResult {
  success: boolean;
  toolName: string;
  output: unknown;
  executedAt: string;
  durationMs: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Build a Zod schema dynamically from a JSON Schema-like definition stored in DB.
 * Supports a subset of Zod schema primitives: string, number, boolean, array, object.
 */
function buildZodSchema(jsonSchema: unknown): z.ZodTypeUnknown {
  if (!jsonSchema || typeof jsonSchema !== "object") {
    return z.unknown();
  }

  const schema = jsonSchema as Record<string, unknown>;
  const type = schema.type as string | undefined;

  switch (type) {
    case "string":
      return z.string();
    case "number":
      return z.number();
    case "boolean":
      return z.boolean();
    case "array": {
      const itemsSchema = schema.items
        ? buildZodSchema(schema.items)
        : z.unknown();
      return z.array(itemsSchema as z.ZodTypeAny);
    }
    case "object": {
      const properties = (schema.properties ?? {}) as Record<
        string,
        unknown
      >;
      const shape: Record<string, z.ZodTypeAny> = {};
      for (const [key, value] of Object.entries(properties)) {
        shape[key] = buildZodSchema(value) as z.ZodTypeAny;
      }
      return z.object(shape);
    }
    default:
      return z.unknown();
  }
}

/**
 * Mock tool implementations. In production, these would dispatch to real
 * sandboxed execution environments (e.g., Docker, Firecracker).
 */
const MOCK_EXECUTORS: Record<string, (args: Record<string, unknown>) => unknown> = {
  run_tests: (_args) => ({
    success: true,
    output: "All 10 tests passed.",
    testCount: 10,
    failedCount: 0,
  }),

  read_file: (args) => ({
    content:
      "export default function() { return true; }",
    path: (args.path as string) ?? "/unknown",
    size: 42,
  }),
};

// ─── Core Executor ───────────────────────────────────────────────────────────

/**
 * Execute a registered tool on behalf of an agent.
 *
 * Security flow:
 * 1. Fetch the Tool from DB — verify it exists and is enabled.
 * 2. Validate inputArgs against the tool's inputSchema using Zod.
 * 3. Fetch the Agent from DB — verify the tool is in the agent's allowedTools.
 * 4. Execute (mock for now) and return structured result.
 *
 * @throws ToolNotFoundError       — tool not in registry
 * @throws ToolDisabledError      — tool exists but isEnabled = false
 * @throws ToolInputValidationError — Zod validation fails
 * @throws ToolNotAuthorizedError  — agent lacks permission (maps to 403)
 */
export async function executeTool(
  toolName: string,
  inputArgs: unknown,
  agentId: string,
): Promise<ToolExecutionResult> {
  // ── Step 1: Fetch and validate tool ──────────────────────────────────────
  const tool = await prisma.tool.findUnique({ where: { name: toolName } });

  if (!tool) {
    throw new ToolNotFoundError(toolName);
  }

  if (!tool.isEnabled) {
    throw new ToolDisabledError(toolName);
  }

  // ── Step 2: Validate input against inputSchema ───────────────────────────
  const inputSchema = buildZodSchema(tool.inputSchema);
  const parseResult = inputSchema.safeParse(inputArgs);

  if (!parseResult.success) {
    throw new ToolInputValidationError(toolName, parseResult.error);
  }

  const validatedInput = parseResult.data as Record<string, unknown>;

  // ── Step 3: Verify agent authorization ───────────────────────────────────
  const agent = await prisma.agent.findUnique({ where: { id: agentId } });

  if (!agent) {
    throw new Error(`Agent not found: ${agentId}`);
  }

  const allowedTools = parseStringArray(agent.allowedTools);
  if (!allowedTools.includes(toolName)) {
    throw new ToolNotAuthorizedError(toolName, agentId, agent.name);
  }

  // ── Step 4: Execute ──────────────────────────────────────────────────────
  const start = performance.now();

  const executor = MOCK_EXECUTORS[toolName];
  let output: unknown;

  if (executor) {
    output = executor(validatedInput);
  } else {
    // Generic mock fallback for unregistered tool implementations
    output = {
      success: true,
      message: `Tool "${toolName}" executed successfully (no specific mock implementation)`,
      input: validatedInput,
    };
  }

  const durationMs = Math.round(performance.now() - start);

  console.log(
    `[TOOL_EXEC] tool="${toolName}" agent="${agent.name}" (${agentId}) duration=${durationMs}ms success=true`,
  );

  return {
    success: true,
    toolName,
    output,
    executedAt: new Date().toISOString(),
    durationMs,
  };
}
