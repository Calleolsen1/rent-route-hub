-- Media storage + editable home banners.
--
-- Two pieces:
--   1. kaisen-media public-read storage bucket for hero banners, event covers,
--      and any future editorial imagery. Admin-only writes.
--   2. home_slides table replacing the hardcoded heroSlides array in
--      src/pages/Home.tsx. Seeded with the 4 existing slides verbatim so the
--      cutover is invisible to visitors. Home.tsx keeps a code-level fallback
--      if the table is empty (defensive).
--
-- Image_url on home_slides is a free-text URL — it can point at the bundled
-- /src/assets path (during transition) or at a kaisen-media public URL once
-- admins start uploading their own.

-- ============================================================================
-- 1. Storage bucket
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kaisen-media',
  'kaisen-media',
  true,
  10485760, -- 10 MB per file
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

-- Storage RLS — buckets policies live on storage.objects.
CREATE POLICY "kaisen-media public read"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'kaisen-media');

CREATE POLICY "kaisen-media admin write"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'kaisen-media'
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "kaisen-media admin update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'kaisen-media'
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "kaisen-media admin delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'kaisen-media'
    AND public.has_role(auth.uid(), 'admin')
  );

-- ============================================================================
-- 2. Home slides table
-- ============================================================================
CREATE TABLE public.home_slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  eyebrow text,
  title text NOT NULL,
  italic text,
  description text,
  cta_label text,
  cta_to text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_home_slides_order ON public.home_slides(sort_order) WHERE is_active = true;

CREATE TRIGGER update_home_slides_updated_at
  BEFORE UPDATE ON public.home_slides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.home_slides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Home slides are public"
  ON public.home_slides FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins manage home slides"
  ON public.home_slides FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT SELECT ON public.home_slides TO anon, authenticated;
GRANT ALL ON public.home_slides TO service_role;

-- Seed with the existing 4 slides. image_url points at bundled assets for now;
-- replace with /storage/v1/object/public/kaisen-media/... once admins upload
-- their own. Front-end maps these src/assets paths to imported URLs via a
-- small lookup table to keep bundling working.
INSERT INTO public.home_slides (image_url, eyebrow, title, italic, description, cta_label, cta_to, sort_order) VALUES
('asset:kaisen-hero',     'Personlig Reseservice', 'Resor skapade',           'Just för dig',           'Sportresor, gruppresor, träningsläger och VIP-service — levererat med personlig omsorg av en dedikerad resekonsult.', 'Planera din resa',  '/contact',                 0),
('asset:kaisen-sports',   'Reklamvideo kommer',    'Upplev sportens',         'största ögonblick',      'F1-race i Monaco, Premier League på Anfield eller Champions League-finaler — vi ordnar biljetter, boende och VIP-access.',          'Se sportresor',     '/services/sportresor',     1),
('asset:kaisen-group',    'Grupp & Konferens',     'Gruppresor &',            'konferenser',            'Från företagsevent till kompisgäng — vi sköter hela logistiken för grupper från 8 upp till 200+ personer.',                          'Läs mer',           '/group-travel',            2),
('asset:kaisen-incoming', 'Träningsläger',         'Träna där',               'proffsen tränar',        'Fotboll, simning, friidrott och fler sporter — kompletta läger med boende, transfer och planhyra.',                                 'Se träningsläger',  '/services/traningslager',  3);
