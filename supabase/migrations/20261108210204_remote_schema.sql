SET local check_function_bodies = off;

CREATE TABLE "public"."blocks" (
  "blocker_id" uuid                     NOT NULL,
  "blocked_id" uuid                     NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "blocks_check" CHECK ((blocker_id <> blocked_id)),
  CONSTRAINT "blocks_pkey" PRIMARY KEY (blocker_id, blocked_id)
);

ALTER TABLE "public"."blocks"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."conversations" (
  "id"              uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "listing_id"      uuid                     NOT NULL,
  "buyer_id"        uuid                     NOT NULL,
  "seller_id"       uuid                     NOT NULL,
  "last_message_at" timestamp with time zone NOT NULL DEFAULT now(),
  "created_at"      timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "conversations_check" CHECK ((buyer_id <> seller_id)),
  CONSTRAINT "conversations_listing_id_buyer_id_key" UNIQUE (listing_id, buyer_id),
  CONSTRAINT "conversations_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."conversations"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."listing_images" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "listing_id" uuid                     NOT NULL,
  "url"        text                     NOT NULL,
  "position"   smallint                 NOT NULL,
  "alt_text"   text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "listing_images_pkey" PRIMARY KEY (id),
  CONSTRAINT "listing_images_position_check" CHECK ((("position" >= 0) AND ("position" <= 5))),
  CONSTRAINT "listing_images_position_unique" UNIQUE (listing_id, "position") DEFERRABLE INITIALLY DEFERRED
);

ALTER TABLE "public"."listing_images"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."listing_tags" (
  "listing_id" uuid NOT NULL,
  "tag_id"     uuid NOT NULL,
  CONSTRAINT "listing_tags_pkey" PRIMARY KEY (listing_id, tag_id)
);

ALTER TABLE "public"."listing_tags"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."listings" (
  "id"            uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "seller_id"     uuid                     NOT NULL,
  "title"         text                     NOT NULL,
  "description"   text                     NOT NULL DEFAULT ''::text,
  "price_cents"   integer,
  "is_free"       boolean                  NOT NULL DEFAULT false,
  "open_to_trade" boolean                  NOT NULL DEFAULT false,
  "size"          text,
  "course_code"   text,
  "event_date"    date,
  "campus_area"   text                     NOT NULL,
  "buyer_id"      uuid,
  "sold_at"       timestamp with time zone,
  "created_at"    timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"    timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "listings_buyer_not_seller" CHECK (((buyer_id IS NULL) OR (buyer_id <> seller_id))),
  CONSTRAINT "listings_description_check" CHECK ((char_length(description) <= 2000)),
  CONSTRAINT "listings_pkey" PRIMARY KEY (id),
  CONSTRAINT "listings_price_cents_check" CHECK (((price_cents >= 0) AND (price_cents <= 10000000))),
  CONSTRAINT "listings_price_rule" CHECK (((is_free AND (price_cents IS NULL)) OR ((NOT is_free) AND ((price_cents IS NOT NULL) OR open_to_trade)))),
  CONSTRAINT "listings_title_check" CHECK (((char_length(title) >= 3) AND (char_length(title) <= 100)))
);

ALTER TABLE "public"."listings"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."messages" (
  "id"              uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "conversation_id" uuid                     NOT NULL,
  "sender_id"       uuid                     NOT NULL,
  "body"            text                     NOT NULL,
  "read_at"         timestamp with time zone,
  "created_at"      timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "messages_body_check" CHECK (((char_length(body) >= 1) AND (char_length(body) <= 2000))),
  CONSTRAINT "messages_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."messages"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."reports" (
  "id"          uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "reporter_id" uuid,
  "target_id"   uuid,
  "details"     text,
  "resolved_by" uuid,
  "resolved_at" timestamp with time zone,
  "created_at"  timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "reports_details_check" CHECK ((char_length(details) <= 1000)),
  CONSTRAINT "reports_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."reports"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."reviews" (
  "id"          uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "listing_id"  uuid,
  "reviewer_id" uuid,
  "seller_id"   uuid                     NOT NULL,
  "stars"       smallint                 NOT NULL,
  "comment"     text,
  "created_at"  timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "reviews_comment_check" CHECK ((char_length(comment) <= 500)),
  CONSTRAINT "reviews_listing_id_key" UNIQUE (listing_id),
  CONSTRAINT "reviews_pkey" PRIMARY KEY (id),
  CONSTRAINT "reviews_stars_check" CHECK (((stars >= 1) AND (stars <= 5)))
);

