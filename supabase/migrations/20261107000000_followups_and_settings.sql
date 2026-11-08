-- =====================================================================
-- Phase 7: absentee follow-up + editable message wording
-- Run via `npx supabase db push`, or paste into the Supabase SQL Editor.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. followups: "someone has contacted this member about this missed date".
--    One row per member per missed date. Contacting again just updates it.
--    Admin only (the follow-up page is an admin page).
-- ---------------------------------------------------------------------
create table public.followups (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  service_date date not null,
  channel text not null check (channel in ('whatsapp', 'sms', 'call', 'other')),
  note text check (note is null or char_length(note) <= 500),
  contacted_by uuid references auth.users(id) on delete set null,
  contacted_at timestamptz not null default now(),

  constraint followups_member_date_unique unique (member_id, service_date)
);

create index idx_followups_date on public.followups(service_date);

-- who and when are set by the database, so a client cannot claim to be someone else
create or replace function public.followups_stamp()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.contacted_by := auth.uid();
  new.contacted_at := now();
  return new;
end;
$$;

create trigger followups_stamp
before insert or update on public.followups
for each row execute function public.followups_stamp();

alter table public.followups enable row level security;
revoke all on public.followups from anon;
grant select, insert, update, delete on public.followups to authenticated;

create policy "admin reads followups" on public.followups
  for select to authenticated using ((select public.is_admin()));
create policy "admin adds followups" on public.followups
  for insert to authenticated with check ((select public.is_admin()));
create policy "admin updates followups" on public.followups
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin deletes followups" on public.followups
  for delete to authenticated using ((select public.is_admin()));

-- ---------------------------------------------------------------------
-- 2. app_settings: the wording of the messages (more settings can be added later).
--    Only the two known keys are allowed, and the text is kept short.
--    No row = the app uses its built-in default wording.
-- ---------------------------------------------------------------------
create table public.app_settings (
  key text primary key check (key in ('template.pass_share', 'template.absence_followup')),
  value jsonb not null check (
    jsonb_typeof(value) = 'string' and char_length(value #>> '{}') between 1 and 1000
  ),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create or replace function public.app_settings_stamp()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_by := auth.uid();
  new.updated_at := now();
  return new;
end;
$$;

create trigger app_settings_stamp
before insert or update on public.app_settings
for each row execute function public.app_settings_stamp();

alter table public.app_settings enable row level security;
revoke all on public.app_settings from anon;
grant select, insert, update, delete on public.app_settings to authenticated;

create policy "staff read settings" on public.app_settings
  for select to authenticated using ((select public.is_staff()));
create policy "admin adds settings" on public.app_settings
  for insert to authenticated with check ((select public.is_admin()));
create policy "admin updates settings" on public.app_settings
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin deletes settings" on public.app_settings
  for delete to authenticated using ((select public.is_admin()));

-- ---------------------------------------------------------------------
-- 3. absentees(date, church): active members with no check-in on that date,
--    plus when they last came before it and whether someone has contacted them.
--    p_church = null means both churches.
--    Runs with the caller's rights, so only an admin sees the "contacted" details.
-- ---------------------------------------------------------------------
create or replace function public.absentees(p_date date, p_church public.church_group_enum default null)
returns table (
  member_id uuid,
  member_code text,
  full_name text,
  phone text,
  church_group public.church_group_enum,
  last_attended date,
  contacted_at timestamptz,
  contacted_channel text
)
language sql
stable
set search_path = ''
as $$
  select
    m.id,
    m.member_code,
    m.full_name,
    m.phone,
    m.church_group,
    (
      select max(a.service_date)
      from public.attendance a
      where a.member_id = m.id and a.service_date < p_date
    ),
    f.contacted_at,
    f.channel
  from public.members m
  left join public.followups f on f.member_id = m.id and f.service_date = p_date
  where m.status = 'active'
    and (p_church is null or m.church_group = p_church)
    and not exists (
      select 1 from public.attendance a
      where a.member_id = m.id and a.service_date = p_date
    )
  order by m.full_name, m.id;
$$;

revoke all on function public.absentees(date, public.church_group_enum) from public, anon;
grant execute on function public.absentees(date, public.church_group_enum) to authenticated;
