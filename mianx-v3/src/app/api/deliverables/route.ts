import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// BUG: Stores base64 content directly in the DB

export async function POST(req: NextRequest) {
  const { projectId, name, content, mimeType } = await req.json();

  // BUG: Saves base64 string directly to DB — causes massive bloat
  const deliverable = await prisma.deliverable.create({
    data: {
      projectId,
      name,
      content,          // BUG: base64 blob stored in SQLite/Postgres
      contentEncoding: "base64",
      mimeType: mimeType || "application/octet-stream",
    },
  });

  return NextResponse.json({ deliverable }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId");

  const deliverables = await prisma.deliverable.findMany({
    where: projectId ? { projectId } : undefined,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ deliverables });
}
