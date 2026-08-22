"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Crosshair, Rocket, Users, ShieldCheck, Package, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/admin", label: "Command Center", icon: Crosshair },
  { href: "/admin/missions", label: "Missions", icon: Rocket },
  { href: "/admin/agents", label: "AI Workforce", icon: Users },
  { href: "/admin/trust", label: "Trust Center", icon: ShieldCheck },
  { href: "/admin/packs", label: "Packs", icon: Package },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`hidden md:flex flex-col border-r border-border bg-surface transition-all duration-300 ease-in-out ${collapsed ? "w-16" : "w-56"}`}>
      <div className="flex items-center gap-2 px-4 h-14 border-b border-border">
        <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
          <Crosshair className="w-4 h-4 text-white" />
        </div>
        {!collapsed && <span className="text-sm font-semibold tracking-tight whitespace-nowrap">MianX<span className="text-accent-light">.ai</span></span>}
      </div>
      <nav className="flex-1 py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? "bg-accent/10 text-accent-light" : "text-muted hover:text-foreground hover:bg-surface-hover"}`} title={collapsed ? item.label : undefined}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="px-2 pb-4">
        <button onClick={() => setCollapsed(!collapsed)} className="flex items-center justify-center w-full py-2 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-colors">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}
