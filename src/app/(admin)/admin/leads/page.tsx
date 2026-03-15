"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  Inbox,
  Mail,
  CheckCircle,
  Archive,
  ExternalLink,
  Copy,
  Loader2,
  X,
  Calendar,
  DollarSign,
} from "lucide-react";

type Lead = {
  id: string;
  full_name: string;
  email: string;
  organization: string | null;
  org_type: string | null;
  message: string;
  status: string;
  converted_client_id: string | null;
  created_at: string;
};

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "new" | "invited" | "converted">("new");
  const [sending, setSending] = useState<string | null>(null);
  const [inviteResult, setInviteResult] = useState<{
    inviteUrl: string;
    leadName: string;
    emailSent?: boolean;
    emailError?: string;
  } | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [inviteEstimate, setInviteEstimate] = useState("");
  const [inviteMeetingLink, setInviteMeetingLink] = useState("");

  useEffect(() => {
    loadLeads();
  }, []);

  async function loadLeads() {
    const supabase = createClient();
    const { data } = await supabase
      .from("quote_leads")
      .select("*")
      .order("created_at", { ascending: false });
    setLeads(data ?? []);
    setLoading(false);
  }

  function openInviteModal(lead: Lead) {
    setSelectedLead(lead);
    setInviteEstimate("");
    setInviteMeetingLink("");
    setInviteResult(null);
    setShowInviteModal(true);
  }

  async function handleSendInvite() {
    if (!selectedLead) return;

    setSending(selectedLead.id);
    setInviteResult(null);
    try {
      const res = await fetch("/api/admin/create-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: selectedLead.id,
          estimate: inviteEstimate,
          meetingLink: inviteMeetingLink,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setInviteResult({
        inviteUrl: data.inviteUrl,
        leadName: selectedLead.full_name,
        emailSent: data.emailSent,
        emailError: data.emailError,
      });
      loadLeads();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create invite");
    } finally {
      setSending(null);
    }
  }

  async function archiveLead(id: string) {
    const supabase = createClient();
    await supabase
      .from("quote_leads")
      .update({ status: "archived" })
      .eq("id", id);
    loadLeads();
  }

  const filteredLeads = leads.filter((l) => {
    if (filter === "new" && l.status !== "new") return false;
    if (filter === "invited" && l.status !== "invited") return false;
    if (filter === "converted" && l.status !== "converted") return false;
    return true;
  });

  if (loading) {
    return (
      <div className="text-muted text-center py-12 flex items-center justify-center gap-2">
        <Loader2 className="animate-spin" size={20} />
        Loading leads...
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Quote Leads</h1>
        <p className="text-muted text-sm mt-1">
          Form submissions. Send an invite with estimate + meeting link — they approve to get portal access.
        </p>
      </div>

      <div className="flex gap-2 mb-6">
        {(["new", "invited", "converted", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? "bg-primary text-white"
                : "bg-surface-light text-muted hover:text-white"
            }`}
          >
            {f === "new" ? "New" : f === "invited" ? "Invited" : f === "converted" ? "Converted" : "All"}
          </button>
        ))}
      </div>

      {/* Invite modal */}
      {showInviteModal && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-surface-light border border-border rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">Send invite to {selectedLead.full_name}</h2>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setSelectedLead(null);
                  setInviteResult(null);
                }}
                className="text-muted hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {inviteResult ? (
              <div className="space-y-4">
                <div className={`rounded-lg p-4 ${inviteResult.emailSent ? "bg-green-500/10 border border-green-500/30" : inviteResult.emailError ? "bg-amber-500/10 border border-amber-500/30" : "bg-green-500/10 border border-green-500/30"}`}>
                  <p className="font-medium text-white">Invite created</p>
                  {inviteResult.emailSent ? (
                    <p className="text-muted text-sm mt-1">
                      Email sent to the lead. They can click &quot;Approve&quot; in the email to get portal access.
                    </p>
                  ) : inviteResult.emailError ? (
                    <p className="text-amber-400 text-sm mt-1">
                      Email not sent ({inviteResult.emailError}). Copy the link below and send it manually.
                    </p>
                  ) : (
                    <p className="text-muted text-sm mt-1">
                      Copy the link below and send it via email. When they click &quot;Approve&quot;, they&apos;ll get portal access.
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={inviteResult.inviteUrl}
                    className="flex-1 bg-surface border border-border rounded-lg px-4 py-2.5 text-white text-sm"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(inviteResult.inviteUrl);
                    }}
                    className="p-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg"
                    title="Copy link"
                  >
                    <Copy size={18} />
                  </button>
                </div>
                <button
                  onClick={() => {
                    setShowInviteModal(false);
                    setSelectedLead(null);
                    setInviteResult(null);
                  }}
                  className="w-full py-2.5 border border-border rounded-lg text-white hover:bg-surface"
                >
                  Done
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendInvite();
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-white text-sm font-medium mb-1.5 flex items-center gap-2">
                    <DollarSign size={14} />
                    Rough estimate
                  </label>
                  <textarea
                    value={inviteEstimate}
                    onChange={(e) => setInviteEstimate(e.target.value)}
                    placeholder="e.g. $2,500–3,500 for a 5-page site"
                    rows={3}
                    className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-white placeholder-muted resize-none"
                  />
                </div>
                <div>
                  <label className="block text-white text-sm font-medium mb-1.5 flex items-center gap-2">
                    <Calendar size={14} />
                    Free consultation meeting link
                  </label>
                  <input
                    type="url"
                    value={inviteMeetingLink}
                    onChange={(e) => setInviteMeetingLink(e.target.value)}
                    placeholder="https://calendar.google.com/... or https://meet.google.com/..."
                    className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-white placeholder-muted"
                  />
                  <p className="text-muted text-xs mt-1">
                    Google Meet or Calendar link for your free consultation
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowInviteModal(false);
                      setSelectedLead(null);
                    }}
                    className="flex-1 py-2.5 border border-border rounded-lg text-white hover:bg-surface"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sending === selectedLead.id}
                    className="flex-1 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {sending === selectedLead.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Mail size={16} />
                    )}
                    Create invite link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {filteredLeads.length === 0 ? (
        <div className="bg-surface-light border border-border rounded-xl p-12 text-center">
          <Inbox className="text-muted mx-auto mb-3" size={48} />
          <p className="text-muted">No leads yet.</p>
          <p className="text-muted text-sm mt-1">
            New submissions from the contact form will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLeads.map((lead) => (
            <div
              key={lead.id}
              className="bg-surface-light border border-border rounded-xl p-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-medium">{lead.full_name}</span>
                    {lead.organization && (
                      <span className="text-muted text-sm">
                        ({lead.organization})
                      </span>
                    )}
                    {lead.status === "invited" && (
                      <span className="flex items-center gap-1 text-amber-400 text-sm">
                        <Mail size={14} />
                        Invite sent
                      </span>
                    )}
                    {lead.status === "converted" && (
                      <span className="flex items-center gap-1 text-green-400 text-sm">
                        <CheckCircle size={14} />
                        Converted
                      </span>
                    )}
                  </div>
                  <p className="text-muted text-sm mt-0.5">{lead.email}</p>
                  {lead.org_type && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-surface rounded text-muted text-xs">
                      {lead.org_type}
                    </span>
                  )}
                  <p className="text-muted text-sm mt-2 line-clamp-2">{lead.message}</p>
                  <p className="text-muted text-xs mt-1">
                    {new Date(lead.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {lead.status === "new" && (
                    <>
                      <button
                        onClick={() => openInviteModal(lead)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-medium"
                      >
                        <Mail size={16} />
                        Send invite
                      </button>
                      <button
                        onClick={() => archiveLead(lead.id)}
                        className="p-2 text-muted hover:text-white rounded-lg"
                        title="Archive"
                      >
                        <Archive size={18} />
                      </button>
                    </>
                  )}
                  {lead.status === "invited" && (
                    <>
                      <button
                        onClick={() => openInviteModal(lead)}
                        className="flex items-center gap-2 px-4 py-2 bg-surface hover:bg-surface-light border border-border rounded-lg text-sm"
                      >
                        <Mail size={16} />
                        Resend invite
                      </button>
                      <button
                        onClick={() => archiveLead(lead.id)}
                        className="p-2 text-muted hover:text-white rounded-lg"
                        title="Archive"
                      >
                        <Archive size={18} />
                      </button>
                    </>
                  )}
                  {lead.status === "converted" && lead.converted_client_id && (
                    <Link
                      href={`/admin/clients?client=${lead.converted_client_id}`}
                      className="flex items-center gap-2 px-4 py-2 bg-surface hover:bg-surface-light border border-border rounded-lg text-sm"
                    >
                      <ExternalLink size={16} />
                      View client
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