ALTER TABLE "public"."reviews"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."saved_listings" (
  "user_id"    uuid                     NOT NULL,
  "listing_id" uuid                     NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "saved_listings_pkey" PRIMARY KEY (user_id, listing_id)
);

ALTER TABLE "public"."saved_listings"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."tags" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "name"       text                     NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "tags_name_check" CHECK (((name = lower(name)) AND ((char_length(name) >= 1) AND (char_length(name) <= 30)))),
  CONSTRAINT "tags_name_key" UNIQUE (name),
  CONSTRAINT "tags_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."tags"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."trade_offers" (
  "id"                 uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "listing_id"         uuid                     NOT NULL,
  "from_user_id"       uuid                     NOT NULL,
  "offered_listing_id" uuid,
  "description"        text,
  "cash_cents"         integer                  NOT NULL DEFAULT 0,
  "created_at"         timestamp with time zone NOT NULL DEFAULT now(),
  "responded_at"       timestamp with time zone,
  CONSTRAINT "trade_offers_cash_cents_check" CHECK ((cash_cents >= 0)),
  CONSTRAINT "trade_offers_check1" CHECK (((offered_listing_id IS NULL) OR (offered_listing_id <> listing_id))),
  CONSTRAINT "trade_offers_check" CHECK (((offered_listing_id IS NOT NULL) OR (description IS NOT NULL))),
  CONSTRAINT "trade_offers_description_check" CHECK ((char_length(description) <= 1000)),
  CONSTRAINT "trade_offers_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."trade_offers"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."universities" (
  "id"           uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "name"         text                     NOT NULL,
  "email_domain" text                     NOT NULL,
  "created_at"   timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "universities_email_domain_check" CHECK ((email_domain = lower(email_domain))),
  CONSTRAINT "universities_email_domain_key" UNIQUE (email_domain),
  CONSTRAINT "universities_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."universities"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."users" (
  "id"            uuid                     NOT NULL,
  "university_id" uuid                     NOT NULL,
  "email"         text                     NOT NULL,
  "display_name"  text                     NOT NULL,
  "avatar_url"    text,
  "grad_year"     smallint,
  "created_at"    timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"    timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "users_display_name_check" CHECK (((char_length(display_name) >= 1) AND (char_length(display_name) <= 50))),
  CONSTRAINT "users_email_key" UNIQUE (email),
  CONSTRAINT "users_grad_year_check" CHECK (((grad_year >= 1900) AND (grad_year <= 2100))),
  CONSTRAINT "users_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."users"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."users" FROM "anon";

ALTER TABLE "public"."listings"
  ADD COLUMN "search_vector" tsvector GENERATED ALWAYS AS
    (((setweight(to_tsvector('english'::regconfig, COALESCE(title, ''::text)), 'A'::"char") || setweight(to_tsvector('english'::regconfig, COALESCE(course_code, ''::text)),
    'A'::"char")) || setweight(to_tsvector('english'::regconfig, COALESCE(description, ''::text)), 'B'::"char"))) STORED;

CREATE TYPE "public"."affiliation" AS ENUM (
  'student',
  'alum'
);

ALTER TABLE "public"."users"
  ADD COLUMN "affiliation" public.affiliation NOT NULL DEFAULT 'student'::public.affiliation;

CREATE TYPE "public"."listing_category" AS ENUM (
  'textbooks',
  'furniture',
  'electronics',
  'appliances',
  'clothing',
  'tickets',
  'dorm_essentials',
  'other'
);

ALTER TABLE "public"."listings"
  ADD COLUMN "category" public.listing_category NOT NULL;

CREATE TYPE "public"."listing_condition" AS ENUM (
  'new',
  'like_new',
  'good',
  'fair',
  'poor'
);

