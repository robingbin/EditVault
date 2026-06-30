import React, { useEffect, useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

export default function NotificationsBell() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);

  const load = async () => {
    try { setItems(await fetchNotifications(20)); } catch { /* ignore */ }
  };

  useEffect(() => {
    if (!user) return;
    load();
    const channel = supabase
      .channel('notif-' + user.id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${user.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const unread = items.filter((n) => !n.read).length;

  const onRead = async (id) => { await markNotificationRead(id); load(); };
  const onReadAll = async () => { await markAllNotificationsRead(); load(); };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative w-9 h-9 rounded-lg border border-[#243334] bg-[#0f1819] text-[#d6e7e6] hover:bg-[#152223] inline-flex items-center justify-center transition-colors">
          <Bell className="w-4 h-4" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#2dd4bf] text-[#0a1f1d] text-[10px] font-bold flex items-center justify-center">{unread}</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[340px] p-0 bg-[#0d1516] border border-[#142021] text-[#e6f7f6]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#142021]">
          <span className="font-semibold text-sm">Notifications</span>
          {unread > 0 && <button onClick={onReadAll} className="text-[12px] text-[#2dd4bf] hover:underline">Mark all read</button>}
        </div>
        <div className="max-h-[380px] overflow-y-auto">
          {items.length === 0 ? (
            <div className="px-4 py-8 text-center text-[#7c8d8e] text-sm">No notifications.</div>
          ) : items.map((n) => (
            <div key={n.id} className={`px-4 py-3 border-b border-[#101a1b] last:border-b-0 ${!n.read ? 'bg-[#0e1819]' : ''}`}>
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <div className="text-sm font-medium text-[#e6f7f6]">{n.title}</div>
                  {n.body && <div className="text-[12.5px] text-[#8aa0a1] mt-0.5">{n.body}</div>}
                  <div className="text-[11px] text-[#3f5152] mt-1">{new Date(n.created_at).toLocaleString()}</div>
                </div>
                {!n.read && (
                  <button onClick={() => onRead(n.id)} className="w-6 h-6 rounded-md flex items-center justify-center text-[#2dd4bf] hover:bg-[#0e2624]"><Check className="w-3.5 h-3.5" /></button>
                )}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
