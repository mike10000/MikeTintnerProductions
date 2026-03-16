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
  FileSignature,
  CheckCircle,
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

  const { data: approvedQuotes } = await supabase
    .from("quotes")
    .select("id, client_id, total, accepted_at, profiles(full_name, company_name)")
    .eq("status", "accepted")
    .order("accepted_at", { ascending: false })
    .limit(10);

  const today = new Date().toISOString().slice(0, 10);
  const { data: todayTasks } = await supabase
    .from("tasks")
    .select(`
      id,
      title,
      due_date,
      priority,
      board_columns(
        board_id,
        boards(
          id,
          name,
          client_id
        )
      )
    `)
    .eq("due_date", today)
    .order("priority", { ascending: false });

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
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

      <div className="space-y-6">
        {(approvedQuotes?.length ?? 0) > 0 && (
          <div className="bg-surface-light border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <CheckCircle size={20} className="text-green-400" />
              Approved quotes — send contract & invoice
            </h2>
            <ul className="space-y-2">
            {approvedQuotes?.map((q) => {
              const profile = Array.isArray(q.profiles) ? q.profiles[0] : q.profiles;
              return (
              <li key={q.id}>
                <div className="flex items-center justify-between p-3 rounded-lg bg-surface hover:bg-surface-lighter transition-colors">
                  <span className="text-white">
                    {(profile as { full_name?: string; company_name?: string | null })?.full_name ||
                      (profile as { full_name?: string; company_name?: string | null })?.company_name ||
                      "Client"}
                  </span>
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/contracts?client=${q.client_id}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/20 text-primary-light hover:bg-primary/30 text-xs font-medium transition-colors"
                    >
                      <FileSignature size={14} />
                      Contract
                    </Link>
                    <Link
                      href={`/admin/invoices?client=${q.client_id}&quote=${q.id}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/20 text-primary-light hover:bg-primary/30 text-xs font-medium transition-colors"
                    >
                      <Receipt size={14} />
                      Invoice
                    </Link>
                  </div>
                </div>
              </li>
            );})}
            </ul>
            <Link
              href="/admin/quotes"
              className="inline-block mt-4 text-primary-light hover:text-white text-sm font-medium"
            >
              View all quotes →
            </Link>
          </div>
        )}

        {(todayTasks?.length ?? 0) > 0 && (
          <div className="bg-surface-light border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Kanban size={20} />
              Due today
            </h2>
            <ul className="space-y-2">
            {(todayTasks ?? []).map((task) => {
              const bc = Array.isArray(task.board_columns) ? task.board_columns[0] : task.board_columns;
              const b = bc as { boards?: unknown } | null;
              const boardsArr = b?.boards;
              const board = (Array.isArray(boardsArr) ? boardsArr[0] : boardsArr) as { id?: string; name?: string } | undefined;
              return (
              <li key={task.id}>
                <Link
                  href={`/admin/boards/${board?.id ?? ""}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-surface hover:bg-surface-lighter transition-colors group"
                >
                  <span className="text-white group-hover:text-primary-light">{task.title}</span>
                  <span className="text-muted text-sm">
                    {board?.name ?? "Board"}
                    {task.priority !== "medium" && (
                      <span className={`ml-2 text-xs ${
                        task.priority === "urgent" ? "text-red-400" :
                        task.priority === "high" ? "text-amber-400" : "text-muted"
                      }`}>
                        {task.priority}
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            );})}
            </ul>
            <Link
              href="/admin/boards"
              className="inline-block mt-4 text-primary-light hover:text-white text-sm font-medium"
            >
              View all boards →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
