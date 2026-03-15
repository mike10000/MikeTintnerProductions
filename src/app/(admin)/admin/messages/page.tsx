"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Conversation, Message } from "@/lib/types";
import { MessageSquare, Send, ArrowLeft, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ClientOption = { id: string; full_name: string; company_name: string | null };

export default function AdminMessagesPage() {
  const [conversations, setConversations] = useState<(Conversation & { profiles?: { full_name: string; company_name: string | null } })[]>([]);
  const [activeConvo, setActiveConvo] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewConvo, setShowNewConvo] = useState(false);
  const [newConvoClientId, setNewConvoClientId] = useState("");
  const [newConvoSubject, setNewConvoSubject] = useState("");
  const [newConvoMessage, setNewConvoMessage] = useState("");
  const [clients, setClients] = useState<ClientOption[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (activeConvo) loadMessages(activeConvo);
  }, [activeConvo]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadConversations() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const [convoRes, clientsRes] = await Promise.all([
      supabase
        .from("conversations")
        .select("*, profiles(full_name, company_name)")
        .order("created_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("id, full_name, company_name")
        .eq("role", "client")
        .order("full_name"),
    ]);

    setConversations(convoRes.data || []);
    setClients(clientsRes.data || []);
    setLoading(false);
  }

  async function createConversation(e: React.FormEvent) {
    e.preventDefault();
    if (!newConvoClientId || !newConvoSubject.trim() || !userId) return;

    const supabase = createClient();
    const { data } = await supabase
      .from("conversations")
      .insert({ client_id: newConvoClientId, subject: newConvoSubject.trim() })
      .select("*, profiles(full_name, company_name)")
      .single();

    if (data) {
      if (newConvoMessage.trim()) {
        await supabase.from("messages").insert({
          conversation_id: data.id,
          sender_id: userId,
          body: newConvoMessage.trim(),
        });
      }
      setShowNewConvo(false);
      setNewConvoClientId("");
      setNewConvoSubject("");
      setNewConvoMessage("");
      setConversations((prev) => [data, ...prev]);
      setActiveConvo(data.id);
      loadMessages(data.id);
    }
  }

  async function loadMessages(convoId: string) {
    const supabase = createClient();
    const { data } = await supabase
      .from("messages")
      .select("*, profiles(full_name)")
      .eq("conversation_id", convoId)
      .order("created_at", { ascending: true });

    setMessages(data || []);

    await supabase
      .from("messages")
      .update({ read: true })
      .eq("conversation_id", convoId);
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !activeConvo || !userId) return;

    const supabase = createClient();
    await supabase.from("messages").insert({
      conversation_id: activeConvo,
      sender_id: userId,
      body: newMessage.trim(),
    });

    setNewMessage("");
    loadMessages(activeConvo);
  }

  if (loading) {
    return <div className="text-muted text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Messages</h1>
          <p className="text-muted text-sm mt-1">Communicate with clients — start conversations or reply</p>
        </div>
        <button
          onClick={() => setShowNewConvo(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          <Plus size={16} />
          Start conversation
        </button>
      </div>

      {showNewConvo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-surface-light border border-border rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">Start conversation</h2>
              <button onClick={() => setShowNewConvo(false)} className="text-muted hover:text-white">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={createConversation} className="space-y-4">
              <div>
                <label className="block text-white text-sm font-medium mb-1.5">Client</label>
                <select
                  value={newConvoClientId}
                  onChange={(e) => setNewConvoClientId(e.target.value)}
                  required
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
              <div>
                <label className="block text-white text-sm font-medium mb-1.5">Subject</label>
                <input
                  type="text"
                  value={newConvoSubject}
                  onChange={(e) => setNewConvoSubject(e.target.value)}
                  required
                  placeholder="e.g. Project update"
                  className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-white"
                />
              </div>
              <div>
                <label className="block text-white text-sm font-medium mb-1.5">First message (optional)</label>
                <textarea
                  value={newConvoMessage}
                  onChange={(e) => setNewConvoMessage(e.target.value)}
                  placeholder="Type your message..."
                  rows={3}
                  className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-white resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg"
              >
                Start conversation
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="bg-surface-light border border-border rounded-xl overflow-hidden flex" style={{ height: "calc(100vh - 200px)" }}>
        <div className={cn("w-80 border-r border-border flex flex-col", activeConvo && "hidden md:flex")}>
          <div className="flex-1 overflow-y-auto">
            {conversations.map((convo) => (
              <button
                key={convo.id}
                onClick={() => setActiveConvo(convo.id)}
                className={cn(
                  "w-full text-left px-4 py-3 border-b border-border transition-colors",
                  activeConvo === convo.id ? "bg-primary/10" : "hover:bg-surface"
                )}
              >
                <p className="text-white text-sm font-medium truncate">{convo.subject}</p>
                <p className="text-muted text-xs mt-0.5">
                  {convo.profiles?.full_name || "Unknown"}
                  {convo.profiles?.company_name && ` · ${convo.profiles.company_name}`}
                </p>
                <p className="text-muted text-xs mt-0.5">
                  {new Date(convo.created_at).toLocaleDateString()}
                </p>
              </button>
            ))}
            {conversations.length === 0 && (
              <div className="p-8 text-center">
                <MessageSquare className="text-muted mx-auto mb-2" size={24} />
                <p className="text-muted text-sm">No conversations yet</p>
              </div>
            )}
          </div>
        </div>

        <div className={cn("flex-1 flex flex-col", !activeConvo && "hidden md:flex")}>
          {activeConvo ? (
            <>
              <div className="p-4 border-b border-border flex items-center gap-3">
                <button onClick={() => setActiveConvo(null)} className="md:hidden text-muted hover:text-white">
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <h3 className="text-white font-medium text-sm">
                    {conversations.find((c) => c.id === activeConvo)?.subject}
                  </h3>
                  <p className="text-muted text-xs">
                    {conversations.find((c) => c.id === activeConvo)?.profiles?.full_name}
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => {
                  const isMine = msg.sender_id === userId;
                  return (
                    <div key={msg.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                      <div
                        className={cn(
                          "max-w-[70%] rounded-xl px-4 py-2.5",
                          isMine ? "bg-primary text-white" : "bg-surface border border-border text-white"
                        )}
                      >
                        {!isMine && (
                          <p className="text-xs text-primary-light font-medium mb-1">
                            {(msg.profiles as unknown as { full_name: string })?.full_name || "Client"}
                          </p>
                        )}
                        <p className="text-sm">{msg.body}</p>
                        <p className={cn("text-xs mt-1", isMine ? "text-white/60" : "text-muted")}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              <form onSubmit={sendMessage} className="p-4 border-t border-border flex gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a reply..."
                  className="flex-1 bg-surface border border-border rounded-lg px-4 py-2.5 text-white text-sm placeholder-muted focus:outline-none focus:border-primary transition-colors"
                />
                <button type="submit" className="bg-primary hover:bg-primary-dark text-white p-2.5 rounded-lg transition-colors">
                  <Send size={16} />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-muted text-sm">Select a conversation to reply</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
