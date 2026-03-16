"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Board, BoardColumn, Task, Profile } from "@/lib/types";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import {
  Plus,
  X,
  Calendar,
  User,
  Flag,
  Eye,
  EyeOff,
  Trash2,
  ArrowLeft,
  GripVertical,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const priorityColors: Record<string, string> = {
  low: "bg-slate-500",
  medium: "bg-blue-500",
  high: "bg-orange-500",
  urgent: "bg-red-500",
};

const labelColors = [
  "bg-red-500",
  "bg-orange-500",
  "bg-yellow-500",
  "bg-green-500",
  "bg-blue-500",
  "bg-purple-500",
  "bg-pink-500",
];

export default function BoardDetailPage() {
  const params = useParams();
  const boardId = params.id as string;

  const [board, setBoard] = useState<(Board & { client?: Profile }) | null>(null);
  const [columns, setColumns] = useState<BoardColumn[]>([]);
  const [teamMembers, setTeamMembers] = useState<Profile[]>([]);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTaskColumn, setNewTaskColumn] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [showAddColumn, setShowAddColumn] = useState(false);

  const loadBoard = useCallback(async () => {
    const supabase = createClient();

    const { data: boardData } = await supabase
      .from("boards")
      .select("*, profiles!client_id(full_name, company_name)")
      .eq("id", boardId)
      .single();

    if (boardData) {
      const profiles = (boardData as { profiles?: Profile | null }).profiles;
      const b = boardData as Board & { client?: Profile; profiles?: Profile };
      if (profiles) b.client = profiles;
      delete b.profiles;
      setBoard(b);
    }

    const { data: colData } = await supabase
      .from("board_columns")
      .select("*, tasks(*, profiles(full_name))")
      .eq("board_id", boardId)
      .order("position", { ascending: true });

    if (colData) {
      const sorted = colData.map((col) => ({
        ...col,
        tasks: (col.tasks || []).sort(
          (a: Task, b: Task) => a.position - b.position
        ),
      }));
      setColumns(sorted);
    }

    const { data: members } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "admin");

    setTeamMembers(members || []);
  }, [boardId]);

  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  async function handleDragEnd(result: DropResult) {
    if (!result.destination) return;

    const { source, destination } = result;
    const supabase = createClient();

    const newColumns = [...columns];
    const sourceCol = newColumns.find((c) => c.id === source.droppableId);
    const destCol = newColumns.find((c) => c.id === destination.droppableId);

    if (!sourceCol?.tasks || !destCol?.tasks) return;

    const [movedTask] = sourceCol.tasks.splice(source.index, 1);

    if (source.droppableId === destination.droppableId) {
      sourceCol.tasks.splice(destination.index, 0, movedTask);
      sourceCol.tasks.forEach((t, i) => (t.position = i));
      setColumns(newColumns);

      const updates = sourceCol.tasks.map((t, i) => ({
        id: t.id,
        column_id: t.column_id,
        title: t.title,
        position: i,
      }));
      for (const u of updates) {
        await supabase
          .from("tasks")
          .update({ position: u.position })
          .eq("id", u.id);
      }
    } else {
      movedTask.column_id = destination.droppableId;
      destCol.tasks.splice(destination.index, 0, movedTask);

      sourceCol.tasks.forEach((t, i) => (t.position = i));
      destCol.tasks.forEach((t, i) => (t.position = i));
      setColumns(newColumns);

      await supabase
        .from("tasks")
        .update({
          column_id: destination.droppableId,
          position: destination.index,
        })
        .eq("id", movedTask.id);

      for (const t of destCol.tasks) {
        await supabase
          .from("tasks")
          .update({ position: t.position })
          .eq("id", t.id);
      }
    }
  }

  async function addTask(columnId: string) {
    if (!newTaskTitle.trim()) return;
    const supabase = createClient();

    const col = columns.find((c) => c.id === columnId);
    const position = col?.tasks?.length || 0;

    await supabase.from("tasks").insert({
      column_id: columnId,
      title: newTaskTitle.trim(),
      position,
      priority: "medium",
      labels: [],
      client_visible: false,
    });

    setNewTaskTitle("");
    setNewTaskColumn(null);
    loadBoard();
  }

  async function updateTask(task: Task) {
    const supabase = createClient();
    await supabase
      .from("tasks")
      .update({
        title: task.title,
        description: task.description,
        assignee_id: task.assignee_id,
        due_date: task.due_date,
        priority: task.priority,
        labels: task.labels,
        client_visible: task.client_visible,
      })
      .eq("id", task.id);
    setEditingTask(null);
    loadBoard();
  }

  async function deleteTask(taskId: string) {
    const supabase = createClient();
    await supabase.from("tasks").delete().eq("id", taskId);
    setEditingTask(null);
    loadBoard();
  }

  async function addColumn() {
    if (!newColumnTitle.trim()) return;
    const supabase = createClient();
    await supabase.from("board_columns").insert({
      board_id: boardId,
      title: newColumnTitle.trim(),
      position: columns.length,
    });
    setNewColumnTitle("");
    setShowAddColumn(false);
    loadBoard();
  }

  async function deleteColumn(colId: string) {
    if (!confirm("Delete this column and all its tasks?")) return;
    const supabase = createClient();
    await supabase.from("board_columns").delete().eq("id", colId);
    loadBoard();
  }

  if (!board) {
    return <div className="text-muted text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/admin/boards"
          className="text-muted hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">{board.name}</h1>
          <p className="text-muted text-sm mt-0.5">
            {board.client_id ? (
              <Link
                href={`/admin/clients?client=${board.client_id}`}
                className="text-primary-light hover:text-white"
              >
                {board.client?.full_name || board.client?.company_name || "Client"}
              </Link>
            ) : (
              "No client linked"
            )}
            {" · "}
            Drag and drop tasks between columns
          </p>
        </div>
        <button
          onClick={() => setShowAddColumn(true)}
          className="flex items-center gap-2 border border-border hover:border-primary text-muted hover:text-white px-3 py-2 rounded-lg text-sm transition-colors"
        >
          <Plus size={14} />
          Add Column
        </button>
      </div>

      {showAddColumn && (
        <div className="bg-surface-light border border-border rounded-xl p-4 mb-6 flex gap-3">
          <input
            type="text"
            value={newColumnTitle}
            onChange={(e) => setNewColumnTitle(e.target.value)}
            placeholder="Column name..."
            className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-white text-sm placeholder-muted focus:outline-none focus:border-primary"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && addColumn()}
          />
          <button
            onClick={addColumn}
            className="bg-primary text-white px-4 py-2 rounded-lg text-sm"
          >
            Add
          </button>
          <button
            onClick={() => setShowAddColumn(false)}
            className="text-muted hover:text-white px-2"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: "calc(100vh - 200px)" }}>
          {columns.map((column) => (
            <div
              key={column.id}
              className="flex-shrink-0 w-72 bg-surface-light border border-border rounded-xl flex flex-col"
            >
              <div className="p-3 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-medium text-sm">
                    {column.title}
                  </h3>
                  <span className="text-muted text-xs bg-surface px-1.5 py-0.5 rounded">
                    {column.tasks?.length || 0}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setNewTaskColumn(column.id)}
                    className="text-muted hover:text-white p-1 transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                  <button
                    onClick={() => deleteColumn(column.id)}
                    className="text-muted hover:text-red-400 p-1 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      "flex-1 p-2 space-y-2 min-h-[100px] transition-colors",
                      snapshot.isDraggingOver && "bg-primary/5"
                    )}
                  >
                    {column.tasks?.map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={task.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={cn(
                              "bg-surface border border-border rounded-lg p-3 cursor-pointer hover:border-primary/50 transition-colors",
                              snapshot.isDragging && "shadow-lg border-primary"
                            )}
                            onClick={() => setEditingTask({ ...task })}
                          >
                            <div className="flex items-start gap-2">
                              <div
                                {...provided.dragHandleProps}
                                className="text-muted mt-0.5 flex-shrink-0"
                              >
                                <GripVertical size={14} />
                              </div>
                              <div className="flex-1 min-w-0">
                                {task.labels.length > 0 && (
                                  <div className="flex gap-1 mb-1.5 flex-wrap">
                                    {task.labels.map((label, i) => (
                                      <span
                                        key={i}
                                        className={cn(
                                          "text-[10px] text-white px-1.5 py-0.5 rounded",
                                          labelColors[i % labelColors.length]
                                        )}
                                      >
                                        {label}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                <p className="text-white text-sm font-medium">
                                  {task.title}
                                </p>
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                  <span
                                    className={cn(
                                      "w-2 h-2 rounded-full",
                                      priorityColors[task.priority]
                                    )}
                                  />
                                  {task.due_date && (
                                    <span className="text-muted text-xs flex items-center gap-1">
                                      <Calendar size={10} />
                                      {new Date(
                                        task.due_date
                                      ).toLocaleDateString()}
                                    </span>
                                  )}
                                  {task.profiles && (
                                    <span className="text-muted text-xs flex items-center gap-1">
                                      <User size={10} />
                                      {task.profiles.full_name}
                                    </span>
                                  )}
                                  {task.client_visible && (
                                    <span title="Visible to client">
                                      <Eye
                                        size={12}
                                        className="text-green-400"
                                      />
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>

              {newTaskColumn === column.id && (
                <div className="p-2 border-t border-border">
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Task title..."
                    className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-white text-sm placeholder-muted focus:outline-none focus:border-primary mb-2"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addTask(column.id);
                      if (e.key === "Escape") setNewTaskColumn(null);
                    }}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => addTask(column.id)}
                      className="bg-primary text-white px-3 py-1 rounded text-xs"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => setNewTaskColumn(null)}
                      className="text-muted text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </DragDropContext>

      {/* Task detail modal */}
      {editingTask && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-surface-light border border-border rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-white font-semibold text-lg">Edit Task</h2>
                <button
                  onClick={() => setEditingTask(null)}
                  className="text-muted hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-1.5">
                  Title
                </label>
                <input
                  type="text"
                  value={editingTask.title}
                  onChange={(e) =>
                    setEditingTask({ ...editingTask, title: e.target.value })
                  }
                  className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editingTask.description || ""}
                  onChange={(e) =>
                    setEditingTask({
                      ...editingTask,
                      description: e.target.value || null,
                    })
                  }
                  className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white text-sm font-medium mb-1.5">
                    <Flag size={14} className="inline mr-1" />
                    Priority
                  </label>
                  <select
                    value={editingTask.priority}
                    onChange={(e) =>
                      setEditingTask({
                        ...editingTask,
                        priority: e.target.value as Task["priority"],
                      })
                    }
                    className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-primary"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-1.5">
                    <User size={14} className="inline mr-1" />
                    Assignee
                  </label>
                  <select
                    value={editingTask.assignee_id || ""}
                    onChange={(e) =>
                      setEditingTask({
                        ...editingTask,
                        assignee_id: e.target.value || null,
                      })
                    }
                    className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-primary"
                  >
                    <option value="">Unassigned</option>
                    {teamMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-1.5">
                  <Calendar size={14} className="inline mr-1" />
                  Due Date
                </label>
                <input
                  type="date"
                  value={editingTask.due_date || ""}
                  onChange={(e) =>
                    setEditingTask({
                      ...editingTask,
                      due_date: e.target.value || null,
                    })
                  }
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-1.5">
                  Labels (comma separated)
                </label>
                <input
                  type="text"
                  value={editingTask.labels.join(", ")}
                  onChange={(e) =>
                    setEditingTask({
                      ...editingTask,
                      labels: e.target.value
                        .split(",")
                        .map((l) => l.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="e.g. design, bug, feature"
                  className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-white placeholder-muted focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    setEditingTask({
                      ...editingTask,
                      client_visible: !editingTask.client_visible,
                    })
                  }
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors",
                    editingTask.client_visible
                      ? "border-green-500/30 text-green-400 bg-green-500/10"
                      : "border-border text-muted hover:text-white"
                  )}
                >
                  {editingTask.client_visible ? (
                    <Eye size={14} />
                  ) : (
                    <EyeOff size={14} />
                  )}
                  {editingTask.client_visible
                    ? "Visible to Client"
                    : "Hidden from Client"}
                </button>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <button
                  onClick={() => deleteTask(editingTask.id)}
                  className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm transition-colors"
                >
                  <Trash2 size={14} />
                  Delete Task
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={() => setEditingTask(null)}
                    className="border border-border text-muted hover:text-white px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => updateTask(editingTask)}
                    className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
