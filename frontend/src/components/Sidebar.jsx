import React from "react";
import { NavLink } from "react-router-dom";
import { LayoutGrid, Users, Monitor, Clapperboard } from "lucide-react";
import { cn } from "../lib/utils";

const items = [
  { to: "/", label: "Dashboard", icon: LayoutGrid, end: true },
  { to: "/clients", label: "Clients", icon: Users },
  { to: "/portal", label: "Client Portal", icon: Monitor },
];

export default function Sidebar() {
  return (
    <aside className="w-[200px] shrink-0 border-r border-[#101a1b] bg-[#0a1112] min-h-screen flex flex-col">
      {/* Logo */}
      <div className="px-5 pt-6 pb-8 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#2dd4bf] flex items-center justify-center shadow-[0_0_22px_-4px_rgba(45,212,191,0.55)]">
          <Clapperboard className="w-5 h-5 text-[#0a1f1d]" strokeWidth={2.5} />
        </div>
        <span className="text-[15px] font-semibold tracking-tight text-[#e6f7f6]">EditVault</span>
      </div>

      {/* Nav */}
      <nav className="px-3 flex-1 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                  isActive
                    ? "bg-[#0e2624] text-[#2dd4bf] border border-[#143a37]"
                    : "text-[#8aa0a1] hover:text-[#e6f7f6] hover:bg-[#0e1819] border border-transparent"
                )
              }
            >
              <Icon className="w-[18px] h-[18px]" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="px-5 py-4 text-[11px] text-[#3f5152] uppercase tracking-wide">
        Video Editor CRM
      </div>
    </aside>
  );
}
