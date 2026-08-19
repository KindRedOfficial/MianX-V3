import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, AdminAuthError } from "@/lib/require-admin";

export async function GET() {
  try {
    await requireAdmin();

    const [totalUsers, totalOrgs, totalSubscriptions] = await Promise.all([
      prisma.user.count(),
      prisma.organization.count(),
      prisma.subscription.count(),
    ]);

    return NextResponse.json({
      totalUsers,
      totalOrgs,
      totalSubscriptions,
    });
  } catch (err: unknown) {
    if (err instanceof AdminAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("Admin stats error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
