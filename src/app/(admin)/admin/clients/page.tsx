"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Search,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  FileText,
  Receipt,
  X,
} from "lucide-react";

type ClientProfile = Profile & { email?: string };

type ClientStats = {
  work_orders: number;
  quotes: number;
  invoices: number;
};

export default function AdminClientsPage() {
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [filteredClients, setFilteredClients] = useState<ClientProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<ClientProfile | null>(null);
  const [clientStats, setClientStats] = useState<ClientStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredClients(clients);
      return;
    }
    const q = searchQuery.toLowerCase();
    setFilteredClients(
      clients.filter(
        (c) =>
          c.full_name?.toLowerCase().includes(q) ||
          c.company_name?.toLowerCase().includes(q) ||
          (c as ClientProfile).email?.toLowerCase().includes(q)
      )
    );
  }, [searchQuery, clients]);

  async function loadClients() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "client")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading clients:", error);
      setLoading(false);
      return;
    }
    setClients((data as ClientProfile[]) ?? []);
    setFilteredClients((data as ClientProfile[]) ?? []);
    setLoading(false);
  }

  async function loadClientStats(clientId: string) {
    setStatsLoading(true);
    const supabase = createClient();

    const [workOrdersRes, quotesRes, invoicesRes] = await Promise.all([
      supabase
        .from("work_orders")
        .select("*", { count: "exact", head: true })
        .eq("client_id", clientId),
      supabase
        .from("quotes")
        .select("*", { count: "exact", head: true })
        .eq("client_id", clientId),
      supabase
        .from("invoices")
        .select("*", { count: "exact", head: true })
        .eq("client_id", clientId),
    ]);

    setClientStats({
      work_orders: workOrdersRes.count ?? 0,
      quotes: quotesRes.count ?? 0,
      invoices: invoicesRes.count ?? 0,
    });
    setStatsLoading(false);
  }

  function handleSelectClient(client: ClientProfile) {
    if (selectedClient?.id === client.id) {
      setSelectedClient(null);
      setClientStats(null);
      return;
    }
    setSelectedClient(client);
    loadClientStats(client.id);
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-muted text-center py-12">Loading clients...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Clients</h1>
        <p className="text-muted text-sm mt-1">
          Manage client profiles and view their activity
        </p>
      </div>

      <div className="mb-5">
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
            size={18}
          />
          <input
            type="text"
            placeholder="Search by name, company, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-light border border-border rounded-xl pl-11 pr-4 py-2.5 text-white placeholder-muted focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {filteredClients.length === 0 ? (
            <div className="bg-surface-light border border-border rounded-xl p-6 text-center text-muted">
              No clients found
            </div>
          ) : (
            filteredClients.map((client) => (
              <button
                key={client.id}
                onClick={() => handleSelectClient(client)}
                className={cn(
                  "w-full text-left bg-surface-light border rounded-xl p-5 transition-colors",
                  selectedClient?.id === client.id
                    ? "border-primary bg-surface-lighter"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-white truncate">
                      {client.full_name || "—"}
                    </p>
                    <p className="text-muted text-sm truncate mt-0.5">
                      {client.company_name || "—"}
                    </p>
                    <p className="text-muted text-sm truncate mt-0.5">
                      {(client as ClientProfile).email || "—"}
                    </p>
                    <p className="text-muted text-xs mt-1">
                      Joined {formatDate(client.created_at)}
                    </p>
                  </div>
                  {selectedClient?.id === client.id ? (
                    <ChevronUp className="text-muted shrink-0" size={20} />
                  ) : (
                    <ChevronDown className="text-muted shrink-0" size={20} />
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        <div className="lg:col-span-1">
          {selectedClient ? (
            <div className="bg-surface-light border border-border rounded-xl p-6 sticky top-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-white">
                    {selectedClient.full_name || "—"}
                  </h3>
                  <p className="text-muted text-sm">
                    {selectedClient.company_name || "—"}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedClient(null);
                    setClientStats(null);
                  }}
                  className="text-muted hover:text-white transition-colors p-1"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>

              {statsLoading ? (
                <div className="text-muted text-sm py-4">Loading stats...</div>
              ) : clientStats ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-surface rounded-lg">
                    <ClipboardList className="text-primary-light shrink-0" size={20} />
                    <div>
                      <p className="text-white font-medium">
                        {clientStats.work_orders} Work Orders
                      </p>
                      <p className="text-muted text-xs">Total submitted</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-surface rounded-lg">
                    <FileText className="text-primary-light shrink-0" size={20} />
                    <div>
                      <p className="text-white font-medium">
                        {clientStats.quotes} Quotes
                      </p>
                      <p className="text-muted text-xs">Total created</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-surface rounded-lg">
                    <Receipt className="text-primary-light shrink-0" size={20} />
                    <div>
                      <p className="text-white font-medium">
                        {clientStats.invoices} Invoices
                      </p>
                      <p className="text-muted text-xs">Total created</p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="bg-surface-light border border-border rounded-xl p-6 text-center text-muted text-sm">
              Click a client to view their work orders, quotes, and invoices
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
