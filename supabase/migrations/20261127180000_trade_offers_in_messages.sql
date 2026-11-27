-- Trade offers show up in Messages.
--
-- Making an offer posts it into the buyer and seller's conversation (starting
-- the conversation if needed). Accepting, declining, or withdrawing posts a
-- reply there too. The database writes these messages itself, so an offer and
-- its message can never get out of sync.
--
--   * messages.trade_offer_id / offer_event: which offer a message is about,
--     and what happened ('offered', 'accepted', 'declined', 'withdrawn').
--     Only these triggers can set them; normal messages can't.
--   * trade_offers.response_note: the seller's "why, or what I'd take
--     instead" when declining. It's sent as the decline message.
--   * Accepting an offer still marks the listing pending (as before), and now
--     also declines the other pending offers on that listing.
--
-- Replaces on_new_message (from 20261127120000_messaging_limits.sql) and
-- on_trade_offer_change (from the baseline schema), keeping all their checks.
-- Safe to run more than once.

-- Columns ---------------------------------------------------------------

alter table public.messages
  add column if not exists trade_offer_id uuid
    references public.trade_offers (id) on delete set null;

alter table public.messages
  add column if not exists offer_event text;

alter table public.messages drop constraint if exists messages_offer_event_check;
alter table public.messages
  add constraint messages_offer_event_check
  check (offer_event in ('offered', 'accepted', 'declined', 'withdrawn'));

create index if not exists messages_trade_offer_idx
  on public.messages using btree (trade_offer_id)
  where trade_offer_id is not null;

alter table public.trade_offers
  add column if not exists response_note text;

alter table public.trade_offers drop constraint if exists trade_offers_response_note_check;
alter table public.trade_offers
  add constraint trade_offers_response_note_check
  check (char_length(response_note) <= 500);

-- Sellers send the note together with the status change.
grant update (response_note) on public.trade_offers to authenticated;

-- Messages: same checks as before, plus offer messages are trigger-only ---

create or replace function public.on_new_message()
  returns trigger
  language plpgsql
  security definer
  set search_path to ''
  as $function$
declare
  c public.conversations;
begin
  select * into c from public.conversations where id = new.conversation_id;

  if new.sender_id not in (c.buyer_id, c.seller_id) then
    raise exception 'You are not part of this conversation.';
  end if;

  -- Offer messages come from the trade offer triggers below (trigger depth 2).
  -- Anyone inserting one directly is faking it.
  if (new.trade_offer_id is not null or new.offer_event is not null)
     and pg_trigger_depth() < 2 then
    raise exception 'Use the Offer a trade button to send a trade offer.';
  end if;

  if exists (select 1 from public.blocks
             where (blocker_id = c.buyer_id  and blocked_id = c.seller_id)
                or (blocker_id = c.seller_id and blocked_id = c.buyer_id)) then
    raise exception 'You can''t message this user.';
  end if;

  if btrim(new.body) = '' then
    raise exception 'Write a message before sending.';
  end if;

  if (select count(*) from public.messages
      where sender_id = new.sender_id
        and created_at > now() - interval '1 minute') >= 20 then
    raise exception 'You''re sending messages too fast. Wait a minute and try again.';
  end if;

  update public.conversations
  set last_message_at = new.created_at
  where id = new.conversation_id;

  return new;
end $function$;

-- Offer rules (BEFORE insert/update) -------------------------------------

create or replace function public.on_trade_offer_change()
  returns trigger
  language plpgsql
  security definer
  set search_path to ''
  as $function$
declare
  l public.listings;
