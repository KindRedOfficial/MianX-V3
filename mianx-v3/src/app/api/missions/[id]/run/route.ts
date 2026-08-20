import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, AuthError } from "@/lib/auth-session";
import { executeMission } from "@/lib/ai/orchestrator.service";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // 1. Authenticate
    const session = await getAuthSession();

    // 2. Resolve params
    const { id: missionId } = await params;

    // 3. Fetch mission and verify ownership
    const mission = await prisma.mission.findUnique({
      where: { id: missionId },
      select: { userId: true, status: true },
    });

    if (!mission) {
      return NextResponse.json({ error: "Mission not found" }, { status: 404 });
    }

    if (mission.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 4. Prevent duplicate execution
    if (mission.status === "EXECUTING") {
      return NextResponse.json(
        { error: "Mission is already executing" },
        { status: 409 },
      );
    }

    // 5. Launch execution in background (fire-and-forget)
    //    The orchestrator updates task statuses in the DB as it progresses,
    //    so the client can poll for updates.
    executeMission(missionId).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error(`[ORCHESTRATOR] Unhandled error in mission ${missionId}: ${message}`);
    });

    return NextResponse.json({
      message: "Mission execution started",
      missionId,
    });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("[MISSION_RUN_API] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
