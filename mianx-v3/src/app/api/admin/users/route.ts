import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// BUG: Relies only on middleware JWT role claim — no DB-level check

export async function GET(req: NextRequest) {
  // BUG: No server-side admin verification — trusts middleware only
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, organizationId: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ users });
}

export async function PATCH(req: NextRequest) {
  // BUG: No server-side admin verification
  const { userId, role } = await req.json();

  const user = await prisma.user.update({
    where: { id: userId },
    data: { role },
  });

  return NextResponse.json({ user });
}
