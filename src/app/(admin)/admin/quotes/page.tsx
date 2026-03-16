"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Quote, LineItem, Profile, QuoteStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  FileText,
  Plus,
  Trash2,
  ChevronDown,
  Loader2,
  X,
  DollarSign,
  FileSignature,
  Receipt,
} from "lucide-react";

type QuoteWithProfile = Quote & {
  profiles?: { full_name: string; company_name: string | null } | null;
};

const STATUS_OPTIONS: QuoteStatus[] = ["draft", "sent", "accepted", "declined"];

const statusConfig: Record<
  QuoteStatus,
  { label: string; color: string }
> = {
  draft: { label: "Draft", color: "text-muted" },
  sent: { label: "Sent", color: "text-blue-400" },
  accepted: { label: "Accepted", color: "text-green-400" },
  declined: { label: "Declined", color: "text-red-400" },
};

const emptyLineItem: LineItem = {
  description: "",
  quantity: 1,
  unit_price: 0,
};

function AdminQuotesContent() {
  const searchParams = useSearchParams();
  const [quotes, setQuotes] = useState<QuoteWithProfile[]>([]);
  const [clients, setClients] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formClientId, setFormClientId] = useState("");
  const [formLineItems, setFormLineItems] = useState<LineItem[]>([
    { ...emptyLineItem },
  ]);
  const [formIntroText, setFormIntroText] = useState("");
  const [formStatus, setFormStatus] = useState<"draft" | "sent">("draft");
  const [formWorkOrderId, setFormWorkOrderId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    loadQuotes();
    loadClients();
  }, []);

  useEffect(() => {
    const create = searchParams.get("create");
    const workOrderId = searchParams.get("work_order");
    const clientId = searchParams.get("client");
    if (create === "1" && clientId && clients.length > 0) {
      setFormClientId(clientId);
      setFormWorkOrderId(workOrderId);
      setModalOpen(true);
      if (workOrderId) {
        loadWorkOrderForQuote(workOrderId);
      }
    }
  }, [searchParams, clients]);

  async function loadWorkOrderForQuote(workOrderId: string) {
    const supabase = createClient();
    const { data } = await supabase
      .from("work_orders")
      .select("title, description")
      .eq("id", workOrderId)
      .single();
    if (data) {
      setFormLineItems([
        {
          description: data.title + (data.description ? `\n${data.description}` : ""),
          quantity: 1,
          unit_price: 0,
        },
      ]);
    }
  }

  async function loadQuotes() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("quotes")
      .select("*, profiles(full_name, company_name)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading quotes:", error);
      setLoading(false);
      return;
    }
    setQuotes((data as QuoteWithProfile[]) ?? []);
    setLoading(false);
  }

  async function loadClients() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "client")
      .order("full_name");

    if (error) {
      console.error("Error loading clients:", error);
      return;
    }
    setClients((data as Profile[]) ?? []);
  }

  async function updateStatus(quoteId: string, newStatus: QuoteStatus) {
    setUpdatingId(quoteId);
    const supabase = createClient();
    const { error } = await supabase
      .from("quotes")
      .update({ status: newStatus })
      .eq("id", quoteId);

    if (error) {
      console.error("Error updating status:", error);
      setUpdatingId(null);
      return;
    }
    setQuotes((prev) =>
      prev.map((q) => (q.id === quoteId ? { ...q, status: newStatus } : q))
    );
    setUpdatingId(null);
  }

  function openCreateModal() {
    setFormClientId(clients[0]?.id ?? "");
    setFormLineItems([{ ...emptyLineItem }]);
    setFormIntroText("");
    setFormStatus("draft");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setSaveError(null);
  }

  function addLineItem() {
    setFormLineItems((prev) => [...prev, { ...emptyLineItem }]);
  }

  function removeLineItem(index: number) {
    setFormLineItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateLineItem(index: number, field: keyof LineItem, value: string | number) {
    setFormLineItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  }

  const formTotal = formLineItems.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  );

  async function handleSaveQuote() {
    if (!formClientId) return;
    setSaving(true);
    setSaveError(null);
    const supabase = createClient();

    const lineItems = formLineItems
      .filter((li) => li.description.trim() || li.quantity > 0 || li.unit_price > 0)
      .map((li) => ({
        description: li.description,
        quantity: Number(li.quantity) || 0,
        unit_price: Number(li.unit_price) || 0,
        ...(li.timeline?.trim() && { timeline: li.timeline.trim() }),
      }));

    const payload: Record<string, unknown> = {
      client_id: formClientId,
      work_order_id: formWorkOrderId || null,
      line_items: lineItems.length > 0 ? lineItems : [{ description: "Quote item", quantity: 1, unit_price: 0 }],
      total: Number(formTotal) || 0,
      status: formStatus,
      valid_until: null,
    };
    const introVal = formIntroText.trim();
    if (introVal) payload.intro_text = introVal;

    const { error } = await supabase.from("quotes").insert(payload);

    if (error) {
      setSaveError(error.message);
      setSaving(false);
      return;
    }
    await loadQuotes();
    closeModal();
    setSaving(false);
  }

  function getClientName(quote: QuoteWithProfile): string {
    const p = quote.profiles;
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

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-muted text-center py-12 flex items-center justify-center gap-2">
          <Loader2 className="animate-spin" size={20} />
          Loading quotes...
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText size={28} />
            Quotes
          </h1>
          <p className="text-muted text-sm mt-1">
            Manage quotes and proposals for clients
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-dark text-primary-light font-medium transition-colors"
        >
          <Plus size={18} />
          New Quote
        </button>
      </div>

      {quotes.length === 0 ? (
        <div className="bg-surface-light border border-border rounded-xl p-12 text-center text-muted">
          No quotes found. Create your first quote to get started.
        </div>
      ) : (
        <div className="bg-surface-light border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="text-left text-muted text-sm font-medium px-5 py-4">
                    Quote ID
                  </th>
                  <th className="text-left text-muted text-sm font-medium px-5 py-4">
                    Client
                  </th>
                  <th className="text-left text-muted text-sm font-medium px-5 py-4">
                    Total
                  </th>
                  <th className="text-left text-muted text-sm font-medium px-5 py-4">
                    Status
                  </th>
                  <th className="text-left text-muted text-sm font-medium px-5 py-4">
                    Created
                  </th>
                  <th className="text-left text-muted text-sm font-medium px-5 py-4">
                    Accepted
                  </th>
                  <th className="text-left text-muted text-sm font-medium px-5 py-4 w-40">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((quote) => {
                  const status = statusConfig[quote.status];
                  return (
                    <tr
                      key={quote.id}
                      className="border-b border-border last:border-b-0 hover:bg-surface-lighter transition-colors"
                    >
                      <td className="px-5 py-4">
                        <p className="font-mono text-sm text-white">
                          {quote.id.slice(0, 8)}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-white">{getClientName(quote)}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-white font-medium">
                          {formatCurrency(quote.total)}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={cn(
                            "inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium",
                            status.color,
                            "bg-surface"
                          )}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-muted text-sm">
                        {formatDate(quote.created_at)}
                      </td>
                      <td className="px-5 py-4 text-muted text-sm">
                        {(quote as Quote & { accepted_at?: string | null }).accepted_at
                          ? formatDate((quote as Quote & { accepted_at: string }).accepted_at)
                          : "—"}
                      </td>
                      <td className="px-5 py-4">
                        {quote.status === "accepted" && (
                          <div className="flex gap-2 mb-2">
                            <Link
                              href={`/admin/contracts?client=${quote.client_id}`}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/20 text-primary-light hover:bg-primary/30 text-xs font-medium transition-colors"
                            >
                              <FileSignature size={14} />
                              Send contract
                            </Link>
                            <Link
                              href={`/admin/invoices?client=${quote.client_id}&quote=${quote.id}`}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/20 text-primary-light hover:bg-primary/30 text-xs font-medium transition-colors"
                            >
                              <Receipt size={14} />
                              Send invoice
                            </Link>
                          </div>
                        )}
                        <div className="relative group">
                          <select
                            value={quote.status}
                            onChange={(e) =>
                              updateStatus(
                                quote.id,
                                e.target.value as QuoteStatus
                              )
                            }
                            disabled={updatingId === quote.id}
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
                          {updatingId === quote.id && (
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

      {/* Create Quote Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-surface-light border border-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-semibold text-white">
                Create New Quote
              </h2>
              <button
                onClick={closeModal}
                className="text-muted hover:text-white transition-colors p-1"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-5">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Client
                </label>
                <select
                  value={formClientId}
                  onChange={(e) => setFormClientId(e.target.value)}
                  className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="">Select a client...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name || c.company_name || c.id}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Intro message (optional)
                </label>
                <textarea
                  value={formIntroText}
                  onChange={(e) => setFormIntroText(e.target.value)}
                  placeholder="Add a paragraph to explain the quote to the client. This will appear in bold above the line items."
                  rows={4}
                  className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-white placeholder-muted focus:outline-none focus:border-primary transition-colors resize-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-white">
                    Line Items
                  </label>
                  <button
                    type="button"
                    onClick={addLineItem}
                    className="flex items-center gap-1.5 text-sm text-primary-light hover:text-white transition-colors"
                  >
                    <Plus size={16} />
                    Add item
                  </button>
                </div>
                <div className="space-y-3">
                  {formLineItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex gap-3 items-start p-3 bg-surface rounded-lg border border-border"
                    >
                      <div className="flex-1 min-w-0 space-y-2">
                        <input
                          type="text"
                          placeholder="Description"
                          value={item.description}
                          onChange={(e) =>
                            updateLineItem(index, "description", e.target.value)
                          }
                          className="w-full bg-surface-light border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-muted focus:outline-none focus:border-primary"
                        />
                        <div className="flex gap-2 flex-wrap">
                          <input
                            type="number"
                            placeholder="Qty"
                            min={1}
                            value={item.quantity || ""}
                            onChange={(e) =>
                              updateLineItem(
                                index,
                                "quantity",
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="w-20 bg-surface-light border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                          />
                          <input
                            type="number"
                            placeholder="Unit price"
                            min={0}
                            step={0.01}
                            value={item.unit_price || ""}
                            onChange={(e) =>
                              updateLineItem(
                                index,
                                "unit_price",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="flex-1 min-w-24 bg-surface-light border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                          />
                          <input
                            type="text"
                            placeholder="Timeline (e.g. 2-3 weeks)"
                            value={item.timeline || ""}
                            onChange={(e) =>
                              updateLineItem(index, "timeline", e.target.value)
                            }
                            className="flex-1 min-w-32 bg-surface-light border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-muted focus:outline-none focus:border-primary"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeLineItem(index)}
                        disabled={formLineItems.length === 1}
                        className="text-muted hover:text-red-400 transition-colors p-2 disabled:opacity-40 disabled:cursor-not-allowed"
                        aria-label="Remove item"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-surface rounded-lg border border-border">
                <span className="text-muted font-medium">Total</span>
                <span className="text-xl font-bold text-white flex items-center gap-1">
                  <DollarSign size={20} />
                  {formatCurrency(formTotal)}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Save as
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormStatus("draft")}
                    className={cn(
                      "flex-1 px-4 py-2 rounded-lg font-medium transition-colors",
                      formStatus === "draft"
                        ? "bg-primary hover:bg-primary-dark text-primary-light"
                        : "bg-surface border border-border text-muted hover:text-white"
                    )}
                  >
                    Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormStatus("sent")}
                    className={cn(
                      "flex-1 px-4 py-2 rounded-lg font-medium transition-colors",
                      formStatus === "sent"
                        ? "bg-primary hover:bg-primary-dark text-primary-light"
                        : "bg-surface border border-border text-muted hover:text-white"
                    )}
                  >
                    Sent
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-shrink-0 flex flex-col gap-3 p-5 border-t border-border bg-surface-light">
              {saveError && (
                <p className="text-red-400 text-sm">
                  {saveError}
                  {saveError.includes("intro_text") && " — Run migration: alter table quotes add column intro_text text;"}
                </p>
              )}
              <div className="flex justify-end gap-2">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg bg-surface border border-border text-muted hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveQuote}
                  disabled={saving || !formClientId}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary hover:bg-primary-dark text-primary-light font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <FileText size={18} />
                  )}
                  {formStatus === "sent" ? "Save & Send Quote" : "Save Quote"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminQuotesPage() {
  return (
    <Suspense fallback={<div className="p-6 text-muted text-center py-12">Loading...</div>}>
      <AdminQuotesContent />
    </Suspense>
  );
}
