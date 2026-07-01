-- =====================================================================
-- EditVault — Production Schema (v3.1)
-- Approval workflow with separate Editor Status & Client Status
-- Fully idempotent — safe on fresh installs and existing v1 / v2 databases.
-- Run in: Supabase Dashboard → SQL Editor
-- =====================================================================
-- BUCKET (once, in Supabase Dashboard → Storage):
--   Create a public bucket named:  corrections
-- =====================================================================

-- ---------------------------------------------------------------------
-- STEP 0. Drop ALL previous videos-related triggers BEFORE any migration
--         (they may enforce old rules and block data updates).
-- ---------------------------------------------------------------------
drop trigger  if exists trg_videos_client_rules       on public.videos;
drop trigger  if exists trg_videos_rules              on public.videos;
drop trigger  if exists trg_videos_log                on public.videos;
drop trigger  if exists trg_invoice_notify            on public.invoices;
drop function if exists public.videos_enforce_client_rules() cascade;
drop function if exists public.videos_enforce_rules()        cascade;
drop function if exists public.log_video_activity()          cascade;
drop function if exists public.notify_invoice()              cascade;

-- ---------------------------------------------------------------------
-- 1. PROFILES
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  role        text not null default 'client' check (role in ('admin','client')),
  created_at  timestamptz default now()
);

create or replace function public.is_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin');
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
    'client')
  on conflict (id) do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 2. CLIENTS
-- ---------------------------------------------------------------------
create table if not exists public.clients (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid references public.profiles(id) on delete set null,
  name         text not null,
  phone        text,
  email        text not null unique,
  monthly_fee  numeric(12,2) not null default 0,
  active       boolean not null default true,
  created_at   timestamptz default now()
);
alter table public.clients add column if not exists active boolean not null default true;
create index if not exists clients_profile_id_idx on public.clients(profile_id);
create index if not exists clients_email_idx      on public.clients(lower(email));

create or replace function public.link_client_to_profile()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.clients set profile_id = new.id
   where lower(email) = lower(new.email) and profile_id is null;
  return new;
end; $$;
drop trigger if exists on_profile_created_link_client on public.profiles;
create trigger on_profile_created_link_client after insert on public.profiles
  for each row execute function public.link_client_to_profile();

-- ---------------------------------------------------------------------
-- 3. VIDEO TYPES
-- ---------------------------------------------------------------------
create table if not exists public.video_types (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  is_default  boolean not null default false,
  created_at  timestamptz default now()
);
insert into public.video_types (name, is_default) values
  ('Instagram Reel', true), ('YouTube Short', true), ('YouTube Video', true),
  ('Facebook Reel', true), ('Advertisement', true), ('Corporate', true),
  ('Wedding', true), ('Product', true), ('Podcast', true), ('Other', true)
on conflict (name) do nothing;

-- ---------------------------------------------------------------------
-- 4. VIDEOS  (create-if-missing OR add columns for upgrade)
-- ---------------------------------------------------------------------
create table if not exists public.videos (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid not null references public.clients(id) on delete cascade,
  year            int not null,
  month           int not null check (month between 1 and 12),
  name            text not null,
  duration        text not null default '00:00',
  type            text not null default 'Instagram Reel',
  version         text not null default 'V1',
  editor_status   text not null default 'Not Started',
  client_status   text default 'Pending Review',
  posted_date     date,
  client_locked   boolean not null default false,
  due_date        date,
  amount          numeric(12,2) not null default 0,
  sent_at         timestamptz,
  created_at      timestamptz default now()
);

-- Upgrade path additive columns
alter table public.videos add column if not exists editor_status text;
alter table public.videos add column if not exists client_status text;
alter table public.videos add column if not exists posted_date   date;
alter table public.videos add column if not exists client_locked boolean not null default false;
alter table public.videos add column if not exists due_date      date;
alter table public.videos add column if not exists sent_at       timestamptz;

