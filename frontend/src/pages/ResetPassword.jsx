import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clapperboard, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const onSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) return toast.error('Password must be at least 6 characters');
    if (password !== confirm) return toast.error('Passwords do not match');
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success('Password updated. Please sign in.');
    await supabase.auth.signOut();
    navigate('/login', { replace: true });
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
          <h1 className="text-xl font-bold mb-1">Set a new password</h1>
          <p className="text-[13px] text-[#8aa0a1] mb-5">You must be signed in via the reset email link for this to work.</p>
          <form onSubmit={onSubmit} className="space-y-4">
            <label className="block"><span className="block text-[12px] text-[#8aa0a1] mb-1.5">New Password</span>
              <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required minLength={6}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#0a1112] border border-[#243334] text-[#e6f7f6] outline-none focus:border-[#2dd4bf] focus:ring-2 focus:ring-[#2dd4bf]/20" /></label>
            <label className="block"><span className="block text-[12px] text-[#8aa0a1] mb-1.5">Confirm Password</span>
              <input type="password" value={confirm} onChange={(e)=>setConfirm(e.target.value)} required minLength={6}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#0a1112] border border-[#243334] text-[#e6f7f6] outline-none focus:border-[#2dd4bf] focus:ring-2 focus:ring-[#2dd4bf]/20" /></label>
            <button type="submit" disabled={busy} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#2dd4bf] text-[#0a1f1d] font-medium hover:bg-[#3ee0cb] disabled:opacity-60">{busy && <Loader2 className="w-4 h-4 animate-spin" />}Update Password</button>
          </form>
        </div>
      </div>
    </div>
  );
}
