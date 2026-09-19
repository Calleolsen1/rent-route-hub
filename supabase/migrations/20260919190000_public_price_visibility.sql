-- Public price visibility switch.
--
-- Kaisen wants per-ticket prices *calculated and stored* (markups, EUR→SEK,
-- supplier cost) but NOT shown to the public yet — the site runs as an
-- enquiry funnel until they're ready to sell at these prices.
--
-- This is a platform setting rather than a code constant so the switch can be
-- flipped from /admin/markup-defaults without a redeploy. Admin screens read
-- prices directly and are unaffected.

INSERT INTO public.platform_settings (setting_key, setting_value, setting_type, description)
VALUES (
  'public_prices_enabled',
  'false',
  'boolean',
  'Visa biljettpriser publikt. Av = "Pris på förfrågan" och förfrågningsformulär i stället för kassa.'
)
ON CONFLICT (setting_key) DO NOTHING;

-- Boolean sibling of get_platform_decimal. SECURITY DEFINER so anon (public
-- site), authenticated (admin) and service_role (edge functions) all resolve
-- the same value regardless of RLS on platform_settings.
CREATE OR REPLACE FUNCTION public.get_platform_bool(p_key text, p_default boolean)
RETURNS boolean
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

  RETURN CASE lower(trim(v_value))
    WHEN 'true'  THEN true
    WHEN '1'     THEN true
    WHEN 'yes'   THEN true
    WHEN 'on'    THEN true
    WHEN 'false' THEN false
    WHEN '0'     THEN false
    WHEN 'no'    THEN false
    WHEN 'off'   THEN false
    ELSE p_default
  END;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_platform_bool(text, boolean) TO anon, authenticated, service_role;
