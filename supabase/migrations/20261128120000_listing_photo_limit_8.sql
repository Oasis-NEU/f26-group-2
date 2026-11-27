-- Listings can have up to 8 photos (was 6). Positions are 0-7; together
-- with the (listing_id, position) unique constraint this caps it at 8.
-- The Sell form's MAX_PHOTOS (src/pages/Sell.jsx) must match.
alter table public.listing_images drop constraint if exists listing_images_position_check;
alter table public.listing_images
  add constraint listing_images_position_check check (position >= 0 and position <= 7);
