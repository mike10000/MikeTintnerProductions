"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ExternalLink, X } from "lucide-react";

type ClientWebsite = {
  id: string;
  client_id: string;
  name: string;
  url: string;
};

export function ClientWebsites() {
  const [websites, setWebsites] = useState<ClientWebsite[]>([]);
  const [loading, setLoading] = useState(true);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [iframeName, setIframeName] = useState("");

  useEffect(() => {
    loadWebsites();
  }, []);

  async function loadWebsites() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("client_websites")
      .select("*")
      .eq("client_id", user.id)
      .order("created_at", { ascending: true });

    setWebsites(data || []);
    setLoading(false);
  }

  function openIframe(url: string, name: string) {
    // Ensure URL has protocol for iframe
    const fullUrl = url.startsWith("http") ? url : `https://${url}`;
    setIframeUrl(fullUrl);
    setIframeName(name);
  }

  if (loading || websites.length === 0) return null;

  return (
    <>
      <div className="mb-6 p-4 bg-surface-light border border-border rounded-xl">
        <h2 className="text-white font-semibold text-sm mb-3">Your Websites</h2>
        <div className="flex flex-wrap gap-2">
          {websites.map((site) => (
            <button
              key={site.id}
              onClick={() => openIframe(site.url, site.name)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary-light border border-primary/30 transition-colors text-sm font-medium"
            >
              <ExternalLink size={14} />
              {site.name}
            </button>
          ))}
        </div>
      </div>

      {iframeUrl && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/95">
          <div className="flex items-center justify-between px-4 py-3 bg-surface border-b border-border shrink-0">
            <h3 className="text-white font-medium truncate">{iframeName}</h3>
            <div className="flex items-center gap-2">
              <a
                href={iframeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-light hover:text-white text-sm"
              >
                Open in new tab
              </a>
              <button
                onClick={() => {
                  setIframeUrl(null);
                  setIframeName("");
                }}
                className="p-2 text-muted hover:text-white rounded-lg transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
          </div>
          <iframe
            src={iframeUrl}
            title={iframeName}
            className="flex-1 w-full min-h-0"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          />
        </div>
      )}
    </>
  );
}
