
-- Allow anon to use the order-creation flow
GRANT EXECUTE ON FUNCTION public.create_order_with_items(uuid, uuid, integer, text) TO anon;

CREATE OR REPLACE FUNCTION public.create_order_with_items(
  p_event_id uuid,
  p_category_id uuid,
  p_qty integer,
  p_customer_email text DEFAULT NULL,
  p_customer_name text DEFAULT NULL,
  p_customer_phone text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_cat record;
  v_order_id uuid;
  v_total numeric(10,2);
BEGIN
  IF p_qty IS NULL OR p_qty < 1 THEN RAISE EXCEPTION 'Antalet biljetter måste vara minst 1'; END IF;
  IF v_user_id IS NULL AND (p_customer_email IS NULL OR length(trim(p_customer_email)) = 0) THEN
    RAISE EXCEPTION 'E-postadress krävs för gästköp';
  END IF;

  SELECT id, event_id, unit_price_sek, qty_available, currency
    INTO v_cat
    FROM public.ticket_categories
    WHERE id = p_category_id
    FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Biljettkategorin hittades inte'; END IF;
  IF v_cat.event_id <> p_event_id THEN RAISE EXCEPTION 'Biljettkategorin tillhör inte detta evenemang'; END IF;
  IF v_cat.qty_available < p_qty THEN RAISE EXCEPTION 'Endast % biljetter kvar', v_cat.qty_available; END IF;

  v_total := v_cat.unit_price_sek * p_qty;

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
  VALUES (v_order_id, p_event_id, p_category_id, p_qty, v_cat.unit_price_sek);

  RETURN v_order_id;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.create_order_with_items(uuid, uuid, integer, text, text, text) TO anon, authenticated;

-- RLS: allow anon/auth to view a specific order by id (UUID is the capability token)
DROP POLICY IF EXISTS "Anyone can view order by id" ON public.orders;
CREATE POLICY "Anyone can view order by id"
  ON public.orders FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow anon to update contact details on their in-progress order
DROP POLICY IF EXISTS "Anyone can update in-progress order contact" ON public.orders;
CREATE POLICY "Anyone can update in-progress order contact"
  ON public.orders FOR UPDATE
  TO anon, authenticated
  USING (status IN ('pending'::order_status, 'awaiting_payment'::order_status) AND user_id IS NULL)
  WITH CHECK (status IN ('pending'::order_status, 'awaiting_payment'::order_status) AND user_id IS NULL);

-- order_items: allow anon SELECT (needed for checkout summary)
DROP POLICY IF EXISTS "Anyone can view order items" ON public.order_items;
CREATE POLICY "Anyone can view order items"
  ON public.order_items FOR SELECT
  TO anon, authenticated
  USING (true);

GRANT SELECT ON public.orders TO anon;
GRANT UPDATE ON public.orders TO anon;
GRANT SELECT ON public.order_items TO anon;
