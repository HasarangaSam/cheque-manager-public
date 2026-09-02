import Sidebar from "@/components/layout/sidebar";
import { getSession } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar username={session?.username} />

      <div className="pt-16 lg:pt-0 lg:pl-64 flex flex-col min-h-screen">
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

