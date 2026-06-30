-- =====================================================================
-- EditVault — Supabase Schema, RLS Policies, Triggers
-- Run this file in: Supabase Dashboard → SQL Editor → New Query → Run
-- Safe to run multiple times (uses IF NOT EXISTS / DROP POLICY IF EXISTS)
-- =====================================================================

-- 1. PROFILES -----------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  role        text not null default 'client' check (role in ('admin','client')),
  created_at  timestamptz default now()
);

-- Helper: is_admin() — used inside RLS to avoid recursion
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- Auto-create profile on signup (default role = client; admin must be set manually)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
    'client'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. CLIENTS ------------------------------------------------------------
create table if not exists public.clients (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid references public.profiles(id) on delete set null, -- linked when client signs up
  name          text not null,
  phone         text,
  email         text not null unique,
  monthly_fee   numeric(12,2) not null default 0,
  created_at    timestamptz default now()
);

create index if not exists clients_profile_id_idx on public.clients(profile_id);
create index if not exists clients_email_idx on public.clients(lower(email));

-- Auto-link client.profile_id when a profile is created with the same email
create or replace function public.link_client_to_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.clients
     set profile_id = new.id
   where lower(email) = lower(new.email)
     and profile_id is null;
  return new;
end;
$$;

drop trigger if exists on_profile_created_link_client on public.profiles;
create trigger on_profile_created_link_client
  after insert on public.profiles
  for each row execute function public.link_client_to_profile();

-- 3. VIDEOS -------------------------------------------------------------
create table if not exists public.videos (
  id             uuid primary key default gen_random_uuid(),
  client_id      uuid not null references public.clients(id) on delete cascade,
  year           int not null,
  month          int not null check (month between 1 and 12),
  name           text not null,
  duration       text not null default '00:00',
  type           text not null default 'Reel',
  version        text not null default 'V1',
  editor_status  text not null default 'Not Started' check (editor_status in ('Not Started','In Progress','Done')),
  client_status  text check (client_status in ('Approved','Correction','Rejected','Posted')),
  date           text,
  amount         numeric(12,2) not null default 0,
  created_at     timestamptz default now()
);

create index if not exists videos_client_idx on public.videos(client_id);
create index if not exists videos_client_period_idx on public.videos(client_id, year, month);

-- 4. PAYMENTS -----------------------------------------------------------
create table if not exists public.payments (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid not null references public.clients(id) on delete cascade,
  year          int not null,
  month         int not null check (month between 1 and 12),
  total_amount  numeric(12,2) not null default 0,
  status        text not null default 'Pending' check (status in ('Pending','Paid')),
  paid_at       timestamptz,
  created_at    timestamptz default now(),
  unique (client_id, year, month)
);

create index if not exists payments_client_idx on public.payments(client_id);

-- 5. INVOICES -----------------------------------------------------------
create table if not exists public.invoices (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references public.clients(id) on delete cascade,
  year        int not null,
  month       int not null check (month between 1 and 12),
  amount      numeric(12,2) not null default 0,
  invoice_no  text,
  created_at  timestamptz default now()
);

create index if not exists invoices_client_idx on public.invoices(client_id);

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================

alter table public.profiles enable row level security;
alter table public.clients  enable row level security;
alter table public.videos   enable row level security;
alter table public.payments enable row level security;
alter table public.invoices enable row level security;

-- PROFILES policies
drop policy if exists "profiles_self_select"   on public.profiles;
drop policy if exists "profiles_admin_select"  on public.profiles;
drop policy if exists "profiles_self_update"   on public.profiles;
drop policy if exists "profiles_admin_all"     on public.profiles;

create policy "profiles_self_select" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_admin_select" on public.profiles
  for select using (public.is_admin());
create policy "profiles_self_update" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id and role = (select role from public.profiles where id = auth.uid()));
create policy "profiles_admin_all" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- CLIENTS policies
drop policy if exists "clients_admin_all"      on public.clients;
drop policy if exists "clients_self_select"    on public.clients;

create policy "clients_admin_all" on public.clients
  for all using (public.is_admin()) with check (public.is_admin());
create policy "clients_self_select" on public.clients
  for select using (profile_id = auth.uid());

-- VIDEOS policies
drop policy if exists "videos_admin_all"            on public.videos;
drop policy if exists "videos_client_select"        on public.videos;
drop policy if exists "videos_client_update_status" on public.videos;

create policy "videos_admin_all" on public.videos
  for all using (public.is_admin()) with check (public.is_admin());
create policy "videos_client_select" on public.videos
  for select using (
    exists (select 1 from public.clients c
            where c.id = videos.client_id and c.profile_id = auth.uid())
  );
-- Clients may update only client_status on their own videos
create policy "videos_client_update_status" on public.videos
  for update using (
    exists (select 1 from public.clients c
            where c.id = videos.client_id and c.profile_id = auth.uid())
  ) with check (
    exists (select 1 from public.clients c
            where c.id = videos.client_id and c.profile_id = auth.uid())
  );

-- PAYMENTS policies
drop policy if exists "payments_admin_all"   on public.payments;
drop policy if exists "payments_client_read" on public.payments;

create policy "payments_admin_all" on public.payments
  for all using (public.is_admin()) with check (public.is_admin());
create policy "payments_client_read" on public.payments
  for select using (
    exists (select 1 from public.clients c
            where c.id = payments.client_id and c.profile_id = auth.uid())
  );

-- INVOICES policies
drop policy if exists "invoices_admin_all"   on public.invoices;
drop policy if exists "invoices_client_read" on public.invoices;

create policy "invoices_admin_all" on public.invoices
  for all using (public.is_admin()) with check (public.is_admin());
create policy "invoices_client_read" on public.invoices
  for select using (
    exists (select 1 from public.clients c
            where c.id = invoices.client_id and c.profile_id = auth.uid())
  );

-- =====================================================================
-- SEED (optional sample data — comment out if not needed)
-- =====================================================================
insert into public.clients (name, phone, email, monthly_fee) values
  ('ABC Fitness',  '+91 98765 43210', 'contact@abcfitness.com', 18000),
  ('XYZ Builders', '+91 87654 32109', 'info@xyzbuilders.com',   12500),
  ('Green Cafe',   '+91 76543 21098', 'hello@greencafe.com',     8000),
  ('Urban Styles', '+91 65432 10987', 'team@urbanstyles.com',   15000),
  ('TechNova',     '+91 54321 09876', 'support@technova.in',    20000)
on conflict (email) do nothing;

-- =====================================================================
-- HOW TO CREATE THE FIRST ADMIN
-- =====================================================================
-- 1. Supabase Dashboard → Authentication → Users → Add user (email + password)
-- 2. Copy the new user's UUID
-- 3. Run:  update public.profiles set role='admin' where id='<uuid>';
-- =====================================================================
