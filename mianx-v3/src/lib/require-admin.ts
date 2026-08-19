import { cookies } from "next/headers";
import { prisma } from "./prisma";

/**
 * Centralized server-side admin authorization.
 * Fetches the user's role directly from the database (not from a potentially stale JWT).
 * Throws if the user is not authenticated or is not an ADMIN.
 */
export async function requireAdmin(): Promise<{ id: string; email: string; name: string | null }> {
  const cookieStore = await cookies();
  const sessionToken =
    cookieStore.get("next-auth.session-token")?.value ??
    cookieStore.get("__Secure-next-auth.session-token")?.value;

  if (!sessionToken) {
    throw new AdminAuthError("Unauthorized: no session", 401);
  }

  const session = await prisma.session.findUnique({
    where: { sessionToken },
    include: { user: { select: { id: true, email: true, name: true, role: true } } },
  });

  if (!session || session.expires < new Date()) {
    throw new AdminAuthError("Unauthorized: session expired or invalid", 401);
  }

  // Fetch role directly from DB — not from JWT — to prevent stale-privilege exploits
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, role: true },
  });

  if (!dbUser || dbUser.role !== "ADMIN") {
    throw new AdminAuthError("Forbidden: admin access required", 403);
  }

  return { id: dbUser.id, email: dbUser.email, name: dbUser.name };
}

export class AdminAuthError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
    this.name = "AdminAuthError";
  }
}
