import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Phone, Mail, Wallet, FileText, CheckCircle2, Plus, Pencil, Trash2, Loader2, Unlock, Copy } from "lucide-react";
import { fetchClient, fetchVideosForClientPeriod, createVideo, updateVideo, deleteVideo, markMonthPaid, createInvoice, upsertPayment, fetchVideoTypes, createVideoType, EDITOR_STATUSES, CLIENT_STATUSES, setEditorStatus, setClientStatus, unlockClient, fetchCorrections, duplicatePreviousMonth, listClientPeriods, deleteClientPeriod } from "../lib/api";
import Avatar from "../components/Avatar";
import StatusBadge from "../components/StatusBadge";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function FieldText({ label, value, onChange, type='text', placeholder, required, full }) {
  return (
    <label className={full ? 'col-span-2 block' : 'block'}>
      <span className="block text-[12px] text-[#8aa0a1] mb-1.5">{label}</span>
      <input type={type} value={value ?? ''} placeholder={placeholder} required={required} onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg bg-[#0a1112] border border-[#243334] text-[#e6f7f6] placeholder-[#3f5152] outline-none focus:border-[#2dd4bf] focus:ring-2 focus:ring-[#2dd4bf]/20" />
    </label>
  );
}
function FieldSelect({ label, value, onChange, options, full }) {
  return (
    <label className={full ? 'col-span-2 block' : 'block'}>
      <span className="block text-[12px] text-[#8aa0a1] mb-1.5">{label}</span>
      <Select value={value || ''} onValueChange={onChange}>
        <SelectTrigger className="bg-[#0a1112] border border-[#243334] text-[#e6f7f6] h-[38px]"><SelectValue placeholder="Select…" /></SelectTrigger>
        <SelectContent className="bg-[#0d1516] border border-[#243334] text-[#e6f7f6]">
          {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
        </SelectContent>
      </Select>
    </label>
  );
}

function VideoForm({ open, onOpenChange, initial, clientId, year, month, onSaved, types, onTypeAdded }) {
  const isEdit = !!initial;
  const [form, setForm] = useState({ name: '', duration: '00:00', type: 'Instagram Reel', version: 'V1', editor_status: 'Not Started', client_status: 'Pending Review', due_date: '', amount: 0, posted_date: '' });
  const [submitting, setSubmitting] = useState(false);
  const [newType, setNewType] = useState('');
  useEffect(() => {
    if (open) {
      setForm(initial ? {
        name: initial.name, duration: initial.duration, type: initial.type, version: initial.version,
        editor_status: initial.editor_status, client_status: initial.client_status || 'Pending Review',
        due_date: initial.due_date || '', amount: initial.amount, posted_date: initial.posted_date || '',
      } : { name: '', duration: '00:00', type: types[0]?.name || 'Instagram Reel', version: 'V1', editor_status: 'Not Started', client_status: 'Pending Review', due_date: '', amount: 0, posted_date: '' });
      setNewType('');
    }
  }, [open, initial, types]);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const submit = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      const payload = { ...form, amount: Number(form.amount) || 0, due_date: form.due_date || null, posted_date: form.posted_date || null };
      if (isEdit) await updateVideo(initial.id, payload);
      else await createVideo({ ...payload, client_id: clientId, year, month });
      toast.success(isEdit ? 'Video updated' : 'Video added');
      onSaved(); onOpenChange(false);
    } catch (err) { toast.error(err.message || 'Failed to save'); }
    setSubmitting(false);
  };
  const addCustomType = async () => {
    if (!newType.trim()) return;
    try { const t = await createVideoType(newType.trim()); toast.success('Type added'); setNewType(''); onTypeAdded(); set('type')(t.name); } catch (e) { toast.error(e.message); }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0d1516] border border-[#142021] text-[#e6f7f6] max-w-lg">
        <DialogHeader><DialogTitle>{isEdit ? 'Edit Video' : 'Add Video'}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="grid grid-cols-2 gap-3">
          <FieldText label="Video Name" value={form.name} onChange={set('name')} required full />
          <FieldText label="Duration (mm:ss)" value={form.duration} onChange={set('duration')} placeholder="01:20" />
          <FieldText label="Last Version" value={form.version} onChange={set('version')} placeholder="V1" />
          <FieldSelect label="Type" value={form.type} onChange={set('type')} options={types.map(t=>t.name)} />
          <FieldText label="Due Date" type="date" value={form.due_date} onChange={set('due_date')} />
          <FieldSelect label="Editor Status" value={form.editor_status} onChange={set('editor_status')} options={EDITOR_STATUSES} />
          <FieldSelect label="Client Status" value={form.client_status} onChange={set('client_status')} options={CLIENT_STATUSES} />
          <FieldText label="Posted Date" type="date" value={form.posted_date} onChange={set('posted_date')} />
          <FieldText label="Amount (₹)" type="number" value={form.amount} onChange={set('amount')} />
          <div className="col-span-2 flex items-center gap-2 pt-1">
            <input value={newType} onChange={(e) => setNewType(e.target.value)} placeholder="Add custom video type…"
              className="flex-1 px-3 py-2 rounded-lg bg-[#0a1112] border border-[#243334] text-[#e6f7f6] text-[13px] outline-none focus:border-[#2dd4bf]" />
            <button type="button" onClick={addCustomType} className="px-3 py-2 rounded-lg border border-[#243334] bg-[#0f1819] text-[#d6e7e6] hover:bg-[#152223] text-[13px]">Add Type</button>
          </div>
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

function DuplicateMonthDialog({ open, onOpenChange, clientId, year, month, onDone }) {
  const [fromYear, setFromYear] = useState(year);
  const [fromMonth, setFromMonth] = useState(month - 1 || 12);
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    try {
      const n = await duplicatePreviousMonth(clientId, Number(fromYear), Number(fromMonth), year, month);
      toast.success(n ? `Copied ${n} video(s)` : 'No videos to copy');
      onDone(); onOpenChange(false);
    } catch (e) { toast.error(e.message); }
    setBusy(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0d1516] border border-[#142021] text-[#e6f7f6] max-w-md">
        <DialogHeader><DialogTitle>Duplicate videos into {MONTHS[month-1]} {year}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <FieldText label="From Year" type="number" value={fromYear} onChange={setFromYear} />
          <FieldSelect label="From Month" value={String(fromMonth)} onChange={(v)=>setFromMonth(Number(v))} options={MONTHS.map((m,i)=>String(i+1))} />
          <p className="text-[12px] text-[#8aa0a1]">All videos from the chosen month copy with Editor Status reset to <b>Not Started</b>.</p>
        </div>
        <DialogFooter>
          <button onClick={() => onOpenChange(false)} className="px-4 py-2 rounded-lg border border-[#243334] bg-[#0f1819] text-[#d6e7e6] hover:bg-[#152223] text-sm">Cancel</button>
          <button onClick={run} disabled={busy} className="px-4 py-2 rounded-lg bg-[#2dd4bf] text-[#0a1f1d] font-medium hover:bg-[#3ee0cb] disabled:opacity-60 text-sm inline-flex items-center gap-2">{busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}Duplicate</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
  const [types, setTypes] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [corrections, setCorrections] = useState([]);
  const [dupOpen, setDupOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const c = await fetchClient(id); setClient(c);
      const [vs, t, ps, cors] = await Promise.all([
        fetchVideosForClientPeriod(id, year, month), fetchVideoTypes(), listClientPeriods(id), fetchCorrections({ clientId: id }),
      ]);
      setVideos(vs); setTypes(t); setPeriods(ps); setCorrections(cors);
      const { supabase } = await import('../lib/supabaseClient');
      const { data: p } = await supabase.from('payments').select('*').eq('client_id', id).eq('year', year).eq('month', month).maybeSingle();
      setPaymentStatus(p);
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [id, year, month]);

  const totalDuration = useMemo(() => {
    const sec = videos.reduce((a,v) => { const [m,s] = (v.duration||'00:00').split(':').map(Number); return a + (m*60+s); }, 0);
    return `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`;
  }, [videos]);
  // Billable = Approved AND locked (i.e., posted date set)
  const billable = videos.filter((v) => v.client_status === 'Approved' && v.client_locked);
  const totalAmount = billable.reduce((a,v) => a + Number(v.amount||0), 0);

  const onDeleteVideo = async (v) => { if (!window.confirm(`Delete “${v.name}”?`)) return; try { await deleteVideo(v.id); toast.success('Deleted'); load(); } catch (e) { toast.error(e.message); } };
  const onMarkPaid = async () => { try { await markMonthPaid(id, year, month, totalAmount); toast.success('Month marked as paid'); load(); } catch (e) { toast.error(e.message); } };
  const onGenerateInvoice = async () => { try { const inv = await createInvoice(id, year, month, totalAmount); await upsertPayment({ client_id: id, year, month, total_amount: totalAmount, status: paymentStatus?.status || 'Pending' }); toast.success(`Invoice ${inv.invoice_no} generated`); load(); } catch (e) { toast.error(e.message); } };
  const onEditorStatus = async (v, val) => { try { await setEditorStatus(v.id, val); toast.success(`Editor → ${val}`); load(); } catch (e) { toast.error(e.message); } };
  const onClientStatus = async (v, val) => { try { await setClientStatus(v.id, { client_status: val, ...(val === 'Approved' ? {} : { posted_date: null }) }); toast.success(`Client → ${val}`); load(); } catch (e) { toast.error(e.message); } };
  const onPostedDate = async (v, date) => { try { await setClientStatus(v.id, { posted_date: date || null }); toast.success('Posted date saved'); load(); } catch (e) { toast.error(e.message); } };
  const onUnlock = async (v) => { if (!window.confirm('Unlock this video? Client can edit again.')) return; try { await unlockClient(v.id); toast.success('Unlocked'); load(); } catch (e) { toast.error(e.message); } };
  const onDeleteMonth = async () => { if (!window.confirm(`Delete ALL videos & payment for ${MONTHS[month-1]} ${year}?`)) return; try { await deleteClientPeriod(id, year, month); toast.success('Month deleted'); load(); } catch (e) { toast.error(e.message); } };

  if (loading && !client) return <div className="py-20 flex justify-center"><Loader2 className="w-6 h-6 text-[#2dd4bf] animate-spin" /></div>;
  if (!client) return <div className="py-10"><Link to="/admin/clients" className="text-[#2dd4bf] inline-flex items-center gap-1.5"><ArrowLeft className="w-4 h-4" /> All Clients</Link><p className="mt-6 text-[#7c8d8e]">Client not found.</p></div>;

  const years = [...new Set(periods.map((p) => p.year).concat([year]))].sort((a,b) => b - a);

  return (
    <div className="space-y-7">
      <Link to="/admin/clients" className="inline-flex items-center gap-1.5 text-[13px] text-[#8aa0a1] hover:text-[#2dd4bf]"><ArrowLeft className="w-4 h-4" /> All Clients</Link>

      <div className="rounded-2xl border border-[#142021] bg-[#0d1516] px-6 py-5">
        <div className="flex items-start justify-between gap-5 flex-wrap">
          <div className="flex items-center gap-5">
            <Avatar name={client.name} size={56} className="text-xl" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{client.name}{!client.active && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/30 align-middle">INACTIVE</span>}</h1>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[13px] text-[#8aa0a1] mt-1.5">
                {client.phone && <span className="inline-flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /><span className="font-mono-num">{client.phone}</span></span>}
                <span className="inline-flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{client.email}</span>
                <span className="inline-flex items-center gap-1.5"><Wallet className="w-3.5 h-3.5 text-teal-400" /><span className="text-teal-300 font-medium font-mono-num">₹{Number(client.monthly_fee).toLocaleString()}/month</span></span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={onGenerateInvoice} className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#243334] bg-[#0f1819] text-[#d6e7e6] hover:bg-[#152223] text-sm"><FileText className="w-4 h-4" /> Generate Invoice</button>
            <button onClick={onMarkPaid} className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#2dd4bf] text-[#0a1f1d] font-medium hover:bg-[#3ee0cb] text-sm"><CheckCircle2 className="w-4 h-4" />{paymentStatus?.status === 'Paid' ? 'Paid' : 'Mark Month as Paid'}</button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setYear(year - 1)} className="px-2 py-1 text-sm text-[#8aa0a1] hover:text-[#2dd4bf]">‹</button>
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="w-[100px] bg-[#0e2624] border border-[#1f5450] text-[#2dd4bf] h-8"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-[#0d1516] border border-[#243334] text-[#e6f7f6]">{years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}<SelectItem value={String(year + 1)}>{year + 1}</SelectItem></SelectContent>
          </Select>
          <button onClick={() => setYear(year + 1)} className="px-2 py-1 text-sm text-[#8aa0a1] hover:text-[#2dd4bf]">›</button>
          <span className="ml-2"></span>
          <button onClick={() => setDupOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#243334] bg-[#0f1819] text-[#d6e7e6] hover:bg-[#152223] text-[12.5px]"><Copy className="w-3.5 h-3.5" /> Duplicate Previous Month</button>
          <button onClick={onDeleteMonth} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/15 text-[12.5px]"><Trash2 className="w-3.5 h-3.5" /> Delete Month</button>
        </div>
        <div className="flex gap-2 flex-wrap">
          {MONTHS.map((m, idx) => {
            const isActive = (idx + 1) === month;
            return <button key={m} onClick={() => setMonth(idx + 1)} className={`px-3.5 py-1.5 rounded-md text-sm transition-colors ${isActive ? "bg-[#0e2624] text-[#2dd4bf] border border-[#1f5450]" : "text-[#8aa0a1] hover:text-[#e6f7f6] hover:bg-[#0f1819] border border-transparent"}`}>{m}</button>;
          })}
        </div>
      </div>

      <div><button onClick={() => { setEditing(null); setFormOpen(true); }} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2dd4bf] text-[#0a1f1d] font-medium hover:bg-[#3ee0cb] text-sm"><Plus className="w-4 h-4" /> Add Video</button></div>

      <div className="rounded-xl border border-[#142021] bg-[#0c1314] overflow-x-auto">
        <table className="w-full text-sm min-w-[1100px]">
          <thead>
            <tr className="text-left text-[12px] text-[#7c8d8e] border-b border-[#142021]">
              <th className="px-3 py-3 font-normal w-8">#</th>
              <th className="px-3 py-3 font-normal">Video</th>
              <th className="px-3 py-3 font-normal">Duration</th>
              <th className="px-3 py-3 font-normal">Type</th>
              <th className="px-3 py-3 font-normal">Ver.</th>
              <th className="px-3 py-3 font-normal">Editor Status</th>
              <th className="px-3 py-3 font-normal">Client Status</th>
              <th className="px-3 py-3 font-normal">Posted Date</th>
              <th className="px-3 py-3 font-normal">Due</th>
              <th className="px-3 py-3 font-normal">Amount</th>
              <th className="px-3 py-3 font-normal">Actions</th>
            </tr>
          </thead>
          <tbody>
            {videos.length === 0 ? (
              <tr><td colSpan={11} className="px-5 py-10 text-center text-[#7c8d8e]">No videos for this month.</td></tr>
            ) : videos.map((v, idx) => (
              <tr key={v.id} className="border-b border-[#101a1b] last:border-b-0 hover:bg-[#0f1819]">
                <td className="px-3 py-3 text-[#7c8d8e] font-mono-num">{idx + 1}</td>
                <td className="px-3 py-3 text-[#e6f7f6] font-medium">{v.name}</td>
                <td className="px-3 py-3 font-mono-num text-[#d6e7e6]">{v.duration}</td>
                <td className="px-3 py-3 text-[#9bb0b1]">{v.type}</td>
                <td className="px-3 py-3 text-[#9bb0b1] font-mono-num">{v.version}</td>
                <td className="px-3 py-3">
                  <Select value={v.editor_status} onValueChange={(val) => onEditorStatus(v, val)}>
                    <SelectTrigger className="h-7 px-2 bg-transparent border-0 hover:bg-[#0f1819] text-[#e6f7f6] w-auto min-w-[150px]"><StatusBadge status={v.editor_status} withDot /></SelectTrigger>
                    <SelectContent className="bg-[#0d1516] border border-[#243334] text-[#e6f7f6]">{EDITOR_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </td>
                <td className="px-3 py-3">
                  <Select value={v.client_status || 'Pending Review'} onValueChange={(val) => onClientStatus(v, val)}>
                    <SelectTrigger className="h-7 px-2 bg-transparent border-0 hover:bg-[#0f1819] text-[#e6f7f6] w-auto min-w-[140px]"><StatusBadge status={v.client_status} /></SelectTrigger>
                    <SelectContent className="bg-[#0d1516] border border-[#243334] text-[#e6f7f6]">{CLIENT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </td>
                <td className="px-3 py-3">
                  <input type="date" value={v.posted_date || ''} onChange={(e) => onPostedDate(v, e.target.value)} disabled={v.client_status !== 'Approved'}
                    className="px-2 py-1 rounded-md bg-[#0a1112] border border-[#243334] text-[#d6e7e6] font-mono-num text-[12.5px] w-[140px] disabled:opacity-40 disabled:cursor-not-allowed" />
                </td>
                <td className="px-3 py-3 text-[#9bb0b1] font-mono-num">{v.due_date || "—"}</td>
                <td className="px-3 py-3 font-mono-num text-[#d6e7e6]">₹{Number(v.amount).toLocaleString()}</td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-1">
                    {v.client_locked && (<button onClick={() => onUnlock(v)} title="Unlock" className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 text-[11px] font-medium"><Unlock className="w-3 h-3" /> Unlock</button>)}
                    <button onClick={() => { setEditing(v); setFormOpen(true); }} title="Edit" className="w-7 h-7 rounded-md flex items-center justify-center text-[#7c8d8e] hover:text-[#2dd4bf] hover:bg-[#0e2624]"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => onDeleteVideo(v)} title="Delete" className="w-7 h-7 rounded-md flex items-center justify-center text-[#7c8d8e] hover:text-rose-400 hover:bg-rose-500/10"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {corrections.length > 0 && (
        <section>
          <h2 className="text-lg font-bold mb-3">Corrections Requests</h2>
          <div className="space-y-2">
            {corrections.map((c) => (
              <div key={c.id} className="rounded-xl border border-[#142021] bg-[#0d1516] px-4 py-3">
                <div className="flex items-start gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-[#e6f7f6]">{c.title}</span>
                      <StatusBadge status={c.priority} />
                      <span className="text-[12px] text-[#7c8d8e]">on {c.videos?.name}</span>
                    </div>
                    {c.description && <div className="text-[13px] text-[#9bb0b1] mt-1">{c.description}</div>}
                    <div className="flex items-center gap-3 mt-2 text-[12px]">
                      {c.screenshot_url && <a href={c.screenshot_url} target="_blank" rel="noreferrer" className="text-[#2dd4bf] hover:underline">View screenshot</a>}
                      {c.voice_note_url && <a href={c.voice_note_url} target="_blank" rel="noreferrer" className="text-[#2dd4bf] hover:underline">Voice note</a>}
                      <span className="text-[#3f5152]">{new Date(c.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Sum label="Total Videos" value={videos.length} />
        <Sum label="Total Duration" value={totalDuration} color="text-cyan-300" />
        <Sum label="Billable Videos" value={billable.length} />
        <Sum label="Total Amount" value={`₹${totalAmount.toLocaleString()}`} color="text-teal-300" />
      </div>

      <VideoForm open={formOpen} onOpenChange={setFormOpen} initial={editing} clientId={id} year={year} month={month} onSaved={load} types={types} onTypeAdded={load} />
      <DuplicateMonthDialog open={dupOpen} onOpenChange={setDupOpen} clientId={id} year={year} month={month} onDone={load} />
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
