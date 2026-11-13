-- Swedish for supplier texts that come without it: XS2 category names and
-- descriptions, P1 ticket names. Made once per text by Claude in the
-- background (supabase/functions/_shared/sv_texts.ts) and read on every
-- page view. sv_source = 'manual' rows are admin edits and never replaced.

CREATE TABLE IF NOT EXISTS public.supplier_texts_sv (
  supplier         text NOT NULL CHECK (supplier IN ('p1', 'xs2', 'travelconnection')),
  key              text NOT NULL,
  name_en          text,
  lines_en         text[] NOT NULL DEFAULT '{}',
  name_sv          text,
  lines_sv         text[],
  translated_from  text[],
  sv_source        text CHECK (sv_source IN ('ai', 'manual')),
  translated_at    timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (supplier, key)
);

ALTER TABLE public.supplier_texts_sv ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage supplier_texts_sv" ON public.supplier_texts_sv;
CREATE POLICY "Admins manage supplier_texts_sv" ON public.supplier_texts_sv
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.supplier_texts_sv TO authenticated;
GRANT ALL ON public.supplier_texts_sv TO service_role;
