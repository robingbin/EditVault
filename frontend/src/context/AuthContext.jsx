import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [clientRecord, setClientRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId, email) => {
    if (!userId) {
      setProfile(null);
      setClientRecord(null);
      return;
    }
    const { data: prof } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    setProfile(prof || null);

    if (prof?.role === 'client') {
      const { data: client } = await supabase
        .from('clients')
        .select('*')
        .eq('profile_id', userId)
        .maybeSingle();
      if (client) {
        setClientRecord(client);
      } else if (email) {
        // Fallback by email if trigger hasn't linked yet
        const { data: byEmail } = await supabase
          .from('clients')
          .select('*')
          .ilike('email', email)
          .maybeSingle();
        setClientRecord(byEmail || null);
      }
    } else {
      setClientRecord(null);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session?.user) {
        await fetchProfile(data.session.user.id, data.session.user.email);
      }
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, sess) => {
      setSession(sess);
      if (sess?.user) {
        await fetchProfile(sess.user.id, sess.user.email);
      } else {
        setProfile(null);
        setClientRecord(null);
      }
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signIn = async ({ email, password }) => {
    return supabase.auth.signInWithPassword({ email, password });
  };

  const signUp = async ({ email, password, fullName }) => {
    return supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setClientRecord(null);
  };

  const value = {
    session,
    user: session?.user || null,
    profile,
    role: profile?.role || null,
    isAdmin: profile?.role === 'admin',
    isClient: profile?.role === 'client',
    clientRecord,
    loading,
    signIn,
    signUp,
    signOut,
    refresh: () => session?.user && fetchProfile(session.user.id, session.user.email),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
