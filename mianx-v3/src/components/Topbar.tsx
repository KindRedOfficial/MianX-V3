"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Crosshair, Menu, User, Rocket, Users } from "lucide-react";
import { useState } from "react";

const mobileNavItems = [
  { href: "/", label: "Home", icon: Crosshair },
  { href: "/missions", label: "Missions", icon: Rocket },
  { href: "/agents", label: "Workforce", icon: Users },
];

export default function Topbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="h-14 border-b border-border bg-surface flex items-center justify-between px-4 md:px-6 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button
            className="md:hidden p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href="/" className="flex items-center gap-2 md:hidden">
            <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
              <Crosshair className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold">
              MianX<span className="text-accent-light">.ai</span>
            </span>
          </Link>

          <span className="hidden md:block text-sm text-muted">
            {pathname === "/" ? "Command Center" : pathname.slice(1).replace(/\//g, " > ")}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center">
            <User className="w-4 h-4 text-accent-light" />
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 top-14 z-40 bg-background/95 backdrop-blur-sm">
          <nav className="flex flex-col p-4 gap-1">
            {mobileNavItems.map((item) => {
              const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm ${
                    isActive ? "bg-accent/10 text-accent-light" : "text-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </>
  );
}
