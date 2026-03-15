import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Target, Users, Clock, Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "About | Mike Tintner Productions",
  description:
    "Learn about Mike Tintner Productions and our mission to provide affordable web design.",
};

const values = [
  {
    icon: Target,
    title: "Mission-Driven",
    description:
      "We prioritize working with organizations that make a positive impact in their communities.",
    gradient: "from-rose-600/20 via-pink-500/10 to-transparent",
    accentBorder: "group-hover:border-rose-500/40",
    iconBg: "group-hover:bg-rose-500/20",
  },
  {
    icon: Users,
    title: "Client-First",
    description:
      "Your success is our success. We build long-term partnerships, not one-off transactions.",
    gradient: "from-blue-600/20 via-cyan-500/10 to-transparent",
    accentBorder: "group-hover:border-blue-500/40",
    iconBg: "group-hover:bg-blue-500/20",
  },
  {
    icon: Clock,
    title: "Efficient & Fast",
    description:
      "We respect your time and budget. Quick turnarounds without compromising quality.",
    gradient: "from-amber-600/20 via-yellow-500/10 to-transparent",
    accentBorder: "group-hover:border-amber-500/40",
    iconBg: "group-hover:bg-amber-500/20",
  },
  {
    icon: Shield,
    title: "Transparent",
    description:
      "No hidden fees, no jargon. Our client portal keeps you informed at every step.",
    gradient: "from-emerald-600/20 via-green-500/10 to-transparent",
    accentBorder: "group-hover:border-emerald-500/40",
    iconBg: "group-hover:bg-emerald-500/20",
  },
];

export default function AboutPage() {
  return (
    <div>
      <section className="relative bg-surface-light pt-32 pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-surface via-surface-light/80 to-surface-light pointer-events-none" />
        <div className="absolute top-0 left-1/3 w-96 h-96 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />
        <div className="absolute top-10 right-1/4 w-64 h-64 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
                Building the Web for Those Who Build{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-light to-cyan-400">
                  Community
                </span>
              </h1>
              <p className="text-muted text-lg mb-6">
                Mike Tintner Productions was founded on a simple belief: every
                organization doing meaningful work deserves a professional
                online presence — regardless of budget.
              </p>
              <p className="text-muted mb-6">
                We specialize in serving small businesses, environmental groups,
                non-profits, farms, and local musicians. These are the
                organizations that strengthen our communities, and they
                shouldn&apos;t have to choose between quality and affordability
                when it comes to their website.
              </p>
              <p className="text-muted">
                From the first conversation to launch day and beyond, we work
                closely with every client through our transparent client portal
                — so you always know where your project stands.
              </p>
            </div>
            <div className="flex justify-center">
              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-br from-primary/20 via-cyan-500/10 to-violet-500/20 rounded-3xl blur-xl opacity-50 group-hover:opacity-80 transition-opacity duration-700" />
                <Image
                  src="/images/logo.png"
                  alt="Mike Tintner Productions"
                  width={300}
                  height={300}
                  className="relative rounded-2xl transition-transform duration-700 group-hover:scale-105"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-surface py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-12 text-center">
            Our Values
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value) => (
              <div
                key={value.title}
                className={`
                  relative overflow-hidden
                  bg-surface-light border border-border rounded-xl p-6
                  group cursor-default
                  transition-all duration-500 ease-out
                  hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/5
                  ${value.accentBorder}
                `}
              >
                <div
                  className={`
                    absolute inset-0 bg-gradient-to-br ${value.gradient}
                    opacity-0 group-hover:opacity-100
                    transition-opacity duration-500 pointer-events-none
                  `}
                />
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary-light to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                <div className="relative z-10">
                  <div
                    className={`
                      w-14 h-14 rounded-xl bg-primary/10
                      flex items-center justify-center mb-5
                      transition-all duration-500 ease-out
                      group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-lg
                      ${value.iconBg}
                    `}
                  >
                    <value.icon
                      className="text-primary-light transition-transform duration-500 group-hover:scale-110"
                      size={26}
                    />
                  </div>
                  <h3 className="text-white font-semibold mb-2">
                    {value.title}
                  </h3>
                  <p className="text-muted text-sm transition-colors duration-300 group-hover:text-slate-300">
                    {value.description}
                  </p>
                </div>

                <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-primary/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative bg-surface-light py-24 overflow-hidden">
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-80 h-80 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl font-bold text-white mb-4">
            Let&apos;s Build Something{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-light to-cyan-400">
              Great Together
            </span>
          </h2>
          <p className="text-muted text-lg mb-8">
            Ready to take your online presence to the next level? We&apos;d love
            to hear about your project.
          </p>
          <Link
            href="/contact"
            className="relative inline-block overflow-hidden bg-primary text-white px-8 py-3 rounded-lg font-semibold transition-all duration-500 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 group"
          >
            <span className="relative z-10">Get in Touch</span>
            <div className="absolute inset-0 bg-gradient-to-r from-primary-dark via-primary to-primary-light opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </Link>
        </div>
      </section>
    </div>
  );
}
