"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, Send } from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    organization: "",
    type: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: wire up to Supabase or email service
    setSubmitted(true);
  }

  return (
    <div>
      <section className="relative bg-surface-light pt-32 pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-surface via-surface-light/80 to-surface-light pointer-events-none" />
        <div className="absolute top-0 right-1/3 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="absolute top-10 left-1/4 w-64 h-64 rounded-full bg-cyan-500/5 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Get in Touch
            </h1>
            <p className="text-muted text-lg max-w-2xl mx-auto">
              Ready to start your project? Fill out the form below and
              we&apos;ll get back to you within 24 hours with a free quote.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              {submitted ? (
                <div className="bg-surface border border-accent/30 rounded-xl p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                    <Send className="text-accent" size={28} />
                  </div>
                  <h3 className="text-white text-xl font-semibold mb-2">
                    Message Sent!
                  </h3>
                  <p className="text-muted">
                    Thanks for reaching out. We&apos;ll be in touch within 24
                    hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-white placeholder-muted focus:outline-none focus:border-primary transition-colors"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-white placeholder-muted focus:outline-none focus:border-primary transition-colors"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        Organization Name
                      </label>
                      <input
                        type="text"
                        value={formData.organization}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            organization: e.target.value,
                          })
                        }
                        className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-white placeholder-muted focus:outline-none focus:border-primary transition-colors"
                        placeholder="Your Business or Org"
                      />
                    </div>
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        Type of Organization
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) =>
                          setFormData({ ...formData, type: e.target.value })
                        }
                        className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                      >
                        <option value="">Select one...</option>
                        <option value="small-business">Small Business</option>
                        <option value="environmental">
                          Environmental Organization
                        </option>
                        <option value="nonprofit">Non-Profit</option>
                        <option value="farm">Farm / Agriculture</option>
                        <option value="musician">Local Musician</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Tell Us About Your Project *
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) =>
                        setFormData({ ...formData, message: e.target.value })
                      }
                      className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-white placeholder-muted focus:outline-none focus:border-primary transition-colors resize-none"
                      placeholder="What kind of website do you need? Any specific features or goals?"
                    />
                  </div>

                  <button
                    type="submit"
                    className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-lg font-semibold transition-colors"
                  >
                    Send Message
                  </button>
                </form>
              )}
            </div>

            <div className="space-y-6">
              <div className="bg-surface border border-border rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="text-primary-light" size={20} />
                  </div>
                  <div>
                    <h3 className="text-white font-medium mb-1">Email</h3>
                    <p className="text-muted text-sm">
                      mike@miketintnerproductions.com
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-surface border border-border rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="text-primary-light" size={20} />
                  </div>
                  <div>
                    <h3 className="text-white font-medium mb-1">Phone</h3>
                    <p className="text-muted text-sm">Available upon request</p>
                  </div>
                </div>
              </div>

              <div className="bg-surface border border-border rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="text-primary-light" size={20} />
                  </div>
                  <div>
                    <h3 className="text-white font-medium mb-1">Location</h3>
                    <p className="text-muted text-sm">
                      Remote — serving clients nationwide
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
