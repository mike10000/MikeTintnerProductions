"use client";

import { useEffect, useState } from "react";
import { X, User, Mail, Building2, Phone, Calendar, Loader2 } from "lucide-react";

type ClientInfo = {
  id: string;
  full_name: string;
  company_name: string | null;
  phone: string | null;
  email: string | null;
  role: string;
  created_at: string;
};

type ClientInfoModalProps = {
  clientId: string;
  onClose: () => void;
};

export function ClientInfoModal({ clientId, onClose }: ClientInfoModalProps) {
  const [info, setInfo] = useState<ClientInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId) return;
    setLoading(true);
    setError(null);
    fetch(`/api/admin/client-info?client_id=${encodeURIComponent(clientId)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load client");
        return res.json();
      })
      .then((data) => {
        setInfo(data);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load client");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [clientId]);

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-surface-light border border-border rounded-xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold">Client Info</h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-white p-1 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-muted">
            <Loader2 className="animate-spin" size={24} />
            <span>Loading...</span>
          </div>
        ) : error ? (
          <p className="text-red-400 text-sm py-4">{error}</p>
        ) : info ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <User className="text-primary-light shrink-0 mt-0.5" size={18} />
              <div>
                <p className="text-muted text-xs font-medium uppercase tracking-wide">Name</p>
                <p className="text-white">{info.full_name || "—"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="text-primary-light shrink-0 mt-0.5" size={18} />
              <div>
                <p className="text-muted text-xs font-medium uppercase tracking-wide">Email</p>
                <p className="text-white break-all">{info.email || "—"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Building2 className="text-primary-light shrink-0 mt-0.5" size={18} />
              <div>
                <p className="text-muted text-xs font-medium uppercase tracking-wide">Company</p>
                <p className="text-white">{info.company_name || "—"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="text-primary-light shrink-0 mt-0.5" size={18} />
              <div>
                <p className="text-muted text-xs font-medium uppercase tracking-wide">Phone</p>
                <p className="text-white">{info.phone || "—"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="text-primary-light shrink-0 mt-0.5" size={18} />
              <div>
                <p className="text-muted text-xs font-medium uppercase tracking-wide">Joined</p>
                <p className="text-white">{formatDate(info.created_at)}</p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
