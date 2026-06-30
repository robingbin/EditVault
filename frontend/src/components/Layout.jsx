import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import NotificationsBell from './NotificationsBell';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { profile } = useAuth();
  return (
    <div className="min-h-screen bg-[#0a0e0f] text-[#e6f7f6] flex">
      <Sidebar />
      <main className="flex-1 min-h-screen overflow-x-hidden">
        {/* Topbar */}
        <div className="sticky top-0 z-30 bg-[#0a0e0f]/85 backdrop-blur border-b border-[#101a1b]">
          <div className="max-w-6xl mx-auto px-8 py-3 flex items-center justify-end gap-3">
            <span className="text-[12.5px] text-[#7c8d8e] hidden sm:inline">{profile?.full_name || profile?.email}</span>
            <NotificationsBell />
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-8 py-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
