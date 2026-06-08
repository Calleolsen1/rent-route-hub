-- Platform-wide markup defaults.
--
-- Stored in the existing platform_settings (setting_key, setting_value, setting_type)
-- key/value table. Read by xs2-get-event-tickets when creating fresh
-- ticket_categories rows, by xs2-reserve as a safety fallback, and editable
-- via /admin/markup-defaults.
--
-- Existing rows keep their own markup_pct / markup_fixed_sek — this only
-- affects NEW category rows created by lazy backfill on first event view.
-- Admins can still bulk-apply via a future "Apply default to all" action.

INSERT INTO public.platform_settings (setting_key, setting_value, setting_type, description)
VALUES
  ('default_markup_pct',       '15',  'decimal', 'Platsens standardprocentsats för påslag (gäller nya kategorier)'),
  ('default_markup_fixed_sek', '0',   'decimal', 'Platsens fasta påslag i SEK (gäller nya kategorier)')
ON CONFLICT (setting_key) DO NOTHING;

-- Helper: read a numeric setting with caller-supplied fallback if missing.
-- SECURITY DEFINER so edge functions (service role) and admin UI (authenticated)
-- both use the same path, RLS on the table notwithstanding.
CREATE OR REPLACE FUNCTION public.get_platform_decimal(p_key text, p_default numeric)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_value text;
BEGIN
  SELECT setting_value INTO v_value
  FROM public.platform_settings
  WHERE setting_key = p_key AND is_active = true
  LIMIT 1;
  IF v_value IS NULL THEN
    RETURN p_default;
  END IF;
  BEGIN
    RETURN v_value::numeric;
  EXCEPTION WHEN OTHERS THEN
    RETURN p_default;
  END;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_platform_decimal(text, numeric) TO anon, authenticated, service_role;
