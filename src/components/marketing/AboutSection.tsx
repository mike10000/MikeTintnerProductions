"use client";

import Link from "next/link";
import Image from "next/image";
import { DollarSign, Zap, Headphones } from "lucide-react";

const pillars = [
  {
    icon: DollarSign,
    title: "Affordable Solutions",
    description:
      "High-impact technology tailored to fit tight budgets, ensuring you never have to compromise on quality to protect your bottom line.",
  },
  {
    icon: Zap,
    title: "Robust Systems",
    description:
      "Streamlined, efficient processes that take the friction out of your day-to-day operations so you can focus entirely on your mission.",
  },
  {
    icon: Headphones,
    title: "Excellent Customer Experience",
    description:
      "True partnership and dedicated support. We are fully invested in your success and are here to guide you every step of the way.",
  },
];

export function AboutSection() {
  return (
    <section className="relative bg-surface py-24 overflow-hidden">
      <div className="absolute top-0 left-1/3 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full bg-cyan-500/5 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              About Mike Tintner Productions
            </h2>
            <p className="text-lg font-medium text-primary-light mb-6">
              Leveling the Playing Field for Organizations Doing Good
            </p>
            <p className="text-muted mb-6">
              Every day, small businesses and mission-driven organizations work
              tirelessly to make a positive impact. Yet, they often hit a wall:
              the robust, enterprise-level tools needed to truly scale are
              typically locked behind massive price tags.
            </p>
            <p className="text-muted mb-6">
              Mike Tintner saw this frustrating divide and decided to bridge
              the gap.
            </p>
            <p className="text-muted">
              Drawing on years of industry experience, Mike founded Mike Tintner
              Productions to give smaller, budget-conscious organizations access
              to the exact same caliber of tools that large corporations use to
              dominate their markets. The platform was built on the core belief
              that doing good shouldn&apos;t mean settling for less.
            </p>
            <Link
              href="/about"
              className="inline-block mt-8 text-primary-light hover:text-white font-medium transition-colors"
            >
              Learn more →
            </Link>
          </div>

          <div className="flex justify-center">
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-br from-primary/20 via-cyan-500/10 to-violet-500/20 rounded-3xl blur-xl opacity-50 group-hover:opacity-80 transition-opacity duration-700" />
              <Image
                src="/images/logo.png"
                alt="Mike Tintner Productions"
                width={280}
                height={280}
                className="relative rounded-2xl transition-transform duration-700 group-hover:scale-105"
              />
            </div>
          </div>
        </div>

        <div className="mt-24">
          <h3 className="text-2xl font-bold text-white mb-2 text-center">
            Our Approach
          </h3>
          <p className="text-muted text-center mb-12 max-w-2xl mx-auto">
            We empower your organization to grow through three core pillars:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pillars.map((pillar) => (
              <div
                key={pillar.title}
                className="relative overflow-hidden bg-surface-light border border-border rounded-xl p-6 group hover:border-primary/40 transition-all duration-500 hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <pillar.icon
                    className="text-primary-light"
                    size={24}
                  />
                </div>
                <h4 className="text-white font-semibold mb-2">{pillar.title}</h4>
                <p className="text-muted text-sm leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            ))}
          </div>

          <p className="text-muted text-center mt-12 max-w-3xl mx-auto">
            By combining accessible technology with exceptional service, Mike
            Tintner Productions equips you with everything you need to expand
            your reach, streamline your workflow, and amplify your impact.
          </p>
        </div>
      </div>
    </section>
  );
}
