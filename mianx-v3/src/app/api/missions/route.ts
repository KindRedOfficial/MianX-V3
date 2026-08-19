import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const missions = await prisma.mission.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ missions });
}