-- Migrate legacy `status` -> editor_status / client_status  (safe: triggers are dropped)
do $$ begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='videos' and column_name='status'
  ) then
    update public.videos
       set editor_status = coalesce(editor_status, case
             when status in ('Pending','Editing','Internal Review') then 'Not Started'
             when status = 'Re-Editing'                              then 'WIP'
             when status = 'Editing Completed'                       then 'WIP'
             when status in ('Sent To Client','Client Review')       then 'Sent To Client'
             when status = 'Correction Requested'                    then 'Sent To Client'
             when status in ('Client Approved','Posted')             then 'Sent To Client'
             else 'Not Started'
           end),
           client_status = coalesce(client_status, case
             when status = 'Correction Requested'         then 'Correction'
             when status in ('Client Approved','Posted')  then 'Approved'
             when status in ('Sent To Client','Client Review') then 'Pending Review'
             else null
           end),
           client_locked = case when status = 'Posted' then true else coalesce(client_locked,false) end;
  end if;
end $$;

-- Handle legacy editor_status/client_status values from an earlier v2 attempt
update public.videos
   set editor_status = case editor_status
        when 'Done'               then 'WIP'
        when 'In Progress'        then 'WIP'
        when 'Editing Completed'  then 'WIP'
        when 'Re-Editing'         then 'WIP'
        when 'Client Review'      then 'Sent To Client'
        when 'Client Approved'    then 'Sent To Client'
        when 'Posted'             then 'Sent To Client'
        when 'Archived'           then 'Not Started'
        when 'Pending'            then 'Not Started'
        when 'Internal Review'    then 'WIP'
        else editor_status end
 where editor_status not in ('Not Started','WIP','Sent To Client','Corrections Updated');

update public.videos
   set client_status = case client_status
        when 'Correction Requested' then 'Correction'
        when 'Client Approved'      then 'Approved'
        when 'Posted'               then 'Approved'
        when 'Client Review'        then 'Pending Review'
        when ''                     then null
        else client_status end
 where client_status is not null
   and client_status not in ('Pending Review','Approved','Correction','Rejected');

-- Fill any remaining nulls with sane defaults
update public.videos set editor_status = 'Not Started' where editor_status is null;

-- Apply constraints (drop-if-exists first to be safe)
alter table public.videos alter column editor_status set default 'Not Started';
alter table public.videos alter column editor_status set not null;

alter table public.videos drop constraint if exists videos_editor_status_check;
alter table public.videos add  constraint videos_editor_status_check
  check (editor_status in ('Not Started','WIP','Sent To Client','Corrections Updated'));

alter table public.videos drop constraint if exists videos_client_status_check;
alter table public.videos add  constraint videos_client_status_check
  check (client_status is null or client_status in ('Pending Review','Approved','Correction','Rejected'));

-- Drop legacy columns/constraints (idempotent)
alter table public.videos drop constraint if exists videos_status_check;
alter table public.videos drop column if exists status;
alter table public.videos drop column if exists posted_locked;

create index if not exists videos_client_idx            on public.videos(client_id);
create index if not exists videos_client_period_idx     on public.videos(client_id, year, month);
create index if not exists videos_editor_status_idx     on public.videos(editor_status);
create index if not exists videos_client_status_idx     on public.videos(client_status);

-- ---------------------------------------------------------------------
-- 5. PAYMENTS
-- ---------------------------------------------------------------------
create table if not exists public.payments (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references public.clients(id) on delete cascade,
  year         int not null,
  month        int not null check (month between 1 and 12),
  total_amount numeric(12,2) not null default 0,
  status       text not null default 'Pending' check (status in ('Pending','Paid')),
  paid_at      timestamptz,
  created_at   timestamptz default now(),
  unique (client_id, year, month)
);
create index if not exists payments_client_idx on public.payments(client_id);

