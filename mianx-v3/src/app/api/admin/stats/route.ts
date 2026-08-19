import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// BUG: Relies only on middleware JWT role claim — no DB-level check

export async function GET() {
  // BUG: No server-side admin verification — trusts middleware only
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
}
