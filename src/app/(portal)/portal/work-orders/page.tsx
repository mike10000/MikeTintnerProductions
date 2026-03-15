"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { WorkOrder } from "@/lib/types";
import { Plus, Clock, CheckCircle, AlertCircle, XCircle, Paperclip, X } from "lucide-react";
import { cn } from "@/lib/utils";

const statusConfig: Record<
  string,
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

export default function WorkOrdersPage() {
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("work_orders")
      .select("*")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false });

    setOrders(data || []);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setSubmitting(true);
    const uploadedUrls: { name: string; url: string }[] = [];
    for (const file of attachments) {
      const path = `${user.id}/work-orders/${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from("client-files")
        .upload(path, file, { upsert: true });
      if (!error && data) {
        const { data: urlData } = supabase.storage.from("client-files").getPublicUrl(data.path);
        uploadedUrls.push({ name: file.name, url: urlData.publicUrl });
      }
    }

    await supabase.from("work_orders").insert({
      client_id: user.id,
      title,
      description,
      priority,
      status: "submitted",
      attachments: uploadedUrls,
    });

    setTitle("");
    setDescription("");
    setPriority("medium");
    setAttachments([]);
    setShowForm(false);
    setSubmitting(false);
    loadOrders();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Work Orders</h1>
          <p className="text-muted text-sm mt-1">
            Submit and track your project requests
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          New Work Order
        </button>
      </div>

      {showForm && (
        <div className="bg-surface-light border border-border rounded-xl p-6 mb-6">
          <h2 className="text-white font-semibold mb-4">
            Submit a Work Order
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-white text-sm font-medium mb-1.5">
                Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-white placeholder-muted focus:outline-none focus:border-primary transition-colors"
                placeholder="Brief description of what you need"
              />
            </div>
            <div>
              <label className="block text-white text-sm font-medium mb-1.5">
                Details
              </label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-white placeholder-muted focus:outline-none focus:border-primary transition-colors resize-none"
                placeholder="Provide as much detail as possible..."
              />
            </div>
            <div>
              <label className="block text-white text-sm font-medium mb-1.5">
                Attachments
              </label>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.csv,image/*"
                onChange={(e) => {
                  const files = e.target.files;
                  if (files) setAttachments((a) => [...a, ...Array.from(files)]);
                  e.target.value = "";
                }}
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 text-muted hover:text-white text-sm"
                >
                  <Paperclip size={16} />
                  Attach files
                </button>
              </div>
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {attachments.map((f, i) => (
                    <span key={i} className="flex items-center gap-1 bg-surface rounded px-2 py-1 text-xs text-muted">
                      {f.name}
                      <button type="button" onClick={() => setAttachments((a) => a.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-300">
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-white text-sm font-medium mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="bg-surface border border-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="bg-primary hover:bg-primary-dark disabled:opacity-50 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {submitting ? "Submitting..." : "Submit"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="border border-border hover:border-primary text-muted hover:text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-muted text-center py-12">Loading...</div>
      ) : orders.length === 0 ? (
        <div className="bg-surface-light border border-border rounded-xl p-12 text-center">
          <p className="text-muted">No work orders yet.</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 text-primary-light hover:text-white text-sm font-medium transition-colors"
          >
            Submit your first work order
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const status = statusConfig[order.status];
            const StatusIcon = status?.icon || Clock;
            return (
              <div
                key={order.id}
                className="bg-surface-light border border-border rounded-xl p-5 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-white font-medium">{order.title}</h3>
                    <p className="text-muted text-sm mt-1 line-clamp-2">
                      {order.description}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "flex items-center gap-1.5 text-sm font-medium ml-4",
                      status?.color
                    )}
                  >
                    <StatusIcon size={14} />
                    {status?.label}
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-muted">
                  <span>
                    Priority:{" "}
                    <span className="capitalize">{order.priority}</span>
                  </span>
                  <span>
                    Submitted:{" "}
                    {new Date(order.created_at).toLocaleDateString()}
                  </span>
                </div>
                {order.attachments?.length ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {order.attachments.map((a, i) => (
                      <a key={i} href={a.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-light hover:text-white">
                        📎 {a.name}
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
