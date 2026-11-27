-- Sellers can delete their own listings at any status, sold included.
-- Nothing deletes a sold listing automatically; the seller does it from the
-- dashboard when they're ready.
--
-- A review of the sale is kept: reviews.listing_id is ON DELETE SET NULL, so
-- the review stays on the seller's profile without the listing. Photos rows,
-- tags, saves, offers, and conversations about the listing are deleted with it.

drop policy if exists "Sellers delete unsold listings; admins delete any" on public.listings;
drop policy if exists "Sellers delete their listings; admins delete any" on public.listings;

create policy "Sellers delete their listings; admins delete any" on public.listings
  for delete
  to authenticated
  using (seller_id = auth.uid() or public.is_admin());
