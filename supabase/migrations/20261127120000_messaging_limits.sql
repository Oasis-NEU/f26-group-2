-- Messaging limits (project doc N5: "message sending is capped in the database").
--
-- Replaces the two chat trigger functions from the baseline schema. They keep
-- every existing check and add:
--   * a message that is only spaces is rejected (the CHECK only counts length)
--   * one user can send at most 20 messages a minute
--   * one buyer can start at most 20 new conversations an hour
--
-- The error messages are shown to users as written (the app shows any P0001
-- error message as is), so keep them short and friendly.
--
-- Safe to run more than once.

create or replace function public.on_new_conversation()
  returns trigger
  language plpgsql
  security definer
  set search_path to ''
  as $function$
declare
  l public.listings;
begin
  select * into l from public.listings where id = new.listing_id;
  if l.id is null or l.status <> 'active' then
    raise exception 'This listing is no longer available.';
  end if;

  if (select count(*) from public.conversations
      where buyer_id = new.buyer_id
        and created_at > now() - interval '1 hour') >= 20 then
    raise exception 'You''ve messaged a lot of sellers in the last hour. Try again later.';
  end if;

  new.seller_id := l.seller_id;
  return new;
end $function$;

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

-- Makes the per-sender count above fast.
create index if not exists messages_sender_recent_idx
  on public.messages using btree (sender_id, created_at desc);
