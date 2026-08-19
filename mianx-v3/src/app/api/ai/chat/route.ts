import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, AuthError } from "@/lib/auth-session";
import { requireAiQuota, deductAiCredits } from "@/lib/ai-quota";
import { rateLimit } from "@/lib/rate-limit";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate session
    const session = await getAuthSession();

    // 2. Rate-limit per user (20 req/min)
    await rateLimit({ key: `ai:chat:${session.user.id}`, limit: 20, windowMs: 60_000 });

    // 3. Check AI quota before calling provider
    const { organizationId } = await requireAiQuota(session.user.id);

    const { messages, model = "gpt-4o" } = await req.json();

    // 4. Call OpenAI
    const response = await openai.chat.completions.create({
      model,
      messages,
      max_tokens: 2048,
    });

    const content = response.choices[0]?.message?.content ?? "";
    const tokensUsed = response.usage?.total_tokens ?? 0;

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
    console.error("AI chat error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