begin
  select * into l from public.listings where id = new.listing_id;

  if tg_op = 'INSERT' then
    if l.status <> 'active' or not l.open_to_trade then
      raise exception 'This listing is not accepting trade offers.';
    end if;
    if l.seller_id = new.from_user_id then
      raise exception 'You can''t make an offer on your own listing.';
    end if;

    new.description := nullif(btrim(new.description), '');
    if new.offered_listing_id is null and new.description is null then
      raise exception 'Pick one of your listings or describe what you''re offering.';
    end if;
    if new.offered_listing_id is not null and not exists (
      select 1 from public.listings
      where id = new.offered_listing_id
        and seller_id = new.from_user_id
        and status = 'active') then
      raise exception 'You can only offer one of your own active listings.';
    end if;

    new.status := 'pending';
    new.response_note := null;
    new.responded_at := null;
  end if;

  if tg_op = 'UPDATE' then
    -- A note only goes with a decline.
    if new.status = 'declined' and old.status = 'pending' then
      new.response_note := nullif(btrim(new.response_note), '');
    else
      new.response_note := old.response_note;
    end if;
  end if;

  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    if old.status <> 'pending' then
      raise exception 'This offer has already been answered.';
    end if;
    -- When called through the Supabase client, check who is acting.
    if auth.uid() is not null then
      if new.status in ('accepted', 'declined') and auth.uid() <> l.seller_id then
        raise exception 'Only the seller can accept or decline offers.';
      end if;
      if new.status = 'withdrawn' and auth.uid() <> new.from_user_id then
        raise exception 'Only the person who made the offer can withdraw it.';
      end if;
    end if;
    if new.status = 'accepted' and l.status = 'sold' then
      raise exception 'This listing has already sold.';
    end if;

    new.responded_at := now();

    if new.status = 'accepted' then
      update public.listings set status = 'pending' where id = new.listing_id;
      -- Only one offer can win. The others are told in their conversations.
      update public.trade_offers
      set status = 'declined',
          response_note = 'Thanks for the offer! I accepted a different one for this item.'
      where listing_id = new.listing_id
        and id <> new.id
        and status = 'pending';
    end if;
  end if;

  return new;
end $function$;

-- Post offers and answers into the conversation (AFTER insert/update) ----

create or replace function public.on_trade_offer_posted()
  returns trigger
  language plpgsql
  security definer
  set search_path to ''
  as $function$
declare
  l public.listings;
  conv_id uuid;
  offered_title text;
  cash text;
  msg_sender uuid;
  msg_body text;
begin
  if tg_op = 'UPDATE' and new.status is not distinct from old.status then
    return null;
  end if;

  select * into l from public.listings where id = new.listing_id;
  select id into conv_id from public.conversations
  where listing_id = new.listing_id and buyer_id = new.from_user_id;

  if tg_op = 'INSERT' then
    -- First contact about this listing: start the conversation.
    if conv_id is null then
      insert into public.conversations (listing_id, buyer_id)
      values (new.listing_id, new.from_user_id)
      returning id into conv_id;
    end if;

    if new.offered_listing_id is not null then
      select title into offered_title from public.listings where id = new.offered_listing_id;
    end if;
    if new.cash_cents > 0 then
      cash := '$' || case when new.cash_cents % 100 = 0
                          then (new.cash_cents / 100)::text
                          else to_char(new.cash_cents / 100.0, 'FM999999990.00') end;
    end if;

    -- Plain-text version. The app shows a card instead; this is what the
    -- inbox preview shows.
    msg_body := 'Offered a trade'
         || coalesce(': ' || concat_ws(' + ', offered_title, cash), '')
         || coalesce(E'\n' || new.description, '');
    msg_sender := new.from_user_id;
  else
    if conv_id is null then
      return null;
    end if;
    if new.status = 'withdrawn' then
      msg_sender := new.from_user_id;
      msg_body := 'Withdrew the trade offer.';
    elsif new.status = 'accepted' then
      msg_sender := l.seller_id;
      msg_body := 'Accepted your trade offer.';
    else
      msg_sender := l.seller_id;
      msg_body := coalesce(new.response_note, 'Declined your trade offer.');
    end if;
  end if;

  insert into public.messages (conversation_id, sender_id, body, trade_offer_id, offer_event)
  values (
    conv_id,
    msg_sender,
    left(msg_body, 2000),
    new.id,
    case when tg_op = 'INSERT' then 'offered' else new.status::text end
  );

  return null;
end $function$;

drop trigger if exists trade_offers_post_to_messages on public.trade_offers;
create trigger trade_offers_post_to_messages
  after insert or update of status on public.trade_offers
  for each row
  execute function public.on_trade_offer_posted();
