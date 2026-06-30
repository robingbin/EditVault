import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clapperboard, Loader2, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

export default function Signup() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) return toast.error('Password must be at least 6 characters');
    setSubmitting(true);
    const { data, error } = await signUp({ email, password, fullName });
    setSubmitting(false);
    if (error) return toast.error(error.message || 'Sign up failed');
    if (data?.session) {
      toast.success('Welcome to EditVault!');
      navigate('/portal', { replace: true });
    } else {
      toast.success('Account created. Please check your email to confirm and then sign in.');
      navigate('/login', { replace: true });
    }
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
            <div className="w-12 h-12 rounded-xl bg-[#1c1c38] border border-[#2a2a55] flex items-center justify-center mb-3">
              <UserPlus className="w-6 h-6 text-[#a8a5ff]" />
            </div>
            <h1 className="text-xl font-bold">Create Client Account</h1>
            <p className="text-[13px] text-[#8aa0a1] mt-1 text-center">Use the email your editor has on file to access your videos.</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <Field label="Full Name" type="text" value={fullName} onChange={setFullName} placeholder="Jane Doe" />
            <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" required />
            <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="Min 6 characters" required />

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#2dd4bf] text-[#0a1f1d] font-medium hover:bg-[#3ee0cb] disabled:opacity-60 transition-colors"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Account
            </button>
          </form>

          <div className="mt-5 text-center text-[13px] text-[#8aa0a1]">
            Already have an account?{' '}
            <Link to="/login" className="text-[#2dd4bf] hover:underline">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, type, value, onChange, placeholder, required }) {
  return (
    <label className="block">
      <span className="block text-[12px] text-[#8aa0a1] mb-1.5">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-3.5 py-2.5 rounded-lg bg-[#0a1112] border border-[#243334] text-[#e6f7f6] placeholder-[#3f5152] outline-none focus:border-[#2dd4bf] focus:ring-2 focus:ring-[#2dd4bf]/20 transition-colors"
      />
    </label>
  );
}