-- ---------------------------------------------------------------------
-- 6. INVOICES
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- 7. CORRECTIONS
-- ---------------------------------------------------------------------
create table if not exists public.corrections (
  id            uuid primary key default gen_random_uuid(),
  video_id      uuid not null references public.videos(id) on delete cascade,
  client_id     uuid not null references public.clients(id) on delete cascade,
  title         text not null,
  description   text,
  priority      text not null default 'Medium' check (priority in ('Low','Medium','High','Urgent')),
  screenshot_url text,
  voice_note_url text,
  resolved      boolean not null default false,
  created_at    timestamptz default now()
);
create index if not exists corrections_video_idx  on public.corrections(video_id);
create index if not exists corrections_client_idx on public.corrections(client_id);

-- ---------------------------------------------------------------------
-- 8. ACTIVITY LOG
-- ---------------------------------------------------------------------
create table if not exists public.activity_log (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references public.profiles(id) on delete set null,
  actor_role  text,
  client_id   uuid references public.clients(id) on delete cascade,
  video_id    uuid references public.videos(id) on delete cascade,
  action      text not null,
  detail      text,
  created_at  timestamptz default now()
);
create index if not exists activity_log_created_idx on public.activity_log(created_at desc);
create index if not exists activity_log_client_idx  on public.activity_log(client_id);

-- ---------------------------------------------------------------------
-- 9. NOTIFICATIONS
-- ---------------------------------------------------------------------
create table if not exists public.notifications (
  id           uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  title        text not null,
  body         text,
  link         text,
  read         boolean not null default false,
  created_at   timestamptz default now()
);
create index if not exists notifications_recipient_idx
  on public.notifications(recipient_id, read, created_at desc);

-- =====================================================================
-- STEP N. RECREATE TRIGGERS (after migration is safe)
-- =====================================================================

-- Enforce role rules + auto client_status transitions
create or replace function public.videos_enforce_rules()
returns trigger language plpgsql security definer set search_path = public as $$
declare adm boolean;
begin
  adm := public.is_admin();

  if tg_op = 'INSERT' then
    if new.editor_status is null then new.editor_status := 'Not Started'; end if;
    return new;
  end if;

  -- Editor-status transitions auto-manage client_status (admin actions)
  if new.editor_status is distinct from old.editor_status then
    if new.editor_status = 'Sent To Client' then
      new.client_status := 'Pending Review';
      new.client_locked := false;
      new.sent_at       := now();
      new.posted_date   := null;
    elsif new.editor_status = 'Corrections Updated' then
      new.client_status := 'Pending Review';
      new.client_locked := false;
      new.posted_date   := null;
    end if;
  end if;

  if not adm then
    -- CLIENT UPDATE RULES
    if old.client_locked then
      raise exception 'This video is locked and cannot be edited.';
    end if;
    if new.name <> old.name or new.duration <> old.duration or new.version <> old.version
       or coalesce(new.amount,0) <> coalesce(old.amount,0) or new.type <> old.type
       or new.editor_status <> old.editor_status
       or new.due_date is distinct from old.due_date
       or new.year <> old.year or new.month <> old.month then
      raise exception 'Clients can only change client status / posted date.';
    end if;
    if new.client_status is null or new.client_status not in ('Pending Review','Approved','Correction','Rejected') then
      raise exception 'Invalid client status: %', new.client_status;
    end if;
    if new.posted_date is not null and new.client_status <> 'Approved' then
      raise exception 'Posted Date can only be set when client status is Approved.';
    end if;
    if new.client_status = 'Approved' and new.posted_date is not null then
      new.client_locked := true;
    end if;
  else
    -- ADMIN UPDATE RULES
    if new.client_status = 'Approved' and new.posted_date is not null and not old.client_locked then
      new.client_locked := true;
    end if;
    if new.posted_date is null and old.client_locked then
      new.client_locked := false;
    end if;
  end if;

  return new;
end; $$;
create trigger trg_videos_rules
  before insert or update on public.videos
  for each row execute function public.videos_enforce_rules();

