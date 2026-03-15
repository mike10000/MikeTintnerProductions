"use client";

import { Zap, DollarSign, BarChart3, Headphones } from "lucide-react";

const reasons = [
  {
    icon: DollarSign,
    title: "Affordable Pricing",
    description:
      "Premium quality websites at prices that respect your budget. No hidden fees, no surprises.",
    gradient: "from-emerald-500/20 via-green-500/10 to-transparent",
    accentBorder: "group-hover:border-emerald-500/40",
    iconBg: "group-hover:bg-emerald-500/20",
  },
  {
    icon: Zap,
    title: "Fast Delivery",
    description:
      "Your site launched in days, not months. We move fast without cutting corners.",
    gradient: "from-amber-500/20 via-yellow-500/10 to-transparent",
    accentBorder: "group-hover:border-amber-500/40",
    iconBg: "group-hover:bg-amber-500/20",
  },
  {
    icon: BarChart3,
    title: "Built to Convert",
    description:
      "Every page is designed to turn visitors into customers, donors, or fans.",
    gradient: "from-blue-500/20 via-cyan-500/10 to-transparent",
    accentBorder: "group-hover:border-blue-500/40",
    iconBg: "group-hover:bg-blue-500/20",
  },
  {
    icon: Headphones,
    title: "Ongoing Support",
    description:
      "Client portal with work order tracking, messaging, and transparent project management.",
    gradient: "from-violet-500/20 via-purple-500/10 to-transparent",
    accentBorder: "group-hover:border-violet-500/40",
    iconBg: "group-hover:bg-violet-500/20",
  },
];

export function WhyUs() {
  return (
    <section className="bg-surface-light py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Why Mike Tintner Productions?
          </h2>
          <p className="text-muted text-lg max-w-2xl mx-auto">
            We deliver more than a website — we deliver results.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {reasons.map((reason) => (
            <div
              key={reason.title}
              className={`
                relative overflow-hidden text-center
                bg-surface border border-border rounded-xl p-6
                group cursor-default
                transition-all duration-500 ease-out
                hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/5
                ${reason.accentBorder}
              `}
            >
              <div
                className={`
                  absolute inset-0 bg-gradient-to-br ${reason.gradient}
                  opacity-0 group-hover:opacity-100
                  transition-opacity duration-500 pointer-events-none
                `}
              />
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary-light to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

              <div className="relative z-10">
                <div
                  className={`
                    w-14 h-14 rounded-full bg-primary/10
                    flex items-center justify-center mx-auto mb-4
                    transition-all duration-500 ease-out
                    group-hover:scale-110 group-hover:shadow-lg
                    ${reason.iconBg}
                  `}
                >
                  <reason.icon
                    className="text-primary-light transition-transform duration-500 group-hover:scale-110"
                    size={28}
                  />
                </div>
                <h3 className="text-white font-semibold mb-2">{reason.title}</h3>
                <p className="text-muted text-sm transition-colors duration-300 group-hover:text-slate-300">
                  {reason.description}
                </p>
              </div>

              <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-primary/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
