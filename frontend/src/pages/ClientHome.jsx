import React, { useEffect, useMemo, useState } from "react";
import { Phone, Mail, Wallet, CheckCircle2, XCircle, RotateCcw, Play, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";
import Avatar from "../components/Avatar";
import StatusBadge from "../components/StatusBadge";
import { updateVideo } from "../lib/api";
import { toast } from "sonner";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function ClientHome() {
  const { clientRecord, refresh, user } = useAuth();
  const [videos, setVideos] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const load = async () => {
    if (!clientRecord?.id) { setLoading(false); return; }
    setLoading(true);
    const [{ data: vs }, { data: ps }] = await Promise.all([
      supabase.from('videos').select('*').eq('client_id', clientRecord.id).order('created_at'),
      supabase.from('payments').select('*').eq('client_id', clientRecord.id).order('year', { ascending: false }).order('month', { ascending: false }),
    ]);
    setVideos(vs || []);
    setPayments(ps || []);
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [clientRecord?.id]);

  const periodVideos = useMemo(() => videos.filter((v) => v.year === year && v.month === month), [videos, year, month]);
  const reviewVideos = periodVideos.filter((v) => v.editor_status === 'Done');
  const allMonths = useMemo(() => {
    const set = new Set();
    videos.forEach((v) => set.add(`${v.year}-${v.month}`));
    return [...set].map((k) => { const [y,m] = k.split('-').map(Number); return { year: y, month: m }; }).sort((a,b) => (b.year - a.year) || (b.month - a.month));
  }, [videos]);

  const setStatus = async (videoId, status) => {
    try {
      await updateVideo(videoId, { client_status: status });
      toast.success(`Marked as ${status}`);
      load();
    } catch (e) { toast.error(e.message); }
  };

  if (loading) return <div className="py-20 flex justify-center"><Loader2 className="w-6 h-6 text-[#2dd4bf] animate-spin" /></div>;

  if (!clientRecord) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-4">
        <h1 className="text-2xl font-bold">Welcome{user?.email ? `, ${user.email}` : ''}</h1>
        <p className="text-[#8aa0a1] text-sm">Your account is not linked to a client record yet. This usually means the admin hasn’t added a client with your email (<span className="text-[#e6f7f6] font-mono-num">{user?.email}</span>) yet.</p>
        <p className="text-[#8aa0a1] text-sm">Please ask your editor to add you, then click below.</p>
        <button onClick={refresh} className="px-4 py-2 rounded-lg bg-[#2dd4bf] text-[#0a1f1d] font-medium hover:bg-[#3ee0cb] text-sm transition-colors">Refresh</button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-[#142021] bg-[#0d1516] px-6 py-5">
        <div className="flex items-center gap-5 flex-wrap">
          <Avatar name={clientRecord.name} size={56} className="text-xl" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{clientRecord.name}</h1>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[13px] text-[#8aa0a1] mt-1.5">
              {clientRecord.phone && <span className="inline-flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /><span className="font-mono-num">{clientRecord.phone}</span></span>}
              <span className="inline-flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{clientRecord.email}</span>
              <span className="inline-flex items-center gap-1.5"><Wallet className="w-3.5 h-3.5 text-teal-400" /><span className="text-teal-300 font-medium font-mono-num">₹{Number(clientRecord.monthly_fee).toLocaleString()}/month</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* Month selector */}
      {allMonths.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {allMonths.map(({ year: y, month: m }) => {
            const isActive = y === year && m === month;
            return (
              <button key={`${y}-${m}`} onClick={() => { setYear(y); setMonth(m); }} className={`px-3.5 py-1.5 rounded-md text-sm transition-colors ${isActive ? 'bg-[#0e2624] text-[#2dd4bf] border border-[#1f5450]' : 'text-[#8aa0a1] hover:text-[#e6f7f6] hover:bg-[#0f1819] border border-transparent'}`}>{MONTHS[m-1]} {y}</button>
            );
          })}
        </div>
      )}

      {/* Videos awaiting review */}
      <section>
        <h2 className="text-lg font-bold mb-3">Videos to review</h2>
        {reviewVideos.length === 0 ? (
          <div className="rounded-xl border border-[#142021] bg-[#0d1516] px-5 py-10 text-center text-[#7c8d8e]">No videos available for {MONTHS[month-1]} {year}.</div>
        ) : (
          <div className="space-y-3">
            {reviewVideos.map((v) => (
              <div key={v.id} className="rounded-xl border border-[#142021] bg-[#0d1516] px-5 py-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="w-12 h-12 rounded-lg bg-[#0e2624] border border-[#143a37] flex items-center justify-center shrink-0">
                    <Play className="w-5 h-5 text-[#2dd4bf]" fill="currentColor" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-[#e6f7f6]">{v.name}</div>
                    <div className="flex items-center gap-3 mt-1 text-[12px] text-[#8aa0a1]">
                      <span className="font-mono-num">{v.duration}</span><span>•</span><span>{v.type}</span><span>•</span><span className="font-mono-num">{v.version}</span>
                    </div>
                  </div>
                  <StatusBadge status={v.client_status} />
                </div>
                <div className="flex items-center gap-2 mt-4 flex-wrap">
                  <button onClick={() => setStatus(v.id, 'Approved')} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 text-xs font-medium transition-colors"><CheckCircle2 className="w-3.5 h-3.5" /> Approve</button>
                  <button onClick={() => setStatus(v.id, 'Correction')} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-orange-500/10 text-orange-300 border border-orange-500/30 hover:bg-orange-500/20 text-xs font-medium transition-colors"><RotateCcw className="w-3.5 h-3.5" /> Request Correction</button>
                  <button onClick={() => setStatus(v.id, 'Rejected')} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20 text-xs font-medium transition-colors"><XCircle className="w-3.5 h-3.5" /> Reject</button>
                  <button onClick={() => setStatus(v.id, 'Posted')} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-teal-500/10 text-teal-300 border border-teal-500/30 hover:bg-teal-500/20 text-xs font-medium transition-colors ml-auto">Mark as Posted</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* All my videos */}
      <section>
        <h2 className="text-lg font-bold mb-3">All videos — {MONTHS[month-1]} {year}</h2>
        <div className="rounded-xl border border-[#142021] bg-[#0c1314] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[12px] text-[#7c8d8e] border-b border-[#142021]">
                <th className="px-5 py-3 font-normal">Video</th>
                <th className="px-5 py-3 font-normal">Duration</th>
                <th className="px-5 py-3 font-normal">Type</th>
                <th className="px-5 py-3 font-normal">Editor</th>
                <th className="px-5 py-3 font-normal">My Status</th>
              </tr>
            </thead>
            <tbody>
              {periodVideos.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-[#7c8d8e]">No videos this month.</td></tr>
              ) : periodVideos.map((v) => (
                <tr key={v.id} className="border-b border-[#101a1b] last:border-b-0 hover:bg-[#0f1819] transition-colors">
                  <td className="px-5 py-3.5 text-[#e6f7f6]">{v.name}</td>
                  <td className="px-5 py-3.5 font-mono-num text-[#d6e7e6]">{v.duration}</td>
                  <td className="px-5 py-3.5 text-[#9bb0b1]">{v.type}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={v.editor_status} withDot /></td>
                  <td className="px-5 py-3.5"><StatusBadge status={v.client_status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Payments */}
      <section>
        <h2 className="text-lg font-bold mb-3">My Payments</h2>
        <div className="rounded-xl border border-[#142021] bg-[#0c1314] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[12px] text-[#7c8d8e] border-b border-[#142021]">
                <th className="px-5 py-3 font-normal">Month</th>
                <th className="px-5 py-3 font-normal">Amount</th>
                <th className="px-5 py-3 font-normal">Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr><td colSpan={3} className="px-5 py-10 text-center text-[#7c8d8e]">No payment records yet.</td></tr>
              ) : payments.map((p) => (
                <tr key={p.id} className="border-b border-[#101a1b] last:border-b-0 hover:bg-[#0f1819] transition-colors">
                  <td className="px-5 py-3.5 text-[#9bb0b1]">{MONTHS[p.month-1]} {p.year}</td>
                  <td className="px-5 py-3.5 font-mono-num text-[#d6e7e6]">₹{Number(p.total_amount).toLocaleString()}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={p.status} withDot /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
