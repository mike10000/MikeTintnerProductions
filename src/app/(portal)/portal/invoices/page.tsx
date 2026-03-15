"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Invoice } from "@/lib/types";
import { Receipt, CreditCard, CheckCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, { color: string; label: string }> = {
  draft: { color: "text-muted", label: "Draft" },
  sent: { color: "text-blue-400", label: "Awaiting Payment" },
  paid: { color: "text-green-400", label: "Paid" },
  overdue: { color: "text-red-400", label: "Overdue" },
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvoices();
  }, []);

  async function loadInvoices() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("invoices")
      .select("*")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false });

    setInvoices(data || []);
    setLoading(false);
  }

  async function handlePay(invoice: Invoice) {
    const res = await fetch("/api/square/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceId: invoice.id }),
    });
    const data = await res.json();
    if (data.checkoutUrl) {
      window.location.href = data.checkoutUrl;
    }
  }

  if (loading) {
    return <div className="text-muted text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Invoices</h1>
        <p className="text-muted text-sm mt-1">
          View and pay your invoices
        </p>
      </div>

      {invoices.length === 0 ? (
        <div className="bg-surface-light border border-border rounded-xl p-12 text-center">
          <Receipt className="text-muted mx-auto mb-3" size={32} />
          <p className="text-muted">No invoices yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {invoices.map((invoice) => {
            const status = statusStyles[invoice.status];
            return (
              <div
                key={invoice.id}
                className="bg-surface-light border border-border rounded-xl p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-semibold">
                        Invoice #{invoice.id.slice(0, 8)}
                      </h3>
                      <span
                        className={cn(
                          "text-xs font-medium",
                          status?.color
                        )}
                      >
                        {status?.label}
                      </span>
                    </div>
                    <p className="text-muted text-xs mt-1">
                      Due {new Date(invoice.due_date).toLocaleDateString()}
                      {invoice.paid_at &&
                        ` · Paid ${new Date(invoice.paid_at).toLocaleDateString()}`}
                    </p>
                  </div>
                  <p className="text-white font-bold text-xl">
                    ${invoice.total.toFixed(2)}
                  </p>
                </div>

                <div className="border border-border rounded-lg overflow-hidden mb-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-surface">
                        <th className="text-left text-muted px-4 py-2 font-medium">
                          Item
                        </th>
                        <th className="text-right text-muted px-4 py-2 font-medium">
                          Qty
                        </th>
                        <th className="text-right text-muted px-4 py-2 font-medium">
                          Price
                        </th>
                        <th className="text-right text-muted px-4 py-2 font-medium">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.line_items.map((item, i) => (
                        <tr key={i} className="border-t border-border">
                          <td className="text-white px-4 py-2">
                            {item.description}
                          </td>
                          <td className="text-muted px-4 py-2 text-right">
                            {item.quantity}
                          </td>
                          <td className="text-muted px-4 py-2 text-right">
                            ${item.unit_price.toFixed(2)}
                          </td>
                          <td className="text-white px-4 py-2 text-right">
                            ${(item.quantity * item.unit_price).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {(invoice.status === "sent" ||
                  invoice.status === "overdue") && (
                  <button
                    onClick={() => handlePay(invoice)}
                    className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    <CreditCard size={16} />
                    Pay Now
                  </button>
                )}

                {invoice.status === "paid" && (
                  <div className="flex items-center gap-2 text-green-400 text-sm">
                    <CheckCircle size={16} />
                    Payment received
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
