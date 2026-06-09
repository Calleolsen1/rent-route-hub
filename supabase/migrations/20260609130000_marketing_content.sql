-- Editable marketing content — for non-technical operators to update
-- testimonials, "why us" cards, and miscellaneous page text without
-- needing a developer.
--
-- Public read access via RLS so the public surfaces (Home, About) can query
-- without a session. Admin-only write.

-- ============================================================================
-- Testimonials
-- ============================================================================
CREATE TABLE public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote text NOT NULL,
  author text NOT NULL,
  role text,
  rating int NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_testimonials_order ON public.testimonials(sort_order) WHERE is_active = true;

CREATE TRIGGER update_testimonials_updated_at
  BEFORE UPDATE ON public.testimonials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active testimonials are public"
  ON public.testimonials FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins manage testimonials"
  ON public.testimonials FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT SELECT ON public.testimonials TO anon, authenticated;
GRANT ALL ON public.testimonials TO service_role;

-- Seed with the four hardcoded entries from Home.tsx so the page looks the
-- same after the switch. Admin can then edit/replace each.
INSERT INTO public.testimonials (quote, author, role, rating, sort_order) VALUES
('Kaisen ordnade vår F1-resa till Monaco ner i minsta detalj. VIP-paddock, hotell med utsikt över banan och middag på Michelin-restaurang — helt magiskt.', 'Erik Lindström', 'VD, Nordic Ventures', 5, 0),
('Vi var 45 personer på företagsresa till Barcelona. Kaisen skötte allt och alla var begeistrade. Absolut bästa företagsresan vi haft.', 'Anna Bergström', 'HR-chef, Scandic Industries', 5, 1),
('Som affärsresenär värdesätter jag att allt bara fungerar. Med Kaisens VIP-service är varje resa smidig och stressfri.', 'Marcus Johansson', 'Konsult, internationell verksamhet', 5, 2),
('Vårt träningsläger i Spanien blev över förväntan. Allt klaffade — boende, mat, planer och transfer. Kommer definitivt boka igen.', 'Johan Eriksson', 'Tränare, IFK Göteborg P-08', 5, 3);


-- ============================================================================
-- "Why us" cards
-- ============================================================================
CREATE TABLE public.why_us_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  icon text NOT NULL,  -- Lucide icon component name; mapped via ICON_MAP in Home.tsx
  title text NOT NULL,
  description text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_why_us_cards_order ON public.why_us_cards(sort_order) WHERE is_active = true;

CREATE TRIGGER update_why_us_cards_updated_at
  BEFORE UPDATE ON public.why_us_cards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.why_us_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active why-us cards are public"
  ON public.why_us_cards FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins manage why-us cards"
  ON public.why_us_cards FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT SELECT ON public.why_us_cards TO anon, authenticated;
GRANT ALL ON public.why_us_cards TO service_role;

INSERT INTO public.why_us_cards (icon, title, description, sort_order) VALUES
('Users', 'Personlig kontakt', 'En dedikerad resekonsult guidar dig från första samtal till hemkomst. Inga chatbotar, inget callcenter.', 0),
('Trophy', 'Sportspecialister', 'Djup kunskap om F1, fotboll och golf — VIP-access, paddock-pass och de bästa platserna.', 1),
('Globe', 'Globalt nätverk', 'Lokala partners på över 60 destinationer säkrar de bästa upplevelserna oavsett vart du reser.', 2),
('Shield', 'Alltid tillgängliga', '24/7-support under hela resan. Vi finns alltid ett samtal bort, var i världen du än befinner dig.', 3);


-- ============================================================================
-- Generic page-content key/value store
-- ============================================================================
-- For one-off blocks of text that don't fit a structured table:
-- about_story, hero_intro_quote, contact_intro, etc. Value is JSONB so
-- callers can store strings, arrays of paragraphs, or richer structures.
CREATE TABLE public.site_content (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  description text,  -- Internal: what this key controls (shown in admin UI)
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TRIGGER update_site_content_updated_at
  BEFORE UPDATE ON public.site_content
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Site content is public"
  ON public.site_content FOR SELECT
  USING (true);

CREATE POLICY "Admins manage site content"
  ON public.site_content FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT SELECT ON public.site_content TO anon, authenticated;
GRANT ALL ON public.site_content TO service_role;

-- Seed initial keys with the existing copy. Admins can edit via /admin/content/page-texts.
INSERT INTO public.site_content (key, value, description) VALUES
(
  'about_story',
  to_jsonb(ARRAY[
    'Kaisen Travel Group grundades med övertygelsen om att resor ska kännas personliga, inte som en produkt ur en hylla. Vi tror på att varje kund förtjänar full uppmärksamhet och en upplevelse anpassad just för dem.',
    'Vi arrangerar allt från sportresor och elitevent till konferenser, incentive och skräddarsydda gruppresor — alltid med en dedikerad rådgivare som ansvarar för varje detalj.',
    'Idag har vi ett brett team med specialister inom alla resekategorier — men vår filosofi är densamma som dag ett: varje kund förtjänar personlig uppmärksamhet och en resa som är skräddarsydd just för dem.'
  ]::text[]),
  'Om oss-sidans huvudtext (varje rad blir ett stycke)'
),
(
  'home_about_paragraph',
  to_jsonb('I en värld av automatiserade bokningar och standardpaket sticker Kaisen Travel Group ut. Vi tror att de bästa reseupplevelserna börjar med en riktig mänsklig kontakt — ett samtal, en gemensam vision och ett åtagande att få varje detalj att stämma.'::text),
  'Startsidans "Vad gör oss annorlunda" inledningstext'
);
