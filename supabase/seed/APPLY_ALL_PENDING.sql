-- ============================================================================
-- PASTE-AND-RUN — apply 9 pending Kaisen migrations in one shot
-- Generated 2026-06-09
-- Run in Supabase Studio: https://supabase.com/dashboard/project/itaefkyfuvwicvarnfke/sql/new
-- 
-- WARNING: 20260608240000_strip_rental_schema DROPS 9 rental tables CASCADE.
-- If you had any production rental data, back it up first. For Kaisen this
-- should be empty scaffolding from the Lovable pivot.
-- ============================================================================


-- ============================================================================
-- ## 20260608220000_xs2event_foundation.sql
-- ============================================================================
-- xs2event integration foundation
--
-- The existing events / ticket_categories / orders / order_items / ticket_deliveries
-- schema is already xs2-ready (source, external_event_id, external_category_id,
-- external_sub_category, external_ticket_ids JSONB, last_synced_at, markup_pct,
-- markup_fixed_sek). This migration adds only what's missing:
--
--   1. Default markup baseline: 15% per category (was 0)
--   2. Reservation hold tracking on orders (xs2 requires hold → confirm)
--   3. is_featured flag on events (drives Home.tsx carousel)
--   4. xs2_sync_log table (operational visibility into cache refreshes)
--
-- Does NOT touch rental schema (deferred). Does NOT extend event_sport enum
-- (defer until first non-soccer/F1 sport encountered).

-- 1. Default markup → 15%
ALTER TABLE public.ticket_categories
  ALTER COLUMN markup_pct SET DEFAULT 15;

-- Backfill rows that still have the old 0% default so existing seed/mock
-- inventory is consistent with the platform baseline.
UPDATE public.ticket_categories
  SET markup_pct = 15
  WHERE markup_pct = 0;

-- 2. Reservation hold + booking tracking
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS xs2_reservation_id text,
  ADD COLUMN IF NOT EXISTS reservation_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS xs2_booking_id text;

CREATE INDEX IF NOT EXISTS idx_orders_reservation_expires
  ON public.orders(reservation_expires_at)
  WHERE reservation_expires_at IS NOT NULL;

-- 3. Featured events flag (for Home.tsx and curated landing pages)
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_events_featured_starts_at
  ON public.events(starts_at)
  WHERE is_featured = true AND status = 'upcoming';

-- 4. xs2event sync log — one row per sync run, per resource type
CREATE TABLE public.xs2_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type text NOT NULL CHECK (resource_type IN (
    'sports', 'tournaments', 'venues', 'teams', 'events', 'categories'
  )),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status text NOT NULL DEFAULT 'running' CHECK (status IN (
    'running', 'success', 'partial', 'failed'
  )),
  records_fetched integer NOT NULL DEFAULT 0,
  records_upserted integer NOT NULL DEFAULT 0,
  error_message text,
  trigger text NOT NULL DEFAULT 'manual' CHECK (trigger IN (
    'manual', 'cron', 'on_demand'
  ))
);

CREATE INDEX idx_xs2_sync_log_resource_started
  ON public.xs2_sync_log(resource_type, started_at DESC);

GRANT SELECT ON public.xs2_sync_log TO authenticated;
GRANT ALL ON public.xs2_sync_log TO service_role;
ALTER TABLE public.xs2_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view sync log"
  ON public.xs2_sync_log FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 5. Upsert keys for xs2-sync
--
-- Events keyed by external_event_id within the xs2event source; partial unique
-- index keeps non-xs2 (mock/manual) rows unconstrained.
CREATE UNIQUE INDEX IF NOT EXISTS uq_events_xs2_external_id
  ON public.events(external_event_id)
  WHERE source = 'xs2event' AND external_event_id IS NOT NULL;

-- Categories are keyed by (event_id, external_category_id, external_sub_category)
-- so we can store per-sub_category party_size_together and markup overrides.
CREATE UNIQUE INDEX IF NOT EXISTS uq_ticket_categories_xs2_external
  ON public.ticket_categories(event_id, external_category_id, external_sub_category)
  WHERE external_category_id IS NOT NULL;

