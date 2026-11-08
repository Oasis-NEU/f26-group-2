-- Each seller can post at most 10 listings in any 24-hour window.
-- Runs in the database, so it can't be bypassed from the browser.
--
-- security definer: counts every listing the seller made, regardless of the
-- row-level security on listings.
create or replace function public.enforce_listing_post_limit()
  returns trigger
  language plpgsql
  security definer
  set search_path to ''
  as $function$
begin
  if (
    select count(*)
    from public.listings
    where seller_id = new.seller_id
      and created_at > now() - interval '24 hours'
  ) >= 10 then
    raise exception 'You can post up to 10 listings a day. Try again tomorrow.';
  end if;
  return new;
end $function$;

create trigger listings_post_limit
  before insert on public.listings
  for each row execute function public.enforce_listing_post_limit();
