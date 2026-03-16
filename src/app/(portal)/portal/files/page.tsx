"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { FolderOpen, FileText, Image, File, Download, Upload, Eye, X } from "lucide-react";

const ACCEPTED_TYPES = ".pdf,.doc,.docx,.csv,.txt,image/jpeg,image/png,image/jpg,image/gif,image/webp";

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
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    // Get direct uploads from client_files
    const { data: clientFiles } = await supabase
      .from("client_files")
      .select("id, name, file_url, created_at")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false });

    if (clientFiles) {
      for (const f of clientFiles) {
        allFiles.push({
          id: `file-${f.id}`,
          name: f.name,
          url: f.file_url,
          source: "Uploaded",
          date: f.created_at,
          type: getFileType(f.name),
        });
      }
    }

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

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setUploading(true);
    setUploadError(null);

    const path = `${user.id}/uploads/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

    const { data: uploadData, error } = await supabase.storage
      .from("client-files")
      .upload(path, file, { upsert: true });

    if (error) {
      setUploadError(error.message || "Upload failed");
      setUploading(false);
      e.target.value = "";
      return;
    }

    const { data: urlData } = supabase.storage.from("client-files").getPublicUrl(uploadData.path);

    const { error: insertErr } = await supabase.from("client_files").insert({
      client_id: user.id,
      name: file.name,
      file_path: uploadData.path,
      file_url: urlData.publicUrl,
      mime_type: file.type || null,
    });

    if (insertErr) {
      setUploadError(insertErr.message || "Failed to save file record");
      setUploading(false);
      e.target.value = "";
      return;
    }

    setUploading(false);
    e.target.value = "";
    loadFiles();
  }

  function getFileType(name: string): "image" | "document" | "other" {
    const ext = name.split(".").pop()?.toLowerCase() ?? "";
    const imageExts = ["jpg", "jpeg", "png", "gif", "webp"];
    const docExts = ["pdf", "doc", "docx", "txt", "csv"];
    if (imageExts.includes(ext)) return "image";
    if (docExts.includes(ext)) return "document";
    return "other";
  }

  function canPreview(file: FileItem): boolean {
    return file.type === "image" || file.name.toLowerCase().endsWith(".pdf");
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
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Files</h1>
          <p className="text-muted text-sm mt-1">
            Upload, view, and download your project files — PDF, DOC, CSV, images
          </p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={ACCEPTED_TYPES}
            onChange={handleUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Upload size={16} />
            {uploading ? "Uploading..." : "Upload file"}
          </button>
        </div>
      </div>

      {uploadError && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {uploadError}
        </div>
      )}

      {files.length === 0 ? (
        <div className="bg-surface-light border border-border rounded-xl p-12 text-center">
          <FolderOpen className="text-muted mx-auto mb-3" size={48} />
          <p className="text-muted">No files yet.</p>
          <p className="text-muted text-sm mt-1">
            Upload a file above or upload when sending messages or submitting work orders.
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="mt-4 inline-flex items-center gap-2 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            <Upload size={16} />
            Upload file
          </button>
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
                      <div className="flex items-center justify-end gap-2">
                        {canPreview(file) && (
                          <button
                            onClick={() => setPreviewFile(file)}
                            className="inline-flex items-center gap-1 text-primary-light hover:text-white"
                          >
                            <Eye size={14} />
                            View
                          </button>
                        )}
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={file.name}
                          className="inline-flex items-center gap-1 text-primary-light hover:text-white"
                        >
                          <Download size={14} />
                          Download
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {previewFile && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black">
          <div className="flex items-center justify-between px-4 py-3 bg-surface border-b border-border shrink-0">
            <h3 className="text-white font-medium truncate">{previewFile.name}</h3>
            <button
              onClick={() => setPreviewFile(null)}
              className="p-2 text-muted hover:text-white rounded-lg"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 min-h-0 overflow-auto p-4">
            {previewFile.type === "image" ? (
              <img
                src={previewFile.url}
                alt={previewFile.name}
                className="max-w-full max-h-full object-contain mx-auto"
              />
            ) : (
              <iframe
                src={previewFile.url}
                title={previewFile.name}
                className="w-full h-full min-h-[600px] rounded-lg border border-border"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
