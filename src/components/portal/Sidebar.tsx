"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  ClipboardList,
  FileText,
  Receipt,
  MessageSquare,
  FolderOpen,
  FileSignature,
  Bell,
  Settings,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const links = [
  { href: "/portal", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/portal/notifications", icon: Bell, label: "Notifications" },
  { href: "/portal/work-orders", icon: ClipboardList, label: "Work Orders" },
  { href: "/portal/quotes", icon: FileText, label: "Quotes" },
  { href: "/portal/invoices", icon: Receipt, label: "Invoices" },
  { href: "/portal/messages", icon: MessageSquare, label: "Messages" },
  { href: "/portal/files", icon: FolderOpen, label: "Files" },
  { href: "/portal/contracts", icon: FileSignature, label: "Contracts" },
  { href: "/portal/settings", icon: Settings, label: "Settings" },
];

export function PortalSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-slate-900/80 border-r border-blue-900/50 flex flex-col z-40 backdrop-blur-sm">
      <div className="p-4 border-b border-blue-900/50">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/images/logo.png"
            alt="MTP"
            width={36}
            height={36}
          />
          <span className="text-white font-bold text-sm">Client Portal</span>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {links.map((link) => {
          const isActive =
            pathname === link.href ||
            (link.href !== "/portal" && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-600/20 text-blue-300"
                  : "text-muted hover:text-white hover:bg-blue-950/50"
              )}
            >
              <link.icon size={18} />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-blue-900/50">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted hover:text-white hover:bg-blue-950/50 transition-colors w-full"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
