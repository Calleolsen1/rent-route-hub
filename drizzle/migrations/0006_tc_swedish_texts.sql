ALTER TABLE public.tc_ticket_category_info
  ADD COLUMN IF NOT EXISTS name_sv         text,
  ADD COLUMN IF NOT EXISTS description_sv  jsonb,
  ADD COLUMN IF NOT EXISTS translated_from jsonb,
  ADD COLUMN IF NOT EXISTS sv_source       text CHECK (sv_source IN ('ai', 'manual')),
  ADD COLUMN IF NOT EXISTS translated_at   timestamptz;

DROP POLICY IF EXISTS "Admins update tc_ticket_category_info" ON public.tc_ticket_category_info;
CREATE POLICY "Admins update tc_ticket_category_info"
  ON public.tc_ticket_category_info FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
GRANT UPDATE ON public.tc_ticket_category_info TO authenticated;