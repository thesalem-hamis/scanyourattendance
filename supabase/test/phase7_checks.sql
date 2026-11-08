-- =====================================================================
-- PHASE 7 CHECKS: paste the WHOLE file into Supabase SQL Editor and Run.
-- Needs the Phase 7 migration applied, plus at least 1 admin and 1 usher in public.profiles.
--
-- It creates a few test teens (phones +2340000002xx) and some attendance in early 2020,
-- tries things as an admin, an usher and a not-logged-in visitor, then deletes everything
-- it made. Safe to re-run, and safe next to your real data.
-- =====================================================================

drop table if exists pg_temp.phase7_results;
create temp table phase7_results (id integer, test text, passed boolean, detail text);

create or replace function pg_temp.log_result(p_id integer, p_test text, p_passed boolean, p_detail text)
returns void language plpgsql as $$
begin
  insert into phase7_results values (p_id, p_test, p_passed, p_detail);
end;
$$;

-- Runs ONE statement as a given role/user and returns its single value as text,
-- or 'ERR <sqlstate>' if the database refused. Always puts the role back afterwards.
create or replace function pg_temp.as_user(p_role text, p_uid uuid, p_sql text)
returns text language plpgsql as $$
declare result text;
begin
  perform set_config('request.jwt.claims',
    case when p_uid is null then json_build_object('role', p_role)::text
         else json_build_object('sub', p_uid, 'role', p_role)::text end, true);
  execute format('set local role %I', p_role);
  begin
    execute p_sql into result;
  exception when others then
    result := 'ERR ' || sqlstate;
  end;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  return coalesce(result, 'null');
end;
$$;

do $$
declare
  d0 constant date := '2020-01-26';
  d1 constant date := '2020-02-02';
  v_admin uuid;
  v_usher uuid;
  a1 uuid; a2 uuid; b1 uuid; b2 uuid;
  r text;
  txt text;
