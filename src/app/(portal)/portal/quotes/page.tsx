"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Quote } from "@/lib/types";
import { FileText, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

function formatMoney(val: number | string): string {
  const n = typeof val === "string" ? parseFloat(val) : val;
  return isNaN(n) ? "0.00" : n.toFixed(2);
}

const statusStyles: Record<string, string> = {
  draft: "text-muted",
  sent: "text-blue-400",
  accepted: "text-green-400",
  declined: "text-red-400",
};

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadQuotes();
  }, []);

  async function loadQuotes() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error: err } = await supabase
      .from("quotes")
      .select("*")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false });

    if (err) {
      console.error("Error loading quotes:", err);
      setError(err.message);
    } else {
      setError(null);
    }
    setQuotes(data || []);
    setLoading(false);
  }

  async function respondToQuote(quoteId: string, accept: boolean) {
    const supabase = createClient();
    await supabase
      .from("quotes")
      .update({ status: accept ? "accepted" : "declined" })
      .eq("id", quoteId);
    loadQuotes();
  }

  if (loading) {
    return <div className="text-muted text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Quotes</h1>
        <p className="text-muted text-sm mt-1">
          Review and respond to project quotes
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-4 text-sm">
          {error}
        </div>
      )}

      {quotes.length === 0 ? (
        <div className="bg-surface-light border border-border rounded-xl p-12 text-center">
          <FileText className="text-muted mx-auto mb-3" size={32} />
          <p className="text-muted">No quotes yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {quotes.map((quote) => (
            <div
              key={quote.id}
              className="bg-surface-light border border-border rounded-xl p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-semibold">
                      Quote #{quote.id.slice(0, 8)}
                    </h3>
                    <span
                      className={cn(
                        "text-xs font-medium capitalize",
                        statusStyles[quote.status]
                      )}
                    >
                      {quote.status}
                    </span>
                  </div>
                  <p className="text-muted text-xs mt-1">
                    Created {new Date(quote.created_at).toLocaleDateString()}
                    {quote.valid_until &&
                      ` · Valid until ${new Date(quote.valid_until).toLocaleDateString()}`}
                  </p>
                </div>
                <p className="text-white font-bold text-xl">
                  ${formatMoney(quote.total)}
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
                    {(quote.line_items || []).map((item, i) => {
                      const qty = typeof item.quantity === "string" ? parseFloat(item.quantity) : item.quantity;
                      const price = typeof item.unit_price === "string" ? parseFloat(item.unit_price) : item.unit_price;
                      const lineTotal = (isNaN(qty) ? 0 : qty) * (isNaN(price) ? 0 : price);
                      return (
                        <tr key={i} className="border-t border-border">
                          <td className="text-white px-4 py-2">
                            {item.description}
                          </td>
                          <td className="text-muted px-4 py-2 text-right">
                            {item.quantity}
                          </td>
                          <td className="text-muted px-4 py-2 text-right">
                            ${formatMoney(item.unit_price)}
                          </td>
                          <td className="text-white px-4 py-2 text-right">
                            ${formatMoney(lineTotal)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {quote.status === "sent" && (
                <div className="flex gap-3">
                  <button
                    onClick={() => respondToQuote(quote.id, true)}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    <CheckCircle size={16} />
                    Accept Quote
                  </button>
                  <button
                    onClick={() => respondToQuote(quote.id, false)}
                    className="flex items-center gap-2 border border-border hover:border-red-500 text-muted hover:text-red-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    <XCircle size={16} />
                    Decline
                  </button>
                </div>
              )}

              {quote.status === "accepted" && (
                <div className="flex items-center gap-2 text-green-400 text-sm">
                  <CheckCircle size={16} />
                  You accepted this quote
                </div>
              )}

              {quote.status === "declined" && (
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <XCircle size={16} />
                  You declined this quote
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
