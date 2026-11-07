-- =====================================================================
-- PHASE 1 CHECKS: paste the WHOLE file into Supabase SQL Editor and Run.
--
-- Why this script exists: the SQL Editor runs as the `postgres` owner,
-- which bypasses RLS. A plain `select * from members` there will ALWAYS
-- work and proves nothing. This script switches into the real `anon`
-- and `authenticated` roles (with a usher / admin identity) so the
-- policies are actually enforced.
--
-- Requirements before running:
--   1. 20261029000000_init.sql has been run
--   2. At least 1 admin and 1 usher exist in public.profiles
--
-- It creates a few rows with phones starting +2340000000 and deletes
-- them again at the end, so it is safe to re-run.
--
-- v2: every "anonymous" test now starts with anonymous login claims. Before, the claims
-- of the usher from an earlier test were still set, so tests 9 and 10 could wrongly say FAIL.
-- =====================================================================

drop table if exists pg_temp.phase1_results;
create temp table phase1_results (
  id integer,
  test text,
  passed boolean,
  detail text
);

create or replace function pg_temp.log_result(p_id integer, p_test text, p_passed boolean, p_detail text)
returns void language plpgsql as $$
begin
  insert into phase1_results values (p_id, p_test, p_passed, p_detail);
end;
$$;

do $$
declare
  v_admin uuid;
  v_usher uuid;
  v_member uuid;
  v_token text;
  v_claims_admin text;
  v_claims_usher text;
  r jsonb;
  n integer;
