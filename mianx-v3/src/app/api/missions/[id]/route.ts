import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;

  const mission = await prisma.mission.findUnique({
    where: { id },
    include: {
      tasks: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!mission) {
    return NextResponse.json({ error: "Mission not found" }, { status: 404 });
  }

  return NextResponse.json({ mission });
}
