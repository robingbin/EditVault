import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Phone, Mail, Wallet, ChevronRight, Plus, Loader2, Trash2, Pencil } from "lucide-react";
import { fetchClients, createClient, updateClient, deleteClient } from "../lib/api";
import Avatar from "../components/Avatar";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";

function Input({ label, value, onChange, type = 'text', required }) {
  return (
    <label className="block">
      <span className="block text-[12px] text-[#8aa0a1] mb-1.5">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required}
        className="w-full px-3 py-2 rounded-lg bg-[#0a1112] border border-[#243334] text-[#e6f7f6] placeholder-[#3f5152] outline-none focus:border-[#2dd4bf] focus:ring-2 focus:ring-[#2dd4bf]/20 transition-colors" />
    </label>
  );
}
function ClientForm({ open, onOpenChange, initial, onSaved }) {
  const isEdit = !!initial;
  const [name, setName] = useState(initial?.name || "");
  const [email, setEmail] = useState(initial?.email || "");
  const [phone, setPhone] = useState(initial?.phone || "");
  const [monthly, setMonthly] = useState(initial?.monthly_fee ?? 0);
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    if (open) {
      setName(initial?.name || ""); setEmail(initial?.email || ""); setPhone(initial?.phone || ""); setMonthly(initial?.monthly_fee ?? 0);
    }
  }, [open, initial]);
  const submit = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      const payload = { name, email: email.toLowerCase(), phone, monthly_fee: Number(monthly) || 0 };
      const saved = isEdit ? await updateClient(initial.id, payload) : await createClient(payload);
      toast.success(isEdit ? 'Client updated' : 'Client added'); onSaved(saved); onOpenChange(false);
    } catch (err) { toast.error(err.message || 'Failed to save'); }
    setSubmitting(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0d1516] border border-[#142021] text-[#e6f7f6]">
        <DialogHeader><DialogTitle>{isEdit ? 'Edit Client' : 'Add Client'}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <Input label="Name" value={name} onChange={setName} required />
          <Input label="Email" type="email" value={email} onChange={setEmail} required />
          <Input label="Phone" value={phone} onChange={setPhone} />
          <Input label="Monthly Fee (₹)" type="number" value={monthly} onChange={setMonthly} />
          <DialogFooter className="pt-2">
            <button type="button" onClick={() => onOpenChange(false)} className="px-4 py-2 rounded-lg border border-[#243334] bg-[#0f1819] text-[#d6e7e6] hover:bg-[#152223] text-sm">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 rounded-lg bg-[#2dd4bf] text-[#0a1f1d] font-medium hover:bg-[#3ee0cb] disabled:opacity-60 text-sm inline-flex items-center gap-2">
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}{isEdit ? 'Save' : 'Add Client'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const load = async () => {
    setLoading(true);
    try { setClients(await fetchClients()); } catch (e) { toast.error(e.message); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);
  const onDelete = async (c) => {
    if (!window.confirm(`Delete ${c.name}? This removes all their videos and payments.`)) return;
    try { await deleteClient(c.id); toast.success('Client deleted'); load(); } catch (e) { toast.error(e.message); }
  };
  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Clients</h1>
          <p className="text-[#7c8d8e] mt-1 text-sm">{clients.length} total clients</p>
        </div>
        <button onClick={() => { setEditing(null); setOpen(true); }} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2dd4bf] text-[#0a1f1d] font-medium hover:bg-[#3ee0cb] text-sm transition-colors"><Plus className="w-4 h-4" /> Add Client</button>
      </div>
      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-6 h-6 text-[#2dd4bf] animate-spin" /></div>
      ) : (
        <div className="space-y-3">
          {clients.length === 0 && (
            <div className="rounded-xl border border-dashed border-[#243334] bg-[#0d1516] px-5 py-12 text-center text-[#7c8d8e]">No clients yet. Click “Add Client” to get started.</div>
          )}
          {clients.map((c) => (
            <div key={c.id} className="card-row rounded-xl border border-[#142021] bg-[#0d1516] px-5 py-4 hover:border-[#1f5450]">
              <div className="flex items-center gap-4">
                <Avatar name={c.name} />
                <Link to={`/admin/clients/${c.id}`} className="flex-1 min-w-0">
                  <div className="font-semibold text-[#e6f7f6] text-[15px] mb-1.5">{c.name}</div>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[13px] text-[#8aa0a1]">
                    {c.phone && <span className="inline-flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /><span className="font-mono-num">{c.phone}</span></span>}
                    <span className="inline-flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{c.email}</span>
                    <span className="inline-flex items-center gap-1.5"><Wallet className="w-3.5 h-3.5 text-teal-400" /><span className="text-teal-300 font-medium font-mono-num">₹{Number(c.monthly_fee).toLocaleString()}/month</span></span>
                  </div>
                </Link>
                <button onClick={() => { setEditing(c); setOpen(true); }} className="w-8 h-8 rounded-md flex items-center justify-center text-[#7c8d8e] hover:text-[#2dd4bf] hover:bg-[#0e2624] transition-colors"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => onDelete(c)} className="w-8 h-8 rounded-md flex items-center justify-center text-[#7c8d8e] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"><Trash2 className="w-4 h-4" /></button>
                <Link to={`/admin/clients/${c.id}`} className="w-8 h-8 rounded-md flex items-center justify-center text-[#3f5152] hover:text-[#e6f7f6]"><ChevronRight className="w-5 h-5" /></Link>
              </div>
            </div>
          ))}
        </div>
      )}
      <ClientForm open={open} onOpenChange={setOpen} initial={editing} onSaved={load} />
    </div>
  );
}
