-- =====================================================================
-- Phase 6: dashboard statistics (+ one security tightening)
-- Run via `npx supabase db push`, or paste into the Supabase SQL Editor.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Tighten who may run the staff-only functions.
--    Phase 1 revoked them from PUBLIC, but Supabase also grants new
--    functions to `anon` directly, so anon could still call them (the
--    function's own check stopped it, but anon should not get that far).
--    register_member and get_pass stay open to anon: the sign-up form needs them.
-- ---------------------------------------------------------------------
revoke execute on function public.check_in_member(uuid, public.checkin_method_enum) from anon;
revoke execute on function public.check_in_by_token(text) from anon;
revoke execute on function public.is_staff() from anon;
revoke execute on function public.is_admin() from anon;

-- ---------------------------------------------------------------------
-- 2. attendance_summary(date): one row per church for one service date.
--    attended = teens of that church who checked in that day.
--    roster   = who could have come: every ACTIVE member, plus anyone who
--               came that day even if they have since been deactivated.
--               (So turnout = attended / roster can never go over 100%.)
--    These functions run with the caller's rights (security invoker), so
--    row-level security still applies: only logged-in staff get any data.
-- ---------------------------------------------------------------------
create or replace function public.attendance_summary(p_date date)
returns table (church_group public.church_group_enum, attended bigint, roster bigint)
language sql
stable
set search_path = ''
as $$
  select
    c.church_group,
    (
      select count(*)
      from public.attendance a
      join public.members m on m.id = a.member_id
      where a.service_date = p_date and m.church_group = c.church_group
    ) as attended,
    (
      select count(*)
      from public.members m
      where m.church_group = c.church_group
        and (
          m.status = 'active'
          or exists (
            select 1 from public.attendance a
            where a.member_id = m.id and a.service_date = p_date
          )
        )
    ) as roster
  from unnest(enum_range(null::public.church_group_enum)) as c(church_group)
  order by c.church_group;
$$;

-- ---------------------------------------------------------------------
-- 3. attendance_trend(n): the last n service dates that have any check-ins
--    (capped at 52), with a count for EACH church (zero if nobody came).
-- ---------------------------------------------------------------------
create or replace function public.attendance_trend(p_limit integer default 12)
returns table (service_date date, church_group public.church_group_enum, attended bigint)
language sql
stable
set search_path = ''
as $$
  with recent as (
    select distinct a.service_date
    from public.attendance a
    order by a.service_date desc
    limit least(greatest(p_limit, 1), 52)
  ),
  counts as (
    select a.service_date, m.church_group, count(*) as attended
    from public.attendance a
    join public.members m on m.id = a.member_id
    where a.service_date in (select r.service_date from recent r)
    group by a.service_date, m.church_group
  )
  select r.service_date, c.church_group, coalesce(k.attended, 0) as attended
  from recent r
  cross join unnest(enum_range(null::public.church_group_enum)) as c(church_group)
  left join counts k on k.service_date = r.service_date and k.church_group = c.church_group
  order by r.service_date, c.church_group;
$$;

-- ---------------------------------------------------------------------
-- 4. membership_strength(): how big each church is, today.
-- ---------------------------------------------------------------------
create or replace function public.membership_strength()
returns table (
  church_group public.church_group_enum,
  active_members bigint,
  inactive_members bigint,
  male_members bigint,
  female_members bigint,
  new_last_7_days bigint,
  new_last_30_days bigint
)
language sql
stable
set search_path = ''
as $$
  select
    c.church_group,
    count(m.id) filter (where m.status = 'active'),
    count(m.id) filter (where m.status <> 'active'),
    count(m.id) filter (where m.status = 'active' and m.gender = 'Male'),
    count(m.id) filter (where m.status = 'active' and m.gender = 'Female'),
    count(m.id) filter (where m.created_at >= now() - interval '7 days'),
    count(m.id) filter (where m.created_at >= now() - interval '30 days')
  from unnest(enum_range(null::public.church_group_enum)) as c(church_group)
  left join public.members m on m.church_group = c.church_group
  group by c.church_group
  order by c.church_group;
$$;

-- ---------------------------------------------------------------------
-- 5. service_dates(n): the most recent dates that have check-ins (for the date pickers).
-- ---------------------------------------------------------------------
create or replace function public.service_dates(p_limit integer default 60)
returns setof date
language sql
stable
set search_path = ''
as $$
  select distinct a.service_date
  from public.attendance a
  order by a.service_date desc
  limit least(greatest(p_limit, 1), 200);
$$;

-- ---------------------------------------------------------------------
-- 6. Permissions: logged-in staff only.
-- ---------------------------------------------------------------------
revoke all on function public.attendance_summary(date) from public, anon;
revoke all on function public.attendance_trend(integer) from public, anon;
revoke all on function public.membership_strength() from public, anon;
revoke all on function public.service_dates(integer) from public, anon;

grant execute on function public.attendance_summary(date) to authenticated;
grant execute on function public.attendance_trend(integer) to authenticated;
grant execute on function public.membership_strength() to authenticated;
grant execute on function public.service_dates(integer) to authenticated;
