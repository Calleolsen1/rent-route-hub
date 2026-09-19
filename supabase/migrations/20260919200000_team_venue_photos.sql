-- One stadium photo per home team (and per F1 race), reused across every
-- fixture that team hosts.
--
-- Keyed by team rather than by venue on purpose: there are 75 distinct home
-- teams against 80 venues, so it costs no more uploads, it reads far better in
-- admin ("Arsenal's stadium"), and clubs that share a ground — Milan and Inter
-- at San Siro — can each show their own imagery.
--
-- `match_key` holds events.home_team for soccer and events.race_name for F1.
-- Both are already canonicalised by oneclicket-sync (TEAM_ALIASES /
-- canonicalRaceName), so a single row matches every fixture reliably.

CREATE TABLE IF NOT EXISTS public.team_venue_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sport public.event_sport NOT NULL,
  match_key text NOT NULL,
  image_url text NOT NULL,
  venue_label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- One photo per team per sport. A real UNIQUE constraint (not a partial
-- index) so PostgREST upsert onConflict works.
ALTER TABLE public.team_venue_photos
  DROP CONSTRAINT IF EXISTS uq_team_venue_photos_key;
ALTER TABLE public.team_venue_photos
  ADD CONSTRAINT uq_team_venue_photos_key UNIQUE (sport, match_key);

-- Public read: the site resolves card images anonymously.
GRANT SELECT ON public.team_venue_photos TO anon, authenticated;
GRANT ALL ON public.team_venue_photos TO service_role;
ALTER TABLE public.team_venue_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Team venue photos are viewable by everyone" ON public.team_venue_photos;
CREATE POLICY "Team venue photos are viewable by everyone"
  ON public.team_venue_photos FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins manage team venue photos" ON public.team_venue_photos;
CREATE POLICY "Admins manage team venue photos"
  ON public.team_venue_photos FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_team_venue_photos_updated_at ON public.team_venue_photos;
CREATE TRIGGER update_team_venue_photos_updated_at
  BEFORE UPDATE ON public.team_venue_photos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Admin worklist: which home teams have the most games, and do they have a
-- photo yet? Lets the upload screen sort by impact instead of alphabetically.
CREATE OR REPLACE VIEW public.home_team_photo_coverage AS
SELECT
  e.sport,
  COALESCE(e.home_team, e.race_name) AS match_key,
  count(*)                           AS event_count,
  min(e.venue_name)                  AS sample_venue,
  max(p.image_url)                   AS image_url
FROM public.events e
LEFT JOIN public.team_venue_photos p
  ON p.sport = e.sport
 AND p.match_key = COALESCE(e.home_team, e.race_name)
WHERE e.status = 'upcoming'
  AND COALESCE(e.home_team, e.race_name) IS NOT NULL
GROUP BY e.sport, COALESCE(e.home_team, e.race_name);

ALTER VIEW public.home_team_photo_coverage SET (security_invoker = true);
GRANT SELECT ON public.home_team_photo_coverage TO anon, authenticated;
