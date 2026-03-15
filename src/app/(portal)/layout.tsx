import { PortalSidebar } from "@/components/portal/Sidebar";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      <PortalSidebar />
      <main className="ml-64 p-6">{children}</main>
    </div>
  );
}
