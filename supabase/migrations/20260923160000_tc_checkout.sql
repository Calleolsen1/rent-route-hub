-- Customer checkout for Travel Connection tickets (phase 2).
--
--   1. Markup rules: standard -> league -> match -> category, most specific
--      wins, plus optional rounding of the customer price.
--   2. Ticket category info: the supplier's description of each category
--      ("Long side, upper tier, home fans only"), cached for a day.
--   3. tc_bookings gains 'draft': an order's tickets are chosen and priced,
--      but not held yet. The 10-minute supplier hold starts only when the
--      customer clicks through to pay.
--   4. Orders: stop the public from listing or editing every order. The
--      checkout page reads its one order through a function instead.
--
-- Nothing here turns selling on. That is still public_prices_enabled.

-- ─── 1. Markup rules ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.markup_rules (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope             text NOT NULL CHECK (scope IN ('league', 'event')),
  -- events.tournament_name, e.g. 'Premier League'
  league            text,
  event_id          uuid REFERENCES public.events(id) ON DELETE CASCADE,
  markup_pct        numeric(6,2) NOT NULL DEFAULT 0,
  markup_fixed_sek  numeric(10,2) NOT NULL DEFAULT 0,
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (scope = 'league' AND league IS NOT NULL AND event_id IS NULL) OR
    (scope = 'event'  AND event_id IS NOT NULL AND league IS NULL)
  )
);

