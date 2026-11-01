-- Dummy data for local testing.
-- Run in Supabase dashboard → SQL Editor. Safe to run more than once.
--
-- Creates 3 test accounts (password for all: password123):
--   maya.test@northeastern.edu    first-year student (buyer)
--   jordan.test@northeastern.edu  graduating senior (seller)
--   priya.test@northeastern.edu   alum (seller)
-- and 9 listings (8 active, 1 sold with a review), tags, and one photo each.
--
-- To remove everything this file added, run the block at the bottom.

begin;

-- University ------------------------------------------------------------

insert into public.universities (name, email_domain)
select 'Northeastern University', 'northeastern.edu'
where not exists (
  select 1 from public.universities
  where email_domain in ('northeastern.edu', '@northeastern.edu')
);

-- Auth accounts (so the test users can actually log in) ----------------

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select
  '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email,
  extensions.crypt('password123', extensions.gen_salt('bf')), now(),
  '{"provider": "email", "providers": ["email"]}',
  jsonb_build_object('display_name', u.display_name, 'full_name', u.display_name),
  now(), now(), '', '', '', ''
from (values
  ('00000000-0000-4000-a000-000000000001'::uuid, 'maya.test@northeastern.edu', 'Maya Chen'),
  ('00000000-0000-4000-a000-000000000002'::uuid, 'jordan.test@northeastern.edu', 'Jordan Rivera'),
  ('00000000-0000-4000-a000-000000000003'::uuid, 'priya.test@northeastern.edu', 'Priya Shah')
) as u(id, email, display_name)
on conflict do nothing;

