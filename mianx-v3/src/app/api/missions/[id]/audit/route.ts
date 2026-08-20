import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, AuthError } from "@/lib/auth-session";
import { getAuditLogs } from "@/lib/ai/audit.service";
import { getMissionOutcome } from "@/lib/ai/outcome.service";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    // 1. Authenticate
    const session = await getAuthSession();

    // 2. Resolve params
    const { id: missionId } = params;

    // 3. Verify mission ownership
    const mission = await prisma.mission.findUnique({
      where: { id: missionId },
      select: { userId: true },
    });

    if (!mission) {
      return NextResponse.json({ error: "Mission not found" }, { status: 404 });
    }

    if (mission.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 4. Fetch audit logs + outcome in parallel
    const [logs, outcome] = await Promise.all([
      getAuditLogs(missionId),
      getMissionOutcome(missionId),
    ]);

    return NextResponse.json({ logs, outcome });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("[AUDIT_API] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