ALTER TABLE "public"."listings"
  ADD COLUMN "condition" public.listing_condition NOT NULL;

CREATE TYPE "public"."listing_status" AS ENUM (
  'active',
  'pending',
  'sold'
);

ALTER TABLE "public"."listings"
  ADD COLUMN "status" public.listing_status NOT NULL DEFAULT 'active'::public.listing_status;

CREATE TYPE "public"."payment_method" AS ENUM (
  'cash',
  'venmo',
  'zelle',
  'trade'
);

ALTER TABLE "public"."listings"
  ADD COLUMN "payment_methods" public.payment_method[] NOT NULL DEFAULT '{}'::public.payment_method[];

CREATE TYPE "public"."report_reason" AS ENUM (
  'scam',
  'prohibited_item',
  'offensive',
  'other'
);

ALTER TABLE "public"."reports"
  ADD COLUMN "reason" public.report_reason NOT NULL;

CREATE TYPE "public"."report_status" AS ENUM (
  'open',
  'dismissed',
  'listing_removed',
  'user_suspended'
);

ALTER TABLE "public"."reports"
  ADD COLUMN "status" public.report_status NOT NULL DEFAULT 'open'::public.report_status;

CREATE TYPE "public"."report_target" AS ENUM (
  'listing',
  'user',
  'message',
  'support'
);

ALTER TABLE "public"."reports"
  ADD COLUMN "target_type" public.report_target NOT NULL;

CREATE TYPE "public"."trade_offer_status" AS ENUM (
  'pending',
  'accepted',
  'declined',
  'withdrawn'
);

ALTER TABLE "public"."trade_offers"
  ADD COLUMN "status" public.trade_offer_status NOT NULL DEFAULT 'pending'::public.trade_offer_status;

CREATE TYPE "public"."user_role" AS ENUM (
  'member',
  'admin'
);

ALTER TABLE "public"."users"
  ADD COLUMN "role" public.user_role NOT NULL DEFAULT 'member'::public.user_role;

CREATE TYPE "public"."user_status" AS ENUM (
  'active',
  'suspended'
);

ALTER TABLE "public"."users"
  ADD COLUMN "status" public.user_status NOT NULL DEFAULT 'active'::public.user_status;

CREATE OR REPLACE FUNCTION public.enforce_max_tags()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
begin
  if (select count(*) from public.listing_tags where listing_id = new.listing_id) >= 5 then
    raise exception 'A listing can have at most 5 tags.';
  end if;
  return new;
end $function$;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
  uni_id uuid;
begin
  select id into uni_id
  from public.universities
  where email_domain = split_part(lower(new.email), '@', 2);

  if uni_id is null then
    raise exception 'Use your Northeastern email to sign up.';
  end if;

  insert into public.users (id, university_id, email, display_name, affiliation)
  values (
    new.id,
    uni_id,
    lower(new.email),
    left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
                  split_part(new.email, '@', 1)), 50),
    case when new.raw_user_meta_data ->> 'affiliation' = 'alum'
         then 'alum' else 'student' end::public.affiliation
  );
  return new;
end $function$;

CREATE OR REPLACE FUNCTION public.hook_restrict_signup_domain (
  event jsonb
)
  RETURNS jsonb
  LANGUAGE plpgsql
  AS $function$
begin
  if lower(event->'user'->>'email') not like '%@northeastern.edu' then
    return jsonb_build_object('error', jsonb_build_object(
      'http_code', 400,
      'message', 'Use your Northeastern email to sign up.'
    ));
  end if;
  return '{}'::jsonb;
end;
$function$;

REVOKE ALL ON FUNCTION "public"."hook_restrict_signup_domain"(jsonb) FROM PUBLIC, "anon", "authenticated";

CREATE OR REPLACE FUNCTION public.is_active_member()
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  select exists (select 1 from public.users
                 where id = auth.uid() and status = 'active');
$function$;

CREATE OR REPLACE FUNCTION public.is_admin()
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  select exists (select 1 from public.users
                 where id = auth.uid() and role = 'admin' and status = 'active');
$function$;

