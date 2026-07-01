import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  // eslint-disable-next-line no-console
  console.warn('Supabase env vars missing.');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
});

// Secondary client used ONLY for admin actions that must not affect the current session
// (e.g. creating a client login without signing the admin out).
export const supabaseAdminOps = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false, storageKey: 'sb-admin-ops' },
});

export const AUTH_DOMAIN = 'editvault.local';
export const usernameToEmail = (username) => `${(username || '').toLowerCase().trim()}@${AUTH_DOMAIN}`;