-- Activity + notifications (audit trail; no gating logic)
create or replace function public.log_video_activity()
returns trigger language plpgsql security definer set search_path = public as $$
declare actor uuid; arole text;
begin
  actor := auth.uid();
  select role into arole from public.profiles where id = actor;
  if tg_op = 'INSERT' then
    insert into public.activity_log(actor_id, actor_role, client_id, video_id, action, detail)
    values (actor, arole, new.client_id, new.id, 'video_created', new.name);
  elsif tg_op = 'UPDATE' then
    if new.editor_status is distinct from old.editor_status then
      insert into public.activity_log(actor_id, actor_role, client_id, video_id, action, detail)
      values (actor, arole, new.client_id, new.id, 'editor_status_changed', new.editor_status);
      if new.editor_status = 'Sent To Client' then
        insert into public.notifications(recipient_id, title, body, link)
        select c.profile_id, 'New video for review', new.name || ' is ready for your review.', '/portal'
          from public.clients c where c.id = new.client_id and c.profile_id is not null;
      elsif new.editor_status = 'Corrections Updated' then
        insert into public.notifications(recipient_id, title, body, link)
        select c.profile_id, 'Corrections updated', new.name || ' has been re-edited.', '/portal'
          from public.clients c where c.id = new.client_id and c.profile_id is not null;
      end if;
    end if;
    if new.client_status is distinct from old.client_status then
      insert into public.activity_log(actor_id, actor_role, client_id, video_id, action, detail)
      values (actor, arole, new.client_id, new.id, 'client_status_changed', coalesce(new.client_status,'null'));
      if new.client_status = 'Correction' then
        insert into public.notifications(recipient_id, title, body, link)
        select p.id, 'Correction requested', new.name || ' needs corrections.', '/admin/clients/' || new.client_id
          from public.profiles p where p.role = 'admin';
      elsif new.client_status = 'Rejected' then
        insert into public.notifications(recipient_id, title, body, link)
        select p.id, 'Video rejected', new.name || ' was rejected by the client.', '/admin/clients/' || new.client_id
          from public.profiles p where p.role = 'admin';
      elsif new.client_status = 'Approved' then
        insert into public.notifications(recipient_id, title, body, link)
        select p.id, 'Video approved', new.name || ' was approved by the client.', '/admin/clients/' || new.client_id
          from public.profiles p where p.role = 'admin';
      end if;
    end if;
  elsif tg_op = 'DELETE' then
    insert into public.activity_log(actor_id, actor_role, client_id, video_id, action, detail)
    values (actor, arole, old.client_id, old.id, 'video_deleted', old.name);
  end if;
  return coalesce(new, old);
end; $$;
create trigger trg_videos_log
  after insert or update or delete on public.videos
  for each row execute function public.log_video_activity();

-- Invoice notif
create or replace function public.notify_invoice() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications(recipient_id, title, body, link)
  select c.profile_id, 'New invoice', 'Invoice ' || coalesce(new.invoice_no,'') || ' is available.', '/portal'
    from public.clients c where c.id = new.client_id and c.profile_id is not null;
  return new;
end; $$;
create trigger trg_invoice_notify
  after insert on public.invoices
  for each row execute function public.notify_invoice();

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================
alter table public.profiles      enable row level security;
alter table public.clients       enable row level security;
alter table public.videos        enable row level security;
alter table public.payments      enable row level security;
alter table public.invoices      enable row level security;
alter table public.video_types   enable row level security;
alter table public.corrections   enable row level security;
alter table public.activity_log  enable row level security;
alter table public.notifications enable row level security;

-- PROFILES
drop policy if exists "p_self_select" on public.profiles;
drop policy if exists "p_admin_all"   on public.profiles;
create policy "p_self_select" on public.profiles for select using (auth.uid() = id);
create policy "p_admin_all"   on public.profiles for all using (public.is_admin()) with check (public.is_admin());

-- CLIENTS
drop policy if exists "c_admin_all"   on public.clients;
drop policy if exists "c_self_select" on public.clients;
create policy "c_admin_all"   on public.clients for all using (public.is_admin()) with check (public.is_admin());
create policy "c_self_select" on public.clients for select using (profile_id = auth.uid() and active = true);

