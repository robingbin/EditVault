import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LayoutGrid, Users, Monitor, Clapperboard, LogOut, ShieldCheck } from "lucide-react";
import { cn } from "../lib/utils";
import { useAuth } from "../context/AuthContext";

const adminItems = [
  { to: "/admin", label: "Dashboard", icon: LayoutGrid, end: true },
  { to: "/admin/clients", label: "Clients", icon: Users },
  { to: "/admin/portal", label: "Client Portal", icon: Monitor },
];
const clientItems = [
  { to: "/portal", label: "My Videos", icon: Monitor, end: true },
];

export default function Sidebar() {
  const { profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const items = isAdmin ? adminItems : clientItems;

  const onLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <aside className="w-[210px] shrink-0 border-r border-[#101a1b] bg-[#0a1112] min-h-screen flex flex-col">
      <div className="px-5 pt-6 pb-6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#2dd4bf] flex items-center justify-center shadow-[0_0_22px_-4px_rgba(45,212,191,0.55)]">
          <Clapperboard className="w-5 h-5 text-[#0a1f1d]" strokeWidth={2.5} />
        </div>
        <span className="text-[15px] font-semibold tracking-tight text-[#e6f7f6]">EditVault</span>
      </div>

      {/* Role badge */}
      <div className="px-5 pb-4">
        <div className={cn(
          "inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-[11px] font-medium",
          isAdmin
            ? "bg-[#0e2624] text-[#2dd4bf] border-[#1f5450]"
            : "bg-[#1c1c38] text-[#a8a5ff] border-[#2a2a55]"
        )}>
          <ShieldCheck className="w-3 h-3" /> {isAdmin ? 'Admin' : 'Client'}
        </div>
      </div>

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

      <div className="px-3 pb-4 space-y-2">
        <div className="px-3 py-2 rounded-lg bg-[#0d1516] border border-[#142021]">
          <div className="text-[11px] text-[#7c8d8e]">Signed in as</div>
          <div className="text-[12.5px] text-[#e6f7f6] font-medium truncate">{profile?.full_name || profile?.email}</div>
        </div>
        <button
          onClick={onLogout}
          className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-[#243334] bg-[#0f1819] text-[#d6e7e6] hover:bg-[#152223] text-sm transition-colors"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>
      <div className="px-5 py-3 text-[11px] text-[#3f5152] uppercase tracking-wide border-t border-[#101a1b]">
        Video Editor CRM
      </div>
    </aside>
  );
}
