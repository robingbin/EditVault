import React, { useEffect, useMemo, useState } from "react";
import { Phone, Mail, Wallet, CheckCircle2, RotateCcw, Play, Loader2, FileText, Lock } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";
import Avatar from "../components/Avatar";
import StatusBadge from "../components/StatusBadge";
import { setVideoStatus, fetchClientInvoices, CLIENT_VISIBLE } from "../lib/api";
import CorrectionForm from "../components/CorrectionForm";
import { toast } from "sonner";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function Section({ title, count, children }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold">{title}</h2>
        {typeof count === 'number' && <span className="text-[12px] text-[#7c8d8e] bg-[#0f1819] border border-[#1a2526] px-2 py-0.5 rounded-full">{count}</span>}
      </div>
      {children}
    </section>
  );
}

function VideoCard({ v, onAction }) {
  const isLocked = v.posted_locked || v.status === 'Posted';
  return (
    <div className="rounded-xl border border-[#142021] bg-[#0d1516] px-5 py-4">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="w-12 h-12 rounded-lg bg-[#0e2624] border border-[#143a37] flex items-center justify-center shrink-0">
          <Play className="w-5 h-5 text-[#2dd4bf]" fill="currentColor" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-[#e6f7f6] flex items-center gap-2">{v.name} {isLocked && <Lock className="w-3.5 h-3.5 text-[#7c8d8e]" />}</div>
          <div className="flex items-center gap-3 mt-1 text-[12px] text-[#8aa0a1]">
            <span className="font-mono-num">{v.duration}</span><span>•</span><span>{v.type}</span><span>•</span><span className="font-mono-num">{v.version}</span>
          </div>
        </div>
        <StatusBadge status={v.status} withDot />
      </div>
      {!isLocked && (
        <div className="flex items-center gap-2 mt-4 flex-wrap">
          {['Sent To Client','Client Review','Correction Requested'].includes(v.status) && (
            <button onClick={() => onAction(v, 'Client Approved')} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 text-xs font-medium"><CheckCircle2 className="w-3.5 h-3.5" /> Approve</button>
          )}
          {['Sent To Client','Client Review','Client Approved'].includes(v.status) && (
            <button onClick={() => onAction(v, 'Correction Requested')} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-orange-500/10 text-orange-300 border border-orange-500/30 hover:bg-orange-500/20 text-xs font-medium"><RotateCcw className="w-3.5 h-3.5" /> Request Correction</button>
          )}
          {v.status === 'Sent To Client' && (
            <button onClick={() => onAction(v, 'Client Review')} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/30 hover:bg-blue-500/20 text-xs font-medium">Start Review</button>
          )}
          {v.status === 'Client Approved' && (
            <button onClick={() => onAction(v, 'Posted')} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-teal-500/10 text-teal-300 border border-teal-500/30 hover:bg-teal-500/20 text-xs font-medium ml-auto">Mark as Posted</button>
          )}
        </div>
      )}
      {isLocked && <p className="mt-3 text-[12px] text-[#7c8d8e]">This video is locked. Contact your editor to make changes.</p>}
    </div>
  );
}

export default function ClientHome() {
  const { clientRecord, refresh, user } = useAuth();
  const [videos, setVideos] = useState([]);
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [correctionVideo, setCorrectionVideo] = useState(null);

  const load = async () => {
    if (!clientRecord?.id) { setLoading(false); return; }
    setLoading(true);
    try {
      const [{ data: vs }, { data: ps }, inv] = await Promise.all([
        supabase.from('videos').select('*').eq('client_id', clientRecord.id).in('status', CLIENT_VISIBLE).order('created_at', { ascending: false }),
        supabase.from('payments').select('*').eq('client_id', clientRecord.id).order('year', { ascending: false }).order('month', { ascending: false }),
        fetchClientInvoices(clientRecord.id),
      ]);
      setVideos(vs || []);
      setPayments(ps || []);
      setInvoices(inv);
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [clientRecord?.id]);

  const buckets = useMemo(() => ({
    waiting:   videos.filter((v) => ['Sent To Client','Client Review'].includes(v.status)),
    corrections: videos.filter((v) => v.status === 'Correction Requested'),
    approved:  videos.filter((v) => v.status === 'Client Approved'),
    posted:    videos.filter((v) => v.status === 'Posted'),
  }), [videos]);

  const onAction = async (v, status) => {
    if (status === 'Correction Requested') {
      setCorrectionVideo(v); setCorrectionOpen(true); return;
    }
    try { await setVideoStatus(v.id, status); toast.success(`Marked as ${status}`); load(); } catch (e) { toast.error(e.message); }
  };

  if (loading) return <div className="py-20 flex justify-center"><Loader2 className="w-6 h-6 text-[#2dd4bf] animate-spin" /></div>;

  if (!clientRecord) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-4">
        <h1 className="text-2xl font-bold">Welcome{user?.email ? `, ${user.email}` : ''}</h1>
        <p className="text-[#8aa0a1] text-sm">Your account isn’t linked to a client record yet. Ask your editor to add a client with email <span className="text-[#e6f7f6] font-mono-num">{user?.email}</span>, then click below.</p>
        <button onClick={refresh} className="px-4 py-2 rounded-lg bg-[#2dd4bf] text-[#0a1f1d] font-medium hover:bg-[#3ee0cb] text-sm">Refresh</button>
      </div>
    );
  }

  return (
    <div className="space-y-9">
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

      <Section title="Videos Waiting For Review" count={buckets.waiting.length}>
        {buckets.waiting.length === 0 ? <Empty msg="Nothing waiting for you right now." /> : (
          <div className="space-y-3">{buckets.waiting.map((v) => <VideoCard key={v.id} v={v} onAction={onAction} />)}</div>
        )}
      </Section>

      <Section title="Correction Requests" count={buckets.corrections.length}>
        {buckets.corrections.length === 0 ? <Empty msg="No corrections pending." /> : (
          <div className="space-y-3">{buckets.corrections.map((v) => <VideoCard key={v.id} v={v} onAction={onAction} />)}</div>
        )}
      </Section>

      <Section title="Approved Videos" count={buckets.approved.length}>
        {buckets.approved.length === 0 ? <Empty msg="No approved videos yet." /> : (
          <div className="space-y-3">{buckets.approved.map((v) => <VideoCard key={v.id} v={v} onAction={onAction} />)}</div>
        )}
      </Section>

      <Section title="Recently Posted" count={buckets.posted.length}>
        {buckets.posted.length === 0 ? <Empty msg="Nothing posted yet." /> : (
          <div className="space-y-3">{buckets.posted.map((v) => <VideoCard key={v.id} v={v} onAction={onAction} />)}</div>
        )}
      </Section>

      <Section title="Invoices" count={invoices.length}>
        {invoices.length === 0 ? <Empty msg="No invoices yet." /> : (
          <div className="rounded-xl border border-[#142021] bg-[#0c1314] overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-[12px] text-[#7c8d8e] border-b border-[#142021]"><th className="px-5 py-3 font-normal">Invoice No</th><th className="px-5 py-3 font-normal">Period</th><th className="px-5 py-3 font-normal">Amount</th><th className="px-5 py-3 font-normal">Date</th></tr></thead>
              <tbody>
                {invoices.map((i) => (
                  <tr key={i.id} className="border-b border-[#101a1b] last:border-b-0">
                    <td className="px-5 py-3 font-mono-num text-[#e6f7f6]"><FileText className="w-3.5 h-3.5 inline mr-2 text-[#2dd4bf]" />{i.invoice_no}</td>
                    <td className="px-5 py-3 text-[#9bb0b1]">{MONTHS[i.month-1]} {i.year}</td>
                    <td className="px-5 py-3 font-mono-num text-[#d6e7e6]">₹{Number(i.amount).toLocaleString()}</td>
                    <td className="px-5 py-3 text-[#9bb0b1]">{new Date(i.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="Payment Status" count={payments.length}>
        {payments.length === 0 ? <Empty msg="No payment records." /> : (
          <div className="rounded-xl border border-[#142021] bg-[#0c1314] overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-[12px] text-[#7c8d8e] border-b border-[#142021]"><th className="px-5 py-3 font-normal">Month</th><th className="px-5 py-3 font-normal">Amount</th><th className="px-5 py-3 font-normal">Status</th></tr></thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-[#101a1b] last:border-b-0">
                    <td className="px-5 py-3 text-[#9bb0b1]">{MONTHS[p.month-1]} {p.year}</td>
                    <td className="px-5 py-3 font-mono-num text-[#d6e7e6]">₹{Number(p.total_amount).toLocaleString()}</td>
                    <td className="px-5 py-3"><StatusBadge status={p.status} withDot /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <CorrectionForm open={correctionOpen} onOpenChange={setCorrectionOpen} video={correctionVideo} clientId={clientRecord.id} onSubmitted={load} />
    </div>
  );
}

function Empty({ msg }) {
  return <div className="rounded-xl border border-dashed border-[#243334] bg-[#0d1516] px-5 py-8 text-center text-[#7c8d8e] text-sm">{msg}</div>;
}
