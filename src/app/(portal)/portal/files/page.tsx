"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { FolderOpen, FileText, Image, File, Download } from "lucide-react";

type FileItem = {
  id: string;
  name: string;
  url: string;
  source: string;
  date: string;
  type: "image" | "document" | "other";
};

export default function FilesPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFiles();
  }, []);

  async function loadFiles() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const allFiles: FileItem[] = [];

    // Get attachments from messages (client sent)
    const { data: messages } = await supabase
      .from("messages")
      .select("id, attachments, created_at, conversation_id")
      .eq("sender_id", user.id);

    if (messages) {
      for (const msg of messages) {
        const attachments = (msg.attachments as { name: string; url: string }[]) ?? [];
        for (const a of attachments) {
          allFiles.push({
            id: `msg-${msg.id}-${a.name}`,
            name: a.name,
            url: a.url,
            source: "Message",
            date: msg.created_at,
            type: getFileType(a.name),
          });
        }
      }
    }

    // Get attachments from work orders
    const { data: workOrders } = await supabase
      .from("work_orders")
      .select("id, title, attachments, created_at")
      .eq("client_id", user.id);

    if (workOrders) {
      for (const order of workOrders) {
        const attachments = (order.attachments as { name: string; url: string }[]) ?? [];
        for (const a of attachments) {
          allFiles.push({
            id: `wo-${order.id}-${a.name}`,
            name: a.name,
            url: a.url,
            source: `Work Order: ${order.title}`,
            date: order.created_at,
            type: getFileType(a.name),
          });
        }
      }
    }

    // Sort by date descending
    allFiles.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setFiles(allFiles);
    setLoading(false);
  }

  function getFileType(name: string): "image" | "document" | "other" {
    const ext = name.split(".").pop()?.toLowerCase() ?? "";
    const imageExts = ["jpg", "jpeg", "png", "gif", "webp"];
    const docExts = ["pdf", "doc", "docx", "txt", "csv"];
    if (imageExts.includes(ext)) return "image";
    if (docExts.includes(ext)) return "document";
    return "other";
  }

  function FileIcon({ type }: { type: FileItem["type"] }) {
    if (type === "image") return <Image size={20} className="text-blue-400" />;
    if (type === "document") return <FileText size={20} className="text-amber-400" />;
    return <File size={20} className="text-muted" />;
  }

  if (loading) {
    return <div className="text-muted text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Files</h1>
        <p className="text-muted text-sm mt-1">
          All files you&apos;ve uploaded for your projects — from messages and work orders
        </p>
      </div>

      {files.length === 0 ? (
        <div className="bg-surface-light border border-border rounded-xl p-12 text-center">
          <FolderOpen className="text-muted mx-auto mb-3" size={48} />
          <p className="text-muted">No files uploaded yet.</p>
          <p className="text-muted text-sm mt-1">
            Upload files when sending messages or submitting work orders.
          </p>
        </div>
      ) : (
        <div className="bg-surface-light border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface border-b border-border">
                  <th className="text-left text-muted px-4 py-3 font-medium">File</th>
                  <th className="text-left text-muted px-4 py-3 font-medium">Source</th>
                  <th className="text-left text-muted px-4 py-3 font-medium">Date</th>
                  <th className="text-right text-muted px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file) => (
                  <tr key={file.id} className="border-b border-border last:border-0 hover:bg-surface/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <FileIcon type={file.type} />
                        <span className="text-white truncate max-w-[200px]">{file.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted">{file.source}</td>
                    <td className="px-4 py-3 text-muted">
                      {new Date(file.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary-light hover:text-white"
                      >
                        <Download size={14} />
                        Download
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
