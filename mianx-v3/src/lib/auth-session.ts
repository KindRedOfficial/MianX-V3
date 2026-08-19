import { cookies } from "next/headers";
import { prisma } from "./prisma";

export interface AuthSession {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    organizationId: string | null;
  };
}

/**
 * Validate the session cookie and return the authenticated user.
 * Throws a 401 error if no valid session is found.
 */
export async function getAuthSession(): Promise<AuthSession> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("next-auth.session-token")?.value
    ?? cookieStore.get("__Secure-next-auth.session-token")?.value;

  if (!sessionToken) {
    throw new AuthError("Unauthorized: no session token", 401);
  }

  const session = await prisma.session.findUnique({
    where: { sessionToken },
    include: { user: { select: { id: true, email: true, name: true, role: true, organizationId: true } } },
  });

  if (!session || session.expires < new Date()) {
    throw new AuthError("Unauthorized: session expired or invalid", 401);
  }

  return { user: session.user };
}

export class AuthError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
    this.name = "AuthError";
  }
}
