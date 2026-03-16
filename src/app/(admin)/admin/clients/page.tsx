"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
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
  Globe,
  Plus,
  FileSignature,
  Kanban,
  ExternalLink,
  FolderOpen,
  Download,
  Upload,
} from "lucide-react";

type ClientProfile = Profile & { email?: string };

type ClientStats = {
  work_orders: number;
  quotes: number;
  invoices: number;
};

type ClientWebsite = {
  id: string;
  client_id: string;
  name: string;
  url: string;
};

type ClientContract = {
  id: string;
  client_id: string;
  name: string;
  file_url: string;
  status: string;
  signed_at: string | null;
  created_at: string;
};

type ClientBoard = {
  id: string;
  name: string;
  client_id: string | null;
  created_at: string;
};

type ClientFile = {
  id: string;
  name: string;
  file_url: string;
  created_at: string;
};

function AdminClientsContent() {
  const searchParams = useSearchParams();
  const clientIdFromUrl = searchParams.get("client");
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [filteredClients, setFilteredClients] = useState<ClientProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<ClientProfile | null>(null);
  const [clientStats, setClientStats] = useState<ClientStats | null>(null);
  const [clientWebsites, setClientWebsites] = useState<ClientWebsite[]>([]);
  const [clientContracts, setClientContracts] = useState<ClientContract[]>([]);
  const [clientBoards, setClientBoards] = useState<ClientBoard[]>([]);
  const [clientFiles, setClientFiles] = useState<ClientFile[]>([]);
  const [fileUploading, setFileUploading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [newSiteName, setNewSiteName] = useState("");
  const [newSiteUrl, setNewSiteUrl] = useState("");
  const [contractUploading, setContractUploading] = useState(false);
  const contractFileRef = useRef<HTMLInputElement>(null);
  const clientFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadClients();
  }, [clientIdFromUrl]);

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
    const clientList = (data as ClientProfile[]) ?? [];
    setClients(clientList);
    setFilteredClients(clientList);
    if (clientIdFromUrl) {
      const toSelect = clientList.find((c) => c.id === clientIdFromUrl);
      if (toSelect) {
        setSelectedClient(toSelect);
        loadClientStats(toSelect.id);
      }
    }
    setLoading(false);
  }

  async function loadClientStats(clientId: string) {
    setStatsLoading(true);
    const supabase = createClient();

    const [workOrdersRes, quotesRes, invoicesRes, websitesRes, contractsRes, boardsRes, filesRes] = await Promise.all([
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
      supabase
        .from("client_websites")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: true }),
      supabase
        .from("client_contracts")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false }),
      supabase
        .from("boards")
        .select("id, name, client_id, created_at")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false }),
      supabase
        .from("client_files")
        .select("id, name, file_url, created_at")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false }),
    ]);

    setClientStats({
      work_orders: workOrdersRes.count ?? 0,
      quotes: quotesRes.count ?? 0,
      invoices: invoicesRes.count ?? 0,
    });
    setClientWebsites(websitesRes.data ?? []);
    setClientContracts(contractsRes.data ?? []);
    setClientBoards(boardsRes.data ?? []);
    setClientFiles(filesRes.data ?? []);
    setStatsLoading(false);
  }

  async function addWebsite() {
    if (!selectedClient || !newSiteName.trim() || !newSiteUrl.trim()) return;
    const supabase = createClient();
    const url = newSiteUrl.trim().startsWith("http") ? newSiteUrl.trim() : `https://${newSiteUrl.trim()}`;
    await supabase.from("client_websites").insert({
      client_id: selectedClient.id,
      name: newSiteName.trim(),
      url,
    });
    setNewSiteName("");
    setNewSiteUrl("");
    loadClientStats(selectedClient.id);
  }

  async function removeWebsite(id: string) {
    if (!selectedClient) return;
    const supabase = createClient();
    await supabase.from("client_websites").delete().eq("id", id);
    loadClientStats(selectedClient.id);
  }

  async function uploadContract(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !selectedClient) return;

    const supabase = createClient();
    setContractUploading(true);
    const path = `${selectedClient.id}/contracts/${Date.now()}-${file.name}`;
    const { data: uploadData, error } = await supabase.storage
      .from("client-files")
      .upload(path, file, { upsert: true });

    if (error) {
      setContractUploading(false);
      e.target.value = "";
      return;
    }

    const { data: urlData } = supabase.storage.from("client-files").getPublicUrl(uploadData.path);
    await supabase.from("client_contracts").insert({
      client_id: selectedClient.id,
      name: file.name,
      file_url: urlData.publicUrl,
      status: "pending",
    });

    setContractUploading(false);
    e.target.value = "";
    loadClientStats(selectedClient.id);
  }

  async function uploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !selectedClient) return;

    const supabase = createClient();
    setFileUploading(true);
    const path = `${selectedClient.id}/uploads/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { data: uploadData, error } = await supabase.storage
      .from("client-files")
      .upload(path, file, { upsert: true });

    if (error) {
      setFileUploading(false);
      e.target.value = "";
      return;
    }

    const { data: urlData } = supabase.storage.from("client-files").getPublicUrl(uploadData.path);
    await supabase.from("client_files").insert({
      client_id: selectedClient.id,
      name: file.name,
      file_path: uploadData.path,
      file_url: urlData.publicUrl,
      mime_type: file.type || null,
    });

    setFileUploading(false);
    e.target.value = "";
    loadClientStats(selectedClient.id);
  }

  function handleSelectClient(client: ClientProfile) {
    if (selectedClient?.id === client.id) {
      setSelectedClient(null);
      setClientStats(null);
      setClientWebsites([]);
      setClientContracts([]);
      setClientBoards([]);
      setClientFiles([]);
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
                    setClientWebsites([]);
                    setClientContracts([]);
                    setClientBoards([]);
                    setClientFiles([]);
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

              <div className="mt-4 pt-4 border-t border-border">
                <h4 className="text-white font-medium text-sm mb-2 flex items-center gap-2">
                  <Globe size={16} />
                  Client Websites
                </h4>
                {clientWebsites.length > 0 && (
                  <ul className="space-y-1 mb-3">
                    {clientWebsites.map((site) => (
                      <li key={site.id} className="flex items-center justify-between text-sm">
                        <a href={site.url} target="_blank" rel="noopener noreferrer" className="text-primary-light hover:text-white truncate">
                          {site.name}
                        </a>
                        <button onClick={() => removeWebsite(site.id)} className="text-red-400 hover:text-red-300 text-xs">Remove</button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Site name"
                    value={newSiteName}
                    onChange={(e) => setNewSiteName(e.target.value)}
                    className="flex-1 bg-surface border border-border rounded px-2 py-1.5 text-white text-sm placeholder-muted"
                  />
                  <input
                    type="text"
                    placeholder="https://..."
                    value={newSiteUrl}
                    onChange={(e) => setNewSiteUrl(e.target.value)}
                    className="flex-1 bg-surface border border-border rounded px-2 py-1.5 text-white text-sm placeholder-muted"
                  />
                  <button onClick={addWebsite} disabled={!newSiteName.trim() || !newSiteUrl.trim()} className="p-1.5 bg-primary text-white rounded disabled:opacity-50">
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                <h4 className="text-white font-medium text-sm mb-2 flex items-center gap-2">
                  <Kanban size={16} />
                  Task Boards
                </h4>
                {clientBoards.length > 0 ? (
                  <ul className="space-y-1 mb-2">
                    {clientBoards.map((b) => (
                      <li key={b.id}>
                        <a
                          href={`/admin/boards/${b.id}`}
                          className="flex items-center gap-2 text-sm text-primary-light hover:text-white"
                        >
                          {b.name}
                          <ExternalLink size={12} />
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted text-sm mb-2">No task boards linked</p>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                <h4 className="text-white font-medium text-sm mb-2 flex items-center gap-2">
                  <FileSignature size={16} />
                  Contracts
                </h4>
                {clientContracts.length > 0 && (
                  <ul className="space-y-1 mb-3">
                    {clientContracts.map((c) => (
                      <li key={c.id} className="flex items-center justify-between text-sm">
                        <span className="text-muted truncate">{c.name}</span>
                        <span className={c.status === "signed" ? "text-green-400 text-xs" : "text-amber-400 text-xs"}>
                          {c.status === "signed" ? "Signed" : "Pending"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <input
                  ref={contractFileRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx"
                  onChange={uploadContract}
                />
                <button
                  onClick={() => contractFileRef.current?.click()}
                  disabled={contractUploading}
                  className="text-sm text-primary-light hover:text-white"
                >
                  {contractUploading ? "Uploading..." : "+ Upload contract for client"}
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                <h4 className="text-white font-medium text-sm mb-2 flex items-center gap-2">
                  <FolderOpen size={16} />
                  Files
                </h4>
                {(clientFiles ?? []).length > 0 && (
                  <ul className="space-y-1 mb-3">
                    {(clientFiles ?? []).map((f) => (
                      <li key={f.id} className="flex items-center justify-between text-sm">
                        <span className="text-muted truncate max-w-[140px]">{f.name}</span>
                        <a
                          href={f.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={f.name}
                          className="text-primary-light hover:text-white shrink-0"
                        >
                          <Download size={14} />
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
                <input
                  ref={clientFileRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.csv,.txt,image/jpeg,image/png,image/jpg,image/gif,image/webp"
                  onChange={uploadFile}
                />
                <button
                  onClick={() => clientFileRef.current?.click()}
                  disabled={fileUploading}
                  className="text-sm text-primary-light hover:text-white"
                >
                  {fileUploading ? "Uploading..." : "+ Upload file for client"}
                </button>
              </div>
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

export default function AdminClientsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-muted text-center py-12">Loading...</div>}>
      <AdminClientsContent />
    </Suspense>
  );
}
