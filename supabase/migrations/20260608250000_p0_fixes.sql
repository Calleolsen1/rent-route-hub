-- P0 fixes from the post-build audit.
--
-- 1. get_order_by_session — public RPC so guest customers can see their
--    OrderConfirmation page right after Stripe's redirect, before they've
--    set their Mitt Kaisen password (and therefore can't yet satisfy the
--    auth.uid() = user_id RLS predicate on orders).
--
-- 2. quote_items SELECT policy — quote orders have no order_items; the line
--    items live on quote_items via order.quote_id. Pre-fix, the table was
--    admin-only, so a quote customer saw "Totalt" but no breakdown.

-- ============================================================================
-- 1. Public order lookup by Stripe session id
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_order_by_session(
  p_order_id uuid,
  p_session_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order public.orders;
  v_items jsonb;
  v_quote_items jsonb;
BEGIN
  -- Token-style auth: caller must know BOTH order_id (URL path) AND the
  -- Stripe session_id (URL query). Stripe session ids are unguessable;
  -- the pair acts as a bearer credential. Returns NULL if the pair doesn't
  -- match an order — caller shows "not found".
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
    AND stripe_checkout_session_id = p_session_id;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Ticket-order line items (join to events + categories + deliveries)
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', oi.id,
    'qty', oi.qty,
    'unit_price_sek', oi.unit_price_sek,
    'sub_category', oi.sub_category,
    'events', (
      SELECT jsonb_build_object(
        'sport', e.sport,
        'tournament_name', e.tournament_name,
        'home_team', e.home_team,
        'away_team', e.away_team,
        'race_name', e.race_name,
        'venue_name', e.venue_name,
        'city', e.city,
        'starts_at', e.starts_at
      ) FROM public.events e WHERE e.id = oi.event_id
    ),
    'ticket_categories', (
      SELECT jsonb_build_object('name', tc.name)
      FROM public.ticket_categories tc WHERE tc.id = oi.category_id
    ),
    'ticket_deliveries', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'file_url', td.file_url,
        'delivered_at', td.delivered_at
      ))
      FROM public.ticket_deliveries td
      WHERE td.order_item_id = oi.id
    ), '[]'::jsonb)
  )), '[]'::jsonb)
  INTO v_items
  FROM public.order_items oi
  WHERE oi.order_id = v_order.id;

  -- Quote-order line items (separate table, only populated for quote orders)
  IF v_order.quote_id IS NOT NULL THEN
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'id', qi.id,
      'description', qi.description,
      'qty', qi.qty,
      'unit_price_sek', qi.unit_price_sek
    ) ORDER BY qi.sort_order, qi.created_at), '[]'::jsonb)
    INTO v_quote_items
    FROM public.quote_items qi
    WHERE qi.quote_id = v_order.quote_id;
  ELSE
    v_quote_items := '[]'::jsonb;
  END IF;

  RETURN jsonb_build_object(
    'order', to_jsonb(v_order),
    'items', v_items,
    'quote_items', v_quote_items
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_order_by_session(uuid, text) TO anon, authenticated;

-- ============================================================================
-- 2. quote_items SELECT policy for customers who own the parent order
-- ============================================================================
CREATE POLICY "Order owners view quote items"
  ON public.quote_items FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.quote_id = quote_items.quote_id
      AND o.user_id = auth.uid()
  ));
