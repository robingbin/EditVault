import { supabase } from '../lib/supabaseClient';

// ---------------- Clients ----------------
export async function fetchClients() {
  const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}
export async function fetchClient(id) {
  const { data, error } = await supabase.from('clients').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}
export async function createClient(payload) {
  const { data, error } = await supabase.from('clients').insert(payload).select().single();
  if (error) throw error;
  return data;
}
export async function updateClient(id, payload) {
  const { data, error } = await supabase.from('clients').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return data;
}
export async function deleteClient(id) {
  const { error } = await supabase.from('clients').delete().eq('id', id);
  if (error) throw error;
}

// ---------------- Videos ----------------
export async function fetchVideosForClientPeriod(clientId, year, month) {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('client_id', clientId)
    .eq('year', year)
    .eq('month', month)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}
export async function fetchAllPendingVideos() {
  // For admin dashboard — includes client name via join
  const { data, error } = await supabase
    .from('videos')
    .select('*, clients(name)')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}
export async function fetchClientVideos(clientId) {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}
export async function createVideo(payload) {
  const { data, error } = await supabase.from('videos').insert(payload).select().single();
  if (error) throw error;
  return data;
}
export async function updateVideo(id, payload) {
  const { data, error } = await supabase.from('videos').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return data;
}
export async function deleteVideo(id) {
  const { error } = await supabase.from('videos').delete().eq('id', id);
  if (error) throw error;
}

// ---------------- Payments ----------------
export async function fetchPaymentsForMonth(year, month) {
  const { data, error } = await supabase
    .from('payments')
    .select('*, clients(name)')
    .eq('year', year)
    .eq('month', month)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}
export async function upsertPayment(payload) {
  const { data, error } = await supabase
    .from('payments')
    .upsert(payload, { onConflict: 'client_id,year,month' })
    .select()
    .single();
  if (error) throw error;
  return data;
}
export async function markMonthPaid(clientId, year, month, totalAmount) {
  return upsertPayment({
    client_id: clientId,
    year,
    month,
    total_amount: totalAmount,
    status: 'Paid',
    paid_at: new Date().toISOString(),
  });
}

// ---------------- Invoices ----------------
export async function createInvoice(clientId, year, month, amount) {
  const invoice_no = `INV-${year}${String(month).padStart(2, '0')}-${Date.now().toString().slice(-5)}`;
  const { data, error } = await supabase
    .from('invoices')
    .insert({ client_id: clientId, year, month, amount, invoice_no })
    .select()
    .single();
  if (error) throw error;
  return data;
}
