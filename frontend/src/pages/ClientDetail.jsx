import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Phone, Mail, Wallet, Calendar, FileText, CheckCircle2, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { fetchClient, fetchVideosForClientPeriod, createVideo, updateVideo, deleteVideo, markMonthPaid, createInvoice, upsertPayment } from "../lib/api";
import Avatar from "../components/Avatar";
import StatusBadge from "../components/StatusBadge";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const EDITOR_STATUS = ["Not Started", "In Progress", "Done"];
const CLIENT_STATUS = ["", "Approved", "Correction", "Rejected", "Posted"];
const VIDEO_TYPES = ["Reel", "Advertisement", "Intro", "YouTube", "Other"];

function VideoForm({ open, onOpenChange, initial, clientId, year, month, onSaved }) {
  const isEdit = !!initial;
  const [form, setForm] = useState({ name: '', duration: '00:00', type: 'Reel', version: 'V1', editor_status: 'Not Started', client_status: '', date: '', amount: 0 });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(initial
        ? { name: initial.name, duration: initial.duration, type: initial.type, version: initial.version, editor_status: initial.editor_status, client_status: initial.client_status || '', date: initial.date || '', amount: initial.amount }
        : { name: '', duration: '00:00', type: 'Reel', version: 'V1', editor_status: 'Not Started', client_status: '', date: '', amount: 0 });
    }
  }, [open, initial]);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...form, amount: Number(form.amount) || 0, client_status: form.client_status || null, date: form.date || null };
      if (isEdit) await updateVideo(initial.id, payload);
      else await createVideo({ ...payload, client_id: clientId, year, month });
      toast.success(isEdit ? 'Video updated' : 'Video added');
      onSaved();
      onOpenChange(false);
    } catch (err) { toast.error(err.message || 'Failed to save'); }
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0d1516] border border-[#142021] text-[#e6f7f6] max-w-lg">
        <DialogHeader><DialogTitle>{isEdit ? 'Edit Video' : 'Add Video'}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="grid grid-cols-2 gap-3">
          <FieldText label="Video Name" value={form.name} onChange={set('name')} required full />
          <FieldText label="Duration (mm:ss)" value={form.duration} onChange={set('duration')} placeholder="01:20" />
          <FieldText label="Version" value={form.version} onChange={set('version')} placeholder="V1" />
          <FieldSelect label="Type" value={form.type} onChange={set('type')} options={VIDEO_TYPES} />
          <FieldText label="Date" value={form.date} onChange={set('date')} placeholder="15 Jun" />
          <FieldSelect label="Editor Status" value={form.editor_status} onChange={set('editor_status')} options={EDITOR_STATUS} />
          <FieldSelect label="Client Status" value={form.client_status} onChange={set('client_status')} options={CLIENT_STATUS} renderItem={(o) => o || '— None —'} />
          <FieldText label="Amount (₹)" type="number" value={form.amount} onChange={set('amount')} />
          <DialogFooter className="col-span-2 pt-2">
            <button type="button" onClick={() => onOpenChange(false)} className="px-4 py-2 rounded-lg border border-[#243334] bg-[#0f1819] text-[#d6e7e6] hover:bg-[#152223] text-sm">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 rounded-lg bg-[#2dd4bf] text-[#0a1f1d] font-medium hover:bg-[#3ee0cb] disabled:opacity-60 text-sm inline-flex items-center gap-2">
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}{isEdit ? 'Save' : 'Add'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
function FieldText({ label, value, onChange, type='text', placeholder, required, full }) {
  return (
    <label className={full ? 'col-span-2 block' : 'block'}>
      <span className="block text-[12px] text-[#8aa0a1] mb-1.5">{label}</span>
      <input type={type} value={value} placeholder={placeholder} required={required} onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg bg-[#0a1112] border border-[#243334] text-[#e6f7f6] placeholder-[#3f5152] outline-none focus:border-[#2dd4bf] focus:ring-2 focus:ring-[#2dd4bf]/20" />
    </label>
  );
}
function FieldSelect({ label, value, onChange, options, renderItem }) {
  return (
    <label className="block">
      <span className="block text-[12px] text-[#8aa0a1] mb-1.5">{label}</span>
      <Select value={value || '__none__'} onValueChange={(v) => onChange(v === '__none__' ? '' : v)}>
        <SelectTrigger className="bg-[#0a1112] border border-[#243334] text-[#e6f7f6] h-[38px]"><SelectValue /></SelectTrigger>
        <SelectContent className="bg-[#0d1516] border border-[#243334] text-[#e6f7f6]">
          {options.map((o) => <SelectItem key={o || '__none__'} value={o || '__none__'}>{renderItem ? renderItem(o) : o}</SelectItem>)}
        </SelectContent>
      </Select>
    </label>
  );
}

export default function ClientDetail() {
  const { id } = useParams();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [client, setClient] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const c = await fetchClient(id);
      setClient(c);
      const vs = await fetchVideosForClientPeriod(id, year, month);
      setVideos(vs);
      // Fetch payment status (optional)
      const { supabase } = await import('../lib/supabaseClient');
      const { data: p } = await supabase.from('payments').select('*').eq('client_id', id).eq('year', year).eq('month', month).maybeSingle();
      setPaymentStatus(p);
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id, year, month]);

  const totalDuration = useMemo(() => {
    const sec = videos.reduce((a,v) => { const [m,s] = (v.duration||'00:00').split(':').map(Number); return a + (m*60+s); }, 0);
    return `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`;
  }, [videos]);
  const billable = videos.filter((v) => ['Posted','Approved'].includes(v.client_status));
  const billableCount = billable.length;
  const totalAmount = billable.reduce((a,v) => a + Number(v.amount||0), 0);

  const onDeleteVideo = async (v) => {
    if (!window.confirm(`Delete “${v.name}”?`)) return;
    try { await deleteVideo(v.id); toast.success('Deleted'); load(); } catch (e) { toast.error(e.message); }
  };

  const onMarkPaid = async () => {
    try {
      await markMonthPaid(id, year, month, totalAmount);
      toast.success('Month marked as paid');
      load();
    } catch (e) { toast.error(e.message); }
  };
  const onGenerateInvoice = async () => {
    try {
      const inv = await createInvoice(id, year, month, totalAmount);
      // also ensure payment row exists
      await upsertPayment({ client_id: id, year, month, total_amount: totalAmount, status: paymentStatus?.status || 'Pending' });
      toast.success(`Invoice ${inv.invoice_no} generated`);
      load();
    } catch (e) { toast.error(e.message); }
  };

  if (loading && !client) return <div className="py-20 flex justify-center"><Loader2 className="w-6 h-6 text-[#2dd4bf] animate-spin" /></div>;
  if (!client) return <div className="py-10"><Link to="/admin/clients" className="text-[#2dd4bf] inline-flex items-center gap-1.5"><ArrowLeft className="w-4 h-4" /> All Clients</Link><p className="mt-6 text-[#7c8d8e]">Client not found.</p></div>;

  return (
    <div className="space-y-7">
      <Link to="/admin/clients" className="inline-flex items-center gap-1.5 text-[13px] text-[#8aa0a1] hover:text-[#2dd4bf] transition-colors"><ArrowLeft className="w-4 h-4" /> All Clients</Link>

      <div className="rounded-2xl border border-[#142021] bg-[#0d1516] px-6 py-5">
        <div className="flex items-start justify-between gap-5 flex-wrap">
          <div className="flex items-center gap-5">
            <Avatar name={client.name} size={56} className="text-xl" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{client.name}</h1>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[13px] text-[#8aa0a1] mt-1.5">
                {client.phone && <span className="inline-flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /><span className="font-mono-num">{client.phone}</span></span>}
                <span className="inline-flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{client.email}</span>
                <span className="inline-flex items-center gap-1.5"><Wallet className="w-3.5 h-3.5 text-teal-400" /><span className="text-teal-300 font-medium font-mono-num">₹{Number(client.monthly_fee).toLocaleString()}/month</span></span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#243334] bg-[#0f1819] text-[#d6e7e6] hover:bg-[#152223] text-sm transition-colors"><Calendar className="w-4 h-4" /> Calendar</button>
            <button onClick={onGenerateInvoice} className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#243334] bg-[#0f1819] text-[#d6e7e6] hover:bg-[#152223] text-sm transition-colors"><FileText className="w-4 h-4" /> Generate Invoice</button>
            <button onClick={onMarkPaid} className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#2dd4bf] text-[#0a1f1d] font-medium hover:bg-[#3ee0cb] text-sm transition-colors"><CheckCircle2 className="w-4 h-4" />{paymentStatus?.status === 'Paid' ? 'Paid' : 'Mark Month as Paid'}</button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <button onClick={() => setYear(year - 1)} className="px-2 py-1 text-sm text-[#8aa0a1] hover:text-[#2dd4bf]">‹</button>
          <button className="px-3 py-1 rounded-md border border-[#1f5450] bg-[#0e2624] text-[#2dd4bf] text-sm font-mono-num">{year}</button>
          <button onClick={() => setYear(year + 1)} className="px-2 py-1 text-sm text-[#8aa0a1] hover:text-[#2dd4bf]">›</button>
        </div>
        <div className="flex gap-2 flex-wrap">
          {MONTHS.map((m, idx) => {
            const isActive = (idx + 1) === month;
            return (
              <button key={m} onClick={() => setMonth(idx + 1)} className={`px-3.5 py-1.5 rounded-md text-sm transition-colors ${isActive ? "bg-[#0e2624] text-[#2dd4bf] border border-[#1f5450]" : "text-[#8aa0a1] hover:text-[#e6f7f6] hover:bg-[#0f1819] border border-transparent"}`}>{m}</button>
            );
          })}
        </div>
      </div>

      <div>
        <button onClick={() => { setEditing(null); setFormOpen(true); }} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2dd4bf] text-[#0a1f1d] font-medium hover:bg-[#3ee0cb] text-sm transition-colors"><Plus className="w-4 h-4" /> Add Video</button>
      </div>

      <div className="rounded-xl border border-[#142021] bg-[#0c1314] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[12px] text-[#7c8d8e] border-b border-[#142021]">
              <th className="px-5 py-3 font-normal w-10">Sl.</th>
              <th className="px-5 py-3 font-normal">Video Name</th>
              <th className="px-5 py-3 font-normal">Duration</th>
              <th className="px-5 py-3 font-normal">Type</th>
              <th className="px-5 py-3 font-normal">Version</th>
              <th className="px-5 py-3 font-normal">Editor Status</th>
              <th className="px-5 py-3 font-normal">Client Status</th>
              <th className="px-5 py-3 font-normal">Date</th>
              <th className="px-5 py-3 font-normal">Amount</th>
              <th className="px-5 py-3 font-normal w-20"></th>
            </tr>
          </thead>
          <tbody>
            {videos.length === 0 ? (
              <tr><td colSpan={10} className="px-5 py-10 text-center text-[#7c8d8e]">No videos for this month. Click “Add Video”.</td></tr>
            ) : videos.map((v, idx) => (
              <tr key={v.id} className="border-b border-[#101a1b] last:border-b-0 hover:bg-[#0f1819] transition-colors">
                <td className="px-5 py-3.5 text-[#7c8d8e] font-mono-num">{idx + 1}</td>
                <td className="px-5 py-3.5 text-[#e6f7f6] font-medium">{v.name}</td>
                <td className="px-5 py-3.5 font-mono-num text-[#d6e7e6]">{v.duration}</td>
                <td className="px-5 py-3.5 text-[#9bb0b1]">{v.type}</td>
                <td className="px-5 py-3.5 text-[#9bb0b1] font-mono-num">{v.version}</td>
                <td className="px-5 py-3.5"><StatusBadge status={v.editor_status} withDot /></td>
                <td className="px-5 py-3.5"><StatusBadge status={v.client_status} /></td>
                <td className="px-5 py-3.5 text-[#9bb0b1] font-mono-num">{v.date || "—"}</td>
                <td className="px-5 py-3.5 font-mono-num text-[#d6e7e6]">₹{Number(v.amount).toLocaleString()}</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => { setEditing(v); setFormOpen(true); }} className="w-7 h-7 rounded-md flex items-center justify-center text-[#7c8d8e] hover:text-[#2dd4bf] hover:bg-[#0e2624] transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => onDeleteVideo(v)} className="w-7 h-7 rounded-md flex items-center justify-center text-[#7c8d8e] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Sum label="Total Videos" value={videos.length} />
        <Sum label="Total Duration" value={totalDuration} color="text-cyan-300" />
        <Sum label="Billable Videos" value={billableCount} />
        <Sum label="Total Amount" value={`₹${totalAmount.toLocaleString()}`} color="text-teal-300" />
      </div>

      <VideoForm open={formOpen} onOpenChange={setFormOpen} initial={editing} clientId={id} year={year} month={month} onSaved={load} />
    </div>
  );
}

function Sum({ label, value, color = 'text-[#e6f7f6]' }) {
  return (
    <div className="rounded-xl border border-[#142021] bg-[#0d1516] px-5 py-4 text-center">
      <div className="text-[12px] text-[#7c8d8e] mb-1">{label}</div>
      <div className={`text-2xl font-bold font-mono-num ${color}`}>{value}</div>
    </div>
  );
}
