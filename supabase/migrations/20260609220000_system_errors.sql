-- Structured log of webhook + scheduled-job failures.
--
-- Previously the payments-webhook swallowed errors with console.error only,
-- so a silent xs2-confirm failure on a paid order or a Resend outage that
-- ate the receipt was invisible until a customer complained.
--
-- Service role writes rows from inside edge functions. Admins read via a
-- diagnostics view. Mark resolved by setting resolved_at when ops handles
-- the issue.

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

ALTER TABLE public.system_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "system_errors admin read" ON public.system_errors FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "system_errors admin update" ON public.system_errors FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT SELECT, UPDATE ON public.system_errors TO authenticated;
GRANT ALL ON public.system_errors TO service_role;
