-- Generalize navigation so admin can add new sports (Tennis, MMA, …) without
-- a code deploy. Collapses nav_teams + nav_races into a single polymorphic
-- table nav_menu_entries, parented by a new nav_sports table.
--
-- Schema:
--   nav_sports        — one row per top-level dropdown ("Fotboll", "F1", …)
--     menu_style: 'grouped' (sub-headers like Bundesliga) or 'list' (flat)
--     sport_filter: which xs2 sport value to query (e.g. 'soccer', 'formula1')
--     entry_kind: 'team' or 'race' — drives label wording on landing pages
--                                    (e.g. "Stad" vs "Bana", "Liga" vs "Datum")
--
--   nav_menu_entries  — one row per menu item under a sport
--     group_label: optional sub-header (e.g. "La Liga"); null for flat lists
--     features_json: array of "Vad ingår" strings shown on landing page
--     hero_image_url: optional override for the landing page hero

CREATE TABLE IF NOT EXISTS public.nav_sports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  label text NOT NULL,
  sport_filter text,
  menu_style text NOT NULL DEFAULT 'list' CHECK (menu_style IN ('grouped', 'list')),
  entry_kind text NOT NULL DEFAULT 'team' CHECK (entry_kind IN ('team', 'race')),
  sort_order integer NOT NULL DEFAULT 100,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.nav_menu_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sport_id uuid NOT NULL REFERENCES public.nav_sports(id) ON DELETE CASCADE,
  slug text NOT NULL,
  name text NOT NULL,
  group_label text,
  city text,
  venue text,
  date_text text,
  short_date text,
  tagline text,
  description text,
  hero_image_url text,
  features_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order integer NOT NULL DEFAULT 100,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (sport_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_nav_menu_entries_sport_active
  ON public.nav_menu_entries (sport_id, is_active, sort_order);

-- Triggers
CREATE TRIGGER nav_sports_updated_at
  BEFORE UPDATE ON public.nav_sports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER nav_menu_entries_updated_at
  BEFORE UPDATE ON public.nav_menu_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.nav_sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nav_menu_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nav_sports public read" ON public.nav_sports FOR SELECT USING (true);
CREATE POLICY "nav_sports admin write" ON public.nav_sports FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "nav_menu_entries public read" ON public.nav_menu_entries FOR SELECT USING (true);
CREATE POLICY "nav_menu_entries admin write" ON public.nav_menu_entries FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT SELECT ON public.nav_sports, public.nav_menu_entries TO anon, authenticated;
GRANT ALL ON public.nav_sports, public.nav_menu_entries TO service_role;

-- Seed the two existing sports
INSERT INTO public.nav_sports (slug, label, sport_filter, menu_style, entry_kind, sort_order) VALUES
  ('fotboll', 'Fotboll', 'soccer', 'grouped', 'team', 10),
  ('f1', 'F1', 'formula1', 'list', 'race', 20)
ON CONFLICT (slug) DO NOTHING;

-- Migrate existing nav_teams rows into nav_menu_entries under 'fotboll'
INSERT INTO public.nav_menu_entries
  (sport_id, slug, name, group_label, city, venue, tagline, description, hero_image_url, sort_order, is_active)
SELECT
  (SELECT id FROM public.nav_sports WHERE slug = 'fotboll'),
  t.slug, t.name, t.league, t.city, t.stadium, t.tagline, t.description, t.hero_image_url,
  t.sort_order, t.is_active
FROM public.nav_teams t
WHERE EXISTS (SELECT 1 FROM public.nav_sports WHERE slug = 'fotboll')
ON CONFLICT (sport_id, slug) DO NOTHING;

-- Migrate nav_races into nav_menu_entries under 'f1'
INSERT INTO public.nav_menu_entries
  (sport_id, slug, name, city, venue, date_text, short_date, tagline, description, hero_image_url, sort_order, is_active)
SELECT
  (SELECT id FROM public.nav_sports WHERE slug = 'f1'),
  r.slug, r.name, r.city, r.circuit, r.date_text, r.short_date, r.tagline, r.description, r.hero_image_url,
  r.sort_order, r.is_active
FROM public.nav_races r
WHERE EXISTS (SELECT 1 FROM public.nav_sports WHERE slug = 'f1')
ON CONFLICT (sport_id, slug) DO NOTHING;

-- Fallback seed for the case where nav_teams / nav_races were empty
-- (e.g. previous migration not applied). Idempotent via ON CONFLICT.
DO $$
DECLARE
  fotboll_id uuid;
  f1_id uuid;
BEGIN
  SELECT id INTO fotboll_id FROM public.nav_sports WHERE slug = 'fotboll';
  SELECT id INTO f1_id FROM public.nav_sports WHERE slug = 'f1';

  -- Seed teams if migration left nav_menu_entries empty for fotboll
  IF NOT EXISTS (SELECT 1 FROM public.nav_menu_entries WHERE sport_id = fotboll_id) THEN
    INSERT INTO public.nav_menu_entries (sport_id, slug, name, group_label, city, venue, tagline, description, sort_order) VALUES
      (fotboll_id, 'bayern-munchen', 'Bayern München', 'Bundesliga', 'München, Tyskland', 'Allianz Arena', 'Tysk fotbollskungadynasti', 'Upplev Bayern München på Allianz Arena — en av Europas mest ikoniska klubbar med en historia full av titlar och stjärnor.', 10),
      (fotboll_id, 'borussia-dortmund', 'Borussia Dortmund', 'Bundesliga', 'Dortmund, Tyskland', 'Signal Iduna Park', 'Den gula väggen', 'Signal Iduna Park rymmer den legendariska Gula Väggen — 25 000 stående fans som skapar Europas mäktigaste fotbollsatmosfär.', 20),
      (fotboll_id, 'atletico-madrid', 'Atlético Madrid', 'La Liga', 'Madrid, Spanien', 'Metropolitano', 'Cholismo & passion', 'Atléticos hemmaarena Metropolitano kokar av rojiblanco-passion. En klubb byggd på arbete, stolthet och spanska titlar.', 30),
      (fotboll_id, 'fc-barcelona', 'FC Barcelona', 'La Liga', 'Barcelona, Spanien', 'Spotify Camp Nou', 'Més que un club', 'FC Barcelona — mer än en klubb. Upplev El Clásico, La Liga-toppmöten och Champions League-kvällar i den katalanska metropolen.', 40),
      (fotboll_id, 'real-madrid', 'Real Madrid', 'La Liga', 'Madrid, Spanien', 'Santiago Bernabéu', 'Hala Madrid', 'Santiago Bernabéu — fotbollens katedral. Upplev de vita på en av sportens mest historiska arenor.', 50),
      (fotboll_id, 'arsenal', 'Arsenal', 'Premier League', 'London, England', 'Emirates Stadium', 'North London is red', 'Arsenal på Emirates — en av Londons mest moderna arenor med klassisk fotbollskultur från Highbury i ryggen.', 60),
      (fotboll_id, 'chelsea', 'Chelsea', 'Premier League', 'London, England', 'Stamford Bridge', 'Pride of London', 'Stamford Bridge i hjärtat av London — Chelsea bjuder på Premier League och Champions League i världsklass.', 70),
      (fotboll_id, 'liverpool', 'Liverpool', 'Premier League', 'Liverpool, England', 'Anfield', 'You''ll Never Walk Alone', 'Anfield — där You''ll Never Walk Alone ekar från läktarna. En av världens mest känslosamma fotbollsupplevelser.', 80),
      (fotboll_id, 'manchester-city', 'Manchester City', 'Premier League', 'Manchester, England', 'Etihad Stadium', 'Modern fotbolls toppskikt', 'Manchester City på Etihad — modern fotboll i absolut världsklass under Pep Guardiola och stjärnlaget.', 90),
      (fotboll_id, 'manchester-united', 'Manchester United', 'Premier League', 'Manchester, England', 'Old Trafford', 'Theatre of Dreams', 'Old Trafford — Theatre of Dreams. En av världens mest legendariska fotbollsarenor och Manchester Uniteds hem.', 100),
      (fotboll_id, 'tottenham-hotspur', 'Tottenham Hotspur', 'Premier League', 'London, England', 'Tottenham Hotspur Stadium', 'To dare is to do', 'Tottenhams nya arena i norra London är en av världens mest moderna fotbollsanläggningar. Premier League på toppnivå.', 110),
      (fotboll_id, 'milan', 'Milan', 'Serie A', 'Milano, Italien', 'San Siro', 'Sempre Milan', 'AC Milan på San Siro — sju gånger Champions League-mästare och en av italiensk fotbolls största stoltheter.', 120),
      (fotboll_id, 'inter', 'Inter', 'Serie A', 'Milano, Italien', 'San Siro', 'Pazza Inter Amala', 'Inter Milan delar San Siro med rivalen Milan. Upplev derbyt della Madonnina — ett av fotbollens hetaste möten.', 130),
      (fotboll_id, 'juventus', 'Juventus', 'Serie A', 'Turin, Italien', 'Allianz Stadium', 'Fino alla fine', 'Juventus på Allianz Stadium i Turin — den gamla damen och Italiens mest framgångsrika klubb.', 140),
      (fotboll_id, 'roma', 'Roma', 'Serie A', 'Rom, Italien', 'Stadio Olimpico', 'Forza Roma', 'AS Roma på Stadio Olimpico — passionerad fotboll i Italiens eviga stad. Romkultur och fotboll i världsklass.', 150)
    ON CONFLICT (sport_id, slug) DO NOTHING;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.nav_menu_entries WHERE sport_id = f1_id) THEN
    INSERT INTO public.nav_menu_entries (sport_id, slug, name, city, venue, date_text, short_date, tagline, description, sort_order) VALUES
      (f1_id, 'ungern', 'Ungerns Grand Prix', 'Budapest, Ungern', 'Hungaroring', '26 juli 2026', '26 juli', 'Monaco utan barriärerna', 'Hungaroring är en av kalenderns mest tekniska banor — en kurvig utmaning där föraren räknas mer än bilen.', 10),
      (f1_id, 'italien-monza', 'Italiens Grand Prix', 'Monza, Italien', 'Autodromo Nazionale Monza', '6 september 2026', '6 september', 'Hastighetens tempel', 'Monza — F1:s historiska hem och hastighetens tempel. Tifosin målar tribunerna röda när Ferrari kör hemma.', 20),
      (f1_id, 'spanien-madrid', 'Spaniens Grand Prix', 'Madrid, Spanien', 'Madring', '13 september 2026', '13 september', 'Spaniens nya F1-bana', 'Madring är F1:s nya stadsbana i Madrid — en spektakulär kombination av gata och permanent bana.', 30),
      (f1_id, 'usa-austin', 'USA:s Grand Prix', 'Austin, Texas', 'Circuit of the Americas', '25 oktober 2026', '25 oktober', 'Allt är större i Texas', 'Austin bjuder på fest, livemusik och en av kalenderns mest älskade banor — Circuit of the Americas.', 40),
      (f1_id, 'las-vegas', 'Las Vegas Grand Prix', 'Las Vegas, USA', 'Las Vegas Strip Circuit', '21 november 2026', '21 november', 'F1 under neonen', 'F1-bilar i 350 km/h ner för Las Vegas Strip i mörkret — kalenderns mest spektakulära nattevent.', 50),
      (f1_id, 'qatar', 'Qatars Grand Prix', 'Doha, Qatar', 'Lusail International Circuit', '29 november 2026', '29 november', 'Race under stjärnorna', 'Lusail bjuder på ett av säsongens snabbaste flytande race under Qatars stjärnhimmel.', 60),
      (f1_id, 'abu-dhabi', 'Abu Dhabi Grand Prix', 'Abu Dhabi, UAE', 'Yas Marina Circuit', '6 december 2026', '6 december', 'Säsongsfinalen', 'F1-säsongens finale på Yas Marina — race från sol till mörker med yacht-show och världsklass-fest.', 70),
      (f1_id, 'miami', 'Miami Grand Prix', 'Miami, USA', 'Miami International Autodrome', '9 maj 2027', '9 maj 2027', 'F1 möter South Beach', 'Miami GP runt Hard Rock Stadium — F1, palmer och South Beach-fest i Florida-värmen.', 80),
      (f1_id, 'monaco', 'Monacos Grand Prix', 'Monte Carlo, Monaco', 'Circuit de Monaco', '6 juni 2027', '6 juni 2027', 'Kronan i F1-kalendern', 'Monaco — F1:s mest prestigefulla race. Gatorna i Monte Carlo, yachterna i hamnen, glamouren utan motstycke.', 90),
      (f1_id, 'algarve', 'Algarves Grand Prix', 'Portimão, Portugal', 'Autódromo do Algarve', '13 juni 2027', '13 juni 2027', 'Bergen och Atlanten', 'Portimão — en av F1:s mest dramatiska banor med branta backar och Atlanten som fond.', 100)
    ON CONFLICT (sport_id, slug) DO NOTHING;
  END IF;
END $$;

-- Drop the now-redundant tables (data has been migrated into nav_menu_entries)
DROP TABLE IF EXISTS public.nav_teams CASCADE;
DROP TABLE IF EXISTS public.nav_races CASCADE;
