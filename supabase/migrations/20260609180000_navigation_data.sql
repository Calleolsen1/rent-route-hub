-- Editable navigation + landing-page content.
--
-- Replaces the hardcoded src/data/sports.ts constants with DB-backed rows so
-- admin can edit menu items, teams, and races without code deploys.
--
-- Three small tables:
--   * nav_top_menu_items  — the right-side primary nav (Grupp & Konferens etc.)
--   * nav_teams           — football team dropdown + per-team landing pages
--   * nav_races           — F1 race dropdown + per-race landing pages
--
-- Public SELECT (the navbar reads anonymously). Admin-only writes via the
-- standard has_role('admin') pattern used elsewhere.
--
-- NOTE for admins: team.name and race.name must exact-match the
-- home_team / race_name values that xs2-sync writes to public.events, or the
-- live-ticket lookup on the team/race page will silently return zero matches.

CREATE TABLE IF NOT EXISTS public.nav_top_menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  href text NOT NULL,
  sort_order integer NOT NULL DEFAULT 100,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.nav_teams (
  slug text PRIMARY KEY,
  name text NOT NULL,
  league text NOT NULL,
  city text,
  stadium text,
  tagline text,
  description text,
  hero_image_url text,
  sort_order integer NOT NULL DEFAULT 100,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.nav_races (
  slug text PRIMARY KEY,
  name text NOT NULL,
  circuit text,
  city text,
  date_text text,
  short_date text,
  tagline text,
  description text,
  hero_image_url text,
  sort_order integer NOT NULL DEFAULT 100,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- updated_at triggers (reusing the project's helper)
CREATE TRIGGER nav_top_menu_items_updated_at
  BEFORE UPDATE ON public.nav_top_menu_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER nav_teams_updated_at
  BEFORE UPDATE ON public.nav_teams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER nav_races_updated_at
  BEFORE UPDATE ON public.nav_races
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.nav_top_menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nav_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nav_races ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nav_top_menu_items public read" ON public.nav_top_menu_items
  FOR SELECT USING (true);
CREATE POLICY "nav_top_menu_items admin write" ON public.nav_top_menu_items
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "nav_teams public read" ON public.nav_teams
  FOR SELECT USING (true);
CREATE POLICY "nav_teams admin write" ON public.nav_teams
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "nav_races public read" ON public.nav_races
  FOR SELECT USING (true);
CREATE POLICY "nav_races admin write" ON public.nav_races
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT SELECT ON public.nav_top_menu_items, public.nav_teams, public.nav_races TO anon, authenticated;
GRANT ALL ON public.nav_top_menu_items, public.nav_teams, public.nav_races TO service_role;

-- Seed top menu (current static values from src/components/Navbar.tsx)
INSERT INTO public.nav_top_menu_items (label, href, sort_order) VALUES
  ('Grupp & Konferens', '/group-travel', 10),
  ('Träningsläger', '/services/traningslager', 20),
  ('Om oss', '/about', 30),
  ('Kontakt', '/contact', 40)
ON CONFLICT DO NOTHING;

-- Seed teams (from src/data/sports.ts — keep names exact-matching xs2 events)
INSERT INTO public.nav_teams (slug, name, league, city, stadium, tagline, description, sort_order) VALUES
  ('bayern-munchen', 'Bayern München', 'Bundesliga', 'München, Tyskland', 'Allianz Arena', 'Tysk fotbollskungadynasti', 'Upplev Bayern München på Allianz Arena — en av Europas mest ikoniska klubbar med en historia full av titlar och stjärnor.', 10),
  ('borussia-dortmund', 'Borussia Dortmund', 'Bundesliga', 'Dortmund, Tyskland', 'Signal Iduna Park', 'Den gula väggen', 'Signal Iduna Park rymmer den legendariska Gula Väggen — 25 000 stående fans som skapar Europas mäktigaste fotbollsatmosfär.', 20),
  ('atletico-madrid', 'Atlético Madrid', 'La Liga', 'Madrid, Spanien', 'Metropolitano', 'Cholismo & passion', 'Atléticos hemmaarena Metropolitano kokar av rojiblanco-passion. En klubb byggd på arbete, stolthet och spanska titlar.', 30),
  ('fc-barcelona', 'FC Barcelona', 'La Liga', 'Barcelona, Spanien', 'Spotify Camp Nou', 'Més que un club', 'FC Barcelona — mer än en klubb. Upplev El Clásico, La Liga-toppmöten och Champions League-kvällar i den katalanska metropolen.', 40),
  ('real-madrid', 'Real Madrid', 'La Liga', 'Madrid, Spanien', 'Santiago Bernabéu', 'Hala Madrid', 'Santiago Bernabéu — fotbollens katedral. Upplev de vita på en av sportens mest historiska arenor.', 50),
  ('arsenal', 'Arsenal', 'Premier League', 'London, England', 'Emirates Stadium', 'North London is red', 'Arsenal på Emirates — en av Londons mest moderna arenor med klassisk fotbollskultur från Highbury i ryggen.', 60),
  ('chelsea', 'Chelsea', 'Premier League', 'London, England', 'Stamford Bridge', 'Pride of London', 'Stamford Bridge i hjärtat av London — Chelsea bjuder på Premier League och Champions League i världsklass.', 70),
  ('liverpool', 'Liverpool', 'Premier League', 'Liverpool, England', 'Anfield', 'You''ll Never Walk Alone', 'Anfield — där You''ll Never Walk Alone ekar från läktarna. En av världens mest känslosamma fotbollsupplevelser.', 80),
  ('manchester-city', 'Manchester City', 'Premier League', 'Manchester, England', 'Etihad Stadium', 'Modern fotbolls toppskikt', 'Manchester City på Etihad — modern fotboll i absolut världsklass under Pep Guardiola och stjärnlaget.', 90),
  ('manchester-united', 'Manchester United', 'Premier League', 'Manchester, England', 'Old Trafford', 'Theatre of Dreams', 'Old Trafford — Theatre of Dreams. En av världens mest legendariska fotbollsarenor och Manchester Uniteds hem.', 100),
  ('tottenham-hotspur', 'Tottenham Hotspur', 'Premier League', 'London, England', 'Tottenham Hotspur Stadium', 'To dare is to do', 'Tottenhams nya arena i norra London är en av världens mest moderna fotbollsanläggningar. Premier League på toppnivå.', 110),
  ('milan', 'Milan', 'Serie A', 'Milano, Italien', 'San Siro', 'Sempre Milan', 'AC Milan på San Siro — sju gånger Champions League-mästare och en av italiensk fotbolls största stoltheter.', 120),
  ('inter', 'Inter', 'Serie A', 'Milano, Italien', 'San Siro', 'Pazza Inter Amala', 'Inter Milan delar San Siro med rivalen Milan. Upplev derbyt della Madonnina — ett av fotbollens hetaste möten.', 130),
  ('juventus', 'Juventus', 'Serie A', 'Turin, Italien', 'Allianz Stadium', 'Fino alla fine', 'Juventus på Allianz Stadium i Turin — den gamla damen och Italiens mest framgångsrika klubb.', 140),
  ('roma', 'Roma', 'Serie A', 'Rom, Italien', 'Stadio Olimpico', 'Forza Roma', 'AS Roma på Stadio Olimpico — passionerad fotboll i Italiens eviga stad. Romkultur och fotboll i världsklass.', 150)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.nav_races (slug, name, circuit, city, date_text, short_date, tagline, description, sort_order) VALUES
  ('ungern', 'Ungerns Grand Prix', 'Hungaroring', 'Budapest, Ungern', '26 juli 2026', '26 juli', 'Monaco utan barriärerna', 'Hungaroring är en av kalenderns mest tekniska banor — en kurvig utmaning där föraren räknas mer än bilen.', 10),
  ('italien-monza', 'Italiens Grand Prix', 'Autodromo Nazionale Monza', 'Monza, Italien', '6 september 2026', '6 september', 'Hastighetens tempel', 'Monza — F1:s historiska hem och hastighetens tempel. Tifosin målar tribunerna röda när Ferrari kör hemma.', 20),
  ('spanien-madrid', 'Spaniens Grand Prix', 'Madring', 'Madrid, Spanien', '13 september 2026', '13 september', 'Spaniens nya F1-bana', 'Madring är F1:s nya stadsbana i Madrid — en spektakulär kombination av gata och permanent bana.', 30),
  ('usa-austin', 'USA:s Grand Prix', 'Circuit of the Americas', 'Austin, Texas', '25 oktober 2026', '25 oktober', 'Allt är större i Texas', 'Austin bjuder på fest, livemusik och en av kalenderns mest älskade banor — Circuit of the Americas.', 40),
  ('las-vegas', 'Las Vegas Grand Prix', 'Las Vegas Strip Circuit', 'Las Vegas, USA', '21 november 2026', '21 november', 'F1 under neonen', 'F1-bilar i 350 km/h ner för Las Vegas Strip i mörkret — kalenderns mest spektakulära nattevent.', 50),
  ('qatar', 'Qatars Grand Prix', 'Lusail International Circuit', 'Doha, Qatar', '29 november 2026', '29 november', 'Race under stjärnorna', 'Lusail bjuder på ett av säsongens snabbaste flytande race under Qatars stjärnhimmel.', 60),
  ('abu-dhabi', 'Abu Dhabi Grand Prix', 'Yas Marina Circuit', 'Abu Dhabi, UAE', '6 december 2026', '6 december', 'Säsongsfinalen', 'F1-säsongens finale på Yas Marina — race från sol till mörker med yacht-show och världsklass-fest.', 70),
  ('miami', 'Miami Grand Prix', 'Miami International Autodrome', 'Miami, USA', '9 maj 2027', '9 maj 2027', 'F1 möter South Beach', 'Miami GP runt Hard Rock Stadium — F1, palmer och South Beach-fest i Florida-värmen.', 80),
  ('monaco', 'Monacos Grand Prix', 'Circuit de Monaco', 'Monte Carlo, Monaco', '6 juni 2027', '6 juni 2027', 'Kronan i F1-kalendern', 'Monaco — F1:s mest prestigefulla race. Gatorna i Monte Carlo, yachterna i hamnen, glamouren utan motstycke.', 90),
  ('algarve', 'Algarves Grand Prix', 'Autódromo do Algarve', 'Portimão, Portugal', '13 juni 2027', '13 juni 2027', 'Bergen och Atlanten', 'Portimão — en av F1:s mest dramatiska banor med branta backar och Atlanten som fond.', 100)
ON CONFLICT (slug) DO NOTHING;