CREATE OR REPLACE FUNCTION public.on_listing_status_change()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
begin
  if new.status = 'sold' and old.status is distinct from 'sold' then
    new.sold_at := now();
  end if;

  if old.status = 'sold' and new.status <> 'sold'
     and exists (select 1 from public.reviews where listing_id = new.id) then
    raise exception 'This sale has been reviewed and can no longer be reopened.';
  end if;

  if new.status <> 'sold' then
    new.sold_at  := null;
    new.buyer_id := null;
  end if;

  -- Buyer must be someone who messaged the seller or made a trade offer
  if new.buyer_id is not null and new.buyer_id is distinct from old.buyer_id
     and not exists (select 1 from public.conversations
                     where listing_id = new.id and buyer_id = new.buyer_id)
     and not exists (select 1 from public.trade_offers
                     where listing_id = new.id and from_user_id = new.buyer_id) then
    raise exception 'The buyer must be someone who contacted you about this listing.';
  end if;

  return new;
end $function$;

CREATE OR REPLACE FUNCTION public.on_new_conversation()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
  l public.listings;
begin
  select * into l from public.listings where id = new.listing_id;
  if l.id is null or l.status <> 'active' then
    raise exception 'This listing is no longer available.';
  end if;
  new.seller_id := l.seller_id;
  return new;
end $function$;

CREATE OR REPLACE FUNCTION public.on_new_message()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
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

  update public.conversations
  set last_message_at = new.created_at
  where id = new.conversation_id;

  return new;
end $function$;

CREATE OR REPLACE FUNCTION public.on_new_review()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
  l public.listings;
begin
  select * into l from public.listings where id = new.listing_id;

  if l.id is null or l.status <> 'sold' then
    raise exception 'You can only review a completed sale.';
  end if;
  if new.reviewer_id is null or l.buyer_id is distinct from new.reviewer_id then
    raise exception 'Only the buyer can review this sale.';
  end if;

  new.seller_id := l.seller_id;
  return new;
end $function$;

CREATE OR REPLACE FUNCTION public.on_trade_offer_change()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
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
    if new.offered_listing_id is not null and not exists (
      select 1 from public.listings
      where id = new.offered_listing_id and seller_id = new.from_user_id) then
      raise exception 'You can only offer your own listings.';
    end if;
    new.status := 'pending';
  end if;

  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    if old.status <> 'pending' then
      raise exception 'This offer has already been answered.';
    end if;
    -- When called through the Supabase client, check who is acting.
    -- (Through Prisma auth.uid() is null, so your API route does this check.)
    if auth.uid() is not null then
      if new.status in ('accepted', 'declined') and auth.uid() <> l.seller_id then
        raise exception 'Only the seller can accept or decline offers.';
      end if;
      if new.status = 'withdrawn' and auth.uid() <> new.from_user_id then
        raise exception 'Only the person who made the offer can withdraw it.';
      end if;
    end if;
    new.responded_at := now();
    if new.status = 'accepted' then
      update public.listings set status = 'pending' where id = new.listing_id;
    end if;
  end if;

  return new;
end $function$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
begin
  new.updated_at := now();
  return new;
end $function$;

ALTER TABLE "public"."listings"
  ADD CONSTRAINT "listings_course_only_textbooks" CHECK (((course_code IS NULL) OR (category = 'textbooks'::public.listing_category)));

ALTER TABLE "public"."listings"
  ADD CONSTRAINT "listings_event_only_tickets" CHECK (((event_date IS NULL) OR (category = 'tickets'::public.listing_category)));

ALTER TABLE "public"."conversations"
  ADD CONSTRAINT "conversations_listing_id_fkey" FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;

ALTER TABLE "public"."listing_images"
  ADD CONSTRAINT "listing_images_listing_id_fkey" FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;

ALTER TABLE "public"."listing_tags"
  ADD CONSTRAINT "listing_tags_listing_id_fkey" FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;

ALTER TABLE "public"."listings"
  ADD CONSTRAINT "listings_size_only_clothing" CHECK (((size IS NULL) OR (category = 'clothing'::public.listing_category)));

