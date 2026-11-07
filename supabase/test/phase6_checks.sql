-- =====================================================================
-- PHASE 6 CHECKS: paste the WHOLE file into Supabase SQL Editor and Run.
-- Needs the Phase 6 migration applied, and at least 1 admin in public.profiles.
--
-- It creates a few test teens (phones +2340000001xx) and attendance on three
-- dates in January 2020, compares what the new functions say with numbers it
-- works out a different way, then deletes everything it made. Safe to re-run,
-- and safe next to your real data.
-- =====================================================================

drop table if exists pg_temp.phase6_results;
create temp table phase6_results (id integer, test text, passed boolean, detail text);

create or replace function pg_temp.log_result(p_id integer, p_test text, p_passed boolean, p_detail text)
returns void language plpgsql as $$
begin
  insert into phase6_results values (p_id, p_test, p_passed, p_detail);
end;
$$;

do $$
declare
  d1 constant date := '2020-01-05';
  d2 constant date := '2020-01-12';
  d3 constant date := '2020-01-19';
  v_admin uuid;
  v_claims text;
  base_active_c1 bigint;
  base_active_c2 bigint;
  a1 uuid; a2 uuid; a3 uuid; b1 uuid; b2 uuid; b3 uuid;
  n bigint; n2 bigint;
  r record;
  ok boolean;
  txt text;
