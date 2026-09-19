CREATE TABLE IF NOT EXISTS public.team_venue_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sport public.event_sport NOT NULL,
  match_key text NOT NULL,
  image_url text NOT NULL,
  venue_label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.team_venue_photos DROP CONSTRAINT IF EXISTS uq_team_venue_photos_key;
ALTER TABLE public.team_venue_photos ADD CONSTRAINT uq_team_venue_photos_key UNIQUE (sport, match_key);
GRANT SELECT ON public.team_venue_photos TO anon, authenticated;
GRANT ALL ON public.team_venue_photos TO service_role;
ALTER TABLE public.team_venue_photos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Team venue photos are viewable by everyone" ON public.team_venue_photos;
CREATE POLICY "Team venue photos are viewable by everyone" ON public.team_venue_photos FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage team venue photos" ON public.team_venue_photos;
CREATE POLICY "Admins manage team venue photos" ON public.team_venue_photos FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP TRIGGER IF EXISTS update_team_venue_photos_updated_at ON public.team_venue_photos;
CREATE TRIGGER update_team_venue_photos_updated_at BEFORE UPDATE ON public.team_venue_photos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE VIEW public.home_team_photo_coverage AS
SELECT e.sport, COALESCE(e.home_team, e.race_name) AS match_key, count(*) AS event_count, min(e.venue_name) AS sample_venue, max(p.image_url) AS image_url
FROM public.events e
LEFT JOIN public.team_venue_photos p ON p.sport = e.sport AND p.match_key = COALESCE(e.home_team, e.race_name)
WHERE e.status = 'upcoming' AND COALESCE(e.home_team, e.race_name) IS NOT NULL
GROUP BY e.sport, COALESCE(e.home_team, e.race_name);
ALTER VIEW public.home_team_photo_coverage SET (security_invoker = true);
GRANT SELECT ON public.home_team_photo_coverage TO anon, authenticated;