ALTER TABLE "public"."messages"
  ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;

ALTER TABLE "public"."reports"
  ADD CONSTRAINT "reports_check" CHECK (((target_type = 'support'::public.report_target) OR (target_id IS NOT NULL)));

ALTER TABLE "public"."reviews"
  ADD CONSTRAINT "reviews_listing_id_fkey" FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE SET NULL;

ALTER TABLE "public"."saved_listings"
  ADD CONSTRAINT "saved_listings_listing_id_fkey" FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;

ALTER TABLE "public"."listing_tags"
  ADD CONSTRAINT "listing_tags_tag_id_fkey" FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE;

ALTER TABLE "public"."trade_offers"
  ADD CONSTRAINT "trade_offers_listing_id_fkey" FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;

ALTER TABLE "public"."trade_offers"
  ADD CONSTRAINT "trade_offers_offered_listing_id_fkey" FOREIGN KEY (offered_listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;

ALTER TABLE "public"."users"
  ADD CONSTRAINT "users_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."blocks"
  ADD CONSTRAINT "blocks_blocked_id_fkey" FOREIGN KEY (blocked_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."blocks"
  ADD CONSTRAINT "blocks_blocker_id_fkey" FOREIGN KEY (blocker_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."conversations"
  ADD CONSTRAINT "conversations_buyer_id_fkey" FOREIGN KEY (buyer_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."conversations"
  ADD CONSTRAINT "conversations_seller_id_fkey" FOREIGN KEY (seller_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."listings"
  ADD CONSTRAINT "listings_buyer_id_fkey" FOREIGN KEY (buyer_id) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE "public"."listings"
  ADD CONSTRAINT "listings_seller_id_fkey" FOREIGN KEY (seller_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."messages"
  ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."reports"
  ADD CONSTRAINT "reports_reporter_id_fkey" FOREIGN KEY (reporter_id) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE "public"."reports"
  ADD CONSTRAINT "reports_resolved_by_fkey" FOREIGN KEY (resolved_by) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE "public"."reviews"
  ADD CONSTRAINT "reviews_reviewer_id_fkey" FOREIGN KEY (reviewer_id) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE "public"."reviews"
  ADD CONSTRAINT "reviews_seller_id_fkey" FOREIGN KEY (seller_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."saved_listings"
  ADD CONSTRAINT "saved_listings_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."trade_offers"
  ADD CONSTRAINT "trade_offers_from_user_id_fkey" FOREIGN KEY (from_user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."users"
  ADD CONSTRAINT "users_university_id_fkey" FOREIGN KEY (university_id) REFERENCES public.universities(id);

CREATE VIEW "public"."seller_ratings" WITH (security_invoker=true) AS  SELECT seller_id,
    round(avg(stars), 1) AS avg_rating,
    (count(*))::integer AS review_count
   FROM public.reviews
  GROUP BY seller_id;

CREATE INDEX conversations_buyer_idx ON public.conversations USING btree (buyer_id, last_message_at DESC);

CREATE INDEX conversations_seller_idx ON public.conversations USING btree (seller_id, last_message_at DESC);

CREATE INDEX listing_tags_tag_idx ON public.listing_tags USING btree (tag_id);

CREATE INDEX listings_buyer_idx ON public.listings USING btree (buyer_id);

CREATE INDEX listings_category_idx ON public.listings USING btree (category, status, created_at DESC);

CREATE INDEX listings_feed_idx ON public.listings USING btree (status, created_at DESC);

CREATE INDEX listings_price_idx ON public.listings USING btree (status, price_cents);

CREATE INDEX listings_search_idx ON public.listings USING gin (search_vector);

CREATE INDEX listings_seller_idx ON public.listings USING btree (seller_id, status);

CREATE INDEX messages_conversation_idx ON public.messages USING btree (conversation_id, created_at);

CREATE INDEX messages_unread_idx ON public.messages USING btree (conversation_id)
  WHERE (read_at IS NULL);

CREATE UNIQUE INDEX reports_one_open_per_target ON public.reports USING btree (reporter_id, target_type, target_id)
  WHERE (status = 'open'::public.report_status);

CREATE INDEX reports_queue_idx ON public.reports USING btree (status, created_at);

CREATE INDEX reviews_seller_idx ON public.reviews USING btree (seller_id);

CREATE INDEX trade_offers_from_idx ON public.trade_offers USING btree (from_user_id);

CREATE INDEX trade_offers_listing_idx ON public.trade_offers USING btree (listing_id, status);

CREATE UNIQUE INDEX trade_offers_one_pending ON public.trade_offers USING btree (listing_id, from_user_id)
  WHERE (status = 'pending'::public.trade_offer_status);

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

CREATE TRIGGER conversations_set_seller
  BEFORE INSERT ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.on_new_conversation();

CREATE TRIGGER listing_tags_max
  BEFORE INSERT ON public.listing_tags
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_max_tags();

CREATE TRIGGER listings_status_change
  BEFORE UPDATE ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION public.on_listing_status_change();

CREATE TRIGGER listings_updated_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER messages_on_insert
  BEFORE INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.on_new_message();

CREATE TRIGGER reviews_on_insert
  BEFORE INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.on_new_review();

CREATE TRIGGER trade_offers_on_change
  BEFORE INSERT OR UPDATE ON public.trade_offers
  FOR EACH ROW
  EXECUTE FUNCTION public.on_trade_offer_change();

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Users manage their own blocks" ON "public"."blocks"
  FOR ALL
  TO "authenticated"
  USING ((blocker_id = auth.uid()))
  WITH CHECK ((blocker_id = auth.uid()));

CREATE POLICY "Buyers can start conversations" ON "public"."conversations"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((buyer_id = auth.uid()) AND public.is_active_member()));

CREATE POLICY "Participants can view conversations" ON "public"."conversations"
  FOR SELECT
  TO "authenticated"
  USING (((buyer_id = auth.uid()) OR (seller_id = auth.uid()) OR public.is_admin()));

CREATE POLICY "Sellers manage their listing images" ON "public"."listing_images"
  FOR ALL
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.listings l
  WHERE ((l.id = listing_images.listing_id) AND (l.seller_id = auth.uid())))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.listings l
  WHERE ((l.id = listing_images.listing_id) AND (l.seller_id = auth.uid())))));

CREATE POLICY "View images of visible listings" ON "public"."listing_images"
  FOR SELECT
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.listings l
  WHERE (l.id = listing_images.listing_id))));