-- VIDEOS
drop policy if exists "v_admin_all"     on public.videos;
drop policy if exists "v_client_select" on public.videos;
drop policy if exists "v_client_update" on public.videos;
create policy "v_admin_all" on public.videos for all using (public.is_admin()) with check (public.is_admin());
create policy "v_client_select" on public.videos for select using (
  editor_status in ('Sent To Client','Corrections Updated')
  and exists (select 1 from public.clients c where c.id = videos.client_id and c.profile_id = auth.uid() and c.active = true)
);
create policy "v_client_update" on public.videos for update using (
  exists (select 1 from public.clients c where c.id = videos.client_id and c.profile_id = auth.uid() and c.active = true)
) with check (
  exists (select 1 from public.clients c where c.id = videos.client_id and c.profile_id = auth.uid() and c.active = true)
);

-- PAYMENTS / INVOICES
drop policy if exists "pay_admin_all"   on public.payments;
drop policy if exists "pay_client_read" on public.payments;
create policy "pay_admin_all"   on public.payments for all using (public.is_admin()) with check (public.is_admin());
create policy "pay_client_read" on public.payments for select using (
  exists (select 1 from public.clients c where c.id = payments.client_id and c.profile_id = auth.uid() and c.active = true)
);
drop policy if exists "inv_admin_all"   on public.invoices;
drop policy if exists "inv_client_read" on public.invoices;
create policy "inv_admin_all"   on public.invoices for all using (public.is_admin()) with check (public.is_admin());
create policy "inv_client_read" on public.invoices for select using (
  exists (select 1 from public.clients c where c.id = invoices.client_id and c.profile_id = auth.uid() and c.active = true)
);

-- VIDEO TYPES
drop policy if exists "vt_read"        on public.video_types;
drop policy if exists "vt_admin_write" on public.video_types;
create policy "vt_read"        on public.video_types for select using (auth.uid() is not null);
create policy "vt_admin_write" on public.video_types for all    using (public.is_admin()) with check (public.is_admin());

-- CORRECTIONS
drop policy if exists "cor_admin_all"     on public.corrections;
drop policy if exists "cor_client_read"   on public.corrections;
drop policy if exists "cor_client_insert" on public.corrections;
create policy "cor_admin_all"    on public.corrections for all using (public.is_admin()) with check (public.is_admin());
create policy "cor_client_read"  on public.corrections for select using (
  exists (select 1 from public.clients c where c.id = corrections.client_id and c.profile_id = auth.uid() and c.active = true)
);
create policy "cor_client_insert" on public.corrections for insert with check (
  exists (select 1 from public.clients c where c.id = corrections.client_id and c.profile_id = auth.uid() and c.active = true)
);

-- ACTIVITY LOG
drop policy if exists "al_admin_all"   on public.activity_log;
drop policy if exists "al_client_read" on public.activity_log;
create policy "al_admin_all"   on public.activity_log for all using (public.is_admin()) with check (public.is_admin());
create policy "al_client_read" on public.activity_log for select using (
  client_id is not null and exists (select 1 from public.clients c where c.id = activity_log.client_id and c.profile_id = auth.uid() and c.active = true)
);

-- NOTIFICATIONS
drop policy if exists "n_self_select" on public.notifications;
drop policy if exists "n_self_update" on public.notifications;
drop policy if exists "n_admin_all"   on public.notifications;
create policy "n_self_select" on public.notifications for select using (recipient_id = auth.uid());
create policy "n_self_update" on public.notifications for update using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());
create policy "n_admin_all"   on public.notifications for all    using (public.is_admin()) with check (public.is_admin());

-- =====================================================================
-- HOW TO CREATE THE FIRST ADMIN
-- =====================================================================
-- 1. Supabase Dashboard → Authentication → Users → Add user (email + password)
-- 2. Copy the new user UUID
-- 3. Run:  update public.profiles set role='admin' where id='<uuid>';
-- =====================================================================
