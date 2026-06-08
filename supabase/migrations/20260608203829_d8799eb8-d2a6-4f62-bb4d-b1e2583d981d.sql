
-- Relax orders UPDATE RLS so contact info edits work during payment
DROP POLICY IF EXISTS "Users update own pending orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update their own pending orders" ON public.orders;
DROP POLICY IF EXISTS "Users update own in-progress orders" ON public.orders;
CREATE POLICY "Users update own in-progress orders"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status IN ('pending','awaiting_payment'))
  WITH CHECK (auth.uid() = user_id AND status IN ('pending','awaiting_payment'));

-- Atomic stock decrement (called from webhook via service role)
CREATE OR REPLACE FUNCTION public.decrement_ticket_qty(p_category_id uuid, p_qty integer)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.ticket_categories
  SET qty_available = GREATEST(0, qty_available - p_qty)
  WHERE id = p_category_id;
$$;
REVOKE ALL ON FUNCTION public.decrement_ticket_qty(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.decrement_ticket_qty(uuid, integer) TO service_role;

-- Atomic order creation with availability check
CREATE OR REPLACE FUNCTION public.create_order_with_items(
  p_event_id uuid,
  p_category_id uuid,
  p_qty integer,
  p_customer_email text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_cat record;
  v_order_id uuid;
  v_total numeric(10,2);
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_qty IS NULL OR p_qty < 1 THEN RAISE EXCEPTION 'Antalet biljetter måste vara minst 1'; END IF;

  SELECT id, event_id, unit_price_sek, qty_available, currency
    INTO v_cat
    FROM public.ticket_categories
    WHERE id = p_category_id
    FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Biljettkategorin hittades inte'; END IF;
  IF v_cat.event_id <> p_event_id THEN RAISE EXCEPTION 'Biljettkategorin tillhör inte detta evenemang'; END IF;
  IF v_cat.qty_available < p_qty THEN RAISE EXCEPTION 'Endast % biljetter kvar', v_cat.qty_available; END IF;

  v_total := v_cat.unit_price_sek * p_qty;

  INSERT INTO public.orders (user_id, status, total_sek, currency, customer_email)
  VALUES (v_user_id, 'pending'::order_status, v_total, COALESCE(v_cat.currency,'SEK'), COALESCE(p_customer_email,''))
  RETURNING id INTO v_order_id;

  INSERT INTO public.order_items (order_id, event_id, category_id, qty, unit_price_sek)
  VALUES (v_order_id, p_event_id, p_category_id, p_qty, v_cat.unit_price_sek);

  RETURN v_order_id;
END;
$$;
REVOKE ALL ON FUNCTION public.create_order_with_items(uuid,uuid,integer,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_order_with_items(uuid,uuid,integer,text) TO authenticated;

-- Admin sets Stripe price lookup_key on a ticket category
CREATE OR REPLACE FUNCTION public.admin_set_ticket_stripe_price(p_category_id uuid, p_lookup_key text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  UPDATE public.ticket_categories SET stripe_price_id = p_lookup_key WHERE id = p_category_id;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_set_ticket_stripe_price(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_ticket_stripe_price(uuid, text) TO authenticated;

-- Invoice numbering KTG-YYYY-NNNNN
CREATE SEQUENCE IF NOT EXISTS public.invoice_number_seq START 1;
GRANT USAGE, SELECT, UPDATE ON SEQUENCE public.invoice_number_seq TO service_role;

CREATE OR REPLACE FUNCTION public.assign_invoice_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'paid' AND NEW.invoice_number IS NULL THEN
    NEW.invoice_number := 'KTG-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.invoice_number_seq')::text, 5, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_assign_invoice ON public.orders;
CREATE TRIGGER trg_orders_assign_invoice
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  WHEN (NEW.status = 'paid'::order_status)
  EXECUTE FUNCTION public.assign_invoice_number();
