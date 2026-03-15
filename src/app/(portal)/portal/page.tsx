import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ClipboardList,
  FileText,
  Receipt,
  MessageSquare,
  ArrowRight,
} from "lucide-react";
import { ClientWebsites } from "@/components/portal/ClientWebsites";

export default async function PortalDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { count: orderCount } = await supabase
    .from("work_orders")
    .select("*", { count: "exact", head: true })
    .eq("client_id", user.id);

  const { count: quoteCount } = await supabase
    .from("quotes")
    .select("*", { count: "exact", head: true })
    .eq("client_id", user.id)
    .eq("status", "sent");

  const { count: invoiceCount } = await supabase
    .from("invoices")
    .select("*", { count: "exact", head: true })
    .eq("client_id", user.id)
    .eq("status", "sent");

  const { count: unreadCount } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("read", false)
    .neq("sender_id", user.id);

  const stats = [
    {
      label: "Active Work Orders",
      count: orderCount ?? 0,
      href: "/portal/work-orders",
      icon: ClipboardList,
    },
    {
      label: "Pending Quotes",
      count: quoteCount ?? 0,
      href: "/portal/quotes",
      icon: FileText,
    },
    {
      label: "Unpaid Invoices",
      count: invoiceCount ?? 0,
      href: "/portal/invoices",
      icon: Receipt,
    },
    {
      label: "Unread Messages",
      count: unreadCount ?? 0,
      href: "/portal/messages",
      icon: MessageSquare,
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          Welcome back, {profile?.full_name || "there"}
        </h1>
        <p className="text-muted text-sm mt-1">
          Here&apos;s an overview of your projects and activity.
        </p>
      </div>

      <ClientWebsites />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-surface-light border border-border rounded-xl p-5 hover:border-primary transition-colors group"
          >
            <div className="flex items-center justify-between mb-3">
              <stat.icon className="text-muted" size={20} />
              <ArrowRight
                className="text-muted group-hover:text-primary-light transition-colors"
                size={16}
              />
            </div>
            <p className="text-2xl font-bold text-white">{stat.count}</p>
            <p className="text-muted text-sm">{stat.label}</p>
          </Link>
        ))}
      </div>

      <div className="bg-surface-light border border-border rounded-xl p-6">
        <h2 className="text-white font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/portal/work-orders?action=new"
            className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Submit Work Order
          </Link>
          <Link
            href="/portal/messages"
            className="border border-border hover:border-primary text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Send a Message
          </Link>
        </div>
      </div>
    </div>
  );
}
