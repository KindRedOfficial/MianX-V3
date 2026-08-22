import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import AuthProvider from "@/components/AuthProvider";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let session;
  try {
    session = await getServerSession(authOptions);
  } catch {
    redirect("/login");
  }

  if (!session?.user) redirect("/login");
  if ((session.user as { role: string }).role !== "ADMIN") redirect("/login");

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
