import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";

// BUG: No auth check, no quota check, no rate limiting

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { prompt, model = "claude-sonnet-4-20250514" } = await req.json();

  // BUG: No session/auth check
  // BUG: No quota/credits check
  // BUG: No rate limiting

  const response = await anthropic.messages.create({
    model,
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.content[0]?.type === "text" ? response.content[0].text : "";
  const tokensUsed = response.usage.input_tokens + response.usage.output_tokens;

  await prisma.aiUsageLog.create({
    data: {
      userId: "anonymous", // BUG: no real user ID
      tokensUsed,
      model,
    },
  });

  return NextResponse.json({ content, tokensUsed });
}