CREATE POLICY "Sellers manage their listing tags" ON "public"."listing_tags"
  FOR ALL
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.listings l
  WHERE ((l.id = listing_tags.listing_id) AND (l.seller_id = auth.uid())))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.listings l
  WHERE ((l.id = listing_tags.listing_id) AND (l.seller_id = auth.uid())))));

CREATE POLICY "View tags of visible listings" ON "public"."listing_tags"
  FOR SELECT
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.listings l
  WHERE (l.id = listing_tags.listing_id))));

CREATE POLICY "Active members can create listings" ON "public"."listings"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((seller_id = auth.uid()) AND public.is_active_member()));

CREATE POLICY "Sellers can edit their listings" ON "public"."listings"
  FOR UPDATE
  TO "authenticated"
  USING ((seller_id = auth.uid()))
  WITH CHECK ((seller_id = auth.uid()));

CREATE POLICY "Sellers delete unsold listings; admins delete any" ON "public"."listings"
  FOR DELETE
  TO "authenticated"
  USING ((((seller_id = auth.uid()) AND (status <> 'sold'::public.listing_status)) OR public.is_admin()));

CREATE POLICY "View active, own, bought, or discussed listings" ON "public"."listings"
  FOR SELECT
  TO "authenticated"
  USING (((status = 'active'::public.listing_status) OR (seller_id = auth.uid()) OR (buyer_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.conversations c
  WHERE ((c.listing_id = listings.id) AND (c.buyer_id = auth.uid())))) OR public.is_admin()));

CREATE POLICY "Participants can read messages" ON "public"."messages"
  FOR SELECT
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.conversations c
  WHERE (c.id = messages.conversation_id))));

