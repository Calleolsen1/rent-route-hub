CREATE TABLE public.home_experiences (
  id uuid primary key default gen_random_uuid(),
  image_url text,
  title text not null,
  subtitle text,
  description text,
  tag text,
  href text not null default '/contact',
  cta_label text not null default 'Läs mer',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
GRANT SELECT ON public.home_experiences TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.home_experiences TO authenticated;
GRANT ALL ON public.home_experiences TO service_role;
ALTER TABLE public.home_experiences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active experiences" ON public.home_experiences FOR SELECT USING (true);
CREATE POLICY "Admins manage experiences" ON public.home_experiences FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER update_home_experiences_updated_at BEFORE UPDATE ON public.home_experiences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.home_experiences (title, subtitle, description, tag, href, sort_order) VALUES
('Fotboll','Premier League · Champions League','Från Premier League-derbyn till Champions League - vi paketerar resan med platser på läktaren, hotell och transfer.','Matchupplevelser','/services/sportresor/fotboll',0),
('Formel 1','Monaco · Silverstone · Spa','Känn adrenalinet när racerna dundrar förbi. Komplett F1-resa med bra platser, boende nära banan och all logistik ordnad.','Premiumupplevelser','/services/sportresor/f1',1),
('Träningsläger','Fotboll · Simning · Friidrott','Kompletta träningsläger på de bästa destinationerna - boende, transfer, planhyra och måltider ingår.','Lag & klubbar','/services/traningslager',2),
('Grupp & Konferens','Resor som samlar människor','Från företagsevent och konferenser till kompisgäng och familjeresor. Vi sköter hela logistiken för grupper från 8 upp till 200+ personer.','8-200+ personer','/group-travel',3);