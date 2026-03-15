"use client";

import { Store, Leaf, Heart, Tractor, Music } from "lucide-react";

const services = [
  {
    icon: Store,
    title: "Small Businesses",
    description:
      "Professional websites that establish credibility, attract customers, and drive sales — without breaking the bank.",
    gradient: "from-blue-600/20 via-cyan-500/10 to-transparent",
    accentBorder: "group-hover:border-blue-500/50",
    iconGlow: "group-hover:shadow-blue-500/25",
    iconBg: "group-hover:bg-blue-500/20",
  },
  {
    icon: Leaf,
    title: "Environmental Orgs",
    description:
      "Compelling sites that communicate your mission, rally supporters, and amplify your environmental impact.",
    gradient: "from-emerald-600/20 via-green-500/10 to-transparent",
    accentBorder: "group-hover:border-emerald-500/50",
    iconGlow: "group-hover:shadow-emerald-500/25",
    iconBg: "group-hover:bg-emerald-500/20",
  },
  {
    icon: Heart,
    title: "Non-Profits",
    description:
      "Donation-ready websites that tell your story, engage donors, and streamline volunteer sign-ups.",
    gradient: "from-rose-600/20 via-pink-500/10 to-transparent",
    accentBorder: "group-hover:border-rose-500/50",
    iconGlow: "group-hover:shadow-rose-500/25",
    iconBg: "group-hover:bg-rose-500/20",
  },
  {
    icon: Tractor,
    title: "Farms & Agriculture",
    description:
      "Beautiful sites for CSAs, farm stands, and agritourism — connect with your local community online.",
    gradient: "from-amber-600/20 via-yellow-500/10 to-transparent",
    accentBorder: "group-hover:border-amber-500/50",
    iconGlow: "group-hover:shadow-amber-500/25",
    iconBg: "group-hover:bg-amber-500/20",
  },
  {
    icon: Music,
    title: "Local Musicians",
    description:
      "Striking artist websites with show dates, music players, merch shops, and press kits that get you noticed.",
    gradient: "from-violet-600/20 via-purple-500/10 to-transparent",
    accentBorder: "group-hover:border-violet-500/50",
    iconGlow: "group-hover:shadow-violet-500/25",
    iconBg: "group-hover:bg-violet-500/20",
  },
];

export function ServiceCards() {
  return (
    <section className="bg-surface py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Who We Help
          </h2>
          <p className="text-muted text-lg max-w-2xl mx-auto">
            We specialize in serving organizations that make a real difference
            in their communities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, i) => (
            <div
              key={service.title}
              className={`
                relative overflow-hidden
                bg-surface-light border border-border rounded-xl p-6
                group cursor-default
                transition-all duration-500 ease-out
                hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/5
                ${service.accentBorder}
              `}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              {/* Gradient overlay on hover */}
              <div
                className={`
                  absolute inset-0 bg-gradient-to-br ${service.gradient}
                  opacity-0 group-hover:opacity-100
                  transition-opacity duration-500 ease-out
                  pointer-events-none
                `}
              />

              {/* Shimmer line at top */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary-light to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

              {/* Content */}
              <div className="relative z-10">
                <div
                  className={`
                    w-14 h-14 rounded-xl bg-primary/10
                    flex items-center justify-center mb-5
                    transition-all duration-500 ease-out
                    group-hover:scale-110 group-hover:rotate-3
                    group-hover:shadow-lg
                    ${service.iconBg} ${service.iconGlow}
                  `}
                >
                  <service.icon
                    className="text-primary-light transition-transform duration-500 group-hover:scale-110"
                    size={26}
                  />
                </div>

                <h3 className="text-white font-semibold text-lg mb-2 transition-colors duration-300">
                  {service.title}
                </h3>

                <p className="text-muted text-sm leading-relaxed transition-colors duration-300 group-hover:text-slate-300">
                  {service.description}
                </p>

                {/* Animated arrow on hover */}
                <div className="mt-4 flex items-center gap-2 text-primary-light text-sm font-medium opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
                  Learn more
                  <svg
                    className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </div>
              </div>

              {/* Corner glow */}
              <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-primary/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
