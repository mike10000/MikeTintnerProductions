import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="bg-surface border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <Image
                src="/images/logo.png"
                alt="Mike Tintner Productions"
                width={36}
                height={36}
                className="rounded-full"
              />
              <span className="text-white font-bold text-lg">
                Mike Tintner Productions
              </span>
            </div>
            <p className="text-muted text-sm max-w-md">
              Affordable, high-quality websites that help small businesses,
              environmental organizations, non-profits, farms, and local
              musicians grow their presence online.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <div className="space-y-2">
              {[
                { href: "/services", label: "Services" },
                { href: "/portfolio", label: "Portfolio" },
                { href: "/about", label: "About" },
                { href: "/contact", label: "Contact" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block text-muted hover:text-white text-sm transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Client Portal</h3>
            <div className="space-y-2">
              <Link
                href="/login"
                className="block text-muted hover:text-white text-sm transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/login?tab=signup"
                className="block text-muted hover:text-white text-sm transition-colors"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center">
          <p className="text-muted text-sm">
            &copy; {new Date().getFullYear()} Mike Tintner Productions. All
            rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
