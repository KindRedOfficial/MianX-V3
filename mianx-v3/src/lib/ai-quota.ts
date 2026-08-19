import { prisma } from "./prisma";
import { AuthError } from "./auth-session";

/**
 * Check if the user's organization has enough AI credits remaining.
 * Throws 402 if quota is exhausted, 404 if no org is linked.
 */
export async function requireAiQuota(userId: string): Promise<{ organizationId: string; remainingCredits: number }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true },
  });

  if (!user) {
    throw new AuthError("User not found", 404);
  }

  if (!user.organizationId) {
    throw new AuthError(
      "No organization linked. AI features require an organization with credits.",
      402,
    );
  }

  const org = await prisma.organization.findUnique({
    where: { id: user.organizationId },
    select: { aiCredits: true },
  });

  if (!org || org.aiCredits <= 0) {
    throw new AuthError(
      "AI credits exhausted. Please upgrade your plan or contact support.",
      402,
    );
  }

  return { organizationId: user.organizationId, remainingCredits: org.aiCredits };
}

/**
 * Decrement the organization's AI credits by the given token count.
 */
export async function deductAiCredits(organizationId: string, tokensUsed: number): Promise<void> {
  await prisma.organization.update({
    where: { id: organizationId },
    data: { aiCredits: { decrement: tokensUsed } },
  });
}
