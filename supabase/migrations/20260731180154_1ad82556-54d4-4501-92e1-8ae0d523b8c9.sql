CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role_title text,
  bio text,
  photo_url text,
  email text,
  phone text,
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.team_members TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO authenticated;
GRANT ALL ON public.team_members TO service_role;

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Published team members are viewable by everyone" ON public.team_members;
CREATE POLICY "Published team members are viewable by everyone"
  ON public.team_members FOR SELECT
  USING (is_published = true OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins manage team members" ON public.team_members;
CREATE POLICY "Admins manage team members"
  ON public.team_members FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS trg_team_members_updated_at ON public.team_members;
CREATE TRIGGER trg_team_members_updated_at
  BEFORE UPDATE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.site_content ADD COLUMN IF NOT EXISTS draft_value text;
ALTER TABLE public.site_content ADD COLUMN IF NOT EXISTS published_at timestamptz;
ALTER TABLE public.home_slides ADD COLUMN IF NOT EXISTS draft_data jsonb;
ALTER TABLE public.home_slides ADD COLUMN IF NOT EXISTS published_at timestamptz;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['site_content','home_slides','team_members','testimonials','why_us_cards','faqs','events']
  LOOP
    EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL', t);
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;