CREATE POLICY "Participants can send messages" ON "public"."messages"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((sender_id = auth.uid()) AND public.is_active_member() AND (EXISTS ( SELECT 1
   FROM public.conversations c
  WHERE (c.id = messages.conversation_id)))));

CREATE POLICY "Recipients can mark messages read" ON "public"."messages"
  FOR UPDATE
  TO "authenticated"
  USING (((sender_id <> auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.conversations c
  WHERE (c.id = messages.conversation_id)))));

CREATE POLICY "Admins resolve reports" ON "public"."reports"
  FOR UPDATE
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Members can file reports" ON "public"."reports"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((reporter_id = auth.uid()));

CREATE POLICY "Reporters see their own; admins see all" ON "public"."reports"
  FOR SELECT
  TO "authenticated"
  USING (((reporter_id = auth.uid()) OR public.is_admin()));

CREATE POLICY "Buyers can leave a review" ON "public"."reviews"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((reviewer_id = auth.uid()));

CREATE POLICY "Members can read reviews" ON "public"."reviews"
  FOR SELECT
  TO "authenticated"
  USING (true);

CREATE POLICY "Users manage their saved listings" ON "public"."saved_listings"
  FOR ALL
  TO "authenticated"
  USING ((user_id = auth.uid()))
  WITH CHECK ((user_id = auth.uid()));

CREATE POLICY "Active members can create tags" ON "public"."tags"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (public.is_active_member());

CREATE POLICY "Members can read tags" ON "public"."tags"
  FOR SELECT
  TO "authenticated"
  USING (true);

CREATE POLICY "Active members can make offers" ON "public"."trade_offers"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((from_user_id = auth.uid()) AND public.is_active_member()));

CREATE POLICY "Offerer and seller can respond to offers" ON "public"."trade_offers"
  FOR UPDATE
  TO "authenticated"
  USING (((from_user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.listings l
  WHERE ((l.id = trade_offers.listing_id) AND (l.seller_id = auth.uid()))))));

CREATE POLICY "Offerer and seller can view offers" ON "public"."trade_offers"
  FOR SELECT
  TO "authenticated"
  USING (((from_user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.listings l
  WHERE ((l.id = trade_offers.listing_id) AND (l.seller_id = auth.uid()))))));

CREATE POLICY "Members can read universities" ON "public"."universities"
  FOR SELECT
  TO "authenticated"
  USING (true);

CREATE POLICY "Members can view profiles" ON "public"."users"
  FOR SELECT
  TO "authenticated"
  USING (true);

CREATE POLICY "Users can update their own profile" ON "public"."users"
  FOR UPDATE
  TO "authenticated"
  USING ((id = auth.uid()))
  WITH CHECK ((id = auth.uid()));

