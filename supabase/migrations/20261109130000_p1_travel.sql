-- P1 Travel B2B (second ticket supplier, football + F1).
--
-- p1_event_links records which of our fixtures each P1 event sells tickets
-- for, like tc_product_links does for Travel Connection. Prices and stock
-- are NOT stored — p1-tickets fetches them live. Admin decisions are sticky:
-- 'manual' links and 'ignored' events are never touched by the matcher.

CREATE TABLE IF NOT EXISTS public.p1_event_links (
  p1_event_id     uuid PRIMARY KEY,
  event_id        uuid REFERENCES public.events(id) ON DELETE SET NULL,
  match_method    text NOT NULL DEFAULT 'none'
                  CHECK (match_method IN ('auto', 'manual', 'ignored', 'none', 'created')),
  match_note      text,
  in_scope        boolean NOT NULL DEFAULT false,
  p1_kind         text NOT NULL CHECK (p1_kind IN ('football', 'f1', 'other')),
  p1_title        text NOT NULL,
  p1_series       text,
  p1_home_team    text,
  p1_away_team    text,
  p1_starts_at    timestamptz,
  p1_venue        text,
  p1_date_confirmed boolean NOT NULL DEFAULT false,
  last_seen_at    timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- One P1 event per fixture (a fixture may also have a Travel Connection link).
CREATE UNIQUE INDEX IF NOT EXISTS p1_event_links_event_id_key
  ON public.p1_event_links(event_id) WHERE event_id IS NOT NULL;

ALTER TABLE public.p1_event_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage p1_event_links" ON public.p1_event_links;
CREATE POLICY "Admins manage p1_event_links"
  ON public.p1_event_links
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Nightly, after travelconnection-sync (01:15 UTC): fixtures and the other
-- supplier's links exist first, so P1 matches onto the same fixture rows.
DO $$
BEGIN
  PERFORM cron.unschedule('nightly-p1-sync');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

SELECT cron.schedule('nightly-p1-sync', '25 1 * * *',
  $$ SELECT public.invoke_sync_function('p1-sync'); $$);
