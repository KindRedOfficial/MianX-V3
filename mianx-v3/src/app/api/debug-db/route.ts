import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const dbUrlExists = !!process.env.DATABASE_URL;
    const secretExists = !!process.env.NEXTAUTH_SECRET;
    const authUrl = process.env.NEXTAUTH_URL || 'NOT SET';

    const user = await prisma.user.findUnique({ where: { email: 'founder@mianx.ai' } });

    return NextResponse.json({
      status: 'Success',
      dbUrlExists,
      secretExists,
      authUrl,
      userFound: !!user,
      userRole: user?.role,
      hashPrefix: user?.passwordHash?.substring(0, 10),
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    return NextResponse.json(
      {
        status: 'Error',
        dbUrlExists: !!process.env.DATABASE_URL,
        errorMessage: err.message,
        errorStack: err.stack,
      },
      { status: 500 }
    );
  }
}
