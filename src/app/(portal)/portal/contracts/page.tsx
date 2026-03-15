"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { FileSignature, Upload, Eye, CheckCircle, X, PenLine } from "lucide-react";
import { SignContractModal } from "@/components/portal/SignContractModal";

type Contract = {
  id: string;
  client_id: string;
  name: string;
  file_url: string;
  status: "pending" | "signed";
  signed_at: string | null;
  signed_file_url?: string | null;
  created_at: string;
};

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState("");
  const [signingContract, setSigningContract] = useState<Contract | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadContracts();
  }, []);

  async function loadContracts() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("client_contracts")
      .select("*")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false });

    setContracts(data || []);
    setLoading(false);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setUploading(true);
    const path = `${user.id}/contracts/${Date.now()}-${file.name}`;
    const { data: uploadData, error } = await supabase.storage
      .from("client-files")
      .upload(path, file, { upsert: true });

    if (error) {
      console.error("Upload error:", error);
      setUploading(false);
      e.target.value = "";
      return;
    }

    const { data: urlData } = supabase.storage.from("client-files").getPublicUrl(uploadData.path);

    await supabase.from("client_contracts").insert({
      client_id: user.id,
      name: file.name,
      file_url: urlData.publicUrl,
      status: "pending",
      created_by: user.id,
    });

    setUploading(false);
    e.target.value = "";
    loadContracts();
  }

  function openSignModal(contract: Contract) {
    if (contract.status === "signed") return;
    setSigningContract(contract);
  }

  if (loading) {
    return <div className="text-muted text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Contracts</h1>
          <p className="text-muted text-sm mt-1">
            Upload, view, and sign contracts for your projects
          </p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,application/pdf"
            onChange={handleUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Upload size={16} />
            {uploading ? "Uploading..." : "Upload Contract"}
          </button>
        </div>
      </div>

      {contracts.length === 0 ? (
        <div className="bg-surface-light border border-border rounded-xl p-12 text-center">
          <FileSignature className="text-muted mx-auto mb-3" size={48} />
          <p className="text-muted">No contracts yet.</p>
          <p className="text-muted text-sm mt-1">
            Upload a contract above or wait for one to be shared with you.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {contracts.map((contract) => (
            <div
              key={contract.id}
              className="bg-surface-light border border-border rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <FileSignature className="text-primary-light shrink-0" size={24} />
                <div className="min-w-0">
                  <p className="text-white font-medium truncate">{contract.name}</p>
                  <p className="text-muted text-xs mt-0.5">
                    {contract.status === "signed" && contract.signed_at
                      ? `Signed ${new Date(contract.signed_at).toLocaleDateString()}`
                      : `Uploaded ${new Date(contract.created_at).toLocaleDateString()}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    const url = contract.status === "signed" && contract.signed_file_url
                      ? contract.signed_file_url
                      : contract.file_url;
                    setPreviewUrl(url);
                    setPreviewName(contract.name);
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:border-primary text-white text-sm transition-colors"
                >
                  <Eye size={14} />
                  View
                </button>
                {contract.status === "pending" && (
                  <button
                    onClick={() => openSignModal(contract)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm transition-colors"
                  >
                    <PenLine size={14} />
                    Sign
                  </button>
                )}
                {contract.status === "signed" && (
                  <span className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-600/20 text-green-400 text-sm">
                    <CheckCircle size={14} />
                    Signed
                  </span>
                )}
                <a
                  href={(contract.status === "signed" && contract.signed_file_url) ? contract.signed_file_url : contract.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-light hover:text-white text-sm"
                >
                  Download
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {signingContract && (
        <SignContractModal
          contract={signingContract}
          onClose={() => setSigningContract(null)}
          onSigned={loadContracts}
        />
      )}

      {previewUrl && !signingContract && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black">
          <div className="flex items-center justify-between px-4 py-3 bg-surface border-b border-border shrink-0">
            <h3 className="text-white font-medium truncate">{previewName}</h3>
            <button
              onClick={() => {
                setPreviewUrl(null);
                setPreviewName("");
              }}
              className="p-2 text-muted hover:text-white rounded-lg"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
          <iframe
            src={previewUrl}
            title={previewName}
            className="flex-1 w-full min-h-0"
          />
        </div>
      )}
    </div>
  );
}