begin
  delete from public.members where phone like '+2340000001%';
  select id into v_admin from public.profiles where role = 'admin' limit 1;
  if v_admin is null then
    perform pg_temp.log_result(0, 'SETUP: need 1 admin in public.profiles', false, 'Create the admin first (see seed.sql)');
    return;
  end if;
  v_claims := json_build_object('sub', v_admin, 'role', 'authenticated')::text;

  -- how many active members each church has BEFORE the test people exist
  select count(*) into base_active_c1 from public.members where status = 'active' and church_group = 'Church 1';
  select count(*) into base_active_c2 from public.members where status = 'active' and church_group = 'Church 2';

  -- six test teens: A = Church 1, B = Church 2
  insert into public.members (full_name, phone, gender, church_group, status) values
    ('ZZ A1 active',   '+2340000001001', 'Male',   'Church 1', 'active'),
    ('ZZ A2 active',   '+2340000001002', 'Female', 'Church 1', 'active'),
    ('ZZ A3 active',   '+2340000001003', 'Female', 'Church 1', 'active'),
    ('ZZ B1 active',   '+2340000001004', 'Male',   'Church 2', 'active'),
    ('ZZ B2 inactive', '+2340000001005', 'Female', 'Church 2', 'inactive'),
    ('ZZ B3 inactive', '+2340000001006', 'Male',   'Church 2', 'inactive');
  select id into a1 from public.members where phone = '+2340000001001';
  select id into a2 from public.members where phone = '+2340000001002';
  select id into a3 from public.members where phone = '+2340000001003';
  select id into b1 from public.members where phone = '+2340000001004';
  select id into b2 from public.members where phone = '+2340000001005';
  select id into b3 from public.members where phone = '+2340000001006';

  -- d1: A1, A2, B1, B2 came (B2 has since been deactivated)   d2: only A1   d3: only B1
  insert into public.attendance (member_id, service_date) values
    (a1, d1), (a2, d1), (b1, d1), (b2, d1), (a1, d2), (b1, d3);

  -- 1. attendance_summary on a busy day, as the admin
  set local role authenticated;
  perform set_config('request.jwt.claims', v_claims, true);
  ok := true; txt := '';
  for r in select * from public.attendance_summary(d1) loop
    txt := txt || r.church_group || ': attended ' || r.attended || ', roster ' || r.roster || '; ';
    if r.church_group = 'Church 1' then ok := ok and r.attended = 2 and r.roster = base_active_c1 + 3; end if;
    if r.church_group = 'Church 2' then ok := ok and r.attended = 2 and r.roster = base_active_c2 + 2; end if;
  end loop;
  reset role;
  perform pg_temp.log_result(1, 'attendance_summary: counts who came, and roster = active members + anyone who came that day', ok, txt);

  -- 2. a day nobody came
  set local role authenticated;
  perform set_config('request.jwt.claims', v_claims, true);
  select count(*), coalesce(sum(attended), 0) into n, n2 from public.attendance_summary('2020-02-02');
  reset role;
  perform pg_temp.log_result(2, 'attendance_summary: an empty day gives a row per church with 0 attended', n = 2 and n2 = 0, n || ' rows, ' || n2 || ' attended');

  -- 3. turnout can never go over 100% (roster always includes everyone who came)
  set local role authenticated;
  perform set_config('request.jwt.claims', v_claims, true);
  select bool_and(attended <= roster) into ok from public.attendance_summary(d1);
  reset role;
  perform pg_temp.log_result(3, 'attendance_summary: attended is never more than the roster', ok, null);

  -- 4. the trend: one row per church per date, zeros filled in
  set local role authenticated;
  perform set_config('request.jwt.claims', v_claims, true);
  select string_agg(service_date || ' ' || church_group || '=' || attended, ', ' order by service_date, church_group)
    into txt from public.attendance_trend(52) where service_date in (d1, d2, d3);
  reset role;
  perform pg_temp.log_result(4, 'attendance_trend: a row for each church on each date, with zeros filled in',
    txt = '2020-01-05 Church 1=2, 2020-01-05 Church 2=2, 2020-01-12 Church 1=1, 2020-01-12 Church 2=0, 2020-01-19 Church 1=0, 2020-01-19 Church 2=1', txt);

  -- 5. the trend is limited to the number of dates asked for, newest first
  set local role authenticated;
  perform set_config('request.jwt.claims', v_claims, true);
  select count(distinct service_date) into n from public.attendance_trend(2);
  select max(service_date) into txt from public.attendance_trend(1);
  reset role;
  perform pg_temp.log_result(5, 'attendance_trend: limit is respected and the newest dates win', n = 2 and txt::date = (select max(service_date) from public.attendance), n || ' dates');

  -- 6. membership strength matches a separate count
  set local role authenticated;
  perform set_config('request.jwt.claims', v_claims, true);
  ok := true; txt := '';
  for r in select * from public.membership_strength() loop
    txt := txt || r.church_group || ': active ' || r.active_members || ', inactive ' || r.inactive_members || ', M ' || r.male_members || ', F ' || r.female_members || '; ';
  end loop;
  select bool_and(
      s.active_members   = (select count(*) from public.members m where m.church_group = s.church_group and m.status = 'active')
  and s.inactive_members = (select count(*) from public.members m where m.church_group = s.church_group and m.status <> 'active')
  and s.male_members     = (select count(*) from public.members m where m.church_group = s.church_group and m.status = 'active' and m.gender = 'Male')
  and s.female_members   = (select count(*) from public.members m where m.church_group = s.church_group and m.status = 'active' and m.gender = 'Female')
  and s.new_last_7_days  <= s.new_last_30_days)
    into ok from public.membership_strength() s;
  reset role;
  perform pg_temp.log_result(6, 'membership_strength: totals match a separate count; both churches always listed', coalesce(ok, false), txt);

  -- 7. the test teens are counted (Church 1 gained 3 active, Church 2 gained 1 active)
  set local role authenticated;
  perform set_config('request.jwt.claims', v_claims, true);
  select active_members into n from public.membership_strength() where church_group = 'Church 1';
  select active_members into n2 from public.membership_strength() where church_group = 'Church 2';
  reset role;
  perform pg_temp.log_result(7, 'membership_strength: counts the people we just added', n = base_active_c1 + 3 and n2 = base_active_c2 + 1, 'C1 active ' || n || ', C2 active ' || n2);

  -- 8. service_dates: newest first, no repeats, includes the test dates
  set local role authenticated;
  perform set_config('request.jwt.claims', v_claims, true);
  select count(*), count(distinct x) into n, n2 from public.service_dates(200) x;
  select string_agg(x::text, ',' order by x desc) into txt from public.service_dates(200) x where x in (d1, d2, d3);
  reset role;
  perform pg_temp.log_result(8, 'service_dates: no repeats, newest first, includes the test dates', n = n2 and txt = '2020-01-19,2020-01-12,2020-01-05', txt);

  -- 9. a visitor who is not logged in can run none of them
  ok := true; txt := '';
  begin
    perform set_config('request.jwt.claims', '{"role":"anon"}', true);
    set local role anon;
    perform * from public.attendance_summary(d1);
    ok := false; txt := 'attendance_summary ran for anon';
  exception when insufficient_privilege then null;
  end;
  reset role;
  begin
    perform set_config('request.jwt.claims', '{"role":"anon"}', true);
    set local role anon;
    perform * from public.attendance_trend(5);
    ok := false; txt := txt || ' attendance_trend ran for anon';
  exception when insufficient_privilege then null;
  end;
  reset role;
  begin
    perform set_config('request.jwt.claims', '{"role":"anon"}', true);
    set local role anon;
    perform * from public.membership_strength();
    ok := false; txt := txt || ' membership_strength ran for anon';
  exception when insufficient_privilege then null;
  end;
  reset role;
  begin
    perform set_config('request.jwt.claims', '{"role":"anon"}', true);
    set local role anon;
    perform * from public.service_dates(5);
    ok := false; txt := txt || ' service_dates ran for anon';
  exception when insufficient_privilege then null;
  end;
  reset role;
  perform pg_temp.log_result(9, 'Not-logged-in visitors cannot run any dashboard function', ok, nullif(txt, ''));

  -- 10. nor the staff-only check-in functions (the Phase 6 tightening)
  ok := true; txt := '';
  begin
    perform set_config('request.jwt.claims', '{"role":"anon"}', true);
    set local role anon;
    perform public.check_in_member(a1, 'manual_search');
    ok := false; txt := 'check_in_member ran for anon';
  exception when insufficient_privilege then txt := sqlerrm;
  end;
  reset role;
  begin
    perform set_config('request.jwt.claims', '{"role":"anon"}', true);
    set local role anon;
    perform public.check_in_by_token('0123456789abcdef0123456789abcdef');
    ok := false; txt := txt || ' check_in_by_token ran for anon';
  exception when insufficient_privilege then null;
  end;
  reset role;
  perform pg_temp.log_result(10, 'Not-logged-in visitors cannot even RUN the check-in functions', ok, txt);

  -- 11. but the public sign-up functions still work for them
  begin
    perform set_config('request.jwt.claims', '{"role":"anon"}', true);
    set local role anon;
    perform public.get_pass('0123456789abcdef0123456789abcdef');
    reset role;
    perform pg_temp.log_result(11, 'The public pass lookup still works for visitors', true, null);
  exception when others then
    reset role;
    perform pg_temp.log_result(11, 'The public pass lookup still works for visitors', false, sqlerrm);
  end;

  -- clean up everything this script made (attendance goes with the members)
  perform set_config('request.jwt.claims', '', true);
  delete from public.members where phone like '+2340000001%';
end;
$$;

select id, test, case when passed then 'PASS' else 'FAIL' end as result, detail
from pg_temp.phase6_results
order by id;