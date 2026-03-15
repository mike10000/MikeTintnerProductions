"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (data) {
      setFullName(data.full_name || "");
      setCompanyName(data.company_name || "");
      setPhone(data.phone || "");
    }
    setLoading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        company_name: companyName || null,
        phone: phone || null,
      })
      .eq("id", user.id);

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (loading) {
    return <div className="text-muted text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-muted text-sm mt-1">Update your profile information</p>
      </div>

      <div className="bg-surface-light border border-border rounded-xl p-6 max-w-xl">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-white text-sm font-medium mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-white placeholder-muted focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="block text-white text-sm font-medium mb-1.5">
              Company / Organization
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-white placeholder-muted focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="block text-white text-sm font-medium mb-1.5">
              Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-white placeholder-muted focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Save Changes
            </button>
            {saved && (
              <span className="text-green-400 text-sm">Saved!</span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
