import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Users,
  ClipboardList,
  FileText,
  Receipt,
  MessageSquare,
  Kanban,
  ArrowRight,
} from "lucide-react";

export default async function AdminDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { count: clientCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "client");

  const { count: orderCount } = await supabase
    .from("work_orders")
    .select("*", { count: "exact", head: true })
    .in("status", ["submitted", "in_progress", "review"]);

  const { count: quoteCount } = await supabase
    .from("quotes")
    .select("*", { count: "exact", head: true })
    .in("status", ["draft", "sent"]);

  const { count: invoiceCount } = await supabase
    .from("invoices")
    .select("*", { count: "exact", head: true })
    .in("status", ["draft", "sent", "overdue"]);

  const { count: unreadCount } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("read", false);

  const { count: boardCount } = await supabase
    .from("boards")
    .select("*", { count: "exact", head: true });

  const stats = [
    { label: "Clients", count: clientCount ?? 0, href: "/admin/clients", icon: Users },
    { label: "Active Orders", count: orderCount ?? 0, href: "/admin/work-orders", icon: ClipboardList },
    { label: "Open Quotes", count: quoteCount ?? 0, href: "/admin/quotes", icon: FileText },
    { label: "Unpaid Invoices", count: invoiceCount ?? 0, href: "/admin/invoices", icon: Receipt },
    { label: "Unread Messages", count: unreadCount ?? 0, href: "/admin/messages", icon: MessageSquare },
    { label: "Task Boards", count: boardCount ?? 0, href: "/admin/boards", icon: Kanban },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Admin Overview</h1>
        <p className="text-muted text-sm mt-1">
          Manage clients, projects, and billing
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
    </div>
  );
}
