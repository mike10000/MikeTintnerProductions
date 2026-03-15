"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { HeroCanvas } from "./HeroCanvas";

export function Hero() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <HeroCanvas />
      </div>

      <div
        className={`relative z-10 max-w-4xl mx-auto px-4 space-y-8 transition-all duration-1000 ${
          loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <h1 className="text-5xl md:text-8xl font-extrabold leading-tight tracking-tight">
          <span className="text-white">Websites That</span> <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 hero-text-glow italic">
            Grow & Convert
          </span>
        </h1>

        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
          We build high-performance digital experiences engineered to turn
          visitors into loyal customers. Specialized for{" "}
          <span className="text-white">environmental pioneers</span>,{" "}
          <span className="text-white">non-profits</span>, and{" "}
          <span className="text-white">sustainable businesses</span>.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/contact"
            className="w-full sm:w-auto px-8 py-4 rounded-xl text-lg font-bold bg-gradient-to-br from-blue-500 to-blue-600 text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/30 hover:brightness-110"
          >
            Free Consultation
          </Link>
          <Link
            href="/portfolio"
            className="w-full sm:w-auto px-8 py-4 rounded-xl text-lg font-semibold bg-white/5 border border-white/10 text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover:border-white/30"
          >
            View Our Work
          </Link>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div
        className={`absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50 transition-all duration-1000 delay-500 ${
          loaded ? "opacity-50" : "opacity-0"
        }`}
      >
        <div className="mouse-icon">
          <div className="mouse-wheel" />
        </div>
      </div>
    </section>
  );
}
