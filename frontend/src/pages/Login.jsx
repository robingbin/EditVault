import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clapperboard, Loader2, LogIn, HelpCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase, usernameToEmail } from '../lib/supabaseClient';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const id = identifier.trim();
    // Admins use real email; clients use username. Try username→synthetic first if no '@'.
    const email = id.includes('@') ? id.toLowerCase() : usernameToEmail(id);
    const { data, error } = await signIn({ email, password });
    if (error) { setSubmitting(false); toast.error('Invalid username or password.'); return; }
    const userId = data?.user?.id;
    const { data: prof, error: profErr } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle();
    setSubmitting(false);
    if (profErr) { toast.error(profErr.message); return; }
    const role = prof?.role || 'client';
    toast.success(`Welcome${role === 'admin' ? ' Admin' : ''}!`);
    navigate(role === 'admin' ? '/admin' : '/portal', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#0a0e0f] text-[#e6f7f6] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-[#2dd4bf] flex items-center justify-center shadow-[0_0_22px_-4px_rgba(45,212,191,0.55)]">
            <Clapperboard className="w-5 h-5 text-[#0a1f1d]" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-semibold tracking-tight">EditVault</span>
        </div>
        <div className="rounded-2xl border border-[#142021] bg-[#0d1516] p-7">
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-[#0e2624] border border-[#1f5450] flex items-center justify-center mb-3"><LogIn className="w-6 h-6 text-[#2dd4bf]" /></div>
            <h1 className="text-xl font-bold">Sign in to EditVault</h1>
            <p className="text-[13px] text-[#8aa0a1] mt-1 text-center">Clients use their username. Admins can use their email.</p>
          </div>
          <form onSubmit={onSubmit} className="space-y-4">
            <label className="block"><span className="block text-[12px] text-[#8aa0a1] mb-1.5">Username</span>
              <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} required placeholder="e.g. abcfitness" autoComplete="username"
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#0a1112] border border-[#243334] text-[#e6f7f6] outline-none focus:border-[#2dd4bf] focus:ring-2 focus:ring-[#2dd4bf]/20" /></label>
            <label className="block"><span className="block text-[12px] text-[#8aa0a1] mb-1.5">Password</span>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" autoComplete="current-password"
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#0a1112] border border-[#243334] text-[#e6f7f6] outline-none focus:border-[#2dd4bf] focus:ring-2 focus:ring-[#2dd4bf]/20" /></label>
            <button type="submit" disabled={submitting} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#2dd4bf] text-[#0a1f1d] font-medium hover:bg-[#3ee0cb] disabled:opacity-60">{submitting && <Loader2 className="w-4 h-4 animate-spin" />}Login</button>
          </form>
          <div className="mt-5 text-center text-[13px] text-[#8aa0a1]">
            <button type="button" onClick={() => setHelpOpen(true)} className="inline-flex items-center gap-1.5 text-[#2dd4bf] hover:underline"><HelpCircle className="w-3.5 h-3.5" /> Forgot Password?</button>
          </div>
        </div>
      </div>

      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="bg-[#0d1516] border border-[#142021] text-[#e6f7f6]">
          <DialogHeader><DialogTitle>Forgot Password</DialogTitle></DialogHeader>
          <p className="text-[13.5px] text-[#9bb0b1] leading-relaxed">
            This is an internal application. Please contact your admin/editor to reset your password.
          </p>
          <p className="text-[12.5px] text-[#7c8d8e]">If you’re the admin, use Supabase Dashboard → Authentication → Users to change any password.</p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
