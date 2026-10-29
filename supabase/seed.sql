-- =====================================================================
-- DEV / TEST DATA ONLY. Do NOT run the fake-teens block in production.
-- =====================================================================

-- 60 fake teens split across both churches
insert into public.members (full_name, phone, age, gender, church_group, consent_given)
select
  'Test Teen ' || g,
  '+234801' || lpad(g::text, 7, '0'),
  13 + (g % 8),
  (case when g % 2 = 0 then 'Male' else 'Female' end)::public.gender_enum,
  (case when g % 3 = 0 then 'Church 2' else 'Church 1' end)::public.church_group_enum,
  true
from generate_series(1, 60) as g
on conflict (phone) do nothing;

-- ---------------------------------------------------------------------
-- STAFF SETUP (run AFTER creating the 3 users in Supabase Dashboard ->
-- Authentication -> Users -> Add user, with "Auto Confirm User" ticked).
-- ---------------------------------------------------------------------
insert into public.staff_profiles (id, full_name, role)
select id, 'Salem (Admin)', 'admin'::public.staff_role_enum
from auth.users where email = 'salemsalemhe@gmail.com'
on conflict (id) do nothing;

insert into public.staff_profiles (id, full_name, role)
select id, 'Usher 1', 'usher'::public.staff_role_enum
from auth.users where email = 'fumshasha@gmail.com'
on conflict (id) do nothing;

insert into public.staff_profiles (id, full_name, role)
select id, 'Usher 2', 'usher'::public.staff_role_enum
from auth.users where email = 'testingsalem71@gmail.com'
on conflict (id) do nothing;