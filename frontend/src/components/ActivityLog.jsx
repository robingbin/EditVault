import React from 'react';
import StatusBadge from './StatusBadge';
import { Activity } from 'lucide-react';

const ACTION_LABEL = {
  video_created: 'Video created',
  video_deleted: 'Video deleted',
  status_changed: 'Status changed to',
};

export default function ActivityLog({ items = [], loading }) {
  return (
    <section>
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-[#2dd4bf]" /> Recent Activity</h2>
      <div className="rounded-xl border border-[#142021] bg-[#0c1314] overflow-hidden">
        {loading ? (
          <div className="px-5 py-10 text-center text-[#7c8d8e]">Loading…</div>
        ) : items.length === 0 ? (
          <div className="px-5 py-10 text-center text-[#7c8d8e]">No activity yet.</div>
        ) : (
          <ul className="divide-y divide-[#101a1b]">
            {items.map((a) => (
              <li key={a.id} className="px-5 py-3 flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-[#2dd4bf] mt-2 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-[#e6f7f6]">
                    <span className="text-[#9bb0b1]">{a.actor_role === 'admin' ? 'Admin' : 'Client'}</span>{' '}
                    <span>— {ACTION_LABEL[a.action] || a.action}</span>{' '}
                    {a.action === 'status_changed' ? <StatusBadge status={a.detail} /> : <span className="text-[#d6e7e6]">{a.detail}</span>}
                  </div>
                  <div className="text-[11.5px] text-[#7c8d8e] mt-0.5">
                    {a.clients?.name && <span>{a.clients.name} · </span>}{new Date(a.created_at).toLocaleString()}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
