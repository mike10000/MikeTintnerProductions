import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Portfolio | Mike Tintner Productions",
  description: "See examples of our web design work.",
};

const projects = [
  {
    title: "Green Valley Farm",
    category: "Farm & Agriculture",
    description:
      "A vibrant site for a local CSA with membership management, weekly harvest updates, and a farm store.",
    tags: ["E-Commerce", "Responsive", "CMS"],
    gradient: "from-amber-600/30 via-green-600/20 to-emerald-600/10",
    hoverBorder: "hover:border-amber-500/50",
  },
  {
    title: "Riverkeepers Alliance",
    category: "Environmental",
    description:
      "A mission-driven site with action alerts, donation processing, and interactive river health maps.",
    tags: ["Non-Profit", "Donations", "Maps"],
    gradient: "from-emerald-600/30 via-teal-600/20 to-cyan-600/10",
    hoverBorder: "hover:border-emerald-500/50",
  },
  {
    title: "Main Street Bakery",
    category: "Small Business",
    description:
      "A warm, inviting site with online ordering, catering request forms, and Google Maps integration.",
    tags: ["Local SEO", "Orders", "Responsive"],
    gradient: "from-orange-600/30 via-rose-600/20 to-pink-600/10",
    hoverBorder: "hover:border-orange-500/50",
  },
  {
    title: "The Hollow Notes",
    category: "Musician",
    description:
      "A bold artist site with embedded music player, tour dates, merch shop, and press kit downloads.",
    tags: ["Music", "E-Commerce", "EPK"],
    gradient: "from-violet-600/30 via-purple-600/20 to-indigo-600/10",
    hoverBorder: "hover:border-violet-500/50",
  },
  {
    title: "Community Food Shelf",
    category: "Non-Profit",
    description:
      "Streamlined donation and volunteer sign-up platform with impact reporting dashboards.",
    tags: ["Donations", "Volunteers", "Analytics"],
    gradient: "from-rose-600/30 via-red-600/20 to-orange-600/10",
    hoverBorder: "hover:border-rose-500/50",
  },
  {
    title: "Summit Trail Guides",
    category: "Small Business",
    description:
      "Adventure booking platform with calendar integration, guide profiles, and photo galleries.",
    tags: ["Booking", "Gallery", "Mobile"],
    gradient: "from-sky-600/30 via-blue-600/20 to-indigo-600/10",
    hoverBorder: "hover:border-sky-500/50",
  },
];

export default function PortfolioPage() {
  return (
    <div>
      <section className="relative bg-surface-light pt-32 pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-surface via-surface-light/80 to-surface-light pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-violet-500/5 blur-3xl pointer-events-none" />
        <div className="absolute top-10 left-1/3 w-64 h-64 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Our Work
            </h1>
            <p className="text-muted text-lg max-w-2xl mx-auto">
              A selection of projects we&apos;ve built for clients across our
              focus areas. Each one designed to convert.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.title}
                className={`
                  relative overflow-hidden
                  bg-surface border border-border rounded-xl
                  transition-all duration-500 ease-out
                  hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/5
                  group cursor-default
                  ${project.hoverBorder}
                `}
              >
                {/* Animated gradient header */}
                <div className="relative h-48 overflow-hidden">
                  <div
                    className={`
                      absolute inset-0 bg-gradient-to-br ${project.gradient}
                      transition-all duration-700
                      group-hover:scale-110
                    `}
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-surface-lighter" />

                  {/* Floating category badge */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-primary-light text-sm font-semibold px-4 py-1.5 rounded-full border border-primary-light/20 bg-surface/40 backdrop-blur-sm transition-all duration-500 group-hover:scale-110 group-hover:border-primary-light/40 group-hover:bg-surface/60">
                      {project.category}
                    </span>
                  </div>

                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
                </div>

                <div className="relative p-6">
                  <h3 className="text-white font-semibold text-lg mb-2 transition-colors duration-300">
                    {project.title}
                  </h3>
                  <p className="text-muted text-sm mb-4 transition-colors duration-300 group-hover:text-slate-300">
                    {project.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-surface-lighter text-muted px-2.5 py-1 rounded-md transition-all duration-300 group-hover:bg-primary/10 group-hover:text-primary-light"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-primary/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative bg-surface py-24 overflow-hidden">
        <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-80 h-80 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl font-bold text-white mb-4">
            Want to See Your Project Here?
          </h2>
          <p className="text-muted text-lg mb-8">
            Let&apos;s talk about what we can build for you.
          </p>
          <Link
            href="/contact"
            className="relative inline-block overflow-hidden bg-primary text-white px-8 py-3 rounded-lg font-semibold transition-all duration-500 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 group"
          >
            <span className="relative z-10">Get a Free Quote</span>
            <div className="absolute inset-0 bg-gradient-to-r from-primary-dark via-primary to-primary-light opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </Link>
        </div>
      </section>
    </div>
  );
}
