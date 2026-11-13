-- XS2Event as a third ticket supplier, READ-ONLY (football + F1).
--
-- KAISEN's XS2 key can read events/tickets/prices but not reserve or book;
-- XS2 rows are request-only and bought by hand in the XS2 portal.
--
-- xs2_event_links records which of our fixtures each XS2 event sells
-- tickets for, like p1_event_links. Prices/stock are fetched live by
-- event-tickets. Admin decisions are sticky ('manual' / 'ignored').
--
-- Unrelated to the retired 2026-06 integration (removed 2026-09-19); the
-- leftover orders.xs2_* columns stay as history and are not used.

CREATE TABLE IF NOT EXISTS public.xs2_event_links (
  xs2_event_id       text PRIMARY KEY,
  event_id           uuid REFERENCES public.events(id) ON DELETE SET NULL,
  match_method       text NOT NULL DEFAULT 'none'
                     CHECK (match_method IN ('auto', 'manual', 'ignored', 'none')),
  match_note         text,
  xs2_kind           text NOT NULL CHECK (xs2_kind IN ('football', 'f1')),
  xs2_title          text NOT NULL,
  xs2_tournament     text,
  xs2_home_team      text,
  xs2_away_team      text,
  xs2_starts_at      timestamptz,
  xs2_venue          text,
  xs2_date_confirmed boolean NOT NULL DEFAULT false,
  xs2_has_tickets    boolean NOT NULL DEFAULT false,
  last_seen_at       timestamptz NOT NULL DEFAULT now(),
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- One XS2 event per fixture (a fixture may also have TC and P1 links).
CREATE UNIQUE INDEX IF NOT EXISTS xs2_event_links_event_id_key
  ON public.xs2_event_links(event_id) WHERE event_id IS NOT NULL;

ALTER TABLE public.xs2_event_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage xs2_event_links" ON public.xs2_event_links;
CREATE POLICY "Admins manage xs2_event_links"
  ON public.xs2_event_links
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.xs2_event_links TO authenticated;
GRANT ALL ON public.xs2_event_links TO service_role;

-- The merged ticket list records XS2 categories too.
ALTER TABLE public.supplier_category_links
  DROP CONSTRAINT IF EXISTS supplier_category_links_supplier_check;
ALTER TABLE public.supplier_category_links
  ADD CONSTRAINT supplier_category_links_supplier_check
  CHECK (supplier IN ('travelconnection', 'p1', 'xs2'));

-- Nightly, after p1-sync (01:25 UTC).
DO $$
BEGIN
  PERFORM cron.unschedule('nightly-xs2-sync');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

SELECT cron.schedule('nightly-xs2-sync', '35 1 * * *',
  $$ SELECT public.invoke_sync_function('xs2-sync'); $$);