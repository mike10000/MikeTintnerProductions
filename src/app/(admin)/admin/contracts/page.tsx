"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createPdfFromText } from "@/lib/pdf-utils";
import {
  FileSignature,
  Upload,
  CheckCircle,
  Clock,
  X,
  FileText,
  RefreshCw,
} from "lucide-react";
import { ClientInfoModal } from "@/components/admin/ClientInfoModal";

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

function AdminContractsContent() {
  const searchParams = useSearchParams();
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
  const [createContractName, setCreateContractName] = useState("");
  const [createTaskId, setCreateTaskId] = useState("");
  const [createInvoiceId, setCreateInvoiceId] = useState("");
  const [invoices, setInvoices] = useState<{ id: string; line_items: { description: string; quantity: number; unit_price: number }[]; total: number }[]>([]);
  const [createError, setCreateError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [clientInfoModalId, setClientInfoModalId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  // Refresh when tab becomes visible (e.g. after client signs in another tab)
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === "visible") loadData();
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);

  useEffect(() => {
    const clientId = searchParams.get("client");
    if (clientId && clients.length > 0) {
      setSelectedClient(clientId);
      setShowCreate(true);
      setCreateClientId(clientId);
    }
  }, [searchParams, clients]);

  useEffect(() => {
    if (!createClientId) {
      setInvoices([]);
      setCreateInvoiceId("");
      return;
    }
    const supabase = createClient();
    supabase
      .from("invoices")
      .select("id, line_items, total")
      .eq("client_id", createClientId)
      .order("created_at", { ascending: false })
      .then(({ data }) => setInvoices(data ?? []));
  }, [createClientId]);

  async function loadData() {
    setLoadError(null);
    const supabase = createClient();

    const [contractsRes, clientsRes, templatesRes, tasksRes] = await Promise.all([
      supabase
        .from("client_contracts")
        .select("*, profiles!client_id(full_name, company_name)")
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

    const errors: string[] = [];
    if (contractsRes.error) errors.push(`Contracts: ${contractsRes.error.message}`);
    if (clientsRes.error) errors.push(`Clients: ${clientsRes.error.message}`);
    if (templatesRes.error) errors.push(`Templates: ${templatesRes.error.message}`);
    if (tasksRes.error) errors.push(`Tasks: ${tasksRes.error.message}`);
    if (errors.length > 0) setLoadError(errors.join(". "));

    setContracts(contractsRes.data ?? []);
    setClients(clientsRes.data ?? []);
    setTemplates(templatesRes.data ?? []);
    setTasks(tasksRes.data ?? []);
    setLoading(false);
  }

  async function handleCreateContract() {
    const supabase = createClient();
    setUploading(true);
    setCreateError(null);

    let fileUrl: string;
    let fileName: string;

    if (createMode === "template") {
      if (!createClientId || !createTemplateId) {
        setUploading(false);
        return;
      }
      const priceVal = createInvoiceId ? parseFloat(invoices.find((i) => i.id === createInvoiceId)?.total?.toString() ?? "0") : parseFloat(createPrice) || 0;
      if (!createInvoiceId && !createPrice.trim()) {
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
      }).format(priceVal);
      const client = clients.find((c) => c.id === createClientId);
      const clientName = client ? (client.full_name || client.company_name || "Client") : "Client";
      const dateFormatted = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const selectedInvoice = createInvoiceId ? invoices.find((i) => i.id === createInvoiceId) : null;
      const scopeOfWork = selectedInvoice?.line_items?.length
        ? selectedInvoice.line_items
            .map((li) => `- ${li.description}${li.quantity > 1 ? ` (${li.quantity}x)` : ""} — ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(li.quantity * li.unit_price)}`)
            .join("\n")
        : "- Custom UI/UX Design and Branding Integration.\n- Mobile-Responsive Front-end Development.\n- Back-end Configuration and Content Management System (CMS) Setup.\n- Pre-launch Quality Assurance (QA) and Performance Testing.";
      const payments = selectedInvoice?.line_items?.length
        ? `The Client agrees to pay the Provider the total sum of ${priceFormatted} for the completion of the project, as specified below:\n\n${selectedInvoice.line_items.map((li) => `• ${li.description}: ${li.quantity} x ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(li.unit_price)} = ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(li.quantity * li.unit_price)}`).join("\n")}\n\nTotal: ${priceFormatted}\n\nDeposit: A non-refundable commencement fee of 50% is due upon signing.\n\nMilestones: Remaining payments shall be made according to the following schedule: 50% upon Prototype Approval, 50% upon Launch.`
        : `The Client agrees to pay the Provider the total sum of ${priceFormatted} for the completion of the project.\n\nDeposit: A non-refundable commencement fee of 50% is due upon signing.\n\nMilestones: Remaining payments shall be made according to the following schedule: 50% upon Prototype Approval, 50% upon Launch.`;
      let content = template.content.replace(/\{\{PRICE\}\}/g, priceFormatted);
      content = content.replace(/\{\{SCOPE_OF_WORK\}\}/g, scopeOfWork);
      content = content.replace(/\{\{PAYMENTS\}\}/g, payments);
      content = content.replace(/\{\{CLIENT_NAME\}\}/g, clientName);
      content = content.replace(/\{\{DATE\}\}/g, dateFormatted);
      const pdfBytes = await createPdfFromText(content);
      const baseName = createContractName.trim() || template.name.replace(/\s+/g, "-");
      fileName = `${baseName}-${Date.now()}.pdf`.replace(/[^a-zA-Z0-9._-]/g, "-");
      const path = `${createClientId}/contracts/${fileName}`;
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from("client-files")
        .upload(path, pdfBytes, {
          contentType: "application/pdf",
          upsert: true,
        });
      if (uploadErr) {
        setCreateError(uploadErr.message || "Failed to upload contract");
        setUploading(false);
        return;
      }
      fileUrl = supabase.storage.from("client-files").getPublicUrl(uploadData.path).data.publicUrl;
    } else {
      if (!createFile || !createClientId) {
        setUploading(false);
        return;
      }
      fileName = createContractName.trim() ? `${createContractName.trim()}-${createFile.name}` : createFile.name;
      const path = `${createClientId}/contracts/${Date.now()}-${createFile.name}`;
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from("client-files")
        .upload(path, createFile, { upsert: true });
      if (uploadErr) {
        setCreateError(uploadErr.message || "Failed to upload contract");
        setUploading(false);
        return;
      }
      fileUrl = supabase.storage.from("client-files").getPublicUrl(uploadData.path).data.publicUrl;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const templateForName = createMode === "template" ? templates.find((t) => t.id === createTemplateId) : null;
    const contractName =
      createContractName.trim() ||
      (templateForName ? templateForName.name : createFile?.name ?? "Contract");
    const { error: insertErr } = await supabase.from("client_contracts").insert({
      client_id: createClientId,
      name: contractName,
      file_url: fileUrl,
      status: "pending",
      created_by: user?.id ?? null,
      task_id: createTaskId || null,
      invoice_id: createInvoiceId || null,
    });

    if (insertErr) {
      setCreateError(insertErr.message || "Failed to create contract");
      setUploading(false);
      return;
    }

    setUploading(false);
    setCreateFile(null);
    setCreateClientId("");
    setCreateTemplateId("");
    setCreatePrice("");
    setCreateContractName("");
    setCreateTaskId("");
    setShowCreate(false);
    setCreateError(null);
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

  if (loadError) {
    return (
      <div className="bg-surface-light border border-border rounded-xl p-8 text-center">
        <p className="text-red-400 mb-4">{loadError}</p>
        <button
          onClick={() => loadData()}
          className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm"
        >
          Retry
        </button>
      </div>
    );
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
      <div className="flex flex-wrap gap-3 mb-6 items-center">
        <button
          onClick={() => loadData()}
          className="p-2 rounded-lg text-muted hover:text-white hover:bg-surface-light transition-colors"
          title="Refresh list"
        >
          <RefreshCw size={18} />
        </button>
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
                  setCreateContractName("");
                  setCreateTaskId("");
                  setCreateInvoiceId("");
                  setCreateError(null);
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
                <label className="block text-white text-sm font-medium mb-1.5">Contract name</label>
                <input
                  type="text"
                  value={createContractName}
                  onChange={(e) => setCreateContractName(e.target.value)}
                  placeholder="e.g. Digital Services Agreement"
                  className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-white placeholder-muted"
                />
              </div>
              <div>
                <label className="block text-white text-sm font-medium mb-1.5">Client</label>
                <select
                  value={createClientId}
                  onChange={(e) => {
                    setCreateClientId(e.target.value);
                    setCreateInvoiceId("");
                  }}
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
              {createMode === "template" && createClientId && (
                <div>
                  <label className="block text-white text-sm font-medium mb-1.5">Link to invoice (optional)</label>
                  <p className="text-muted text-xs mb-1.5">
                    Use scope of work and payment terms from an invoice for this client.
                  </p>
                  <select
                    value={createInvoiceId}
                    onChange={(e) => setCreateInvoiceId(e.target.value)}
                    className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-white"
                  >
                    <option value="">None — use manual price</option>
                    {invoices.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        ${inv.total.toLocaleString()} — {inv.line_items?.length ?? 0} items
                      </option>
                    ))}
                  </select>
                </div>
              )}

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
                  {!createInvoiceId && (
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
                  )}
                  <div>
                    <label className="block text-white text-sm font-medium mb-1.5">Link to task (optional)</label>
                    <p className="text-muted text-xs mb-1.5">
                      If none: a new task board will be created when the contract is signed.
                    </p>
                    <select
                      value={createTaskId}
                      onChange={(e) => setCreateTaskId(e.target.value)}
                      className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-white"
                    >
                      <option value="">None — create new board when signed</option>
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
                <>
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
                  <div>
                    <label className="block text-white text-sm font-medium mb-1.5">Link to task (optional)</label>
                    <p className="text-muted text-xs mb-1.5">
                      If none: a new task board will be created when the contract is signed.
                    </p>
                    <select
                      value={createTaskId}
                      onChange={(e) => setCreateTaskId(e.target.value)}
                      className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-white"
                    >
                      <option value="">None — create new board when signed</option>
                      {tasks.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {createError && (
                <p className="text-red-400 text-sm">{createError}</p>
              )}

              <button
                onClick={handleCreateContract}
                disabled={
                  !createClientId ||
                  (createMode === "template"
                    ? !createTemplateId || (!createInvoiceId && !createPrice.trim())
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
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setClientInfoModalId(c.client_id)}
                      className="text-muted hover:text-primary-light transition-colors text-left"
                    >
                      {(c.profiles as { full_name?: string; company_name?: string })?.full_name ?? "—"}
                    </button>
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

      {clientInfoModalId && (
        <ClientInfoModal
          clientId={clientInfoModalId}
          onClose={() => setClientInfoModalId(null)}
        />
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

export default function AdminContractsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-muted text-center py-12">Loading...</div>}>
      <AdminContractsContent />
    </Suspense>
  );
}
