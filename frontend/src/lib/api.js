import { supabase } from '../lib/supabaseClient';

export const ADMIN_STATUSES = [
  'Pending','Editing','Internal Review','Editing Completed','Sent To Client',
  'Client Review','Correction Requested','Re-Editing','Client Approved','Posted','Archived'
];
export const CLIENT_STATUSES = ['Client Review','Correction Requested','Client Approved','Posted'];
export const CLIENT_VISIBLE = ['Sent To Client','Client Review','Correction Requested','Client Approved','Posted'];
export const PENDING_STATUSES = ['Pending','Editing','Internal Review','Editing Completed'];

// ---------------- Clients ----------------
export async function fetchClients() {
  const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: true });
  if (error) throw error; return data || [];
}
export async function fetchClient(id) {
  const { data, error } = await supabase.from('clients').select('*').eq('id', id).maybeSingle();
  if (error) throw error; return data;
}
export async function createClient(payload) {
  const { data, error } = await supabase.from('clients').insert(payload).select().single();
  if (error) throw error; return data;
}
export async function updateClient(id, payload) {
  const { data, error } = await supabase.from('clients').update(payload).eq('id', id).select().single();
  if (error) throw error; return data;
}
export async function deleteClient(id) {
  const { error } = await supabase.from('clients').delete().eq('id', id);
  if (error) throw error;
}

// ---------------- Videos ----------------
export async function fetchVideosForClientPeriod(clientId, year, month) {
  const { data, error } = await supabase.from('videos').select('*').eq('client_id', clientId).eq('year', year).eq('month', month).order('created_at', { ascending: true });
  if (error) throw error; return data || [];
}
export async function fetchPendingVideos() {
  const { data, error } = await supabase.from('videos').select('*, clients(name)').in('status', PENDING_STATUSES).order('due_date', { ascending: true, nullsFirst: false });
  if (error) throw error; return data || [];
}
export async function fetchClientVideos(clientId) {
  const { data, error } = await supabase.from('videos').select('*').eq('client_id', clientId).order('created_at', { ascending: true });
  if (error) throw error; return data || [];
}
export async function createVideo(payload) {
  const { data, error } = await supabase.from('videos').insert(payload).select().single();
  if (error) throw error; return data;
}
export async function updateVideo(id, payload) {
  const { data, error } = await supabase.from('videos').update(payload).eq('id', id).select().single();
  if (error) throw error; return data;
}
export async function deleteVideo(id) {
  const { error } = await supabase.from('videos').delete().eq('id', id);
  if (error) throw error;
}
export async function setVideoStatus(id, status) {
  return updateVideo(id, { status });
}
export async function sendVideoToClient(id) {
  return updateVideo(id, { status: 'Sent To Client' });
}
export async function unlockPosted(id) {
  // Admin sets status back to Client Approved & unlocks (trigger handles unlock when status != Posted)
  return updateVideo(id, { status: 'Client Approved' });
}

// ---------------- Payments ----------------
export async function fetchPaymentsForMonth(year, month) {
  const { data, error } = await supabase.from('payments').select('*, clients(name)').eq('year', year).eq('month', month).order('created_at');
  if (error) throw error; return data || [];
}
export async function fetchClientPayments(clientId) {
  const { data, error } = await supabase.from('payments').select('*').eq('client_id', clientId).order('year', { ascending: false }).order('month', { ascending: false });
  if (error) throw error; return data || [];
}
export async function upsertPayment(payload) {
  const { data, error } = await supabase.from('payments').upsert(payload, { onConflict: 'client_id,year,month' }).select().single();
  if (error) throw error; return data;
}
export async function markMonthPaid(clientId, year, month, totalAmount) {
  return upsertPayment({ client_id: clientId, year, month, total_amount: totalAmount, status: 'Paid', paid_at: new Date().toISOString() });
}

// ---------------- Invoices ----------------
export async function createInvoice(clientId, year, month, amount) {
  const invoice_no = `INV-${year}${String(month).padStart(2, '0')}-${Date.now().toString().slice(-5)}`;
  const { data, error } = await supabase.from('invoices').insert({ client_id: clientId, year, month, amount, invoice_no }).select().single();
  if (error) throw error; return data;
}
export async function fetchClientInvoices(clientId) {
  const { data, error } = await supabase.from('invoices').select('*').eq('client_id', clientId).order('created_at', { ascending: false });
  if (error) throw error; return data || [];
}

