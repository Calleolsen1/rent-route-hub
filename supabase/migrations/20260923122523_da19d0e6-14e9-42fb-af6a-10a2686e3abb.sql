-- Travel Connection — ticket supplier for football and F1.
--
-- Fixtures still come from football-data.org and Jolpica. Travel Connection
-- never creates an event: its products are LINKED onto the fixtures we
-- already have. That is the lesson from OneClicket, which inserted its own
-- events next to football-data's and showed every game twice.
--
-- Three tables:
--   tc_product_links  one row per Travel Connection product, with the event it
--                     was matched to (or null + a reason, for admin review)
--   tc_bookings       one row per reservation / order placed with the supplier
--   fx_rates          cached live exchange rates (EUR/GBP -> SEK)
--
-- Ticket options land in the existing ticket_categories table, keyed
-- external_category_id = 'tc_<ticket option id>', so admin markup overrides
-- and order_items keep working unchanged.

-- ─── Product links ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tc_product_links (
  tc_product_id      integer PRIMARY KEY,
  -- Null until matched. SET NULL so deleting a fixture never loses the link
  -- row (and its manual decision) — the next sync re-matches it.
  event_id           uuid REFERENCES public.events(id) ON DELETE SET NULL,
  -- auto:    matched by the sync (team pair / race date)
  -- manual:  linked by an admin; the sync never overrides it
  -- ignored: an admin decided we don't sell this; never re-matched
  -- none:    no match found
  match_method       text NOT NULL DEFAULT 'none'
                     CHECK (match_method IN ('auto', 'manual', 'ignored', 'none')),
  -- Why the sync left it unmatched, in plain Swedish for the review list.
  match_note         text,
  -- True for competitions/sports Kaisen lists (the six football leagues + F1).
  -- Out-of-scope products (Scottish football, concerts) stay out of the
  -- review list so it only shows what actually needs a decision.
  in_scope           boolean NOT NULL DEFAULT false,
  tc_type            text NOT NULL,
  tc_name            text NOT NULL,
  tc_competition_id  integer,
  tc_competition     text,
  tc_home_team       text,
  tc_away_team       text,
  tc_starts_at       timestamptz,
  tc_date_confirmed  boolean NOT NULL DEFAULT false,
  tc_time_confirmed  boolean NOT NULL DEFAULT false,
  tc_venue_id        integer,
  tc_currency        text,
  tc_status          text,
  guest_details_required boolean NOT NULL DEFAULT false,
  last_seen_at       timestamptz NOT NULL DEFAULT now(),
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- One supplier product per fixture. A plain UNIQUE constraint (not a partial
-- index) so PostgREST upserts can use it; NULLs don't collide.
ALTER TABLE public.tc_product_links
  DROP CONSTRAINT IF EXISTS uq_tc_product_links_event;
ALTER TABLE public.tc_product_links
  ADD CONSTRAINT uq_tc_product_links_event UNIQUE (event_id);

CREATE INDEX IF NOT EXISTS idx_tc_product_links_review
  ON public.tc_product_links (in_scope, match_method);

ALTER TABLE public.tc_product_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage tc_product_links" ON public.tc_product_links;
CREATE POLICY "Admins manage tc_product_links"
  ON public.tc_product_links FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ─── Bookings placed with the supplier ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tc_bookings (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Website order (Stripe path) or back-office booking (quote path). Both
  -- optional: an admin can also hold tickets before either exists.
  order_id            uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  booking_id          uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  event_id            uuid REFERENCES public.events(id) ON DELETE SET NULL,
  -- 'sandbox' or 'production', derived from TRAVELCONNECTION_BASE_URL at the
  -- moment of the call. Sandbox rows are never real money.
  environment         text NOT NULL CHECK (environment IN ('sandbox', 'production')),
  -- reserved -> confirmed, or reserved -> cancelled / expired. 'failed' when
  -- the supplier rejected the call; error_message says why.
  status              text NOT NULL DEFAULT 'reserved'
                      CHECK (status IN ('reserved', 'confirmed', 'cancelled', 'expired', 'failed')),
  reservation_num     text,
  reservation_expires_at timestamptz,
  -- Supplier order number. For a confirmed reservation it equals
  -- reservation_num — Travel Connection keeps the same "O123456" id.
  order_num           text,
  agent_reference     text,
  lines               jsonb NOT NULL DEFAULT '[]'::jsonb,
  supplier_total      numeric(12,2),
  supplier_currency   text,
  -- Supplier documents, refreshed from GET /orders/{num}.
  invoice_url         text,
  voucher_urls        jsonb NOT NULL DEFAULT '[]'::jsonb,
  supplier_status     text,
  request_payload     jsonb,
  response_payload    jsonb,
  error_message       text,
  created_by          uuid,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tc_bookings_order ON public.tc_bookings (order_id);
CREATE INDEX IF NOT EXISTS idx_tc_bookings_status ON public.tc_bookings (status, created_at DESC);

ALTER TABLE public.tc_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage tc_bookings" ON public.tc_bookings;
CREATE POLICY "Admins manage tc_bookings"
  ON public.tc_bookings FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ─── Live exchange rates ──────────────────────────────────────────────────
-- Written by edge functions only (service role). Admins can read it to see
-- which rate priced a ticket.
CREATE TABLE IF NOT EXISTS public.fx_rates (
  currency     text PRIMARY KEY,
  rate_to_sek  numeric(12,6) NOT NULL CHECK (rate_to_sek > 0),
  rate_date    date,
  source       text NOT NULL,
  fetched_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.fx_rates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read fx_rates" ON public.fx_rates;
CREATE POLICY "Admins read fx_rates"
  ON public.fx_rates FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ─── Ticket categories: supplier cost basis ───────────────────────────────
-- The supplier price in its own currency, so admin can see cost next to the
-- marked-up SEK price, and so an order can record what it cost us.
ALTER TABLE public.ticket_categories
  ADD COLUMN IF NOT EXISTS supplier_price     numeric(12,2),
  ADD COLUMN IF NOT EXISTS supplier_currency  text,
  ADD COLUMN IF NOT EXISTS max_purchase_qty   integer;

COMMENT ON COLUMN public.ticket_categories.supplier_price IS
  'Travel Connection wholesale price per ticket, in supplier_currency (EUR or GBP). Refreshed on every live lookup.';
COMMENT ON COLUMN public.ticket_categories.max_purchase_qty IS
  'Most tickets the supplier will sell in one order for this option right now. 0 = sold out at the moment.';

-- ─── updated_at triggers ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.tc_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tc_product_links_updated ON public.tc_product_links;
CREATE TRIGGER trg_tc_product_links_updated
  BEFORE UPDATE ON public.tc_product_links
  FOR EACH ROW EXECUTE FUNCTION public.tc_touch_updated_at();

DROP TRIGGER IF EXISTS trg_tc_bookings_updated ON public.tc_bookings;
CREATE TRIGGER trg_tc_bookings_updated
  BEFORE UPDATE ON public.tc_bookings
  FOR EACH ROW EXECUTE FUNCTION public.tc_touch_updated_at();