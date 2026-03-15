"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { WorkOrder, WorkOrderStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  ClipboardList,
  ChevronDown,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Flag,
  Loader2,
} from "lucide-react";

type WorkOrderWithProfile = WorkOrder & {
  profiles?: { full_name: string; company_name: string | null } | null;
};

const STATUS_OPTIONS: WorkOrderStatus[] = [
  "submitted",
  "in_progress",
  "review",
  "completed",
  "cancelled",
];

const statusConfig: Record<
  WorkOrderStatus,
  { label: string; color: string; icon: typeof Clock }
> = {
  submitted: { label: "Submitted", color: "text-blue-400", icon: Clock },
  in_progress: {
    label: "In Progress",
    color: "text-yellow-400",
    icon: AlertCircle,
  },
  review: { label: "In Review", color: "text-purple-400", icon: AlertCircle },
  completed: {
    label: "Completed",
    color: "text-green-400",
    icon: CheckCircle,
  },
  cancelled: { label: "Cancelled", color: "text-red-400", icon: XCircle },
};

const priorityConfig: Record<
  string,
  { label: string; color: string; icon?: typeof Flag }
> = {
  low: { label: "Low", color: "text-muted" },
  medium: { label: "Medium", color: "text-blue-400" },
  high: { label: "High", color: "text-orange-400" },
  urgent: { label: "Urgent", color: "text-red-400", icon: Flag },
};

const FILTER_TABS: { value: WorkOrderStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "submitted", label: "Submitted" },
  { value: "in_progress", label: "In Progress" },
  { value: "review", label: "Review" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function AdminWorkOrdersPage() {
  const [orders, setOrders] = useState<WorkOrderWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<WorkOrderStatus | "all">(
    "all"
  );
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("work_orders")
      .select("*, profiles(full_name, company_name)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading work orders:", error);
      setLoading(false);
      return;
    }
    setOrders((data as WorkOrderWithProfile[]) ?? []);
    setLoading(false);
  }

  async function updateStatus(orderId: string, newStatus: WorkOrderStatus) {
    setUpdatingId(orderId);
    const supabase = createClient();
    const { error } = await supabase
      .from("work_orders")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", orderId);

    if (error) {
      console.error("Error updating status:", error);
      setUpdatingId(null);
      return;
    }
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, status: newStatus } : o
      )
    );
    setUpdatingId(null);
  }

  function getClientName(order: WorkOrderWithProfile): string {
    const p = order.profiles;
    if (!p) return "—";
    return p.full_name || p.company_name || "—";
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  const filteredOrders =
    statusFilter === "all"
      ? orders
      : orders.filter((o) => o.status === statusFilter);

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-muted text-center py-12 flex items-center justify-center gap-2">
          <Loader2 className="animate-spin" size={20} />
          Loading work orders...
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ClipboardList size={28} />
          Work Orders
        </h1>
        <p className="text-muted text-sm mt-1">
          Manage all work orders from all clients
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              statusFilter === tab.value
                ? "bg-primary hover:bg-primary-dark text-primary-light"
                : "bg-surface-light border border-border text-muted hover:text-white hover:border-primary/50"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="bg-surface-light border border-border rounded-xl p-12 text-center text-muted">
          No work orders found
          {statusFilter !== "all" && " for this status"}
        </div>
      ) : (
        <div className="bg-surface-light border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="text-left text-muted text-sm font-medium px-5 py-4">
                    Title
                  </th>
                  <th className="text-left text-muted text-sm font-medium px-5 py-4">
                    Client
                  </th>
                  <th className="text-left text-muted text-sm font-medium px-5 py-4">
                    Status
                  </th>
                  <th className="text-left text-muted text-sm font-medium px-5 py-4">
                    Priority
                  </th>
                  <th className="text-left text-muted text-sm font-medium px-5 py-4">
                    Created
                  </th>
                  <th className="text-left text-muted text-sm font-medium px-5 py-4 w-40">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const status = statusConfig[order.status];
                  const StatusIcon = status?.icon ?? Clock;
                  const priority = priorityConfig[order.priority] ?? priorityConfig.medium;
                  const PriorityIcon = priority.icon;

                  return (
                    <tr
                      key={order.id}
                      className="border-b border-border last:border-b-0 hover:bg-surface-lighter transition-colors"
                    >
                      <td className="px-5 py-4">
                        <p className="font-medium text-white">{order.title}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-white">{getClientName(order)}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium",
                            status.color,
                            "bg-surface"
                          )}
                        >
                          <StatusIcon size={12} />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 text-xs font-medium",
                            priority.color
                          )}
                        >
                          {PriorityIcon && <PriorityIcon size={12} />}
                          {priority.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-muted text-sm">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="relative group">
                          <select
                            value={order.status}
                            onChange={(e) =>
                              updateStatus(
                                order.id,
                                e.target.value as WorkOrderStatus
                              )
                            }
                            disabled={updatingId === order.id}
                            className={cn(
                              "appearance-none bg-surface border border-border rounded-lg pl-3 pr-8 py-2 text-sm text-white focus:outline-none focus:border-primary transition-colors cursor-pointer",
                              "disabled:opacity-60 disabled:cursor-not-allowed"
                            )}
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>
                                {statusConfig[s].label}
                              </option>
                            ))}
                          </select>
                          <ChevronDown
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
                            size={16}
                          />
                          {updatingId === order.id && (
                            <Loader2
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 animate-spin text-primary-light"
                              size={14}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
