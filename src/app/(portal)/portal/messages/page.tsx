"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Conversation, Message } from "@/lib/types";
import { MessageSquare, Send, Plus, ArrowLeft, Paperclip, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvo, setActiveConvo] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [showNewConvo, setShowNewConvo] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const { data } = await supabase
      .from("conversations")
      .select("*")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false });

    setConversations(data || []);
    setLoading(false);
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
      .eq("conversation_id", convoId)
      .neq("sender_id", userId!);
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if ((!newMessage.trim() && attachments.length === 0) || !activeConvo || !userId) return;

    const supabase = createClient();
    setUploading(true);

    const uploadedUrls: { name: string; url: string }[] = [];
    for (const file of attachments) {
      const path = `${userId}/${activeConvo}/${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from("client-files")
        .upload(path, file, { upsert: true });
      if (!error && data) {
        const { data: urlData } = supabase.storage.from("client-files").getPublicUrl(data.path);
        uploadedUrls.push({ name: file.name, url: urlData.publicUrl });
      }
    }

    await supabase.from("messages").insert({
      conversation_id: activeConvo,
      sender_id: userId,
      body: newMessage.trim() || "(file attachment)",
      attachments: uploadedUrls,
    });

    setNewMessage("");
    setAttachments([]);
    setUploading(false);
    loadMessages(activeConvo);
  }

  async function createConversation(e: React.FormEvent) {
    e.preventDefault();
    if (!newSubject.trim() || !userId) return;

    const supabase = createClient();
    const { data } = await supabase
      .from("conversations")
      .insert({ client_id: userId, subject: newSubject.trim() })
      .select()
      .single();

    if (data) {
      setShowNewConvo(false);
      setNewSubject("");
      loadConversations();
      setActiveConvo(data.id);
    }
  }

  if (loading) {
    return <div className="text-muted text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Messages</h1>
        <p className="text-muted text-sm mt-1">
          Communicate with the MTP team
        </p>
      </div>

      <div className="bg-surface-light border border-border rounded-xl overflow-hidden flex" style={{ height: "calc(100vh - 200px)" }}>
        {/* Conversation list */}
        <div className={cn("w-80 border-r border-border flex flex-col", activeConvo && "hidden md:flex")}>
          <div className="p-3 border-b border-border">
            <button
              onClick={() => setShowNewConvo(true)}
              className="flex items-center gap-2 w-full bg-primary hover:bg-primary-dark text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors justify-center"
            >
              <Plus size={16} />
              New Conversation
            </button>
          </div>

          {showNewConvo && (
            <form onSubmit={createConversation} className="p-3 border-b border-border">
              <input
                type="text"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                placeholder="Subject..."
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-white text-sm placeholder-muted focus:outline-none focus:border-primary mb-2"
                autoFocus
              />
              <div className="flex gap-2">
                <button type="submit" className="bg-primary text-white px-3 py-1.5 rounded text-xs">Create</button>
                <button type="button" onClick={() => setShowNewConvo(false)} className="text-muted text-xs">Cancel</button>
              </div>
            </form>
          )}

          <div className="flex-1 overflow-y-auto">
            {conversations.map((convo) => (
              <button
                key={convo.id}
                onClick={() => setActiveConvo(convo.id)}
                className={cn(
                  "w-full text-left px-4 py-3 border-b border-border transition-colors",
                  activeConvo === convo.id
                    ? "bg-primary/10"
                    : "hover:bg-surface"
                )}
              >
                <p className="text-white text-sm font-medium truncate">
                  {convo.subject}
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

        {/* Messages */}
        <div className={cn("flex-1 flex flex-col", !activeConvo && "hidden md:flex")}>
          {activeConvo ? (
            <>
              <div className="p-4 border-b border-border flex items-center gap-3">
                <button
                  onClick={() => setActiveConvo(null)}
                  className="md:hidden text-muted hover:text-white"
                >
                  <ArrowLeft size={20} />
                </button>
                <h3 className="text-white font-medium text-sm">
                  {conversations.find((c) => c.id === activeConvo)?.subject}
                </h3>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => {
                  const isMine = msg.sender_id === userId;
                  return (
                    <div
                      key={msg.id}
                      className={cn("flex", isMine ? "justify-end" : "justify-start")}
                    >
                      <div
                        className={cn(
                          "max-w-[70%] rounded-xl px-4 py-2.5",
                          isMine
                            ? "bg-primary text-white"
                            : "bg-surface border border-border text-white"
                        )}
                      >
                        {!isMine && (
                          <p className="text-xs text-primary-light font-medium mb-1">
                            {(msg.profiles as unknown as { full_name: string })?.full_name || "MTP Team"}
                          </p>
                        )}
                        <p className="text-sm">{msg.body}</p>
                        {(msg as Message & { attachments?: { name: string; url: string }[] }).attachments?.length ? (
                          <div className="mt-2 space-y-1">
                            {((msg as Message & { attachments?: { name: string; url: string }[] }).attachments ?? []).map((a, i) => (
                              <a key={i} href={a.url} target="_blank" rel="noopener noreferrer" className="block text-xs text-white/80 hover:text-white underline truncate">
                                📎 {a.name}
                              </a>
                            ))}
                          </div>
                        ) : null}
                        <p
                          className={cn(
                            "text-xs mt-1",
                            isMine ? "text-white/60" : "text-muted"
                          )}
                        >
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              <form onSubmit={sendMessage} className="p-4 border-t border-border">
                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {attachments.map((f, i) => (
                      <span key={i} className="flex items-center gap-1 bg-surface rounded px-2 py-1 text-xs text-muted">
                        {f.name}
                        <button type="button" onClick={() => setAttachments((a) => a.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-300">
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt,.csv,image/*"
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files) setAttachments((a) => [...a, ...Array.from(files)]);
                      e.target.value = "";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-muted hover:text-white p-2.5 rounded-lg transition-colors"
                    title="Attach file"
                  >
                    <Paperclip size={18} />
                  </button>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-surface border border-border rounded-lg px-4 py-2.5 text-white text-sm placeholder-muted focus:outline-none focus:border-primary transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={uploading || (!newMessage.trim() && attachments.length === 0)}
                    className="bg-primary hover:bg-primary-dark disabled:opacity-50 text-white p-2.5 rounded-lg transition-colors"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-muted text-sm">
                Select a conversation or start a new one
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
