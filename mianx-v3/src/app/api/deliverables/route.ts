import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadToStorage } from "@/services/deliverable-upload";

export async function POST(req: NextRequest) {
  try {
    const { projectId, name, content, mimeType } = await req.json();

    // Upload file to Supabase Storage instead of storing base64 in DB
    const storageUrl = await uploadToStorage({
      projectId,
      name,
      base64Content: content,
      mimeType: mimeType || "application/octet-stream",
    });

    const deliverable = await prisma.deliverable.create({
      data: {
        projectId,
        name,
        storageUrl,           // Store the URL, not the base64 blob
        content: "",           // Legacy field — keep empty for backward compat
        contentEncoding: "url",
        mimeType: mimeType || "application/octet-stream",
      },
    });

    // Return the same shape as V2 for backward compatibility
    return NextResponse.json({ deliverable }, { status: 201 });
  } catch (err: unknown) {
    console.error("Deliverable upload error:", err);
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId");

  const deliverables = await prisma.deliverable.findMany({
    where: projectId ? { projectId } : undefined,
    orderBy: { createdAt: "desc" },
  });

  // Backward compat: if a deliverable has storageUrl, expose it;
  // if it still has base64 content (legacy), return it as-is
  const compatDeliverables = deliverables.map((d) => {
    if (d.storageUrl) {
      return { ...d, content: d.storageUrl, contentEncoding: "url" };
    }
    return d;
  });

  return NextResponse.json({ deliverables: compatDeliverables });
}
