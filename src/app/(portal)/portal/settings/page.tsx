"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { NotificationPreferences } from "@/lib/types";
import { Mail } from "lucide-react";
import { cn } from "@/lib/utils";

const EMAIL_PREF_LABELS: { key: keyof Omit<NotificationPreferences, "user_id" | "created_at" | "updated_at">; label: string }[] = [
  { key: "work_order_updates", label: "Work order updates" },
  { key: "quote_updates", label: "Quotes sent" },
  { key: "invoice_updates", label: "Invoices sent" },
  { key: "task_updates", label: "Task updates" },
  { key: "new_messages", label: "New messages" },
  { key: "contract_updates", label: "Contracts to review" },
];

export default function SettingsPage() {
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [prefs, setPrefs] = useState<Partial<NotificationPreferences>>({
    work_order_updates: true,
    quote_updates: true,
    invoice_updates: true,
    task_updates: true,
    new_messages: true,
    contract_updates: true,
  });
  const [prefsSaved, setPrefsSaved] = useState(false);

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

    const { data: prefsData } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (prefsData) {
      setPrefs({
        work_order_updates: prefsData.work_order_updates ?? true,
        quote_updates: prefsData.quote_updates ?? true,
        invoice_updates: prefsData.invoice_updates ?? true,
        task_updates: prefsData.task_updates ?? true,
        new_messages: prefsData.new_messages ?? true,
        contract_updates: prefsData.contract_updates ?? true,
      });
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

  async function handleSavePrefs(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("notification_preferences").upsert(
      {
        user_id: user.id,
        work_order_updates: prefs.work_order_updates ?? true,
        quote_updates: prefs.quote_updates ?? true,
        invoice_updates: prefs.invoice_updates ?? true,
        task_updates: prefs.task_updates ?? true,
        new_messages: prefs.new_messages ?? true,
        contract_updates: prefs.contract_updates ?? true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    setPrefsSaved(true);
    setTimeout(() => setPrefsSaved(false), 3000);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");
    setPasswordLoading(true);
    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      setPasswordLoading(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      setPasswordLoading(false);
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordLoading(false);
    if (error) {
      setPasswordError(error.message);
      return;
    }
    setPasswordSaved(true);
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => setPasswordSaved(false), 3000);
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

      <div className="mt-8 bg-surface-light border border-border rounded-xl p-6 max-w-xl">
        <h2 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
          <Mail size={20} />
          Email notifications
        </h2>
        <p className="text-muted text-sm mb-4">
          Choose which updates you want to receive by email. You&apos;ll always see notifications in the portal.
        </p>
        <form onSubmit={handleSavePrefs} className="space-y-3">
          {EMAIL_PREF_LABELS.map(({ key, label }) => (
            <label
              key={key}
              className="flex items-center justify-between gap-4 cursor-pointer group"
            >
              <span className="text-white text-sm">{label}</span>
              <button
                type="button"
                role="switch"
                aria-checked={prefs[key] ?? true}
                onClick={() => setPrefs((p) => ({ ...p, [key]: !(p[key] ?? true) }))}
                className={cn(
                  "relative w-11 h-6 rounded-full transition-colors",
                  (prefs[key] ?? true) ? "bg-primary" : "bg-surface border border-border"
                )}
              >
                <span
                  className={cn(
                    "absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform",
                    (prefs[key] ?? true) ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </button>
            </label>
          ))}
          <div className="pt-2">
            <button
              type="submit"
              className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Save preferences
            </button>
            {prefsSaved && (
              <span className="ml-3 text-green-400 text-sm">Saved!</span>
            )}
          </div>
        </form>
      </div>

      <div className="mt-8 bg-surface-light border border-border rounded-xl p-6 max-w-xl">
        <h2 className="text-lg font-semibold text-white mb-1">Change password</h2>
        <p className="text-muted text-sm mb-4">Update your password to keep your account secure.</p>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-white text-sm font-medium mb-1.5">
              New password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              minLength={6}
              className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-white placeholder-muted focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="block text-white text-sm font-medium mb-1.5">
              Confirm new password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your new password"
              minLength={6}
              className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-white placeholder-muted focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          {passwordError && (
            <p className="text-red-400 text-sm">{passwordError}</p>
          )}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={passwordLoading}
              className="bg-primary hover:bg-primary-dark disabled:opacity-70 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {passwordLoading ? "Updating..." : "Change password"}
            </button>
            {passwordSaved && (
              <span className="text-green-400 text-sm">Password updated!</span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
