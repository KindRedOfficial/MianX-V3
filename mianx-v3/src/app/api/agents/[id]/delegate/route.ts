import { NextRequest, NextResponse } from "next/server";
import { getAuthSession, AuthError } from "@/lib/auth-session";
import { delegateTask, DelegationSecurityError } from "@/lib/ai/delegation.service";
import type { DelegationTaskData } from "@/lib/ai/delegation.service";

interface DelegateRequestBody {
  taskData: DelegationTaskData;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // 1. Authenticate the user
    const session = await getAuthSession();

    // 2. Parse and validate request body
    const body = (await req.json()) as DelegateRequestBody;
    const { taskData } = body;

    if (!taskData?.title || !taskData?.capabilities || !taskData?.riskLevel || !taskData?.missionId) {
      return NextResponse.json(
        { error: "Missing required fields: title, capabilities, riskLevel, missionId" },
        { status: 400 },
      );
    }

    if (!Array.isArray(taskData.capabilities) || taskData.capabilities.length === 0) {
      return NextResponse.json(
        { error: "capabilities must be a non-empty array of strings" },
        { status: 400 },
      );
    }

    // 3. Resolve dynamic route param
    const { id: parentAgentId } = await params;

    // 4. Delegate (includes security checks)
    const delegatedTask = await delegateTask(parentAgentId, taskData);

    return NextResponse.json({ task: delegatedTask }, { status: 201 });
  } catch (err: unknown) {
    // Auth errors
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }

    // Privilege escalation — return 403
    if (err instanceof DelegationSecurityError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }

    // Other errors
    const message = err instanceof Error ? err.message : "Delegation failed";
    console.error("[API /agents/[id]/delegate]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
