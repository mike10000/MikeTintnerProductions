"use client";

import Link from "next/link";

export function CTA() {
  return (
    <section className="relative bg-surface py-24 overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-72 h-72 rounded-full bg-cyan-500/5 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          Ready to Elevate Your{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-light to-cyan-400">
            Online Presence
          </span>
          ?
        </h2>
        <p className="text-muted text-lg mb-8 max-w-2xl mx-auto">
          Let&apos;s build a website that works as hard as you do. Get a free
          quote today — no commitment, no pressure.
        </p>
        <Link
          href="/contact"
          className="relative inline-block overflow-hidden bg-primary text-white px-10 py-4 rounded-lg font-semibold text-lg transition-all duration-500 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-1 group"
        >
          <span className="relative z-10">Start Your Project</span>
          <div className="absolute inset-0 bg-gradient-to-r from-primary-dark via-primary to-primary-light opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        </Link>
      </div>
    </section>
  );
}