-- Plain UNIQUEs (NULLs don't collide) so PostgREST upserts can target them.
ALTER TABLE public.markup_rules DROP CONSTRAINT IF EXISTS uq_markup_rules_league;
ALTER TABLE public.markup_rules ADD CONSTRAINT uq_markup_rules_league UNIQUE (league);
ALTER TABLE public.markup_rules DROP CONSTRAINT IF EXISTS uq_markup_rules_event;
ALTER TABLE public.markup_rules ADD CONSTRAINT uq_markup_rules_event UNIQUE (event_id);

ALTER TABLE public.markup_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage markup_rules" ON public.markup_rules;
CREATE POLICY "Admins manage markup_rules"
  ON public.markup_rules FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.markup_rules TO authenticated;
GRANT ALL ON public.markup_rules TO service_role;

-- A category's own markup_pct/markup_fixed_sek only wins when an admin set
-- it on purpose. Otherwise the match/league/standard rule applies, so
-- changing the standard markup reprices everything not deliberately set.
ALTER TABLE public.ticket_categories
  ADD COLUMN IF NOT EXISTS markup_override boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.ticket_categories.markup_override IS
  'True when an admin set this category''s markup by hand. Travel Connection categories otherwise take the match, league or standard markup.';

-- Round customer prices up to a friendly step (1 = off, 10, 50, 100 kr).
INSERT INTO public.platform_settings (setting_key, setting_value, setting_type, description)
VALUES ('price_rounding_sek', '1', 'decimal',
        'Kundpriser avrundas uppåt till närmaste steg i kronor (1 = ingen avrundning).')
ON CONFLICT (setting_key) DO NOTHING;

-- ─── 2. Ticket category info ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tc_ticket_category_info (
  tc_category_id  integer PRIMARY KEY,
  name            text,
  -- Plain-text bullet points, converted from the supplier's HTML on the
  -- server so no third-party markup is ever rendered on the site.
  description     jsonb NOT NULL DEFAULT '[]'::jsonb,
  color           text,
  guest_data_requirements jsonb,
  fetched_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tc_ticket_category_info ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins read tc_ticket_category_info" ON public.tc_ticket_category_info;
CREATE POLICY "Admins read tc_ticket_category_info"
  ON public.tc_ticket_category_info FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
GRANT SELECT ON public.tc_ticket_category_info TO authenticated;
GRANT ALL ON public.tc_ticket_category_info TO service_role;

-- ─── 3. Draft bookings + order vouchers ───────────────────────────────────
ALTER TABLE public.tc_bookings DROP CONSTRAINT IF EXISTS tc_bookings_status_check;
ALTER TABLE public.tc_bookings ADD CONSTRAINT tc_bookings_status_check
  CHECK (status IN ('draft', 'reserved', 'confirmed', 'cancelled', 'expired', 'failed'));

-- One supplier booking per website order.
CREATE UNIQUE INDEX IF NOT EXISTS uq_tc_bookings_order
  ON public.tc_bookings (order_id) WHERE order_id IS NOT NULL;

-- Supplier travel vouchers, copied onto the order so the customer can see
-- them in Mitt Kaisen (tc_bookings itself stays admin-only).
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS voucher_urls jsonb NOT NULL DEFAULT '[]'::jsonb;

-- ─── 4. Close the public order listing ────────────────────────────────────
-- These let anyone holding the public key list every order (names, emails,
-- phone numbers) and edit unpaid guest orders. Signed-in owners and admins
-- keep their own policies; guests go through the two functions below, which
-- need the exact order id — an unguessable UUID — and return only that order.
DROP POLICY IF EXISTS "Anyone can view order by id" ON public.orders;
DROP POLICY IF EXISTS "Anyone can update in-progress order contact" ON public.orders;
DROP POLICY IF EXISTS "Anyone can view order items" ON public.order_items;
REVOKE SELECT, UPDATE ON public.orders FROM anon;
REVOKE SELECT ON public.order_items FROM anon;

-- create_order_with_items is unused since the ticket picker was removed, and
-- its latest overload takes p_unit_price_sek FROM THE CALLER — with selling
-- on, anyone could create a 1 kr order and create-checkout would charge 1 kr.
-- Orders are now created by travelconnection-checkout, which prices on the
-- server. Several overloads exist, so revoke every one of them.
DO $$
DECLARE
  f regprocedure;
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public' AND p.proname = 'create_order_with_items'
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', f);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.get_checkout_order(p_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order public.orders;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  RETURN jsonb_build_object(
    'order', jsonb_build_object(
      'id', v_order.id,
      'user_id', v_order.user_id,
      'status', v_order.status,
      'total_sek', v_order.total_sek,
      'currency', v_order.currency,
      'customer_email', v_order.customer_email,
      'customer_name', v_order.customer_name,
      'customer_phone', v_order.customer_phone
    ),
    'items', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', oi.id,
        'qty', oi.qty,
        'unit_price_sek', oi.unit_price_sek,
        'events', jsonb_build_object(
          'id', e.id,
          'sport', e.sport,
          'tournament_name', e.tournament_name,
          'home_team', e.home_team,
          'away_team', e.away_team,
          'race_name', e.race_name,
          'venue_name', e.venue_name,
          'city', e.city,
          'starts_at', e.starts_at
        ),
        'ticket_categories', jsonb_build_object(
          'id', tc.id,
          'name', tc.name,
          'description', tc.description
        )
      ))
      FROM public.order_items oi
      JOIN public.events e ON e.id = oi.event_id
      JOIN public.ticket_categories tc ON tc.id = oi.category_id
      WHERE oi.order_id = v_order.id
    ), '[]'::jsonb),
    'hold_expires_at', (
      SELECT b.reservation_expires_at
      FROM public.tc_bookings b
      WHERE b.order_id = v_order.id AND b.status = 'reserved'
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_checkout_order(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.set_checkout_contact(
  p_order_id uuid,
  p_name text,
  p_email text,
  p_phone text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF coalesce(trim(p_name), '') = '' OR p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RAISE EXCEPTION 'Namn och en giltig e-postadress krävs';
  END IF;

  UPDATE public.orders
     SET customer_name = left(trim(p_name), 200),
         customer_email = lower(left(trim(p_email), 200)),
         customer_phone = left(trim(coalesce(p_phone, '')), 50)
   WHERE id = p_order_id
     AND status IN ('pending', 'awaiting_payment');
  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_checkout_contact(uuid, text, text, text) TO anon, authenticated;

-- ─── 5. Hourly supplier poll ──────────────────────────────────────────────
-- Vouchers and invoice status for confirmed bookings, and lapsed holds.
-- Uses invoke_sync_function + the cron secret from the nightly-sync migration.
DO $$
BEGIN
  PERFORM cron.unschedule('hourly-travelconnection-poll');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

SELECT cron.schedule('hourly-travelconnection-poll', '25 * * * *',
  $$ SELECT public.invoke_sync_function('travelconnection-poll'); $$);
