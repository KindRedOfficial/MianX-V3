import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import AuthProvider from "@/components/AuthProvider";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Step 1: Try to get the session — if this fails, show the EXACT error
  let session;
  let authError: string | null = null;

  try {
    session = await getServerSession(authOptions);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    authError = message;
  }

  // If auth itself threw, render a diagnostic page instead of crashing
  if (authError) {
    return (
      <html lang="en" className="dark">
        <body className="min-h-screen bg-[#0a0a0f] text-red-400 flex items-center justify-center p-6">
          <div className="max-w-2xl w-full space-y-4">
            <h1 className="text-2xl font-bold text-red-500">Admin Auth Error (Diagnostic)</h1>
            <p className="text-sm text-gray-400">
              The <code className="bg-red-500/10 px-1.5 py-0.5 rounded text-red-300">getServerSession()</code> call failed.
              This is the raw error from Vercel runtime:
            </p>
            <pre className="bg-red-500/5 border border-red-500/20 rounded-lg p-4 text-sm text-red-300 whitespace-pre-wrap break-all overflow-auto">
              {authError}
            </pre>
            <div className="text-xs text-gray-500 space-y-1">
              <p>Checklist:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Is <code>NEXTAUTH_SECRET</code> set in Vercel Environment Variables?</li>
                <li>Is <code>NEXTAUTH_URL</code> set to <code>https://mianx-v3.vercel.app</code>?</li>
                <li>Is <code>DATABASE_URL</code> set with <code>?sslmode=require</code>?</li>
                <li>Is the Supabase database publicly accessible (not in pause mode)?</li>
              </ul>
            </div>
            <a
              href="/login"
              className="inline-block mt-4 px-4 py-2 rounded-lg text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
            >
              Back to Login
            </a>
          </div>
        </body>
      </html>
    );
  }

  // Step 2: Session obtained but missing / wrong role → redirect
  if (!session?.user) redirect("/login");
  if ((session.user as { role: string }).role !== "ADMIN") redirect("/login");

  // Step 3: Normal admin render
  return (
    <AuthProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </AuthProvider>
  );
}
