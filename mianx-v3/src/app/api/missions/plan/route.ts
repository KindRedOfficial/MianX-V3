import { NextRequest, NextResponse } from "next/server";
import { createMissionFromGoal } from "@/lib/ai/planner.service";
import { getAuthSession, AuthError } from "@/lib/auth-session";

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    const { goal, budget } = (await req.json()) as { goal?: string; budget?: number };

    if (!goal || typeof goal !== "string" || goal.trim().length === 0) {
      return NextResponse.json({ error: "Goal is required" }, { status: 400 });
    }

    const result = await createMissionFromGoal({
      userId: session.user.id,
      userGoal: goal.trim(),
      budget: budget ?? 0,
    });

    return NextResponse.json({ missionId: result.missionId, plan: result.plan }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    const message = err instanceof Error ? err.message : "Planning failed";
    console.error("[API /missions/plan]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