insert into auth.identities (user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
select
  u.id, u.id::text, 'email',
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  now(), now(), now()
from auth.users u
where u.id in (
  '00000000-0000-4000-a000-000000000001',
  '00000000-0000-4000-a000-000000000002',
  '00000000-0000-4000-a000-000000000003'
)
on conflict do nothing;

-- Profiles (updates the row if a sign-up trigger already created it) ----

insert into public.users (id, email, display_name, grad_year, affiliation, university_id)
select u.id, u.email, u.display_name, u.grad_year, u.affiliation::affiliation,
  (select id from public.universities
   where email_domain in ('northeastern.edu', '@northeastern.edu') limit 1)
from (values
  ('00000000-0000-4000-a000-000000000001'::uuid, 'maya.test@northeastern.edu', 'Maya Chen', 2030, 'student'),
  ('00000000-0000-4000-a000-000000000002'::uuid, 'jordan.test@northeastern.edu', 'Jordan Rivera', 2027, 'student'),
  ('00000000-0000-4000-a000-000000000003'::uuid, 'priya.test@northeastern.edu', 'Priya Shah', 2024, 'alum')
) as u(id, email, display_name, grad_year, affiliation)
on conflict (id) do update set
  display_name = excluded.display_name,
  grad_year = excluded.grad_year,
  affiliation = excluded.affiliation;

-- Listings ------------------------------------------------------------

insert into public.listings (
  id, seller_id, title, description, category, price_cents, is_free, open_to_trade,
  condition, size, course_code, event_date, campus_area, payment_methods,
  status, buyer_id, sold_at, created_at
)
values
  ('00000000-0000-4000-b000-000000000001', '00000000-0000-4000-a000-000000000002',
   'IKEA Malm desk', 'White desk with one drawer. Small scratch on the left side. Must pick up, I can help carry it down.',
   'furniture', 4000, false, true, 'good', null, null, null, 'West Village',
   '{cash,venmo,trade}', 'active', null, null, now() - interval '2 hours'),

  ('00000000-0000-4000-b000-000000000002', '00000000-0000-4000-a000-000000000002',
   '27-inch Dell monitor', 'Dell S2721H, 1080p, HDMI cable included. Works perfectly.',
   'electronics', 9000, false, false, 'like_new', null, null, null, 'West Village',
   '{cash,venmo,zelle}', 'active', null, null, now() - interval '5 hours'),

  ('00000000-0000-4000-b000-000000000003', '00000000-0000-4000-a000-000000000002',
   'Gray futon couch', 'Folds flat into a bed. Some wear on the arms. Open to trading for a smaller chair.',
   'furniture', 6000, false, true, 'fair', null, null, null, 'Mission Hill',
   '{cash,venmo,trade}', 'active', null, null, now() - interval '1 day'),

  ('00000000-0000-4000-b000-000000000004', '00000000-0000-4000-a000-000000000001',
   'Calculus: Early Transcendentals (9th ed.)', 'Stewart. Some highlighting in the first three chapters, otherwise clean.',
   'textbooks', 3500, false, false, 'good', null, 'MATH 1341', null, 'Snell Library',
   '{cash,venmo}', 'active', null, null, now() - interval '3 hours'),

  ('00000000-0000-4000-b000-000000000005', '00000000-0000-4000-a000-000000000003',
   'Celtics vs. Knicks: 2 tickets', 'Two seats together in the balcony. Selling at face value, transferred through the app.',
   'tickets', 15000, false, false, 'new', null, null, '2026-12-12', 'Huntington Ave',
   '{venmo,zelle}', 'active', null, null, now() - interval '30 minutes'),

  ('00000000-0000-4000-b000-000000000006', '00000000-0000-4000-a000-000000000001',
   'Mini fridge (3.1 cu ft)', 'Has a small freezer section. Cleaned and defrosted.',
   'appliances', 5000, false, false, 'good', null, null, null, 'Fenway',
   '{cash}', 'active', null, null, now() - interval '2 days'),

  ('00000000-0000-4000-b000-000000000007', '00000000-0000-4000-a000-000000000003',
   'Northeastern hoodie', 'Red, barely worn. Bought the wrong size.',
   'clothing', 2000, false, true, 'like_new', 'M', null, null, 'Columbus Ave',
   '{cash,venmo,trade}', 'active', null, null, now() - interval '6 hours'),

  ('00000000-0000-4000-b000-000000000008', '00000000-0000-4000-a000-000000000002',
   'Desk lamp and storage bins', 'Free to whoever picks it up first. Moving out this week.',
   'dorm_essentials', null, true, false, 'good', null, null, null, 'West Village',
   '{}', 'active', null, null, now() - interval '20 minutes'),

  ('00000000-0000-4000-b000-000000000009', '00000000-0000-4000-a000-000000000002',
   'Small bookshelf', 'Three shelves, easy to carry.',
   'furniture', 2500, false, false, 'good', null, null, null, 'West Village',
   '{cash,venmo}', 'sold', '00000000-0000-4000-a000-000000000001', now() - interval '2 days',
   now() - interval '4 days')
on conflict do nothing;

-- Photos (placeholder images) -------------------------------------------

insert into public.listing_images (listing_id, url, position, alt_text)
select l.id, 'https://picsum.photos/seed/nu-' || right(l.id::text, 2) || '/800/600', 0, l.title
from public.listings l
where l.id::text like '00000000-0000-4000-b000-%'
  and not exists (select 1 from public.listing_images i where i.listing_id = l.id);

-- Tags ----------------------------------------------------------------

insert into public.tags (name)
select t.name
from (values ('desk'), ('ikea'), ('monitor'), ('couch'), ('math'), ('celtics'), ('fridge'), ('hoodie'), ('free'), ('bookshelf')) as t(name)
where not exists (select 1 from public.tags where tags.name = t.name);

insert into public.listing_tags (listing_id, tag_id)
select lt.listing_id::uuid, (select id from public.tags where name = lt.tag limit 1)
from (values
  ('00000000-0000-4000-b000-000000000001', 'desk'),
  ('00000000-0000-4000-b000-000000000001', 'ikea'),
  ('00000000-0000-4000-b000-000000000002', 'monitor'),
  ('00000000-0000-4000-b000-000000000003', 'couch'),
  ('00000000-0000-4000-b000-000000000004', 'math'),
  ('00000000-0000-4000-b000-000000000005', 'celtics'),
  ('00000000-0000-4000-b000-000000000006', 'fridge'),
  ('00000000-0000-4000-b000-000000000007', 'hoodie'),
  ('00000000-0000-4000-b000-000000000008', 'free'),
  ('00000000-0000-4000-b000-000000000009', 'bookshelf')
) as lt(listing_id, tag)
on conflict do nothing;

-- Review (Maya bought Jordan's bookshelf) -----------------------------

insert into public.reviews (listing_id, reviewer_id, seller_id, stars, comment)
select '00000000-0000-4000-b000-000000000009', '00000000-0000-4000-a000-000000000001',
  '00000000-0000-4000-a000-000000000002', 5, 'Easy pickup, exactly as described.'
where not exists (
  select 1 from public.reviews where listing_id = '00000000-0000-4000-b000-000000000009'
);

commit;

-- Cleanup: select and run only these lines to remove the dummy data.
-- delete from public.listings where id::text like '00000000-0000-4000-b000-%';
-- delete from public.users where id::text like '00000000-0000-4000-a000-%';
-- delete from auth.users where id::text like '00000000-0000-4000-a000-%';
