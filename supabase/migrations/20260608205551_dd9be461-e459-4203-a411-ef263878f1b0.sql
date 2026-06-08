ALTER TABLE public.ticket_categories
  ADD COLUMN IF NOT EXISTS markup_pct numeric(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS markup_fixed_sek numeric(10,2) NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.create_order_with_items(
  p_event_id uuid,
  p_category_id uuid,
  p_qty integer,
  p_unit_price_sek numeric,
  p_customer_email text DEFAULT NULL::text,
  p_customer_name text DEFAULT NULL::text,
  p_customer_phone text DEFAULT NULL::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_cat record;
  v_order_id uuid;
  v_total numeric(10,2);
BEGIN
  IF p_qty IS NULL OR p_qty < 1 THEN RAISE EXCEPTION 'Antalet biljetter måste vara minst 1'; END IF;
  IF p_unit_price_sek IS NULL OR p_unit_price_sek <= 0 THEN RAISE EXCEPTION 'Ogiltigt pris'; END IF;

  SELECT id, event_id, qty_available, currency
    INTO v_cat
    FROM public.ticket_categories
    WHERE id = p_category_id
    FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Biljettkategorin hittades inte'; END IF;
  IF v_cat.event_id <> p_event_id THEN RAISE EXCEPTION 'Biljettkategorin tillhör inte detta evenemang'; END IF;
  IF v_cat.qty_available < p_qty THEN RAISE EXCEPTION 'Endast % biljetter kvar', v_cat.qty_available; END IF;

  v_total := p_unit_price_sek * p_qty;

  INSERT INTO public.orders (user_id, status, total_sek, currency, customer_email, customer_name, customer_phone)
  VALUES (
    v_user_id,
    'pending'::order_status,
    v_total,
    COALESCE(v_cat.currency,'SEK'),
    COALESCE(NULLIF(trim(p_customer_email),''), ''),
    NULLIF(trim(p_customer_name),''),
    NULLIF(trim(p_customer_phone),'')
  )
  RETURNING id INTO v_order_id;

  INSERT INTO public.order_items (order_id, event_id, category_id, qty, unit_price_sek)
  VALUES (v_order_id, p_event_id, p_category_id, p_qty, p_unit_price_sek);

  RETURN v_order_id;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.create_order_with_items(uuid, uuid, integer, numeric, text, text, text) TO anon, authenticated;