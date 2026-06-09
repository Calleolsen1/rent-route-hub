-- ============ 20260609110000_event_unique_constraints ============
DROP INDEX IF EXISTS public.uq_events_xs2_external_id;
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS uq_events_external_event_id;
ALTER TABLE public.events ADD CONSTRAINT uq_events_external_event_id UNIQUE (external_event_id);

DROP INDEX IF EXISTS public.uq_ticket_categories_xs2_external;
ALTER TABLE public.ticket_categories DROP CONSTRAINT IF EXISTS uq_ticket_categories_external;
ALTER TABLE public.ticket_categories ADD CONSTRAINT uq_ticket_categories_external UNIQUE (event_id, external_category_id, external_sub_category);

-- ============ 20260609120000_rate_limits ============
CREATE TABLE public.rate_limits (
  key text PRIMARY KEY,
  count int NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_rate_limits_window ON public.rate_limits(window_start);
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.rate_limits TO service_role;

CREATE OR REPLACE FUNCTION public.consume_rate_limit(p_key text, p_max int, p_window_sec int)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_count int;
BEGIN
  INSERT INTO public.rate_limits (key, count, window_start)
  VALUES (p_key, 1, now())
  ON CONFLICT (key) DO UPDATE
  SET count = CASE WHEN public.rate_limits.window_start < now() - (p_window_sec || ' seconds')::interval THEN 1 ELSE public.rate_limits.count + 1 END,
      window_start = CASE WHEN public.rate_limits.window_start < now() - (p_window_sec || ' seconds')::interval THEN now() ELSE public.rate_limits.window_start END
  RETURNING count INTO v_count;
  RETURN v_count <= p_max;
END; $$;
GRANT EXECUTE ON FUNCTION public.consume_rate_limit(text, int, int) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_count integer;
BEGIN
  DELETE FROM public.rate_limits WHERE window_start < now() - interval '1 day';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END; $$;
GRANT EXECUTE ON FUNCTION public.cleanup_rate_limits() TO service_role;

-- ============ 20260609130000_marketing_content ============
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
CREATE TRIGGER update_testimonials_updated_at BEFORE UPDATE ON public.testimonials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active testimonials are public" ON public.testimonials FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage testimonials" ON public.testimonials FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
GRANT SELECT ON public.testimonials TO anon, authenticated;
GRANT ALL ON public.testimonials TO service_role;

INSERT INTO public.testimonials (quote, author, role, rating, sort_order) VALUES
('Kaisen ordnade vår F1-resa till Monaco ner i minsta detalj. VIP-paddock, hotell med utsikt över banan och middag på Michelin-restaurang — helt magiskt.', 'Erik Lindström', 'VD, Nordic Ventures', 5, 0),
('Vi var 45 personer på företagsresa till Barcelona. Kaisen skötte allt och alla var begeistrade. Absolut bästa företagsresan vi haft.', 'Anna Bergström', 'HR-chef, Scandic Industries', 5, 1),
('Som affärsresenär värdesätter jag att allt bara fungerar. Med Kaisens VIP-service är varje resa smidig och stressfri.', 'Marcus Johansson', 'Konsult, internationell verksamhet', 5, 2),
('Vårt träningsläger i Spanien blev över förväntan. Allt klaffade — boende, mat, planer och transfer. Kommer definitivt boka igen.', 'Johan Eriksson', 'Tränare, IFK Göteborg P-08', 5, 3);

CREATE TABLE public.why_us_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  icon text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_why_us_cards_order ON public.why_us_cards(sort_order) WHERE is_active = true;
CREATE TRIGGER update_why_us_cards_updated_at BEFORE UPDATE ON public.why_us_cards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
ALTER TABLE public.why_us_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active why-us cards are public" ON public.why_us_cards FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage why-us cards" ON public.why_us_cards FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
GRANT SELECT ON public.why_us_cards TO anon, authenticated;
GRANT ALL ON public.why_us_cards TO service_role;

INSERT INTO public.why_us_cards (icon, title, description, sort_order) VALUES
('Users', 'Personlig kontakt', 'En dedikerad resekonsult guidar dig från första samtal till hemkomst. Inga chatbotar, inget callcenter.', 0),
('Trophy', 'Sportspecialister', 'Djup kunskap om F1, fotboll och golf — VIP-access, paddock-pass och de bästa platserna.', 1),
('Globe', 'Globalt nätverk', 'Lokala partners på över 60 destinationer säkrar de bästa upplevelserna oavsett vart du reser.', 2),
('Shield', 'Alltid tillgängliga', '24/7-support under hela resan. Vi finns alltid ett samtal bort, var i världen du än befinner dig.', 3);

CREATE TABLE public.site_content (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  description text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
CREATE TRIGGER update_site_content_updated_at BEFORE UPDATE ON public.site_content FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Site content is public" ON public.site_content FOR SELECT USING (true);
CREATE POLICY "Admins manage site content" ON public.site_content FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
GRANT SELECT ON public.site_content TO anon, authenticated;
GRANT ALL ON public.site_content TO service_role;

INSERT INTO public.site_content (key, value, description) VALUES
('about_story', to_jsonb(ARRAY[
  'Kaisen Travel Group grundades med övertygelsen om att resor ska kännas personliga, inte som en produkt ur en hylla. Vi tror på att varje kund förtjänar full uppmärksamhet och en upplevelse anpassad just för dem.',
  'Vi arrangerar allt från sportresor och elitevent till konferenser, incentive och skräddarsydda gruppresor — alltid med en dedikerad rådgivare som ansvarar för varje detalj.',
  'Idag har vi ett brett team med specialister inom alla resekategorier — men vår filosofi är densamma som dag ett: varje kund förtjänar personlig uppmärksamhet och en resa som är skräddarsydd just för dem.'
]::text[]), 'Om oss-sidans huvudtext (varje rad blir ett stycke)'),
('home_about_paragraph', to_jsonb('I en värld av automatiserade bokningar och standardpaket sticker Kaisen Travel Group ut. Vi tror att de bästa reseupplevelserna börjar med en riktig mänsklig kontakt — ett samtal, en gemensam vision och ett åtagande att få varje detalj att stämma.'::text), 'Startsidans "Vad gör oss annorlunda" inledningstext');

-- ============ 20260609140000_customer_inquiries_view ============
CREATE POLICY "Users see their own inquiries"
  ON public.inquiries FOR SELECT
  TO authenticated
  USING (email = auth.email());