-- ============================================================================
-- ## 20260608230000_quotes.sql
-- ============================================================================
-- Custom-trip quote → payment flow.
--
-- Companion to the inquiry funnel: customer fills inquiry form → admin
-- composes a quote with line items → customer receives email with a public
-- /quote/:token link → clicks pay → Stripe checkout → webhook creates an
-- orders row linked back to the quote.
--
-- Quotes are accessed publicly via a UUID `public_token` (not by inquiry/quote
-- UUID, to keep IDs unguessable). RLS allows anonymous SELECT only through a
-- SECURITY DEFINER RPC that verifies the token.

CREATE TABLE public.quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id uuid REFERENCES public.inquiries(id) ON DELETE SET NULL,
  public_token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,

  customer_email text NOT NULL,
  customer_name text,

  title text NOT NULL,
  intro_message text,

  total_sek numeric(10,2) NOT NULL CHECK (total_sek >= 0),
  currency text NOT NULL DEFAULT 'SEK',

  status text NOT NULL DEFAULT 'sent' CHECK (status IN (
    'draft', 'sent', 'accepted', 'expired', 'cancelled'
  )),
  expires_at timestamptz NOT NULL,
  sent_at timestamptz,
  accepted_at timestamptz,

  stripe_checkout_session_id text,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,

  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_quotes_inquiry ON public.quotes(inquiry_id);
CREATE INDEX idx_quotes_status ON public.quotes(status);
CREATE INDEX idx_quotes_expires ON public.quotes(expires_at) WHERE status = 'sent';

CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage quotes"
  ON public.quotes FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Note: anonymous reads happen via the SECURITY DEFINER RPC below, not a
-- direct table policy.

GRANT SELECT, INSERT, UPDATE ON public.quotes TO authenticated;
GRANT ALL ON public.quotes TO service_role;

-- ----------------------------------------------------------------------

CREATE TABLE public.quote_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  description text NOT NULL,
  qty integer NOT NULL DEFAULT 1 CHECK (qty > 0),
  unit_price_sek numeric(10,2) NOT NULL CHECK (unit_price_sek >= 0),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_quote_items_quote ON public.quote_items(quote_id, sort_order);

ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage quote items"
  ON public.quote_items FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.quote_items TO authenticated;
GRANT ALL ON public.quote_items TO service_role;

-- ----------------------------------------------------------------------

-- Link from orders → originating quote (for quote-payment orders).
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS quote_id uuid REFERENCES public.quotes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_quote ON public.orders(quote_id) WHERE quote_id IS NOT NULL;

-- ----------------------------------------------------------------------