// ---------------- Video Types ----------------
export async function fetchVideoTypes() {
  const { data, error } = await supabase.from('video_types').select('*').order('is_default', { ascending: false }).order('name');
  if (error) throw error; return data || [];
}
export async function createVideoType(name) {
  const { data, error } = await supabase.from('video_types').insert({ name, is_default: false }).select().single();
  if (error) throw error; return data;
}
export async function deleteVideoType(id) {
  const { error } = await supabase.from('video_types').delete().eq('id', id);
  if (error) throw error;
}

// ---------------- Corrections ----------------
export async function createCorrection(payload, fileScreenshot, fileVoice) {
  let screenshot_url = null, voice_note_url = null;
  if (fileScreenshot) {
    const path = `${payload.client_id}/${Date.now()}_${fileScreenshot.name}`;
    const { error } = await supabase.storage.from('corrections').upload(path, fileScreenshot, { upsert: false });
    if (!error) {
      const { data: pub } = supabase.storage.from('corrections').getPublicUrl(path);
      screenshot_url = pub.publicUrl;
    }
  }
  if (fileVoice) {
    const path = `${payload.client_id}/${Date.now()}_${fileVoice.name}`;
    const { error } = await supabase.storage.from('corrections').upload(path, fileVoice, { upsert: false });
    if (!error) {
      const { data: pub } = supabase.storage.from('corrections').getPublicUrl(path);
      voice_note_url = pub.publicUrl;
    }
  }
  const { data, error } = await supabase.from('corrections').insert({ ...payload, screenshot_url, voice_note_url }).select().single();
  if (error) throw error; return data;
}
export async function fetchCorrections({ videoId, clientId } = {}) {
  let q = supabase.from('corrections').select('*, videos(name)').order('created_at', { ascending: false });
  if (videoId) q = q.eq('video_id', videoId);
  if (clientId) q = q.eq('client_id', clientId);
  const { data, error } = await q;
  if (error) throw error; return data || [];
}

// ---------------- Activity Log ----------------
export async function fetchRecentActivity(limit = 10) {
  const { data, error } = await supabase.from('activity_log').select('*, clients(name)').order('created_at', { ascending: false }).limit(limit);
  if (error) throw error; return data || [];
}
export async function fetchClientActivity(clientId, limit = 20) {
  const { data, error } = await supabase.from('activity_log').select('*').eq('client_id', clientId).order('created_at', { ascending: false }).limit(limit);
  if (error) throw error; return data || [];
}

// ---------------- Notifications ----------------
export async function fetchNotifications(limit = 30) {
  const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(limit);
  if (error) throw error; return data || [];
}
export async function markNotificationRead(id) {
  const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
  if (error) throw error;
}
export async function markAllNotificationsRead() {
  const { error } = await supabase.from('notifications').update({ read: true }).eq('read', false);
  if (error) throw error;
}

// ---------------- Months / Years management ----------------
// Helper: list (year, month) combinations that have any videos for a client (admin)
export async function listClientPeriods(clientId) {
  const { data, error } = await supabase.from('videos').select('year, month').eq('client_id', clientId);
  if (error) throw error;
  const seen = new Set();
  const periods = [];
  (data || []).forEach((r) => {
    const k = `${r.year}-${r.month}`;
    if (!seen.has(k)) { seen.add(k); periods.push({ year: r.year, month: r.month }); }
  });
  periods.sort((a, b) => (b.year - a.year) || (b.month - a.month));
  return periods;
}

export async function deleteClientPeriod(clientId, year, month) {
  const { error } = await supabase.from('videos').delete().eq('client_id', clientId).eq('year', year).eq('month', month);
  if (error) throw error;
  await supabase.from('payments').delete().eq('client_id', clientId).eq('year', year).eq('month', month);
}

export async function duplicatePreviousMonth(clientId, fromYear, fromMonth, toYear, toMonth) {
  const { data, error } = await supabase.from('videos').select('name, duration, type, version, amount, due_date').eq('client_id', clientId).eq('year', fromYear).eq('month', fromMonth);
  if (error) throw error;
  if (!data || data.length === 0) return 0;
  const payload = data.map((v) => ({ ...v, client_id: clientId, year: toYear, month: toMonth, status: 'Pending', version: 'V1' }));
  const { error: insErr } = await supabase.from('videos').insert(payload);
  if (insErr) throw insErr;
  return payload.length;
}
