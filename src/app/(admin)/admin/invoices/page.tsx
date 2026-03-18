"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Invoice, LineItem, Profile, InvoiceStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Receipt,
  Plus,
  CreditCard,
  ChevronDown,
  Loader2,
  X,
  DollarSign,
  Trash2,
} from "lucide-react";
import { ClientInfoModal } from "@/components/admin/ClientInfoModal";

type InvoiceWithProfile = Invoice & {
  profiles?: { full_name: string; company_name: string | null } | null;
};

const STATUS_OPTIONS: InvoiceStatus[] = ["draft", "sent", "paid", "overdue"];

const statusConfig: Record<
  InvoiceStatus,
  { label: string; color: string }
> = {
  draft: { label: "Draft", color: "text-muted" },
  sent: { label: "Sent", color: "text-blue-400" },
  paid: { label: "Paid", color: "text-green-400" },
  overdue: { label: "Overdue", color: "text-red-400" },
};

const emptyLineItem: LineItem = {
  description: "",
  quantity: 1,
  unit_price: 0,
};

function AdminInvoicesContent() {
  const searchParams = useSearchParams();
  const [invoices, setInvoices] = useState<InvoiceWithProfile[]>([]);
  const [clients, setClients] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formClientId, setFormClientId] = useState("");
  const [clientInfoModalId, setClientInfoModalId] = useState<string | null>(null);
  const [formLineItems, setFormLineItems] = useState<LineItem[]>([
    { ...emptyLineItem },
  ]);
  const [formDueDate, setFormDueDate] = useState("");
  const [formStatus, setFormStatus] = useState<"draft" | "sent">("draft");
  const [formQuoteId, setFormQuoteId] = useState<string | null>(null);

  useEffect(() => {
    loadInvoices();
    loadClients();
  }, []);

  useEffect(() => {
    const clientId = searchParams.get("client");
    const quoteId = searchParams.get("quote");
    if (clientId && clients.length > 0) {
      setFormClientId(clientId);
      setFormQuoteId(quoteId);
      setModalOpen(true);
      if (quoteId) {
        loadQuoteForInvoice(quoteId);
      }
    }
  }, [searchParams, clients]);

  async function loadQuoteForInvoice(quoteId: string) {
    const supabase = createClient();
    const { data } = await supabase
      .from("quotes")
      .select("line_items, total")
      .eq("id", quoteId)
      .single();
    if (data?.line_items && Array.isArray(data.line_items)) {
      setFormLineItems(
        (data.line_items as LineItem[]).map((li) => ({
          description: li.description,
          quantity: li.quantity,
          unit_price: li.unit_price,
        }))
      );
    }
  }

  async function loadInvoices() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("invoices")
      .select("*, profiles(full_name, company_name)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading invoices:", error);
      setLoading(false);
      return;
    }
    setInvoices((data as InvoiceWithProfile[]) ?? []);
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

  async function updateStatus(invoiceId: string, newStatus: InvoiceStatus) {
    setUpdatingId(invoiceId);
    const supabase = createClient();
    const updateData: Partial<Invoice> = { status: newStatus };
    if (newStatus === "paid") {
      updateData.paid_at = new Date().toISOString();
    }
    const { error } = await supabase
      .from("invoices")
      .update(updateData)
      .eq("id", invoiceId);

    if (error) {
      console.error("Error updating status:", error);
      setUpdatingId(null);
      return;
    }
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoiceId
          ? {
              ...inv,
              status: newStatus,
              paid_at:
                newStatus === "paid"
                  ? new Date().toISOString()
                  : inv.paid_at,
            }
          : inv
      )
    );
    setUpdatingId(null);
  }

  function openCreateModal() {
    const defaultDue = new Date();
    defaultDue.setDate(defaultDue.getDate() + 30);
    setFormClientId(clients[0]?.id ?? "");
    setFormLineItems([{ ...emptyLineItem }]);
    setFormDueDate(defaultDue.toISOString().slice(0, 10));
    setFormStatus("draft");
    setFormQuoteId(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
  }

  function addLineItem() {
    setFormLineItems((prev) => [...prev, { ...emptyLineItem }]);
  }

  function removeLineItem(index: number) {
    setFormLineItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateLineItem(
    index: number,
    field: keyof LineItem,
    value: string | number
  ) {
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

  async function handleSaveInvoice() {
    if (!formClientId || !formDueDate) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("invoices").insert({
      client_id: formClientId,
      quote_id: null,
      work_order_id: null,
      square_invoice_id: null,
      square_payment_link: null,
      line_items: formLineItems.filter(
        (li) =>
          li.description.trim() || li.quantity > 0 || li.unit_price > 0
      ),
      total: formTotal,
      status: formStatus,
      due_date: formDueDate,
      paid_at: null,
    });

    if (error) {
      console.error("Error creating invoice:", error);
      setSaving(false);
      return;
    }
    await loadInvoices();
    closeModal();
    setSaving(false);
  }

  function getClientName(invoice: InvoiceWithProfile): string {
    const p = invoice.profiles;
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
          Loading invoices...
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Receipt size={28} />
            Invoices
          </h1>
          <p className="text-muted text-sm mt-1">
            Manage invoices and track payments
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-dark text-primary-light font-medium transition-colors"
        >
          <Plus size={18} />
          New Invoice
        </button>
      </div>

      {invoices.length === 0 ? (
        <div className="bg-surface-light border border-border rounded-xl p-12 text-center text-muted">
          No invoices found. Create your first invoice to get started.
        </div>
      ) : (
        <div className="bg-surface-light border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="text-left text-muted text-sm font-medium px-5 py-4">
                    Invoice ID
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
                    Due Date
                  </th>
                  <th className="text-left text-muted text-sm font-medium px-5 py-4">
                    Paid At
                  </th>
                  <th className="text-left text-muted text-sm font-medium px-5 py-4 w-40">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => {
                  const status = statusConfig[invoice.status];
                  return (
                    <tr
                      key={invoice.id}
                      className="border-b border-border last:border-b-0 hover:bg-surface-lighter transition-colors"
                    >
                      <td className="px-5 py-4">
                        <p className="font-mono text-sm text-white">
                          {invoice.id.slice(0, 8)}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => setClientInfoModalId(invoice.client_id)}
                          className="text-white hover:text-primary-light transition-colors text-left"
                        >
                          {getClientName(invoice)}
                        </button>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-white font-medium">
                          {formatCurrency(invoice.total)}
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
                        {formatDate(invoice.due_date)}
                      </td>
                      <td className="px-5 py-4 text-muted text-sm">
                        {invoice.paid_at
                          ? formatDate(invoice.paid_at)
                          : "—"}
                      </td>
                      <td className="px-5 py-4">
                        <div className="relative group">
                          <select
                            value={invoice.status}
                            onChange={(e) =>
                              updateStatus(
                                invoice.id,
                                e.target.value as InvoiceStatus
                              )
                            }
                            disabled={updatingId === invoice.id}
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
                          {updatingId === invoice.id && (
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

      {clientInfoModalId && (
        <ClientInfoModal
          clientId={clientInfoModalId}
          onClose={() => setClientInfoModalId(null)}
        />
      )}

      {/* Create Invoice Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-surface-light border border-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-semibold text-white">
                Create New Invoice
              </h2>
              <button
                onClick={closeModal}
                className="text-muted hover:text-white transition-colors p-1"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
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
                  Due Date
                </label>
                <input
                  type="date"
                  value={formDueDate}
                  onChange={(e) => setFormDueDate(e.target.value)}
                  className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors"
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
                            updateLineItem(
                              index,
                              "description",
                              e.target.value
                            )
                          }
                          className="w-full bg-surface-light border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-muted focus:outline-none focus:border-primary"
                        />
                        <div className="flex gap-2">
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
                            className="flex-1 bg-surface-light border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
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

            <div className="flex justify-end gap-2 p-5 border-t border-border">
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded-lg bg-surface border border-border text-muted hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveInvoice}
                disabled={
                  saving || !formClientId || !formDueDate
                }
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-dark text-primary-light font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <CreditCard size={18} />
                )}
                Save Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminInvoicesPage() {
  return (
    <Suspense fallback={<div className="p-6 text-muted text-center py-12">Loading...</div>}>
      <AdminInvoicesContent />
    </Suspense>
  );
}