-- Public-by-token lookup. Returns the quote + its items as a single JSON
-- payload. Hides nothing — anyone with the token can see everything we'd put
-- in the customer-facing email anyway. Returns NULL for unknown/expired
-- tokens so the public page can show a clean "quote not found / expired"
-- state without distinguishing the two.
CREATE OR REPLACE FUNCTION public.get_quote_by_token(p_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_quote public.quotes;
  v_items jsonb;
BEGIN
  SELECT * INTO v_quote
  FROM public.quotes
  WHERE public_token = p_token
    AND status IN ('sent', 'accepted');
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', id,
      'description', description,
      'qty', qty,
      'unit_price_sek', unit_price_sek,
      'sort_order', sort_order
    )
    ORDER BY sort_order, created_at
  ), '[]'::jsonb)
  INTO v_items
  FROM public.quote_items
  WHERE quote_id = v_quote.id;

  RETURN jsonb_build_object(
    'id', v_quote.id,
    'public_token', v_quote.public_token,
    'customer_email', v_quote.customer_email,
    'customer_name', v_quote.customer_name,
    'title', v_quote.title,
    'intro_message', v_quote.intro_message,
    'total_sek', v_quote.total_sek,
    'currency', v_quote.currency,
    'status', v_quote.status,
    'expires_at', v_quote.expires_at,
    'sent_at', v_quote.sent_at,
    'accepted_at', v_quote.accepted_at,
    'order_id', v_quote.order_id,
    'items', v_items
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_quote_by_token(uuid) TO anon, authenticated;

-- Background sweep: mark sent quotes as expired once past expires_at.
-- Called opportunistically from edge functions (no pg_cron dependency).
CREATE OR REPLACE FUNCTION public.expire_old_quotes()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.quotes
  SET status = 'expired', updated_at = now()
  WHERE status = 'sent' AND expires_at < now();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.expire_old_quotes() TO authenticated, service_role;

-- ============================================================================
-- ## 20260608240000_strip_rental_schema.sql
-- ============================================================================
-- Strip rental schema (deferred Task #7).
--
-- The repo originated as a short-term rental marketplace; it was pivoted to
-- Kaisen sports-ticket travel but the rental schema was never removed.
-- This drops all rental-only tables, functions, views, and enums.
--
-- KEEPS untouched:
--   * messaging primitives (message_threads, messages) — general-purpose
--   * profiles, user_roles, user_status, app_role enum
--   * ticket flow (events, ticket_categories, orders, order_items, ticket_deliveries)
--   * inquiry + quote flow
--   * xs2event additions
--
-- LEAVES the `app_role` enum value 'host' in place. Postgres can't drop enum
-- values cleanly; nothing in the new code paths sets role='host', so it's
-- dead-but-harmless. If you want a true rename to 'admin/staff/customer',
-- do it in a focused future migration after auditing every RLS policy.

-- ============================================================================
-- 1. Drop the admin view + function that join to rental tables
-- ============================================================================
DROP FUNCTION IF EXISTS public.admin_search_users(text, user_status, app_role, text, text);
DROP VIEW IF EXISTS public.user_admin_view;

-- ============================================================================
-- 2. Drop rental-only Postgres functions
-- ============================================================================
DROP FUNCTION IF EXISTS public.host_search_listings(text, text, text, text, text);
DROP FUNCTION IF EXISTS public.host_search_listings(uuid, text, listing_status, text, text);
DROP FUNCTION IF EXISTS public.host_search_bookings(text, text, text, text, text);
DROP FUNCTION IF EXISTS public.host_search_bookings(uuid, text, booking_status, text, text);
DROP FUNCTION IF EXISTS public.host_search_payouts(uuid, text, text, text, text);
DROP FUNCTION IF EXISTS public.host_cancel_booking_full_refund(uuid);
DROP FUNCTION IF EXISTS public.cancel_booking_with_refund(uuid);
DROP FUNCTION IF EXISTS public.cancel_booking_with_refund(uuid, text);
DROP FUNCTION IF EXISTS public.cancel_expired_bookings();
DROP FUNCTION IF EXISTS public.mark_past_bookings_completed();
DROP FUNCTION IF EXISTS public.create_booking_with_financial_snapshot CASCADE;
DROP FUNCTION IF EXISTS public.confirm_booking_payment CASCADE;
DROP FUNCTION IF EXISTS public.process_guest_refund(uuid);
DROP FUNCTION IF EXISTS public.process_guest_refund(uuid, numeric, text);
DROP FUNCTION IF EXISTS public.process_host_claim CASCADE;
DROP FUNCTION IF EXISTS public.create_payout_on_booking_completion() CASCADE;
DROP FUNCTION IF EXISTS public.get_host_earnings_report CASCADE;
DROP FUNCTION IF EXISTS public.get_host_dashboard_kpis CASCADE;
DROP FUNCTION IF EXISTS public.admin_search_disputes(text, text, text, numeric, numeric, date, date, text, text);
DROP FUNCTION IF EXISTS public.admin_search_payouts CASCADE;
DROP FUNCTION IF EXISTS public.admin_search_bookings CASCADE;
DROP FUNCTION IF EXISTS public.admin_search_listings CASCADE;
DROP FUNCTION IF EXISTS public.admin_search_guest_debts CASCADE;
DROP FUNCTION IF EXISTS public.admin_search_reviews CASCADE;
DROP FUNCTION IF EXISTS public.admin_get_listings_reviews_report CASCADE;
DROP FUNCTION IF EXISTS public.admin_get_listing_reviews_detail CASCADE;
DROP FUNCTION IF EXISTS public.admin_export_reviews_custom_report CASCADE;
DROP FUNCTION IF EXISTS public.admin_resolve_dispute(uuid, text, numeric, text);
DROP FUNCTION IF EXISTS public.admin_resolve_dispute(uuid, numeric, text);
DROP FUNCTION IF EXISTS public.admin_get_dispute_details(uuid);
DROP FUNCTION IF EXISTS public.admin_get_weekly_bookings(integer);
DROP FUNCTION IF EXISTS public.admin_get_weekly_revenue(integer);
DROP FUNCTION IF EXISTS public.admin_get_weekly_revenue_report(date, date);
DROP FUNCTION IF EXISTS public.admin_get_detailed_revenue_report(date, date);
DROP FUNCTION IF EXISTS public.admin_mark_payout_completed(uuid);
DROP FUNCTION IF EXISTS public.calculate_listing_rating(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.update_rating_on_review_insert() CASCADE;
DROP FUNCTION IF EXISTS public.update_rating_on_review_update() CASCADE;
DROP FUNCTION IF EXISTS public.update_rating_on_review_delete() CASCADE;
DROP FUNCTION IF EXISTS public.set_review_listing_id() CASCADE;
DROP FUNCTION IF EXISTS public.check_guest_outstanding_debts(uuid);
DROP FUNCTION IF EXISTS public.expire_old_guest_debts();
DROP FUNCTION IF EXISTS public.apply_outstanding_debts_to_payout();
DROP FUNCTION IF EXISTS public.apply_outstanding_debts_to_payout(uuid);
DROP FUNCTION IF EXISTS public.get_eligible_refund_amount(uuid);
DROP FUNCTION IF EXISTS public.create_dispute_with_support_thread CASCADE;
DROP FUNCTION IF EXISTS public.send_dispute_resolution_message CASCADE;
DROP FUNCTION IF EXISTS public.process_guest_debt_payment CASCADE;

-- ============================================================================
-- 3. Drop rental tables (CASCADE removes dependent FKs, triggers, RLS, etc.)
-- ============================================================================
-- Order matters less with CASCADE but list child → parent for clarity.
DROP TABLE IF EXISTS public.listing_moderation_feedback CASCADE;
DROP TABLE IF EXISTS public.listing_availability CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.disputes CASCADE;
DROP TABLE IF EXISTS public.guest_debts CASCADE;
DROP TABLE IF EXISTS public.payouts CASCADE;
DROP TABLE IF EXISTS public.bookings CASCADE;
DROP TABLE IF EXISTS public.listings CASCADE;
DROP TABLE IF EXISTS public.cancellation_policies CASCADE;

-- ============================================================================
-- 4. Drop rental enums (now that no column references them)
-- ============================================================================
DROP TYPE IF EXISTS public.booking_status;
DROP TYPE IF EXISTS public.cancellation_policy;
DROP TYPE IF EXISTS public.listing_status;
DROP TYPE IF EXISTS public.property_type;
DROP TYPE IF EXISTS public.review_status;
DROP TYPE IF EXISTS public.dispute_category;
DROP TYPE IF EXISTS public.dispute_status;
DROP TYPE IF EXISTS public.payout_status_enum;

-- ============================================================================
-- 5. Recreate user_admin_view + admin_search_users without rental joins
-- ============================================================================
-- listings_count is gone entirely; bookings_count is replaced with orders_count
-- (counts the user's ticket/quote orders, the Kaisen equivalent of bookings).

CREATE OR REPLACE VIEW public.user_admin_view
  WITH (security_invoker = on)
AS
SELECT
  p.id,
  CONCAT('#', SUBSTRING(p.id::text, 1, 4), '-', SUBSTRING(p.id::text, 5, 2)) AS user_display_id,
  p.first_name,
  p.last_name,
  CONCAT(p.first_name, ' ', p.last_name) AS full_name,
  p.email,
  p.avatar_url,
  p.status,
  p.created_at,
  COALESCE(
    (SELECT role FROM public.user_roles
       WHERE user_id = p.id
       ORDER BY CASE
         WHEN role = 'admin' THEN 1
         WHEN role = 'guest' THEN 2
         ELSE 3
       END
       LIMIT 1),
    'guest'
  ) AS primary_role,
  (SELECT COUNT(*) FROM public.orders WHERE user_id = p.id)::int AS orders_count
FROM public.profiles p
ORDER BY p.created_at DESC;

GRANT SELECT ON public.user_admin_view TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_search_users(
  search_query text DEFAULT NULL,
  status_filter user_status DEFAULT NULL,
  role_filter app_role DEFAULT NULL,
  sort_by text DEFAULT 'created_at',
  sort_order text DEFAULT 'desc'
)
RETURNS TABLE (
  id uuid,
  user_display_id text,
  first_name text,
  last_name text,
  full_name text,
  email text,
  avatar_url text,
  status user_status,
  created_at timestamptz,
  primary_role text,
  orders_count int
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can search users';
  END IF;

  RETURN QUERY
  SELECT
    v.id,
    v.user_display_id,
    v.first_name,
    v.last_name,
    v.full_name,
    v.email,
    v.avatar_url,
    v.status,
    v.created_at,
    v.primary_role::text,
    v.orders_count
  FROM public.user_admin_view v
  WHERE
    (search_query IS NULL OR
     v.full_name ILIKE '%' || search_query || '%' OR
     v.email ILIKE '%' || search_query || '%')
    AND (status_filter IS NULL OR v.status = status_filter)
    AND (role_filter IS NULL OR v.primary_role::app_role = role_filter)
  ORDER BY
    CASE WHEN sort_by = 'created_at' AND sort_order = 'desc' THEN v.created_at END DESC,
    CASE WHEN sort_by = 'created_at' AND sort_order = 'asc'  THEN v.created_at END ASC,
    CASE WHEN sort_by = 'full_name'  AND sort_order = 'asc'  THEN v.full_name  END ASC,
    CASE WHEN sort_by = 'full_name'  AND sort_order = 'desc' THEN v.full_name  END DESC,
    v.created_at DESC;
END;
$$;

-- ============================================================================
-- ## 20260608250000_p0_fixes.sql
-- ============================================================================
-- P0 fixes from the post-build audit.
--
-- 1. get_order_by_session — public RPC so guest customers can see their
--    OrderConfirmation page right after Stripe's redirect, before they've
--    set their Mitt Kaisen password (and therefore can't yet satisfy the
--    auth.uid() = user_id RLS predicate on orders).
--
-- 2. quote_items SELECT policy — quote orders have no order_items; the line
--    items live on quote_items via order.quote_id. Pre-fix, the table was
--    admin-only, so a quote customer saw "Totalt" but no breakdown.

-- ============================================================================
-- 1. Public order lookup by Stripe session id
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_order_by_session(
  p_order_id uuid,
  p_session_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order public.orders;
  v_items jsonb;
  v_quote_items jsonb;
BEGIN
  -- Token-style auth: caller must know BOTH order_id (URL path) AND the
  -- Stripe session_id (URL query). Stripe session ids are unguessable;
  -- the pair acts as a bearer credential. Returns NULL if the pair doesn't
  -- match an order — caller shows "not found".
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
    AND stripe_checkout_session_id = p_session_id;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Ticket-order line items (join to events + categories + deliveries)
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', oi.id,
    'qty', oi.qty,
    'unit_price_sek', oi.unit_price_sek,
    'sub_category', oi.sub_category,
    'events', (
      SELECT jsonb_build_object(
        'sport', e.sport,
        'tournament_name', e.tournament_name,
        'home_team', e.home_team,
        'away_team', e.away_team,
        'race_name', e.race_name,
        'venue_name', e.venue_name,
        'city', e.city,
        'starts_at', e.starts_at
      ) FROM public.events e WHERE e.id = oi.event_id
    ),
    'ticket_categories', (
      SELECT jsonb_build_object('name', tc.name)
      FROM public.ticket_categories tc WHERE tc.id = oi.category_id
    ),
    'ticket_deliveries', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'file_url', td.file_url,
        'delivered_at', td.delivered_at
      ))
      FROM public.ticket_deliveries td
      WHERE td.order_item_id = oi.id
    ), '[]'::jsonb)
  )), '[]'::jsonb)
  INTO v_items
  FROM public.order_items oi
  WHERE oi.order_id = v_order.id;

  -- Quote-order line items (separate table, only populated for quote orders)
  IF v_order.quote_id IS NOT NULL THEN
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'id', qi.id,
      'description', qi.description,
      'qty', qi.qty,
      'unit_price_sek', qi.unit_price_sek
    ) ORDER BY qi.sort_order, qi.created_at), '[]'::jsonb)
    INTO v_quote_items
    FROM public.quote_items qi
    WHERE qi.quote_id = v_order.quote_id;
  ELSE
    v_quote_items := '[]'::jsonb;
  END IF;

  RETURN jsonb_build_object(
    'order', to_jsonb(v_order),
    'items', v_items,
    'quote_items', v_quote_items
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_order_by_session(uuid, text) TO anon, authenticated;

-- ============================================================================
-- 2. quote_items SELECT policy for customers who own the parent order
-- ============================================================================
CREATE POLICY "Order owners view quote items"
  ON public.quote_items FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.quote_id = quote_items.quote_id
      AND o.user_id = auth.uid()
  ));

