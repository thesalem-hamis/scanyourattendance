-- =====================================================================
-- Teens Attendance System: Phase 1 (schema, security, RPC functions)
-- Run via `npx supabase db push`, or paste into the Supabase SQL Editor.
-- =====================================================================

create extension if not exists pg_trgm with schema extensions;

-- ---------------------------------------------------------------------
-- 1. Enums
-- ---------------------------------------------------------------------
create type public.church_group_enum as enum ('Church 1', 'Church 2');
create type public.gender_enum as enum ('Male', 'Female');
create type public.checkin_method_enum as enum ('qr_scan', 'manual_search', 'self_form');
create type public.staff_role_enum as enum ('admin', 'usher');

-- ---------------------------------------------------------------------
-- 2. Staff profiles (1 admin + 2 ushers, linked to Supabase Auth users)
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.staff_role_enum not null,
  full_name text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 3. Members
--    member_code : human-friendly label (MEM-10001), sequential, NOT secret
--    qr_token    : long random secret that goes inside the QR / pass link
-- ---------------------------------------------------------------------
create sequence public.member_code_seq start 10001;

create table public.members (
  id uuid primary key default gen_random_uuid(),
  member_code text not null unique
    default ('MEM-' || lpad(nextval('public.member_code_seq')::text, 5, '0')),
  qr_token text not null unique
    default replace(gen_random_uuid()::text, '-', ''),
  full_name text not null check (char_length(trim(full_name)) between 2 and 100),
  phone text not null check (phone ~ '^\+[1-9][0-9]{7,14}$'),  -- E.164, e.g. +2348031234567
  age integer check (age between 1 and 24),
  gender public.gender_enum not null,
  church_group public.church_group_enum not null,
  status text not null default 'active' check (status in ('active', 'inactive')),
  consent_at timestamptz,
  created_at timestamptz not null default now(),

  constraint members_phone_unique unique (phone)
);

-- ---------------------------------------------------------------------
-- 4. Attendance (service_date is computed in Lagos time, not server UTC)
-- ---------------------------------------------------------------------
create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  service_date date not null default ((now() at time zone 'Africa/Lagos')::date),
  check_in_time timestamptz not null default now(),
  check_in_method public.checkin_method_enum not null default 'qr_scan',
  checked_in_by uuid references auth.users(id) on delete set null default auth.uid(),

  -- One check-in per teen per Sunday, enforced by the database itself
  constraint attendance_member_day_unique unique (member_id, service_date)
);

-- ---------------------------------------------------------------------
-- 5. Indexes (phone, member_code, qr_token, member+date already indexed
--    by their unique constraints)
-- ---------------------------------------------------------------------
create index idx_members_church on public.members(church_group);
create index idx_members_status on public.members(status);
create index idx_members_name_trgm on public.members using gin (full_name extensions.gin_trgm_ops);
create index idx_attendance_date on public.attendance(service_date);

-- ---------------------------------------------------------------------
-- 6. Role helpers
-- ---------------------------------------------------------------------
create or replace function public.is_staff()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.profiles where id = auth.uid());
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- ---------------------------------------------------------------------
-- 7. Row Level Security
--    Anonymous visitors get NO direct table access. They only use the
--    two public RPC functions below (register_member, get_pass).
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.members enable row level security;
alter table public.attendance enable row level security;

revoke all on public.profiles, public.members, public.attendance from anon;
grant select, insert, update, delete on public.profiles, public.members, public.attendance to authenticated;
grant usage on sequence public.member_code_seq to authenticated;

-- profiles
create policy "read own profile" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy "admin reads all profiles" on public.profiles
  for select to authenticated
  using ((select public.is_admin()));

-- members: staff (admin + ushers) can read; only admin can change
create policy "staff read members" on public.members
  for select to authenticated
  using ((select public.is_staff()));

create policy "admin insert members" on public.members
  for insert to authenticated
  with check ((select public.is_admin()));

create policy "admin update members" on public.members
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "admin delete members" on public.members
  for delete to authenticated
  using ((select public.is_admin()));

-- attendance: staff can read and check people in; only admin can correct
create policy "staff read attendance" on public.attendance
  for select to authenticated
  using ((select public.is_staff()));

create policy "staff insert attendance" on public.attendance
  for insert to authenticated
  with check ((select public.is_staff()));