begin
  delete from public.members where phone like '+2340000002%';
  delete from public.app_settings;  -- start from "built-in wording"; the test below restores nothing, see note at the end

  select id into v_admin from public.profiles where role = 'admin' limit 1;
  select id into v_usher from public.profiles where role = 'usher' limit 1;
  if v_admin is null or v_usher is null then
    perform pg_temp.log_result(0, 'SETUP: need 1 admin and 1 usher in public.profiles', false, 'Create the staff users first (see seed.sql)');
    return;
  end if;

  insert into public.members (full_name, phone, gender, church_group, status) values
    ('ZZ A1 came',      '+2340000002001', 'Male',   'Church 1', 'active'),
    ('ZZ A2 absent',    '+2340000002002', 'Female', 'Church 1', 'active'),
    ('ZZ B1 absent',    '+2340000002003', 'Male',   'Church 2', 'active'),
    ('ZZ B2 inactive',  '+2340000002004', 'Female', 'Church 2', 'inactive');
  select id into a1 from public.members where phone = '+2340000002001';
  select id into a2 from public.members where phone = '+2340000002002';
  select id into b1 from public.members where phone = '+2340000002003';
  select id into b2 from public.members where phone = '+2340000002004';

  -- d0: A2 came.  d1: only A1 came.
  insert into public.attendance (member_id, service_date) values (a2, d0), (a1, d1);

  -- 1. who is absent on d1 (both churches): the two active people who did not come
  r := pg_temp.as_user('authenticated', v_admin,
    $q$select string_agg(full_name, ', ' order by full_name) from public.absentees('2020-02-02') where phone like '+2340000002%'$q$);
  perform pg_temp.log_result(1, 'absentees: active members who did not come (not those who came, not inactive ones)',
    r = 'ZZ A2 absent, ZZ B1 absent', r);

  -- 2. church filter
  r := pg_temp.as_user('authenticated', v_admin,
    $q$select string_agg(full_name, ', ') from public.absentees('2020-02-02', 'Church 2') where phone like '+2340000002%'$q$);
  txt := pg_temp.as_user('authenticated', v_admin,
    $q$select string_agg(full_name, ', ') from public.absentees('2020-02-02', 'Church 1') where phone like '+2340000002%'$q$);
  perform pg_temp.log_result(2, 'absentees: can be limited to one church', r = 'ZZ B1 absent' and txt = 'ZZ A2 absent', 'C2: ' || r || ' | C1: ' || txt);

  -- 3. last time they came before that date
  r := pg_temp.as_user('authenticated', v_admin,
    $q$select string_agg(full_name || '=' || coalesce(last_attended::text, 'never'), ', ' order by full_name) from public.absentees('2020-02-02') where phone like '+2340000002%'$q$);
  perform pg_temp.log_result(3, 'absentees: shows when each person last came (or never)', r = 'ZZ A2 absent=2020-01-26, ZZ B1 absent=never', r);

  -- 4. an admin marks someone contacted; the stamp (who/when) comes from the database, not the caller
  r := pg_temp.as_user('authenticated', v_admin,
    format($q$insert into public.followups (member_id, service_date, channel, contacted_by) values (%L, '2020-02-02', 'whatsapp', %L) returning contacted_by::text$q$, a2, v_usher));
  perform pg_temp.log_result(4, 'followups: admin can record a contact, and "contacted by" is set by the database (cannot be faked)',
    r = v_admin::text, 'contacted_by = ' || r);

  -- 5. the absentee list now shows who was contacted, and how
  r := pg_temp.as_user('authenticated', v_admin,
    $q$select string_agg(full_name || '=' || coalesce(contacted_channel, 'no'), ', ' order by full_name) from public.absentees('2020-02-02') where phone like '+2340000002%'$q$);
  perform pg_temp.log_result(5, 'absentees: shows who has already been contacted', r = 'ZZ A2 absent=whatsapp, ZZ B1 absent=no', r);

  -- 6. contacting the same person again for the same date updates the one record (no duplicates)
  r := pg_temp.as_user('authenticated', v_admin,
    format($q$insert into public.followups (member_id, service_date, channel) values (%L, '2020-02-02', 'call') on conflict (member_id, service_date) do update set channel = excluded.channel returning channel$q$, a2));
  txt := pg_temp.as_user('authenticated', v_admin, format($q$select count(*)::text from public.followups where member_id = %L$q$, a2));
  perform pg_temp.log_result(6, 'followups: contacting again updates the same record instead of adding another', r = 'call' and txt = '1', 'channel ' || r || ', rows ' || txt);

  -- 7. a plain duplicate is refused; an invalid channel is refused
  r := pg_temp.as_user('authenticated', v_admin, format($q$insert into public.followups (member_id, service_date, channel) values (%L, '2020-02-02', 'sms') returning 'x'$q$, a2));
  txt := pg_temp.as_user('authenticated', v_admin, format($q$insert into public.followups (member_id, service_date, channel) values (%L, '2020-02-02', 'carrier pigeon') returning 'x'$q$, b1));
  perform pg_temp.log_result(7, 'followups: duplicates and unknown channels are refused', r = 'ERR 23505' and txt = 'ERR 23514', r || ' / ' || txt);

  -- 8. ushers cannot read or write follow-ups
  r := pg_temp.as_user('authenticated', v_usher, 'select count(*)::text from public.followups');
  txt := pg_temp.as_user('authenticated', v_usher, format($q$insert into public.followups (member_id, service_date, channel) values (%L, '2020-02-02', 'sms') returning 'x'$q$, b1));
  perform pg_temp.log_result(8, 'followups: an usher sees nothing and cannot add anything', r = '0' and txt = 'ERR 42501', 'rows seen ' || r || ' / insert ' || txt);

  -- 9. an usher running the absentee list does not see who was contacted
  r := pg_temp.as_user('authenticated', v_usher,
    $q$select count(*)::text from public.absentees('2020-02-02') where phone like '+2340000002%' and contacted_at is not null$q$);
  perform pg_temp.log_result(9, 'absentees: ushers cannot see contact details (row-level security still applies)', r = '0', r);

  -- 10. a visitor who is not logged in gets nothing
  r := pg_temp.as_user('anon', null, 'select count(*)::text from public.followups');
  txt := pg_temp.as_user('anon', null, 'select count(*)::text from public.absentees(''2020-02-02'')');
  perform pg_temp.log_result(10, 'Not-logged-in visitors cannot read follow-ups or run the absentee list',
    r like 'ERR 42501' and txt = 'ERR 42501', r || ' / ' || txt);

  -- 11. settings: admin can save wording; the database stamps who and when
  r := pg_temp.as_user('authenticated', v_admin,
    $q$insert into public.app_settings (key, value) values ('template.absence_followup', to_jsonb('Hi {name}, we missed you on {date}!'::text)) returning updated_by::text$q$);
  perform pg_temp.log_result(11, 'app_settings: admin can save wording, and "updated by" is stamped by the database', r = v_admin::text, r);

  -- 12. everyone on staff can read the wording; only the admin can change or delete it
  r := pg_temp.as_user('authenticated', v_usher, 'select count(*)::text from public.app_settings');
  txt := pg_temp.as_user('authenticated', v_usher, $q$update public.app_settings set value = to_jsonb('hacked'::text) returning 'x'$q$);
  perform pg_temp.log_result(12, 'app_settings: an usher can read the wording but not change it',
    r = '1' and txt = 'null', 'read ' || r || ' / update touched ' || (case when txt = 'null' then '0 rows' else txt end));
  txt := pg_temp.as_user('authenticated', v_usher, $q$insert into public.app_settings (key, value) values ('template.pass_share', to_jsonb('x {link}'::text)) returning 'x'$q$);
  perform pg_temp.log_result(13, 'app_settings: an usher cannot add wording either', txt = 'ERR 42501', txt);

  -- 14. the database only accepts the two known settings, with short text values
  r := pg_temp.as_user('authenticated', v_admin, $q$insert into public.app_settings (key, value) values ('something.else', to_jsonb('x'::text)) returning 'x'$q$);
  txt := pg_temp.as_user('authenticated', v_admin, $q$insert into public.app_settings (key, value) values ('template.pass_share', to_jsonb(''::text)) returning 'x'$q$);
  perform pg_temp.log_result(14, 'app_settings: unknown keys and empty wording are refused', r = 'ERR 23514' and txt = 'ERR 23514', r || ' / ' || txt);
  r := pg_temp.as_user('authenticated', v_admin, format($q$insert into public.app_settings (key, value) values ('template.pass_share', to_jsonb(%L::text)) returning 'x'$q$, repeat('x', 1001)));
  txt := pg_temp.as_user('authenticated', v_admin, $q$insert into public.app_settings (key, value) values ('template.pass_share', '{"a":1}'::jsonb) returning 'x'$q$);
  perform pg_temp.log_result(15, 'app_settings: over-long wording and non-text values are refused', r = 'ERR 23514' and txt = 'ERR 23514', r || ' / ' || txt);

  -- 16. a visitor cannot read the wording
  r := pg_temp.as_user('anon', null, 'select count(*)::text from public.app_settings');
  perform pg_temp.log_result(16, 'app_settings: not-logged-in visitors cannot read it', r = 'ERR 42501', r);

  -- 17. resetting to the built-in wording = deleting the row (admin only)
  txt := pg_temp.as_user('authenticated', v_usher, $q$delete from public.app_settings returning 'x'$q$);
  r := pg_temp.as_user('authenticated', v_admin, $q$delete from public.app_settings where key = 'template.absence_followup' returning key$q$);
  perform pg_temp.log_result(17, 'app_settings: only the admin can reset wording to the default', txt = 'null' and r = 'template.absence_followup', 'usher ' || txt || ' / admin ' || r);

  -- 18. removing a member removes their follow-up records too
  delete from public.members where id = a2;
  select count(*)::text into r from public.followups where member_id = a2;
  perform pg_temp.log_result(18, 'followups: deleted with the member (no orphan records)', r = '0', r);

  -- clean up everything this script made
  delete from public.members where phone like '+2340000002%';
  delete from public.app_settings;
end;
$$;

select id, test, case when passed then 'PASS' else 'FAIL' end as result, detail
from pg_temp.phase7_results
order by id;
