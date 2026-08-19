import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, AdminAuthError } from "@/lib/require-admin";

export async function GET() {
  try {
    await requireAdmin();

    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, organizationId: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ users });
  } catch (err: unknown) {
    if (err instanceof AdminAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("Admin users error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin();

    const { userId, role } = await req.json();

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    return NextResponse.json({ user });
  } catch (err: unknown) {
    if (err instanceof AdminAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("Admin users update error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
