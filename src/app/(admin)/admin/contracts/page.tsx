"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { createPdfFromText } from "@/lib/pdf-utils";
import {
  FileSignature,
  Upload,
  CheckCircle,
  Clock,
  X,
  FileText,
} from "lucide-react";

type Contract = {
  id: string;
  client_id: string;
  name: string;
  file_url: string;
  signed_file_url: string | null;
  status: string;
  signed_at: string | null;
  created_at: string;
  task_id?: string | null;
  profiles?: { full_name: string; company_name: string | null };
};

type ContractTemplate = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  content: string;
};

type TaskOption = { id: string; title: string };

export default function AdminContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [clients, setClients] = useState<{ id: string; full_name: string; company_name: string | null }[]>([]);
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [tasks, setTasks] = useState<TaskOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "signed">("all");
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createMode, setCreateMode] = useState<"upload" | "template">("template");
  const [createClientId, setCreateClientId] = useState("");
  const [createFile, setCreateFile] = useState<File | null>(null);
  const [createTemplateId, setCreateTemplateId] = useState("");
  const [createPrice, setCreatePrice] = useState("");
  const [createTaskId, setCreateTaskId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const supabase = createClient();

    const [contractsRes, clientsRes, templatesRes, tasksRes] = await Promise.all([
      supabase
        .from("client_contracts")
        .select("*, profiles(full_name, company_name)")
        .order("created_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("id, full_name, company_name")
        .eq("role", "client")
        .order("full_name"),
      supabase.from("contract_templates").select("*").order("name"),
      supabase
        .from("tasks")
        .select("id, title")
        .order("title"),
    ]);

    setContracts(contractsRes.data ?? []);
    setClients(clientsRes.data ?? []);
    setTemplates(templatesRes.data ?? []);
    setTasks(tasksRes.data ?? []);
    setLoading(false);
  }

  async function handleCreateContract() {
    const supabase = createClient();
    setUploading(true);

    let fileUrl: string;
    let fileName: string;

    if (createMode === "template") {
      if (!createClientId || !createTemplateId || !createPrice.trim()) {
        setUploading(false);
        return;
      }
      const template = templates.find((t) => t.id === createTemplateId);
      if (!template) {
        setUploading(false);
        return;
      }
      const priceFormatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
      }).format(parseFloat(createPrice) || 0);
      const content = template.content.replace(/\{\{PRICE\}\}/g, priceFormatted);
      const pdfBytes = await createPdfFromText(content);
      fileName = `${template.name.replace(/\s+/g, "-")}-${Date.now()}.pdf`;
      const path = `${createClientId}/contracts/${fileName}`;
      const { data: uploadData, error } = await supabase.storage
        .from("client-files")
        .upload(path, pdfBytes, {
          contentType: "application/pdf",
          upsert: true,
        });
      if (error) {
        setUploading(false);
        return;
      }
      fileUrl = supabase.storage.from("client-files").getPublicUrl(uploadData.path).data.publicUrl;
    } else {
      if (!createFile || !createClientId) {
        setUploading(false);
        return;
      }
      fileName = createFile.name;
      const path = `${createClientId}/contracts/${Date.now()}-${createFile.name}`;
      const { data: uploadData, error } = await supabase.storage
        .from("client-files")
        .upload(path, createFile, { upsert: true });
      if (error) {
        setUploading(false);
        return;
      }
      fileUrl = supabase.storage.from("client-files").getPublicUrl(uploadData.path).data.publicUrl;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase.from("client_contracts").insert({
      client_id: createClientId,
      name: fileName,
      file_url: fileUrl,
      status: "pending",
      created_by: user?.id ?? null,
      task_id: createTaskId || null,
    });

    setUploading(false);
    setCreateFile(null);
    setCreateClientId("");
    setCreateTemplateId("");
    setCreatePrice("");
    setCreateTaskId("");
    setShowCreate(false);
    loadData();
  }

  const filteredContracts = contracts.filter((c) => {
    if (filter === "pending" && c.status !== "pending") return false;
    if (filter === "signed" && c.status !== "signed") return false;
    if (selectedClient && c.client_id !== selectedClient) return false;
    return true;
  });

  if (loading) {
    return <div className="text-muted text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Contracts</h1>
          <p className="text-muted text-sm mt-1">
            Create contracts for clients and track when they&apos;ve been signed
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Upload size={16} />
          Create contract
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex gap-2">
          {(["all", "pending", "signed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-primary text-white"
                  : "bg-surface-light text-muted hover:text-white"
              }`}
            >
              {f === "all" ? "All" : f === "pending" ? "Pending" : "Signed"}
            </button>
          ))}
        </div>
        <select
          value={selectedClient ?? ""}
          onChange={(e) => setSelectedClient(e.target.value || null)}
          className="bg-surface-light border border-border rounded-lg px-3 py-1.5 text-white text-sm"
        >
          <option value="">All clients</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.full_name} {c.company_name ? `(${c.company_name})` : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-surface-light border border-border rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">Create contract</h2>
              <button
                onClick={() => {
                  setShowCreate(false);
                  setCreateFile(null);
                  setCreateClientId("");
                  setCreateTemplateId("");
                  setCreatePrice("");
                  setCreateTaskId("");
                }}
                className="text-muted hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setCreateMode("template")}
                className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                  createMode === "template"
                    ? "bg-primary text-white"
                    : "bg-surface text-muted hover:text-white"
                }`}
              >
                <FileText size={16} className="inline mr-1.5" />
                From template
              </button>
              <button
                onClick={() => setCreateMode("upload")}
                className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                  createMode === "upload"
                    ? "bg-primary text-white"
                    : "bg-surface text-muted hover:text-white"
                }`}
              >
                <Upload size={16} className="inline mr-1.5" />
                Upload PDF
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-white text-sm font-medium mb-1.5">Client</label>
                <select
                  value={createClientId}
                  onChange={(e) => setCreateClientId(e.target.value)}
                  className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-white"
                >
                  <option value="">Select client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name} {c.company_name ? `(${c.company_name})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {createMode === "template" ? (
                <>
                  <div>
                    <label className="block text-white text-sm font-medium mb-1.5">Template</label>
                    <select
                      value={createTemplateId}
                      onChange={(e) => setCreateTemplateId(e.target.value)}
                      className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-white"
                    >
                      <option value="">Select template</option>
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-white text-sm font-medium mb-1.5">Project price ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={createPrice}
                      onChange={(e) => setCreatePrice(e.target.value)}
                      placeholder="e.g. 2500"
                      className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-white text-sm font-medium mb-1.5">Link to task (optional)</label>
                    <select
                      value={createTaskId}
                      onChange={(e) => setCreateTaskId(e.target.value)}
                      className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-white"
                    >
                      <option value="">None</option>
                      {tasks.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title}
                        </option>
                      ))}
                    </select>
                    <p className="text-muted text-xs mt-1">When signed, task status updates on the board</p>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-white text-sm font-medium mb-1.5">Contract PDF</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => setCreateFile(e.target.files?.[0] ?? null)}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-3 border-2 border-dashed border-border rounded-lg text-muted hover:text-white hover:border-primary transition-colors"
                  >
                    {createFile ? createFile.name : "Choose PDF file"}
                  </button>
                </div>
              )}

              <button
                onClick={handleCreateContract}
                disabled={
                  !createClientId ||
                  (createMode === "template"
                    ? !createTemplateId || !createPrice.trim()
                    : !createFile) ||
                  uploading
                }
                className="w-full py-3 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-medium rounded-lg"
              >
                {uploading ? "Creating..." : "Create & send to client"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contract list */}
      {filteredContracts.length === 0 ? (
        <div className="bg-surface-light border border-border rounded-xl p-12 text-center">
          <FileSignature className="text-muted mx-auto mb-3" size={48} />
          <p className="text-muted">No contracts yet.</p>
          <p className="text-muted text-sm mt-1">
            Create a contract above to send to a client for signing.
          </p>
        </div>
      ) : (
        <div className="bg-surface-light border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface border-b border-border">
                <th className="text-left text-muted px-4 py-3 font-medium">Contract</th>
                <th className="text-left text-muted px-4 py-3 font-medium">Client</th>
                <th className="text-left text-muted px-4 py-3 font-medium">Status</th>
                <th className="text-left text-muted px-4 py-3 font-medium">Date</th>
                <th className="text-right text-muted px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredContracts.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-surface/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileSignature className="text-primary-light shrink-0" size={18} />
                      <span className="text-white">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {(c.profiles as { full_name?: string; company_name?: string })?.full_name ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {c.status === "signed" ? (
                      <span className="flex items-center gap-1.5 text-green-400">
                        <CheckCircle size={14} />
                        Signed
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-amber-400">
                        <Clock size={14} />
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {c.status === "signed" && c.signed_at
                      ? `Signed ${new Date(c.signed_at).toLocaleDateString()}`
                      : `Sent ${new Date(c.created_at).toLocaleDateString()}`}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => {
                        const url = c.status === "signed" && c.signed_file_url ? c.signed_file_url : c.file_url;
                        setPreviewUrl(url);
                        setPreviewName(c.name);
                      }}
                      className="text-primary-light hover:text-white"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {previewUrl && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black">
          <div className="flex items-center justify-between px-4 py-3 bg-surface border-b border-border shrink-0">
            <h3 className="text-white font-medium truncate">{previewName}</h3>
            <button
              onClick={() => {
                setPreviewUrl(null);
                setPreviewName("");
              }}
              className="p-2 text-muted hover:text-white rounded-lg"
            >
              <X size={20} />
            </button>
          </div>
          <iframe src={previewUrl} title={previewName} className="flex-1 w-full min-h-0" />
        </div>
      )}
    </div>
  );
}
