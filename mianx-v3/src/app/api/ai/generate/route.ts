import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { getAuthSession, AuthError } from "@/lib/auth-session";
import { requireAiQuota, deductAiCredits } from "@/lib/ai-quota";
import { rateLimit } from "@/lib/rate-limit";

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate session
    const session = await getAuthSession();

    // 2. Rate-limit per user (20 req/min)
    await rateLimit({ key: `ai:generate:${session.user.id}`, limit: 20, windowMs: 60_000 });

    // 3. Check AI quota before calling provider
    const { organizationId } = await requireAiQuota(session.user.id);

    const { prompt, model = "claude-sonnet-4-20250514" } = await req.json();

    // 4. Call Anthropic
    const response = await getAnthropic().messages.create({
      model,
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0]?.type === "text" ? response.content[0].text : "";
    const tokensUsed = response.usage.input_tokens + response.usage.output_tokens;

    // 5. Deduct credits & log usage
    await deductAiCredits(organizationId, tokensUsed);
    await prisma.aiUsageLog.create({
      data: {
        userId: session.user.id,
        organizationId,
        tokensUsed,
        model,
      },
    });

    return NextResponse.json({ content, tokensUsed });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("AI generate error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