begin
  -- clean slate from any previous run
  delete from public.members where phone like '+2340000000%';

  select id into v_admin from public.profiles where role = 'admin' limit 1;
  select id into v_usher from public.profiles where role = 'usher' limit 1;

  if v_admin is null or v_usher is null then
    perform pg_temp.log_result(0, 'SETUP: need 1 admin and 1 usher in public.profiles', false,
      'Create the users in Authentication, then insert their profiles (see seed.sql)');
    return;
  end if;

  v_claims_admin := json_build_object('sub', v_admin, 'role', 'authenticated')::text;
  v_claims_usher := json_build_object('sub', v_usher, 'role', 'authenticated')::text;

  -- a test teen created as owner
  insert into public.members (full_name, phone, age, gender, church_group, consent_at)
  values ('ZZ Test Teen', '+2340000000001', 15, 'Male', 'Church 1', now())
  returning id, qr_token into v_member, v_token;

  -- 1. logged out cannot read members
  begin
    perform set_config('request.jwt.claims', '{"role":"anon"}', true); -- a visitor, not whoever tested before
    set local role anon;
    perform 1 from public.members limit 1;
    reset role;
    perform pg_temp.log_result(1, 'Logged out (anon) cannot read members', false, 'anon read succeeded');
  exception when insufficient_privilege then
    reset role;
    perform pg_temp.log_result(1, 'Logged out (anon) cannot read members', true, sqlerrm);
  end;

  -- 2. usher can read members
  begin
    set local role authenticated;
    perform set_config('request.jwt.claims', v_claims_usher, true);
    select count(*) into n from public.members;
    reset role;
    perform pg_temp.log_result(2, 'Usher can read members', n > 0, n || ' rows visible');
  exception when others then
    reset role;
    perform pg_temp.log_result(2, 'Usher can read members', false, sqlerrm);
  end;

  -- 3. usher cannot insert members
  begin
    set local role authenticated;
    perform set_config('request.jwt.claims', v_claims_usher, true);
    insert into public.members (full_name, phone, age, gender, church_group)
    values ('ZZ Usher Insert', '+2340000000009', 15, 'Male', 'Church 1');
    reset role;
    perform pg_temp.log_result(3, 'Usher cannot insert members', false, 'insert succeeded');
  exception when insufficient_privilege then
    reset role;
    perform pg_temp.log_result(3, 'Usher cannot insert members', true, sqlerrm);
  end;

  -- 4. first check-in by token
  begin
    set local role authenticated;
    perform set_config('request.jwt.claims', v_claims_usher, true);
    r := public.check_in_by_token(v_token);
    reset role;
    perform pg_temp.log_result(4, 'First check_in_by_token returns checked_in', r->>'result' = 'checked_in', r::text);
  exception when others then
    reset role;
    perform pg_temp.log_result(4, 'First check_in_by_token returns checked_in', false, sqlerrm);
  end;

  -- 5. second check-in by token
  begin
    set local role authenticated;
    perform set_config('request.jwt.claims', v_claims_usher, true);
    r := public.check_in_by_token(v_token);
    reset role;
    perform pg_temp.log_result(5, 'Second check_in_by_token returns already_checked_in', r->>'result' = 'already_checked_in', r::text);
  exception when others then
    reset role;
    perform pg_temp.log_result(5, 'Second check_in_by_token returns already_checked_in', false, sqlerrm);
  end;

  -- 6. exactly one attendance row
  select count(*) into n from public.attendance where member_id = v_member;
  perform pg_temp.log_result(6, 'Attendance table has exactly 1 row for that teen', n = 1, n || ' row(s)');

  -- 7. register_member first call
  begin
    perform set_config('request.jwt.claims', '{"role":"anon"}', true); -- a visitor, not whoever tested before
    set local role anon;
    r := public.register_member('ZZ Anon Teen', '+2340000000003', 14, 'Female', 'Church 2', true);
    reset role;
    perform pg_temp.log_result(7, 'register_member first call returns created', r->>'result' = 'created', 'result=' || (r->>'result'));
  exception when others then
    reset role;
    perform pg_temp.log_result(7, 'register_member first call returns created', false, sqlerrm);
  end;

  -- 8. register_member same phone again (and no token leaked)
  begin
    perform set_config('request.jwt.claims', '{"role":"anon"}', true); -- a visitor, not whoever tested before
    set local role anon;
    r := public.register_member('ZZ Anon Teen', '+2340000000003', 14, 'Female', 'Church 2', true);
    reset role;
    perform pg_temp.log_result(8, 'register_member same phone returns exists, with no qr_token',
      r->>'result' = 'exists' and not (r ? 'qr_token'), r::text);
  exception when others then
    reset role;
    perform pg_temp.log_result(8, 'register_member same phone returns exists, with no qr_token', false, sqlerrm);
  end;

  -- 9. anon cannot call check_in_member
  begin
    perform set_config('request.jwt.claims', '{"role":"anon"}', true); -- a visitor, not whoever tested before
    set local role anon;
    r := public.check_in_member(v_member, 'manual_search');
    reset role;
    perform pg_temp.log_result(9, 'Anon cannot call check_in_member', false, 'call succeeded');
  exception when insufficient_privilege then
    reset role;
    perform pg_temp.log_result(9, 'Anon cannot call check_in_member', true, sqlerrm);
  end;

  -- 10. anon cannot call check_in_by_token
  begin
    perform set_config('request.jwt.claims', '{"role":"anon"}', true); -- a visitor, not whoever tested before
    set local role anon;
    r := public.check_in_by_token(v_token);
    reset role;
    perform pg_temp.log_result(10, 'Anon cannot call check_in_by_token', false, 'call succeeded');
  exception when insufficient_privilege then
    reset role;
    perform pg_temp.log_result(10, 'Anon cannot call check_in_by_token', true, sqlerrm);
  end;

  -- 11. anon can fetch a pass with a valid token (and only that)
  begin
    perform set_config('request.jwt.claims', '{"role":"anon"}', true); -- a visitor, not whoever tested before
    set local role anon;
    r := public.get_pass(v_token);
    reset role;
    perform pg_temp.log_result(11, 'Anon can get a pass with a valid token', r->>'full_name' = 'ZZ Test Teen', r::text);
  exception when others then
    reset role;
    perform pg_temp.log_result(11, 'Anon can get a pass with a valid token', false, sqlerrm);
  end;

  -- 12. admin can insert members
  begin
    set local role authenticated;
    perform set_config('request.jwt.claims', v_claims_admin, true);
    insert into public.members (full_name, phone, age, gender, church_group)
    values ('ZZ Admin Insert', '+2340000000002', 16, 'Female', 'Church 2');
    reset role;
    perform pg_temp.log_result(12, 'Admin can insert members', true, 'insert succeeded');
  exception when others then
    reset role;
    perform pg_temp.log_result(12, 'Admin can insert members', false, sqlerrm);
  end;

  -- 13. usher cannot update members (RLS makes it affect 0 rows, no error)
  begin
    set local role authenticated;
    perform set_config('request.jwt.claims', v_claims_usher, true);
    update public.members set full_name = 'ZZ HACKED' where id = v_member;
    get diagnostics n = row_count;
    reset role;
    perform pg_temp.log_result(13, 'Usher cannot update members', n = 0, n || ' row(s) changed');
  exception when others then
    reset role;
    perform pg_temp.log_result(13, 'Usher cannot update members', true, sqlerrm);
  end;

  -- 14. usher cannot delete members
  begin
    set local role authenticated;
    perform set_config('request.jwt.claims', v_claims_usher, true);
    delete from public.members where id = v_member;
    get diagnostics n = row_count;
    reset role;
    perform pg_temp.log_result(14, 'Usher cannot delete members', n = 0, n || ' row(s) deleted');
  exception when others then
    reset role;
    perform pg_temp.log_result(14, 'Usher cannot delete members', true, sqlerrm);
  end;

  -- remove everything this script created
  delete from public.members where phone like '+2340000000%';
end;
$$;

select
  id,
  test,
  case when passed then 'PASS' else 'FAIL' end as result,
  detail
from pg_temp.phase1_results
order by id;
