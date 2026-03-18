import type { Metadata } from "next";
import Link from "next/link";
import {
  Store,
  Leaf,
  Heart,
  Tractor,
  Music,
  Code,
  Smartphone,
  Search,
  PenTool,
  ShoppingCart,
  BarChart,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Services | Mike Tintner Productions",
  description:
    "Web design services for small businesses, environmental organizations, non-profits, farms, and musicians.",
};

const niches = [
  {
    icon: Store,
    title: "Small Businesses",
    features: [
      "Custom branded design",
      "Google Business integration",
      "Contact forms & lead capture",
      "Mobile-optimized",
    ],
    gradient: "from-blue-600/20 via-cyan-500/10 to-transparent",
    accentBorder: "group-hover:border-blue-500/50",
    iconBg: "group-hover:bg-blue-500/20",
  },
  {
    icon: Leaf,
    title: "Environmental Organizations",
    features: [
      "Mission-driven design",
      "Event calendars",
      "Petition & action pages",
      "Newsletter sign-ups",
    ],
    gradient: "from-emerald-600/20 via-green-500/10 to-transparent",
    accentBorder: "group-hover:border-emerald-500/50",
    iconBg: "group-hover:bg-emerald-500/20",
  },
  {
    icon: Heart,
    title: "Non-Profits",
    features: [
      "Donation integration",
      "Volunteer sign-up forms",
      "Impact storytelling",
      "Grant & sponsor pages",
    ],
    gradient: "from-rose-600/20 via-pink-500/10 to-transparent",
    accentBorder: "group-hover:border-rose-500/50",
    iconBg: "group-hover:bg-rose-500/20",
  },
  {
    icon: Tractor,
    title: "Farms & Agriculture",
    features: [
      "CSA membership management",
      "Product catalogs",
      "Farm-to-table branding",
      "Location & hours display",
    ],
    gradient: "from-amber-600/20 via-yellow-500/10 to-transparent",
    accentBorder: "group-hover:border-amber-500/50",
    iconBg: "group-hover:bg-amber-500/20",
  },
  {
    icon: Music,
    title: "Local Musicians",
    features: [
      "Music player integration",
      "Show date calendars",
      "Merch shop setup",
      "Electronic press kits",
    ],
    gradient: "from-violet-600/20 via-purple-500/10 to-transparent",
    accentBorder: "group-hover:border-violet-500/50",
    iconBg: "group-hover:bg-violet-500/20",
  },
];

const capabilities = [
  { icon: Code, title: "Custom Web Development" },
  { icon: Smartphone, title: "Responsive Design" },
  { icon: Search, title: "SEO Optimization" },
  { icon: PenTool, title: "Brand Identity" },
  { icon: ShoppingCart, title: "E-Commerce" },
  { icon: BarChart, title: "Analytics Setup" },
];

export default function ServicesPage() {
  return (
    <div>
      <section className="relative bg-surface-light pt-32 pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-surface via-surface-light/80 to-surface-light pointer-events-none" />
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="absolute top-10 right-1/3 w-64 h-64 rounded-full bg-cyan-500/5 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Our Services
            </h1>
            <p className="text-muted text-lg max-w-2xl mx-auto">
              Tailored web design for organizations making a difference. Every
              site is built to convert visitors into supporters.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {niches.map((niche) => (
              <div
                key={niche.title}
                className={`
                  relative overflow-hidden
                  bg-surface border border-border rounded-xl p-6
                  group cursor-default
                  transition-all duration-500 ease-out
                  hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/5
                  ${niche.accentBorder}
                `}
              >
                <div
                  className={`
                    absolute inset-0 bg-gradient-to-br ${niche.gradient}
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
                      ${niche.iconBg}
                    `}
                  >
                    <niche.icon
                      className="text-primary-light transition-transform duration-500 group-hover:scale-110"
                      size={26}
                    />
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-4">
                    {niche.title}
                  </h3>
                  <ul className="space-y-2.5">
                    {niche.features.map((feature, i) => (
                      <li
                        key={feature}
                        className="text-muted text-sm flex items-start gap-2 transition-all duration-300 group-hover:text-slate-300"
                        style={{ transitionDelay: `${i * 50}ms` }}
                      >
                        <span className="text-primary-light mt-0.5 transition-transform duration-300 group-hover:scale-125">
                          &#x2713;
                        </span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-primary/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-12 text-center">
            Full-Stack Capabilities
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {capabilities.map((cap) => (
              <div
                key={cap.title}
                className="relative overflow-hidden flex flex-col items-center text-center gap-3 p-6 rounded-xl border border-transparent group cursor-default transition-all duration-500 hover:border-border hover:bg-surface-light/50 hover:-translate-y-1"
              >
                <div className="w-14 h-14 rounded-full bg-surface-light flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:bg-primary/10 group-hover:shadow-lg group-hover:shadow-primary/10">
                  <cap.icon
                    className="text-primary-light transition-transform duration-500 group-hover:scale-110"
                    size={24}
                  />
                </div>
                <span className="text-white text-sm font-medium transition-colors duration-300 group-hover:text-primary-light">
                  {cap.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface-light py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Simple, Transparent Process
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-12">
            {[
              {
                step: "1",
                title: "Discovery",
                desc: "We learn about your goals, audience, and brand.",
                gradient: "from-blue-500 to-cyan-500",
              },
              {
                step: "2",
                title: "Design & Build",
                desc: "You review designs, we iterate fast until it's perfect.",
                gradient: "from-primary to-primary-light",
              },
              {
                step: "3",
                title: "Launch & Grow",
                desc: "We launch your site and provide ongoing support.",
                gradient: "from-emerald-500 to-green-400",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="group cursor-default transition-all duration-500 hover:-translate-y-1"
              >
                <div
                  className={`w-12 h-12 rounded-full bg-gradient-to-br ${item.gradient} text-white font-bold flex items-center justify-center mx-auto mb-4 transition-all duration-500 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/20`}
                >
                  {item.step}
                </div>
                <h3 className="text-white font-semibold mb-1">{item.title}</h3>
                <p className="text-muted text-sm transition-colors duration-300 group-hover:text-slate-300">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
          <Link
            href="/contact"
            className="relative inline-block overflow-hidden mt-12 bg-primary text-white px-8 py-3 rounded-lg font-semibold transition-all duration-500 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 group"
          >
            <span className="relative z-10">Get Started</span>
            <div className="absolute inset-0 bg-gradient-to-r from-primary-dark via-primary to-primary-light opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </Link>
        </div>
      </section>
    </div>
  );
}
