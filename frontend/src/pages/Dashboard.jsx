import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Monitor, Users, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { fetchPendingVideos, fetchRecentActivity, fetchCorrectionQueue, fetchRejectedVideos, PENDING_EDITOR } from "../lib/api";
import StatusBadge from "../components/StatusBadge";
import ActivityLog from "../components/ActivityLog";

const MONTH_LABEL = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function StatCard({ label, value, color = "text-[#e6f7f6]" }) {
  return (
    <div className="flex-1 min-w-[160px] rounded-xl border border-[#142021] bg-[#0d1516] px-5 py-4">
      <div className="text-[12px] text-[#7c8d8e] mb-1.5">{label}</div>
      <div className={`text-3xl font-bold font-mono-num ${color}`}>{value}</div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ pendingWork: 0, awaitingClient: 0, activeClients: 0, thisMonthBilling: 0, pendingPayment: 0 });
  const [pendingVideos, setPendingVideos] = useState([]);
  const [corrections, setCorrections] = useState([]);
  const [rejected, setRejected] = useState([]);
  const [payments, setPayments] = useState([]);
  const [activity, setActivity] = useState([]);
  const [schemaErrors, setSchemaErrors] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const r = await Promise.allSettled([
        supabase.from('clients').select('id').eq('active', true),
        fetchPendingVideos(),
        fetchCorrectionQueue(),
        fetchRejectedVideos(),
        supabase.from('videos').select('*').eq('year', year).eq('month', month),
        supabase.from('payments').select('*, clients(name)').eq('year', year).eq('month', month),
        fetchRecentActivity(10),
      ]);
      if (cancelled) return;
      const [clientsR, pendingR, corrR, rejR, monthVR, paysR, actR] = r;
      const errs = [];
      const clients = clientsR.status === 'fulfilled' ? (clientsR.value.data || []) : (errs.push(`clients: ${clientsR.reason?.message || clientsR.value?.error?.message}`), []);
      const pending = pendingR.status === 'fulfilled' ? pendingR.value : (errs.push(`videos: ${pendingR.reason?.message}`), []);
      const corrList = corrR.status === 'fulfilled' ? corrR.value : [];
      const rejList = rejR.status === 'fulfilled' ? rejR.value : [];
      const monthVideos = monthVR.status === 'fulfilled' ? (monthVR.value.data || []) : [];
      const monthPayments = paysR.status === 'fulfilled' ? (paysR.value.data || []) : [];
      const act = actR.status === 'fulfilled' ? actR.value : (errs.push(`activity_log: ${actR.reason?.message}`), []);
      const awaiting = monthVideos.filter((v) => v.editor_status === 'Sent To Client' && v.client_status === 'Pending Review').length;
      const billing = monthVideos.filter((v) => v.client_status === 'Approved' && v.client_locked).reduce((a,v) => a + Number(v.amount || 0), 0);
      const pendingPay = monthPayments.filter((p) => p.status === 'Pending').reduce((a,p) => a + Number(p.total_amount || 0), 0);
      setStats({ pendingWork: pending.length, awaitingClient: awaiting, activeClients: clients.length, thisMonthBilling: billing, pendingPayment: pendingPay });
      setPendingVideos(pending); setCorrections(corrList); setRejected(rejList); setPayments(monthPayments); setActivity(act);
      if (errs.length) { console.warn('[Dashboard] Some queries failed:', errs); setSchemaErrors(errs); } else { setSchemaErrors([]); }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [year, month]);

  if (loading) return <div className="py-20 flex justify-center"><Loader2 className="w-6 h-6 text-[#2dd4bf] animate-spin" /></div>;

  const totalBilling = payments.reduce((a,p) => a + Number(p.total_amount || 0), 0);
  const received = payments.filter((p) => p.status === 'Paid').reduce((a,p) => a + Number(p.total_amount || 0), 0);
  const pendingTotal = totalBilling - received;

  return (
    <div className="space-y-10">
      {schemaErrors.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-5 py-4 text-[13px] text-amber-200">
          <div className="font-semibold mb-1">Database schema not fully applied</div>
          <div className="text-amber-200/80">Please run <code className="font-mono text-amber-100">/app/supabase_schema.sql</code> in the Supabase SQL Editor. Failed:</div>
          <ul className="list-disc list-inside mt-1 text-amber-200/80">{schemaErrors.map((e, i) => <li key={i} className="font-mono text-[12px]">{e}</li>)}</ul>
        </div>
      )}
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-[#7c8d8e] mt-1 text-sm">Overview of your video editing workflow</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/admin/portal")} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#3b3a6b] bg-[#15152a] text-[#a8a5ff] hover:bg-[#1c1c38] text-sm font-medium"><Monitor className="w-4 h-4" /> Client Portal <ArrowRight className="w-4 h-4" /></button>
          <button onClick={() => navigate("/admin/clients")} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#243334] bg-[#0f1819] text-[#e6f7f6] hover:bg-[#152223] text-sm font-medium"><Users className="w-4 h-4" /> View Clients <ArrowRight className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="flex gap-4 flex-wrap">
        <StatCard label="Pending Work" value={stats.pendingWork} color="text-amber-400" />
        <StatCard label="Awaiting Client" value={stats.awaitingClient} color="text-orange-400" />
        <StatCard label="Active Clients" value={stats.activeClients} color="text-teal-300" />
        <StatCard label="This Month Billing" value={`₹${stats.thisMonthBilling.toLocaleString()}`} color="text-cyan-400" />
        <StatCard label="Pending Payment" value={`₹${stats.pendingPayment.toLocaleString()}`} color="text-rose-400" />
      </div>

      <VideoTable title="Pending Videos" subtitle={`Editor status: ${PENDING_EDITOR.join(' or ')}`} videos={pendingVideos} statusField="editor_status" />

      {corrections.length > 0 && (
        <VideoTable title="Correction Queue" subtitle="Clients requested corrections — admin action needed" videos={corrections} statusField="editor_status" />
      )}
      {rejected.length > 0 && (
        <VideoTable title="Rejected Videos" subtitle="Rejected by clients — edit / replace / resend" videos={rejected} statusField="editor_status" />
      )}

      <section>
        <h2 className="text-xl font-bold mb-4">Monthly Payment Summary — {MONTH_LABEL[month-1]} {year}</h2>
        <div className="rounded-xl border border-[#142021] bg-[#0c1314] overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-[12px] text-[#7c8d8e] border-b border-[#142021]">
              <th className="px-5 py-3 font-normal">Client Name</th><th className="px-5 py-3 font-normal">Month</th><th className="px-5 py-3 font-normal">Total Amount</th><th className="px-5 py-3 font-normal">Payment Status</th>
            </tr></thead>
            <tbody>
              {payments.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-10 text-center text-[#7c8d8e]">No payments recorded for this month.</td></tr>
              ) : payments.map((p) => (
                <tr key={p.id} className="border-b border-[#101a1b] last:border-b-0 hover:bg-[#0f1819]">
                  <td className="px-5 py-3.5"><Link to={`/admin/clients/${p.client_id}`} className="text-[#2dd4bf] hover:underline">{p.clients?.name}</Link></td>
                  <td className="px-5 py-3.5 text-[#9bb0b1]">{MONTH_LABEL[p.month-1]} {p.year}</td>
                  <td className="px-5 py-3.5 font-mono-num text-[#d6e7e6]">₹{Number(p.total_amount).toLocaleString()}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={p.status} withDot /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <div className="rounded-xl border border-[#142021] bg-[#0d1516] px-5 py-4 text-center"><div className="text-[12px] text-[#7c8d8e] mb-1">Total Billing</div><div className="text-2xl font-bold font-mono-num text-[#e6f7f6]">₹{totalBilling.toLocaleString()}</div></div>
          <div className="rounded-xl border border-[#142021] bg-[#0d1516] px-5 py-4 text-center"><div className="text-[12px] text-[#7c8d8e] mb-1">Received</div><div className="text-2xl font-bold font-mono-num text-emerald-400">₹{received.toLocaleString()}</div></div>
          <div className="rounded-xl border border-[#142021] bg-[#0d1516] px-5 py-4 text-center"><div className="text-[12px] text-[#7c8d8e] mb-1">Pending</div><div className="text-2xl font-bold font-mono-num text-rose-400">₹{pendingTotal.toLocaleString()}</div></div>
        </div>
      </section>

      <ActivityLog items={activity} />
    </div>
  );
}

function VideoTable({ title, subtitle, videos }) {
  const MONTH_LABEL2 = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-xl font-bold">{title}</h2>
          {subtitle && <p className="text-[12px] text-[#7c8d8e] mt-0.5">{subtitle}</p>}
        </div>
        <span className="text-[12px] text-[#7c8d8e] bg-[#0f1819] border border-[#1a2526] px-2.5 py-1 rounded-full">{videos.length} videos</span>
      </div>
      <div className="rounded-xl border border-[#142021] bg-[#0c1314] overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-[12px] text-[#7c8d8e] border-b border-[#142021]">
            <th className="px-5 py-3 font-normal">Client</th><th className="px-5 py-3 font-normal">Video</th><th className="px-5 py-3 font-normal">Due Date</th>
            <th className="px-5 py-3 font-normal">Editor Status</th><th className="px-5 py-3 font-normal">Client Status</th><th className="px-5 py-3 font-normal">Type</th>
          </tr></thead>
          <tbody>
            {videos.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-[#7c8d8e]">Nothing here.</td></tr>
            ) : videos.map((v) => (
              <tr key={v.id} className="border-b border-[#101a1b] last:border-b-0 hover:bg-[#0f1819]">
                <td className="px-5 py-3.5"><Link to={`/admin/clients/${v.client_id}`} className="text-[#2dd4bf] hover:underline">{v.clients?.name}</Link></td>
                <td className="px-5 py-3.5 text-[#d6e7e6]">{v.name}</td>
                <td className="px-5 py-3.5 text-[#9bb0b1] font-mono-num">{v.due_date || `${MONTH_LABEL2[v.month-1]} ${v.year}`}</td>
                <td className="px-5 py-3.5"><StatusBadge status={v.editor_status} withDot /></td>
                <td className="px-5 py-3.5"><StatusBadge status={v.client_status} /></td>
                <td className="px-5 py-3.5 text-[#9bb0b1]">{v.type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
