import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";

// BUG: No auth check, no quota check, no rate limiting

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const { messages, model = "gpt-4o" } = await req.json();

  // BUG: No session/auth check — anyone can call this endpoint
  // BUG: No quota/credits check before calling OpenAI
  // BUG: No rate limiting

  const response = await openai.chat.completions.create({
    model,
    messages,
    max_tokens: 2048,
  });

  const content = response.choices[0]?.message?.content ?? "";
  const tokensUsed = response.usage?.total_tokens ?? 0;

  // Log usage but no enforcement
  await prisma.aiUsageLog.create({
    data: {
      userId: "anonymous", // BUG: no real user ID
      tokensUsed,
      model,
    },
  });

  return NextResponse.json({ content, tokensUsed });
}