-- ============================================================================
-- ## 20260608260000_refunds.sql
-- ============================================================================
-- Refund tracking.
--
-- Supports both full and partial refunds, multiple refunds per order, and
-- keeps a denormalized total on the order for fast Mitt Kaisen queries.
--
-- Does NOT auto-cancel xs2event bookings — xs2 doesn't expose a public
-- booking-cancellation endpoint, so cancellation goes through xs2 support.
-- The admin refund UI surfaces this clearly.

CREATE TABLE public.refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  amount_sek numeric(10,2) NOT NULL CHECK (amount_sek > 0),
  reason text,
  stripe_refund_id text,
  processed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_refunds_order ON public.refunds(order_id, created_at DESC);

ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage refunds"
  ON public.refunds FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Order owners view their refunds"
  ON public.refunds FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = refunds.order_id AND o.user_id = auth.uid()
  ));

GRANT SELECT ON public.refunds TO authenticated;
GRANT ALL ON public.refunds TO service_role;

-- Denormalized running total + reason summary on orders. The edge function
-- updates this as part of the refund transaction so Mitt Kaisen / admin
-- listings don't need to aggregate from refunds.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS refunded_sek numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_refund_reason text;

-- ============================================================================
-- ## 20260608270000_media_and_banners.sql
-- ============================================================================
-- Media storage + editable home banners.
--
-- Two pieces:
--   1. kaisen-media public-read storage bucket for hero banners, event covers,
--      and any future editorial imagery. Admin-only writes.
--   2. home_slides table replacing the hardcoded heroSlides array in
--      src/pages/Home.tsx. Seeded with the 4 existing slides verbatim so the
--      cutover is invisible to visitors. Home.tsx keeps a code-level fallback
--      if the table is empty (defensive).
--
-- Image_url on home_slides is a free-text URL — it can point at the bundled
-- /src/assets path (during transition) or at a kaisen-media public URL once
-- admins start uploading their own.

