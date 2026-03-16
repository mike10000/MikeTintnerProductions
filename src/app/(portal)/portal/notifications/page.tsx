"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Notification } from "@/lib/types";
import Link from "next/link";
import { Bell, ChevronRight, FileText, MessageSquare, ClipboardList, Receipt, CheckSquare, FileSignature } from "lucide-react";
import { cn } from "@/lib/utils";

const typeIcons: Record<string, typeof FileText> = {
  work_order_update: ClipboardList,
  quote_sent: FileText,
  invoice_sent: Receipt,
  task_update: CheckSquare,
  new_message: MessageSquare,
  contract_ready: FileSignature,
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    const supabase = createClient();
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    setNotifications((data as Notification[]) ?? []);
    setLoading(false);
  }

  async function markRead(id: string) {
    const supabase = createClient();
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  async function markAllRead() {
    const supabase = createClient();
    const unread = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unread.length === 0) return;
    await supabase.from("notifications").update({ read: true }).in("id", unread);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
  }

  if (loading) {
    return <div className="text-muted text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-muted text-sm mt-1">
            Updates about your projects and activity
          </p>
        </div>
        {notifications.some((n) => !n.read) && (
          <button
            onClick={markAllRead}
            className="text-primary-light hover:text-white text-sm font-medium transition-colors"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="bg-surface-light border border-border rounded-xl overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-12 text-center text-muted">
            <Bell size={40} className="mx-auto mb-3 opacity-50" />
            <p>No notifications yet</p>
            <p className="text-sm mt-1">
              You&apos;ll see updates here when we send quotes, invoices, or make changes to your projects.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {notifications.map((n) => {
              const Icon = typeIcons[n.type] ?? Bell;
              return (
                <li key={n.id}>
                  <Link
                    href={n.link_url || "/portal"}
                    onClick={() => !n.read && markRead(n.id)}
                    className={cn(
                      "flex items-start gap-4 p-4 hover:bg-surface transition-colors",
                      !n.read && "bg-primary/5"
                    )}
                  >
                    <div
                      className={cn(
                        "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
                        !n.read ? "bg-primary/20 text-primary-light" : "bg-surface text-muted"
                      )}
                    >
                      <Icon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-white font-medium", !n.read && "font-semibold")}>
                        {n.title}
                      </p>
                      {n.body && (
                        <p className="text-muted text-sm mt-0.5 line-clamp-2">
                          {n.body}
                        </p>
                      )}
                      <p className="text-muted text-xs mt-1">{formatDate(n.created_at)}</p>
                    </div>
                    <ChevronRight size={18} className="text-muted flex-shrink-0 mt-1" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