create policy "admin update attendance" on public.attendance
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "admin delete attendance" on public.attendance
  for delete to authenticated
  using ((select public.is_admin()));

-- ---------------------------------------------------------------------
-- 8. RPC: public registration (anon allowed)
--    If the phone already exists we do NOT return the token, otherwise
--    anyone who knows a phone number could pull that teen's QR.
-- ---------------------------------------------------------------------
create or replace function public.register_member(
  p_full_name text,
  p_phone text,
  p_age integer,
  p_gender public.gender_enum,
  p_church_group public.church_group_enum,
  p_consent boolean
)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_token text;
begin
  if p_consent is not true then
    raise exception 'Consent is required to register';
  end if;

  if exists (select 1 from public.members m where m.phone = p_phone) then
    return jsonb_build_object('result', 'exists');
  end if;

  insert into public.members (full_name, phone, age, gender, church_group, consent_at)
  values (trim(p_full_name), p_phone, p_age, p_gender, p_church_group, now())
  returning qr_token into v_token;

  return jsonb_build_object('result', 'created', 'qr_token', v_token);

exception
  when unique_violation then
    return jsonb_build_object('result', 'exists');
end;
$$;

-- ---------------------------------------------------------------------
-- 9. RPC: fetch a digital pass by its secret token (anon allowed)
-- ---------------------------------------------------------------------
create or replace function public.get_pass(p_token text)
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object(
    'full_name', m.full_name,
    'church_group', m.church_group,
    'member_code', m.member_code,
    'qr_token', m.qr_token
  )
  from public.members m
  where m.qr_token = p_token and m.status = 'active';
$$;

-- ---------------------------------------------------------------------
-- 10. RPC: check-in (staff only: admin + ushers)
-- ---------------------------------------------------------------------
create or replace function public.check_in_member(
  p_member_id uuid,
  p_method public.checkin_method_enum default 'manual_search'
)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_member public.members%rowtype;
  v_card jsonb;
  v_attendance_id uuid;
begin
  if not public.is_staff() then
    raise exception 'Not authorised' using errcode = '42501';
  end if;

  select * into v_member from public.members where id = p_member_id;
  if not found then
    return jsonb_build_object('result', 'not_found');
  end if;

  v_card := jsonb_build_object(
    'id', v_member.id,
    'full_name', v_member.full_name,
    'church_group', v_member.church_group,
    'member_code', v_member.member_code
  );

  if v_member.status <> 'active' then
    return jsonb_build_object('result', 'inactive', 'member', v_card);
  end if;

  insert into public.attendance (member_id, check_in_method, checked_in_by)
  values (v_member.id, p_method, auth.uid())
  on conflict (member_id, service_date) do nothing
  returning id into v_attendance_id;

  return jsonb_build_object(
    'result', case when v_attendance_id is null then 'already_checked_in' else 'checked_in' end,
    'member', v_card
  );
end;
$$;

create or replace function public.check_in_by_token(p_token text)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_id uuid;
begin
  if not public.is_staff() then
    raise exception 'Not authorised' using errcode = '42501';
  end if;

  select id into v_id from public.members where qr_token = p_token;
  if v_id is null then
    return jsonb_build_object('result', 'not_found');
  end if;

  return public.check_in_member(v_id, 'qr_scan');
end;
$$;

-- ---------------------------------------------------------------------
-- 11. Function permissions
-- ---------------------------------------------------------------------
revoke all on function public.is_staff() from public;
revoke all on function public.is_admin() from public;
revoke all on function public.check_in_member(uuid, public.checkin_method_enum) from public;
revoke all on function public.check_in_by_token(text) from public;
revoke all on function public.register_member(text, text, integer, public.gender_enum, public.church_group_enum, boolean) from public;
revoke all on function public.get_pass(text) from public;

grant execute on function public.is_staff() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.check_in_member(uuid, public.checkin_method_enum) to authenticated;
grant execute on function public.check_in_by_token(text) to authenticated;

grant execute on function public.register_member(text, text, integer, public.gender_enum, public.church_group_enum, boolean) to anon, authenticated;
grant execute on function public.get_pass(text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- 12. Realtime: live "today's check-ins" feed (respects RLS)
-- ---------------------------------------------------------------------
alter publication supabase_realtime add table public.attendance;