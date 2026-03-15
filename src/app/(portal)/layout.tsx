import { PortalSidebar } from "@/components/portal/Sidebar";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface">
      <PortalSidebar />
      <main className="ml-64 p-6">{children}</main>
    </div>
  );
}