-- ============================================================================
-- 1. Storage bucket
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kaisen-media',
  'kaisen-media',
  true,
  10485760, -- 10 MB per file
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

-- Storage RLS — buckets policies live on storage.objects.
CREATE POLICY "kaisen-media public read"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'kaisen-media');

CREATE POLICY "kaisen-media admin write"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'kaisen-media'
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "kaisen-media admin update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'kaisen-media'
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "kaisen-media admin delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'kaisen-media'
    AND public.has_role(auth.uid(), 'admin')
  );

-- ============================================================================
-- 2. Home slides table
-- ============================================================================
CREATE TABLE public.home_slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  eyebrow text,
  title text NOT NULL,
  italic text,
  description text,
  cta_label text,
  cta_to text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_home_slides_order ON public.home_slides(sort_order) WHERE is_active = true;

CREATE TRIGGER update_home_slides_updated_at
  BEFORE UPDATE ON public.home_slides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.home_slides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Home slides are public"
  ON public.home_slides FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins manage home slides"
  ON public.home_slides FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT SELECT ON public.home_slides TO anon, authenticated;
GRANT ALL ON public.home_slides TO service_role;

-- Seed with the existing 4 slides. image_url points at bundled assets for now;
-- replace with /storage/v1/object/public/kaisen-media/... once admins upload
-- their own. Front-end maps these src/assets paths to imported URLs via a
-- small lookup table to keep bundling working.
INSERT INTO public.home_slides (image_url, eyebrow, title, italic, description, cta_label, cta_to, sort_order) VALUES
('asset:kaisen-hero',     'Personlig Reseservice', 'Resor skapade',           'Just för dig',           'Sportresor, gruppresor, träningsläger och VIP-service — levererat med personlig omsorg av en dedikerad resekonsult.', 'Planera din resa',  '/contact',                 0),
('asset:kaisen-sports',   'Reklamvideo kommer',    'Upplev sportens',         'största ögonblick',      'F1-race i Monaco, Premier League på Anfield eller Champions League-finaler — vi ordnar biljetter, boende och VIP-access.',          'Se sportresor',     '/services/sportresor',     1),
('asset:kaisen-group',    'Grupp & Konferens',     'Gruppresor &',            'konferenser',            'Från företagsevent till kompisgäng — vi sköter hela logistiken för grupper från 8 upp till 200+ personer.',                          'Läs mer',           '/group-travel',            2),
('asset:kaisen-incoming', 'Träningsläger',         'Träna där',               'proffsen tränar',        'Fotboll, simning, friidrott och fler sporter — kompletta läger med boende, transfer och planhyra.',                                 'Se träningsläger',  '/services/traningslager',  3);

