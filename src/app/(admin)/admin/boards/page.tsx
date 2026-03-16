"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Board, Profile } from "@/lib/types";
import Link from "next/link";
import { Kanban, Plus, Trash2 } from "lucide-react";

export default function BoardsPage() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [clients, setClients] = useState<Profile[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [clientId, setClientId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBoards();
    loadClients();
  }, []);

  async function loadBoards() {
    const supabase = createClient();
    const { data } = await supabase
      .from("boards")
      .select("*")
      .order("created_at", { ascending: false });

    setBoards(data || []);
    setLoading(false);
  }

  async function loadClients() {
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "client")
      .order("full_name");

    setClients(data || []);
  }

  async function createBoard(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    const supabase = createClient();
    const { data: board } = await supabase
      .from("boards")
      .insert({
        name: name.trim(),
        client_id: clientId || null,
      })
      .select()
      .single();

    if (board) {
      const defaultColumns = ["Backlog", "To Do", "In Progress", "Review", "Done"];
      await supabase.from("board_columns").insert(
        defaultColumns.map((title, i) => ({
          board_id: board.id,
          title,
          position: i,
        }))
      );
    }

    setName("");
    setClientId("");
    setShowForm(false);
    loadBoards();
  }

  async function deleteBoard(id: string) {
    if (!confirm("Delete this board and all its tasks?")) return;
    const supabase = createClient();
    await supabase.from("boards").delete().eq("id", id);
    loadBoards();
  }

  if (loading) {
    return <div className="text-muted text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Task Boards</h1>
          <p className="text-muted text-sm mt-1">
            Manage projects with Kanban-style boards
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          New Board
        </button>
      </div>

      {showForm && (
        <div className="bg-surface-light border border-border rounded-xl p-6 mb-6">
          <form onSubmit={createBoard} className="space-y-3">
            <div className="flex flex-wrap gap-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Board name (e.g. 'Client X Website')"
                className="flex-1 min-w-[200px] bg-surface border border-border rounded-lg px-4 py-2.5 text-white placeholder-muted focus:outline-none focus:border-primary transition-colors"
                autoFocus
              />
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="bg-surface border border-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary min-w-[180px]"
              >
                <option value="">No client (general)</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name} {c.company_name ? `(${c.company_name})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
            <button
              type="submit"
              className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="border border-border text-muted hover:text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Cancel
            </button>
            </div>
          </form>
        </div>
      )}

      {boards.length === 0 ? (
        <div className="bg-surface-light border border-border rounded-xl p-12 text-center">
          <Kanban className="text-muted mx-auto mb-3" size={32} />
          <p className="text-muted">No boards yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {boards.map((board) => (
            <div
              key={board.id}
              className="bg-surface-light border border-border rounded-xl p-5 hover:border-primary transition-colors group"
            >
              <div className="flex items-start justify-between">
                <Link href={`/admin/boards/${board.id}`} className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Kanban className="text-primary-light" size={20} />
                    <h3 className="text-white font-semibold">{board.name}</h3>
                  </div>
                  <p className="text-muted text-xs">
                    {board.client_id
                      ? (clients.find((c) => c.id === board.client_id)?.full_name ?? "Client")
                      : "No client"}
                    {" · "}
                    Created {new Date(board.created_at).toLocaleDateString()}
                  </p>
                </Link>
                <button
                  onClick={() => deleteBoard(board.id)}
                  className="text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
