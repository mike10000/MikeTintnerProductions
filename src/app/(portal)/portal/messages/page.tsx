"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Conversation, Message } from "@/lib/types";
import { MessageSquare, Send, Plus, ArrowLeft } from "lucide-react";
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

              <form onSubmit={sendMessage} className="p-4 border-t border-border flex gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-surface border border-border rounded-lg px-4 py-2.5 text-white text-sm placeholder-muted focus:outline-none focus:border-primary transition-colors"
                />
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary-dark text-white p-2.5 rounded-lg transition-colors"
                >
                  <Send size={16} />
                </button>
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