-- ============================================================================
-- ## 20260608280000_markup_defaults.sql
-- ============================================================================
-- Platform-wide markup defaults.
--
-- Stored in the existing platform_settings (setting_key, setting_value, setting_type)
-- key/value table. Read by xs2-get-event-tickets when creating fresh
-- ticket_categories rows, by xs2-reserve as a safety fallback, and editable
-- via /admin/markup-defaults.
--
-- Existing rows keep their own markup_pct / markup_fixed_sek — this only
-- affects NEW category rows created by lazy backfill on first event view.
-- Admins can still bulk-apply via a future "Apply default to all" action.

INSERT INTO public.platform_settings (setting_key, setting_value, setting_type, description)
VALUES
  ('default_markup_pct',       '15',  'decimal', 'Platsens standardprocentsats för påslag (gäller nya kategorier)'),
  ('default_markup_fixed_sek', '0',   'decimal', 'Platsens fasta påslag i SEK (gäller nya kategorier)')
ON CONFLICT (setting_key) DO NOTHING;

-- Helper: read a numeric setting with caller-supplied fallback if missing.
-- SECURITY DEFINER so edge functions (service role) and admin UI (authenticated)
-- both use the same path, RLS on the table notwithstanding.
CREATE OR REPLACE FUNCTION public.get_platform_decimal(p_key text, p_default numeric)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_value text;
BEGIN
  SELECT setting_value INTO v_value
  FROM public.platform_settings
  WHERE setting_key = p_key AND is_active = true
  LIMIT 1;
  IF v_value IS NULL THEN
    RETURN p_default;
  END IF;
  BEGIN
    RETURN v_value::numeric;
  EXCEPTION WHEN OTHERS THEN
    RETURN p_default;
  END;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_platform_decimal(text, numeric) TO anon, authenticated, service_role;

