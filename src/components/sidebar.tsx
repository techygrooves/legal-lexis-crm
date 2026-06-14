"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  Calendar,
  Contact,
  FileText,
  FolderClosed,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Scale,
  Settings,
  StickyNote,
  Users,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

// Derive avatar initials from the signed-in user's email (e.g.
// "jane.doe@firm.com" -> "JA"). Falls back to "U" for an empty value.
export function emailInitials(email: string) {
  const local = email.split("@")[0].replace(/[^a-zA-Z]/g, "");
  return (local.slice(0, 2) || "U").toUpperCase();
}

export const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Clients", href: "/clients", icon: Users },
  { label: "Cases", href: "/cases", icon: FolderClosed },
  { label: "Calendar", href: "/calendar", icon: Calendar },
  { label: "Tasks", href: "/tasks", icon: ListChecks },
  { label: "Documents", href: "/documents", icon: FileText },
  { label: "Notes", href: "/notes", icon: StickyNote },
  { label: "Contacts", href: "/contacts", icon: Contact },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
      {navItems.map((item) => {
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            title={item.label}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-white",
              active && "bg-indigo-600 text-white hover:bg-indigo-600"
            )}
          >
            <item.icon className="size-4.5 shrink-0" />
            <span className="lg:inline md:hidden">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function SidebarBrand() {
  return (
    <Link href="/" className="flex items-center gap-2.5 px-5 py-5">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white">
        <Scale className="size-4.5" />
      </span>
      <span className="text-lg font-semibold text-white lg:inline md:hidden">
        LegalCRM
      </span>
    </Link>
  );
}

export function SidebarUser({ userEmail }: { userEmail: string }) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3 border-t border-white/10 px-5 py-4 md:justify-center md:px-2 lg:justify-start lg:px-5">
      <Avatar className="size-8 md:hidden lg:flex">
        <AvatarFallback className="bg-zinc-700 text-xs text-white">
          {emailInitials(userEmail)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1 lg:block md:hidden">
        <p className="truncate text-sm font-medium text-white">
          {userEmail || "Signed in"}
        </p>
        <p className="text-xs text-zinc-400">Solo Attorney</p>
      </div>
      <button
        type="button"
        onClick={handleSignOut}
        disabled={signingOut}
        title="Log out"
        className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-50"
      >
        <LogOut className="size-4" />
        <span className="sr-only">Log out</span>
      </button>
    </div>
  );
}

export function Sidebar({ userEmail }: { userEmail: string }) {
  return (
    <aside className="sticky top-0 hidden h-svh w-16 shrink-0 flex-col bg-zinc-900 md:flex lg:w-60 dark:border-r dark:border-white/10">
      <SidebarBrand />
      <SidebarNav />
      <SidebarUser userEmail={userEmail} />
    </aside>
  );
}
