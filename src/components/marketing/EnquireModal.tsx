"use client";

import { useState, useEffect } from "react";
import { X, Send } from "lucide-react";
import { submitContact } from "@/app/(marketing)/contact/actions";

const ORG_TYPES = [
  { value: "small-business", label: "Small Business" },
  { value: "environmental", label: "Environmental Organization" },
  { value: "nonprofit", label: "Non-Profit" },
  { value: "farm", label: "Farm / Agriculture" },
  { value: "musician", label: "Local Musician" },
  { value: "other", label: "Other" },
] as const;

type EnquireModalProps = {
  isOpen: boolean;
  onClose: () => void;
  defaultOrgType?: string;
  serviceTitle?: string;
};

export function EnquireModal({
  isOpen,
  onClose,
  defaultOrgType = "",
  serviceTitle,
}: EnquireModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    organization: "",
    type: defaultOrgType,
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData((prev) => ({ ...prev, type: defaultOrgType }));
      setSubmitted(false);
      setError(null);
    }
  }, [isOpen, defaultOrgType]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const result = await submitContact({
        name: formData.name,
        email: formData.email,
        message: formData.message,
        organization: formData.organization || undefined,
        type: formData.type || undefined,
      });
      if (result.success) {
        setSubmitted(true);
      } else {
        setError(result.error);
      }
    } catch {
      setError("Something went wrong. Please try again or email us at info@MikeTintnerProductions.com.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative bg-surface-light border border-border rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between p-4 border-b border-border bg-surface-light z-10">
          <h3 className="text-white font-semibold text-lg">
            {serviceTitle ? `Enquire — ${serviceTitle}` : "Enquire"}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-muted hover:text-white rounded-lg transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {submitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Send className="text-primary-light" size={28} />
              </div>
              <h4 className="text-white text-xl font-semibold mb-2">
                Message Sent!
              </h4>
              <p className="text-muted text-sm mb-6">
                Thanks for reaching out. We&apos;ll get back to you within 24
                hours with a free quote.
              </p>
              <button
                onClick={onClose}
                className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white text-sm font-medium mb-1.5">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-white placeholder-muted focus:outline-none focus:border-primary transition-colors"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-white text-sm font-medium mb-1.5">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-white placeholder-muted focus:outline-none focus:border-primary transition-colors"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white text-sm font-medium mb-1.5">
                    Organization Name
                  </label>
                  <input
                    type="text"
                    value={formData.organization}
                    onChange={(e) =>
                      setFormData({ ...formData, organization: e.target.value })
                    }
                    className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-white placeholder-muted focus:outline-none focus:border-primary transition-colors"
                    placeholder="Your Business or Org"
                  />
                </div>
                <div>
                  <label className="block text-white text-sm font-medium mb-1.5">
                    Type of Organization
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: e.target.value,
                      })
                    }
                    className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors"
                  >
                    <option value="">Select one...</option>
                    {ORG_TYPES.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-1.5">
                  Tell Us About Your Project *
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-white placeholder-muted focus:outline-none focus:border-primary transition-colors resize-none"
                  placeholder="What kind of website do you need? Any specific features or goals?"
                />
              </div>

              {error && (
                <p className="text-red-400 text-sm">{error}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-primary hover:bg-primary-dark disabled:opacity-70 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? (
                  "Sending..."
                ) : (
                  <>
                    <Send size={18} />
                    Send Message
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
