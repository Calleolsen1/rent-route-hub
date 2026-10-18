UPDATE public.site_content
SET value = '"Landskrona, Sverige"'::jsonb,
    draft_value = NULL
WHERE key = 'contact_address';