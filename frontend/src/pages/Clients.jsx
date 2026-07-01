import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Phone, Mail, Wallet, ChevronRight, Plus, Loader2, Trash2, Pencil, PowerOff, Power, KeyRound } from "lucide-react";
import { fetchClients, createClient, updateClient, deleteClient, createClientCredentials } from "../lib/api";
import Avatar from "../components/Avatar";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";

function Input({ label, value, onChange, type = 'text', required, placeholder, autoComplete }) {
  return (
    <label className="block">
      <span className="block text-[12px] text-[#8aa0a1] mb-1.5">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} placeholder={placeholder} autoComplete={autoComplete}
        className="w-full px-3 py-2 rounded-lg bg-[#0a1112] border border-[#243334] text-[#e6f7f6] placeholder-[#3f5152] outline-none focus:border-[#2dd4bf] focus:ring-2 focus:ring-[#2dd4bf]/20" />
    </label>
  );
}

function ClientForm({ open, onOpenChange, initial, onSaved }) {
  const isEdit = !!initial;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [monthly, setMonthly] = useState(0);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setName(initial?.name || '');
      setEmail(initial?.email || '');
      setPhone(initial?.phone || '');
      setMonthly(initial?.monthly_fee ?? 0);
      setUsername(initial?.username || '');
      setPassword('');
    }
  }, [open, initial]);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { name, email: email.toLowerCase(), phone, monthly_fee: Number(monthly) || 0 };
      let clientId = initial?.id;
      if (isEdit) { await updateClient(clientId, payload); }
      else { const created = await createClient(payload); clientId = created.id; }

      // Handle login credentials (only when both fields filled)
      if (username && password) {
        await createClientCredentials({ clientId, username, password });
      } else if (username && !isEdit) {
        // Save username even without password (rare)
        await updateClient(clientId, { username: username.toLowerCase() });
      }

      toast.success(isEdit ? 'Client updated' : 'Client added');
      onSaved(); onOpenChange(false);
    } catch (err) { toast.error(err.message || 'Failed to save'); }
    setSubmitting(false);
  };

  const hasCreds = !!initial?.username;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0d1516] border border-[#142021] text-[#e6f7f6] max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{isEdit ? 'Edit Client' : 'Add Client'}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-3">
            <Input label="Name" value={name} onChange={setName} required />
            <Input label="Email" type="email" value={email} onChange={setEmail} required />
            <Input label="Phone" value={phone} onChange={setPhone} />
            <Input label="Monthly Fee (₹)" type="number" value={monthly} onChange={setMonthly} />
          </div>

          <div className="border-t border-[#142021] pt-4">
            <div className="flex items-center gap-2 mb-2">
              <KeyRound className="w-4 h-4 text-[#2dd4bf]" />
              <span className="text-[13.5px] font-semibold text-[#e6f7f6]">Login Credentials</span>
              {hasCreds && <span className="text-[10.5px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">SET</span>}
            </div>
            <p className="text-[12px] text-[#7c8d8e] mb-3">Admin manually creates the username and password. Client uses these on the login screen.</p>
            <div className="space-y-3">
              <Input label="Username" value={username} onChange={(v) => setUsername(v.replace(/[^a-zA-Z0-9._-]/g,'').toLowerCase())} placeholder="e.g. abcfitness" autoComplete="off" />
              <Input label={hasCreds ? 'New Password (leave blank to keep existing)' : 'Password'} type="password" value={password} onChange={setPassword} placeholder={hasCreds ? '——————' : 'e.g. abc@123'} autoComplete="new-password" />
            </div>
            {hasCreds && (
              <p className="text-[11.5px] text-amber-300/80 mt-2">Note: to change an existing username or reset a lost password, delete this client and recreate, or use Supabase Dashboard → Authentication → Users.</p>
            )}
          </div>

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
  const onToggleActive = async (c) => {
    try { await updateClient(c.id, { active: !c.active }); toast.success(c.active ? 'Client deactivated' : 'Client activated'); load(); } catch (e) { toast.error(e.message); }
  };
  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Clients</h1>
          <p className="text-[#7c8d8e] mt-1 text-sm">{clients.length} total clients</p>
        </div>
        <button onClick={() => { setEditing(null); setOpen(true); }} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2dd4bf] text-[#0a1f1d] font-medium hover:bg-[#3ee0cb] text-sm"><Plus className="w-4 h-4" /> Add Client</button>
      </div>
      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-6 h-6 text-[#2dd4bf] animate-spin" /></div>
      ) : (
        <div className="space-y-3">
          {clients.length === 0 && (
            <div className="rounded-xl border border-dashed border-[#243334] bg-[#0d1516] px-5 py-12 text-center text-[#7c8d8e]">No clients yet.</div>
          )}
          {clients.map((c) => (
            <div key={c.id} className={`card-row rounded-xl border ${c.active ? 'border-[#142021]' : 'border-[#3f2528] opacity-70'} bg-[#0d1516] px-5 py-4 hover:border-[#1f5450]`}>
              <div className="flex items-center gap-4 flex-wrap">
                <Avatar name={c.name} />
                <Link to={`/admin/clients/${c.id}`} className="flex-1 min-w-[240px]">
                  <div className="font-semibold text-[#e6f7f6] text-[15px] mb-1.5 flex items-center gap-2">
                    {c.name}
                    {!c.active && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/30">INACTIVE</span>}
                    {c.username && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">LOGIN SET</span>}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[13px] text-[#8aa0a1]">
                    {c.username && <span className="inline-flex items-center gap-1.5 text-[#2dd4bf]"><KeyRound className="w-3.5 h-3.5" /><span className="font-mono-num">{c.username}</span></span>}
                    {c.phone && <span className="inline-flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /><span className="font-mono-num">{c.phone}</span></span>}
                    <span className="inline-flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{c.email}</span>
                    <span className="inline-flex items-center gap-1.5"><Wallet className="w-3.5 h-3.5 text-teal-400" /><span className="text-teal-300 font-medium font-mono-num">₹{Number(c.monthly_fee).toLocaleString()}/month</span></span>
                  </div>
                </Link>
                <div className="flex items-center gap-1">
                  <button onClick={() => onToggleActive(c)} title={c.active ? 'Deactivate' : 'Activate'} className="w-8 h-8 rounded-md flex items-center justify-center text-[#7c8d8e] hover:text-amber-300 hover:bg-amber-500/10">{c.active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}</button>
                  <button onClick={() => { setEditing(c); setOpen(true); }} title="Edit" className="w-8 h-8 rounded-md flex items-center justify-center text-[#7c8d8e] hover:text-[#2dd4bf] hover:bg-[#0e2624]"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => onDelete(c)} title="Delete" className="w-8 h-8 rounded-md flex items-center justify-center text-[#7c8d8e] hover:text-rose-400 hover:bg-rose-500/10"><Trash2 className="w-4 h-4" /></button>
                  <Link to={`/admin/clients/${c.id}`} className="w-8 h-8 rounded-md flex items-center justify-center text-[#3f5152] hover:text-[#e6f7f6]"><ChevronRight className="w-5 h-5" /></Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <ClientForm open={open} onOpenChange={setOpen} initial={editing} onSaved={load} />
    </div>
  );
}
