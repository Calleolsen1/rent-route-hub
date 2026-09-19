-- Club crests, keyed by the site's canonical team name.
--
-- football-data.org supplies a crest URL with every team, so football-sync
-- stores one per club and EventImage can render a real badge without an
-- extra API call per card. Free to use alongside the data, which is what
-- made this preferable to sourcing 200+ club crests ourselves.
--
-- Separate from team_venue_photos on purpose: a crest arrives automatically
-- from the sync, a stadium photo is uploaded by hand, and a sync must never
-- overwrite something a person chose.

CREATE TABLE IF NOT EXISTS public.team_crests (
  team_name text PRIMARY KEY,
  crest_url text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.team_crests TO anon, authenticated;
GRANT ALL ON public.team_crests TO service_role;
ALTER TABLE public.team_crests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Team crests are viewable by everyone" ON public.team_crests;
CREATE POLICY "Team crests are viewable by everyone"
  ON public.team_crests FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins manage team crests" ON public.team_crests;
CREATE POLICY "Admins manage team crests"
  ON public.team_crests FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_team_crests_updated_at ON public.team_crests;
CREATE TRIGGER update_team_crests_updated_at
  BEFORE UPDATE ON public.team_crests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
