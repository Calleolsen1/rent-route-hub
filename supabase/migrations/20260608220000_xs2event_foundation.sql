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
