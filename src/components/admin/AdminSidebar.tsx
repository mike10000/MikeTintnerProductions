"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  FileText,
  Receipt,
  MessageSquare,
  Kanban,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", icon: LayoutDashboard, label: "Overview" },
  { href: "/admin/clients", icon: Users, label: "Clients" },
  { href: "/admin/work-orders", icon: ClipboardList, label: "Work Orders" },
  { href: "/admin/quotes", icon: FileText, label: "Quotes" },
  { href: "/admin/invoices", icon: Receipt, label: "Invoices" },
  { href: "/admin/messages", icon: MessageSquare, label: "Messages" },
  { href: "/admin/boards", icon: Kanban, label: "Task Boards" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-surface border-r border-border flex flex-col z-40">
      <div className="p-4 border-b border-border">
        <Link href="/admin" className="flex items-center gap-3">
          <Image
            src="/images/logo.png"
            alt="MTP"
            width={32}
            height={32}
            className="rounded-full"
          />
          <span className="text-white font-bold text-sm">Admin Dashboard</span>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {links.map((link) => {
          const isActive =
            pathname === link.href ||
            (link.href !== "/admin" && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary-light"
                  : "text-muted hover:text-white hover:bg-surface-light"
              )}
            >
              <link.icon size={18} />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border space-y-1">
        <Link
          href="/portal"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted hover:text-white hover:bg-surface-light transition-colors"
        >
          <LayoutDashboard size={18} />
          Client View
        </Link>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted hover:text-white hover:bg-surface-light transition-colors w-full"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
