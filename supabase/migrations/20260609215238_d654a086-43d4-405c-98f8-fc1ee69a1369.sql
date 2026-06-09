
ALTER TABLE public.nav_menu_entries
  ADD COLUMN IF NOT EXISTS show_in_menu boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_nav_menu_entries_show_in_menu
  ON public.nav_menu_entries (sport_id, show_in_menu)
  WHERE is_active = true;

CREATE TABLE IF NOT EXISTS public.system_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  message text NOT NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  details jsonb,
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_system_errors_unresolved
  ON public.system_errors (created_at DESC)
  WHERE resolved_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_system_errors_kind
  ON public.system_errors (kind, created_at DESC);

GRANT SELECT, UPDATE ON public.system_errors TO authenticated;
GRANT ALL ON public.system_errors TO service_role;

ALTER TABLE public.system_errors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "system_errors admin read" ON public.system_errors;
CREATE POLICY "system_errors admin read" ON public.system_errors FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "system_errors admin update" ON public.system_errors;
CREATE POLICY "system_errors admin update" ON public.system_errors FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
