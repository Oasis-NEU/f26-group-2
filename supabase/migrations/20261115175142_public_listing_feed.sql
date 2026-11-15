-- Logged-out visitors (the `anon` role) can browse the feed, but only see
-- what a listing card shows. Full details (description, seller, buyer, size,
-- course code, event date, ...) stay members-only.
--
-- Two layers do this:
--   1. Column privileges: anon can only SELECT the card columns. Asking for
--      any other column (or `select *`) fails with "permission denied".
--   2. RLS policies: anon only sees rows for active listings.
--
-- Heads up: a column added to listings later is NOT visible to logged-out
-- users until it is added to the GRANT below. That's on purpose.
--
-- Safe to run more than once.

-- listings ---------------------------------------------------------------

revoke select on table public.listings from anon;

grant select (
  id,
  title,
  price_cents,
  is_free,
  category,
  condition,
  payment_methods,
  open_to_trade,
  campus_area,
  status,
  created_at
) on table public.listings to anon;

drop policy if exists "Visitors can browse active listings" on public.listings;
create policy "Visitors can browse active listings" on public.listings
  for select
  to anon
  using (status = 'active');

-- listing_images (cover photos on the cards) ----------------------------

revoke select on table public.listing_images from anon;

grant select (listing_id, url, position) on table public.listing_images to anon;

drop policy if exists "Visitors can view images of active listings" on public.listing_images;
create policy "Visitors can view images of active listings" on public.listing_images
  for select
  to anon
  using (exists (
    select 1
    from public.listings l
    where l.id = listing_images.listing_id
      and l.status = 'active'
  ));