CREATE POLICY "Users delete their own files" ON "storage"."objects"
  FOR DELETE
  TO "authenticated"
  USING (((bucket_id = ANY (ARRAY['listing-images'::text, 'avatars'::text])) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

CREATE POLICY "Users update their own files" ON "storage"."objects"
  FOR UPDATE
  TO "authenticated"
  USING (((bucket_id = ANY (ARRAY['listing-images'::text, 'avatars'::text])) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

CREATE POLICY "Users upload to their own folder" ON "storage"."objects"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((bucket_id = ANY (ARRAY['listing-images'::text, 'avatars'::text])) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

GRANT EXECUTE ON FUNCTION "public"."enforce_max_tags"() TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."enforce_max_tags"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."enforce_max_tags"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."enforce_max_tags"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."handle_new_auth_user"() TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."handle_new_auth_user"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."handle_new_auth_user"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."handle_new_auth_user"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."hook_restrict_signup_domain"(jsonb) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."hook_restrict_signup_domain"(jsonb) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."hook_restrict_signup_domain"(jsonb) TO "service_role", "supabase_auth_admin";

GRANT EXECUTE ON FUNCTION "public"."is_active_member"() TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."is_active_member"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."is_active_member"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."is_active_member"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."is_admin"() TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."is_admin"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."is_admin"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."is_admin"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."on_listing_status_change"() TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."on_listing_status_change"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."on_listing_status_change"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."on_listing_status_change"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."on_new_conversation"() TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."on_new_conversation"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."on_new_conversation"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."on_new_conversation"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."on_new_message"() TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."on_new_message"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."on_new_message"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."on_new_message"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."on_new_review"() TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."on_new_review"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."on_new_review"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."on_new_review"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."on_trade_offer_change"() TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."on_trade_offer_change"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."on_trade_offer_change"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."on_trade_offer_change"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."set_updated_at"() TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."set_updated_at"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."set_updated_at"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."set_updated_at"() TO "service_role";

REVOKE ALL ON SCHEMA "public" FROM "supabase_auth_admin";

GRANT USAGE ON SCHEMA "public" TO "supabase_auth_admin";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."blocks" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."blocks" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."blocks" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."blocks" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."conversations" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."conversations" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."conversations" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."conversations" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."listing_images" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."listing_images" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."listing_images" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."listing_images" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."listing_tags" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."listing_tags" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."listing_tags" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."listing_tags" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."listings" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."listings" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."listings" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."listings" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."messages" TO "anon";

REVOKE ALL ON TABLE "public"."messages" FROM "authenticated";

REVOKE ALL ("read_at") ON TABLE "public"."messages" FROM "authenticated";

GRANT UPDATE ("read_at") ON TABLE "public"."messages" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."messages" TO "authenticated";

REVOKE ALL ON TABLE "public"."messages" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."messages" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."messages" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."reports" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."reports" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."reports" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."reports" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."reviews" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."reviews" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."reviews" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."reviews" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."saved_listings" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."saved_listings" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."saved_listings" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."saved_listings" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."tags" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."tags" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."tags" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."tags" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."trade_offers" TO "anon";

REVOKE ALL ON TABLE "public"."trade_offers" FROM "authenticated";

REVOKE ALL ("status") ON TABLE "public"."trade_offers" FROM "authenticated";

GRANT UPDATE ("status") ON TABLE "public"."trade_offers" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."trade_offers" TO "authenticated";

REVOKE ALL ON TABLE "public"."trade_offers" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."trade_offers" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."trade_offers" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."universities" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."universities" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."universities" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."universities" TO "service_role";

REVOKE ALL ON TABLE "public"."users" FROM "authenticated";

REVOKE ALL ("affiliation") ON TABLE "public"."users" FROM "authenticated";

GRANT SELECT ("affiliation"), UPDATE ("affiliation") ON TABLE "public"."users" TO "authenticated";

REVOKE ALL ("avatar_url") ON TABLE "public"."users" FROM "authenticated";

GRANT SELECT ("avatar_url"), UPDATE ("avatar_url") ON TABLE "public"."users" TO "authenticated";

REVOKE ALL ("created_at") ON TABLE "public"."users" FROM "authenticated";

GRANT SELECT ("created_at") ON TABLE "public"."users" TO "authenticated";

REVOKE ALL ("display_name") ON TABLE "public"."users" FROM "authenticated";

GRANT SELECT ("display_name"), UPDATE ("display_name") ON TABLE "public"."users" TO "authenticated";

REVOKE ALL ("grad_year") ON TABLE "public"."users" FROM "authenticated";

GRANT SELECT ("grad_year"), UPDATE ("grad_year") ON TABLE "public"."users" TO "authenticated";

REVOKE ALL ("id") ON TABLE "public"."users" FROM "authenticated";

GRANT SELECT ("id") ON TABLE "public"."users" TO "authenticated";

REVOKE ALL ("role") ON TABLE "public"."users" FROM "authenticated";

GRANT SELECT ("role") ON TABLE "public"."users" TO "authenticated";

REVOKE ALL ("status") ON TABLE "public"."users" FROM "authenticated";

GRANT SELECT ("status") ON TABLE "public"."users" TO "authenticated";

REVOKE ALL ("university_id") ON TABLE "public"."users" FROM "authenticated";

GRANT SELECT ("university_id") ON TABLE "public"."users" TO "authenticated";

REVOKE ALL ON TABLE "public"."users" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."users" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."users" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."seller_ratings" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."seller_ratings" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."seller_ratings" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."seller_ratings" TO "service_role";

