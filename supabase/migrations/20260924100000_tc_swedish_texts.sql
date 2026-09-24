-- Swedish texts for supplier ticket categories.
--
-- Travel Connection describes each category in English. The site is
-- Swedish-only, so each category is translated once (by Claude, from the
-- edge function) and stored here; page views read the stored text.
--
-- sv_source:
--   'ai'      machine translation, redone if the supplier changes the English
--   'manual'  edited by an admin — never overwritten by a new translation

ALTER TABLE public.tc_ticket_category_info
  ADD COLUMN IF NOT EXISTS name_sv         text,
  ADD COLUMN IF NOT EXISTS description_sv  jsonb,
  -- The English lines the Swedish was made from, to notice supplier edits.
  ADD COLUMN IF NOT EXISTS translated_from jsonb,
  ADD COLUMN IF NOT EXISTS sv_source       text CHECK (sv_source IN ('ai', 'manual')),
  ADD COLUMN IF NOT EXISTS translated_at   timestamptz;

-- Admins edit the Swedish text from the Biljettleverantör page.
DROP POLICY IF EXISTS "Admins update tc_ticket_category_info" ON public.tc_ticket_category_info;
CREATE POLICY "Admins update tc_ticket_category_info"
  ON public.tc_ticket_category_info FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
GRANT UPDATE ON public.tc_ticket_category_info TO authenticated;
