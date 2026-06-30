import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import Avatar from "../components/Avatar";

export default function ClientPortal() {
  const [clients, setClients] = useState([]);
  const [pendingMap, setPendingMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: cs }, { data: vs }] = await Promise.all([
        supabase.from('clients').select('*').order('created_at', { ascending: true }),
        supabase.from('videos').select('client_id, editor_status, client_status'),
      ]);
      setClients(cs || []);
      const map = {};
      (vs || []).forEach((v) => {
        if (v.editor_status === 'Done' && !v.client_status) map[v.client_id] = (map[v.client_id] || 0) + 1;
      });
      setPendingMap(map);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-8">
      <div className="flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-xl bg-[#1c1c38] border border-[#2a2a55] flex items-center justify-center mb-4">
          <Users className="w-7 h-7 text-[#a8a5ff]" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Client Portal</h1>
        <p className="text-[#7c8d8e] mt-1 text-sm">Select a client to review videos awaiting feedback.</p>
      </div>

      {loading ? (
        <div className="py-10 flex justify-center"><Loader2 className="w-6 h-6 text-[#2dd4bf] animate-spin" /></div>
      ) : (
        <div className="space-y-3">
          {clients.map((c) => (
            <Link key={c.id} to={`/admin/portal/${c.id}`} className="card-row block rounded-xl border border-[#142021] bg-[#0d1516] px-4 py-3.5 hover:border-[#1f5450]">
              <div className="flex items-center gap-4">
                <Avatar name={c.name} size={40} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[#e6f7f6]">{c.name}</div>
                  <div className="text-[12.5px] text-[#8aa0a1]">{c.email}</div>
                </div>
                {pendingMap[c.id] > 0 && (
                  <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">{pendingMap[c.id]} pending</span>
                )}
                <ArrowRight className="w-5 h-5 text-[#3f5152]" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
