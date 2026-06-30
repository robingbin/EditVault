import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function Layout() {
  return (
    <div className="min-h-screen bg-[#0a0e0f] text-[#e6f7f6] flex">
      <Sidebar />
      <main className="flex-1 min-h-screen overflow-x-hidden">
        <div className="max-w-6xl mx-auto px-8 py-10">
          <Outlet />
        </div>
        <RorkBadge />
      </main>
    </div>
  );
}

function RorkBadge() {
  return (
    <div className="fixed bottom-3 right-3 z-50">
      <div className="flex items-center gap-2 bg-[#0f1718]/90 backdrop-blur border border-[#1a2526] text-[#7c8d8e] text-xs px-3 py-1.5 rounded-full">
        <span>Built with</span>
        <span className="inline-flex items-center gap-1 text-[#e6f7f6]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2dd4bf]" />
          EditVault
        </span>
      </div>
    </div>
  );
}
