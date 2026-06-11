"use client";

import Link from "next/link";
import { useState } from "react";
import { Bell, Menu, Plus, Search } from "lucide-react";

import { SidebarBrand, SidebarNav, SidebarUser } from "@/components/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { attorney } from "@/lib/mock-data";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b bg-background px-4 md:px-6">
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu />
            <span className="sr-only">Open menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 bg-zinc-900 p-0 [&>button]:text-white">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="flex h-full flex-col">
            <SidebarBrand />
            <SidebarNav onNavigate={() => setMenuOpen(false)} />
            <SidebarUser />
          </div>
        </SheetContent>
      </Sheet>

      <div className="relative hidden w-full max-w-sm sm:block">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search anything..."
          className="rounded-full pl-9"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button asChild>
          <Link href="/cases/new">
            <Plus data-icon="inline-start" />
            Add Case
          </Link>
        </Button>
        <Button variant="ghost" size="icon" className="relative">
          <Bell />
          <span className="absolute top-1 right-1 flex size-2 rounded-full bg-red-500" />
          <span className="sr-only">Notifications</span>
        </Button>
        <Avatar className="size-8">
          <AvatarFallback className="bg-indigo-100 text-xs font-medium text-indigo-700">
            {attorney.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
