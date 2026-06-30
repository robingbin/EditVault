import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Monitor, Users, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { fetchPendingVideos, fetchRecentActivity, PENDING_STATUSES } from "../lib/api";
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
  const [payments, setPayments] = useState([]);
  const [activity, setActivity] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [clientsRes, pending, monthVideosRes, paymentsRes, act] = await Promise.all([
          supabase.from('clients').select('id'),
          fetchPendingVideos(),
          supabase.from('videos').select('*').eq('year', year).eq('month', month),
          supabase.from('payments').select('*, clients(name)').eq('year', year).eq('month', month),
          fetchRecentActivity(10),
        ]);
        if (cancelled) return;
        const clients = clientsRes.data || [];
        const monthVideos = monthVideosRes.data || [];
        const monthPayments = paymentsRes.data || [];
        const awaiting = monthVideos.filter((v) => ['Sent To Client','Client Review'].includes(v.status)).length;
        const billing = monthVideos.filter((v) => ['Client Approved','Posted'].includes(v.status)).reduce((a,v) => a + Number(v.amount || 0), 0);
        const pendingPay = monthPayments.filter((p) => p.status === 'Pending').reduce((a,p) => a + Number(p.total_amount || 0), 0);
        setStats({
          pendingWork: pending.length,
          awaitingClient: awaiting,
          activeClients: clients.length,
          thisMonthBilling: billing,
          pendingPayment: pendingPay,
        });
        setPendingVideos(pending);
        setPayments(monthPayments);
        setActivity(act);
      } finally {
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [year, month]);

  if (loading) return <div className="py-20 flex justify-center"><Loader2 className="w-6 h-6 text-[#2dd4bf] animate-spin" /></div>;

  const totalBilling = payments.reduce((a,p) => a + Number(p.total_amount || 0), 0);
  const received = payments.filter((p) => p.status === 'Paid').reduce((a,p) => a + Number(p.total_amount || 0), 0);
  const pendingTotal = totalBilling - received;

  return (
    <div className="space-y-10">
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-[#7c8d8e] mt-1 text-sm">Overview of your video editing workflow</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/admin/portal")} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#3b3a6b] bg-[#15152a] text-[#a8a5ff] hover:bg-[#1c1c38] transition-colors text-sm font-medium">
            <Monitor className="w-4 h-4" /> Client Portal <ArrowRight className="w-4 h-4" />
          </button>
          <button onClick={() => navigate("/admin/clients")} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#243334] bg-[#0f1819] text-[#e6f7f6] hover:bg-[#152223] transition-colors text-sm font-medium">
            <Users className="w-4 h-4" /> View Clients <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex gap-4 flex-wrap">
        <StatCard label="Pending Work" value={stats.pendingWork} color="text-amber-400" />
        <StatCard label="Awaiting Client" value={stats.awaitingClient} color="text-orange-400" />
        <StatCard label="Active Clients" value={stats.activeClients} color="text-teal-300" />
        <StatCard label="This Month Billing" value={`₹${stats.thisMonthBilling.toLocaleString()}`} color="text-cyan-400" />
        <StatCard label="Pending Payment" value={`₹${stats.pendingPayment.toLocaleString()}`} color="text-rose-400" />
      </div>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Pending Videos</h2>
          <span className="text-[12px] text-[#7c8d8e] bg-[#0f1819] border border-[#1a2526] px-2.5 py-1 rounded-full">{pendingVideos.length} videos</span>
        </div>
        <div className="rounded-xl border border-[#142021] bg-[#0c1314] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[12px] text-[#7c8d8e] border-b border-[#142021]">
                <th className="px-5 py-3 font-normal">Client</th>
                <th className="px-5 py-3 font-normal">Video</th>
                <th className="px-5 py-3 font-normal">Due Date</th>
                <th className="px-5 py-3 font-normal">Status</th>
                <th className="px-5 py-3 font-normal">Duration</th>
                <th className="px-5 py-3 font-normal">Type</th>
              </tr>
            </thead>
            <tbody>
              {pendingVideos.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-[#7c8d8e]">No pending videos. Statuses tracked: {PENDING_STATUSES.join(', ')}.</td></tr>
              ) : pendingVideos.map((v) => (
                <tr key={v.id} className="border-b border-[#101a1b] last:border-b-0 hover:bg-[#0f1819] transition-colors">
                  <td className="px-5 py-3.5"><Link to={`/admin/clients/${v.client_id}`} className="text-[#2dd4bf] hover:underline">{v.clients?.name}</Link></td>
                  <td className="px-5 py-3.5 text-[#d6e7e6]">{v.name}</td>
                  <td className="px-5 py-3.5 text-[#9bb0b1] font-mono-num">{v.due_date || `${MONTH_LABEL[v.month-1]} ${v.year}`}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={v.status} withDot /></td>
                  <td className="px-5 py-3.5 font-mono-num text-[#d6e7e6]">{v.duration}</td>
                  <td className="px-5 py-3.5 text-[#9bb0b1]">{v.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">Monthly Payments — {MONTH_LABEL[month-1]} {year}</h2>
        <div className="rounded-xl border border-[#142021] bg-[#0c1314] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[12px] text-[#7c8d8e] border-b border-[#142021]">
                <th className="px-5 py-3 font-normal">Client Name</th>
                <th className="px-5 py-3 font-normal">Month</th>
                <th className="px-5 py-3 font-normal">Total Amount</th>
                <th className="px-5 py-3 font-normal">Payment Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-10 text-center text-[#7c8d8e]">No payments recorded for this month.</td></tr>
              ) : payments.map((p) => (
                <tr key={p.id} className="border-b border-[#101a1b] last:border-b-0 hover:bg-[#0f1819] transition-colors">
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
