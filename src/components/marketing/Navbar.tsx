"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
    <nav
      className={`fixed top-0 left-0 right-0 z-50 px-6 py-4 flex justify-between items-center transition-all duration-500 ${
        scrolled ? "glass-nav-scrolled" : "glass-nav"
      }`}
    >
      <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center font-bold italic text-white shadow-lg shadow-blue-900/50 transition-transform duration-300 group-hover:scale-105">
            MT
          </div>
          <span className="text-xl font-bold tracking-tight hidden sm:block">
            Mike Tintner{" "}
            <span className="text-blue-400">Productions</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
          {navLinks.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-link relative ${isActive ? "text-white" : ""}`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <Link
          href="/login"
          className="bg-white/10 hover:bg-white/20 border border-white/20 px-5 py-2 rounded-lg text-sm font-semibold transition-all"
        >
          Client Portal
        </Link>

        <button
          onClick={() => setOpen(!open)}
          className="md:hidden text-gray-300 hover:text-white transition-colors"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </nav>

    {/* Mobile menu */}
    <div
      className={`md:hidden fixed top-[57px] left-0 right-0 z-40 glass-nav-scrolled border-b border-white/10 overflow-hidden transition-all duration-500 ${
        open ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
      }`}
    >
      <div className="px-6 py-4 space-y-3">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setOpen(false)}
            className="block text-gray-300 hover:text-white transition-colors text-sm font-medium"
          >
            {link.label}
          </Link>
        ))}
        <Link
          href="/login"
          onClick={() => setOpen(false)}
          className="block bg-white/10 border border-white/20 text-white px-4 py-2 rounded-lg text-sm font-semibold text-center"
        >
          Client Portal
        </Link>
      </div>
    </div>
    </>
  );
}