-- ============================================================================
-- ## 20260608290000_newsletter.sql
-- ============================================================================
-- Newsletter signups.
--
-- Public can INSERT (the footer form), admins can SELECT/DELETE. We don't need
-- updates — if someone changes email, they sign up again.

CREATE TABLE public.newsletter_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  source text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_newsletter_signups_email ON public.newsletter_signups (lower(email));

ALTER TABLE public.newsletter_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe"
  ON public.newsletter_signups FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins manage signups"
  ON public.newsletter_signups FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT INSERT ON public.newsletter_signups TO anon, authenticated;
GRANT SELECT, DELETE ON public.newsletter_signups TO authenticated;
GRANT ALL ON public.newsletter_signups TO service_role;

-- ============================================================================
-- ## 20260609100000_eur_sek_rate.sql
-- ============================================================================
-- EUR → SEK conversion rate.
--
-- xs2event returns ticket prices in EUR (cents). Swedish customers see SEK.
-- This setting drives the conversion; admins update it manually so prices
-- don't fluctuate during a customer's checkout session.
--
-- Edit at /admin/markup-defaults.

INSERT INTO public.platform_settings (setting_key, setting_value, setting_type, description)
VALUES (
  'eur_to_sek_rate',
  '11.5',
  'decimal',
  'Växelkurs EUR → SEK för xs2event-biljetter. Uppdatera manuellt — påverkar nya prisberäkningar omedelbart.'
)
ON CONFLICT (setting_key) DO NOTHING;
