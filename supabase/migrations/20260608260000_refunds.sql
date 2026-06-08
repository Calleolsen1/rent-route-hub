-- Refund tracking.
--
-- Supports both full and partial refunds, multiple refunds per order, and
-- keeps a denormalized total on the order for fast Mitt Kaisen queries.
--
-- Does NOT auto-cancel xs2event bookings — xs2 doesn't expose a public
-- booking-cancellation endpoint, so cancellation goes through xs2 support.
-- The admin refund UI surfaces this clearly.

CREATE TABLE public.refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  amount_sek numeric(10,2) NOT NULL CHECK (amount_sek > 0),
  reason text,
  stripe_refund_id text,
  processed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_refunds_order ON public.refunds(order_id, created_at DESC);

ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage refunds"
  ON public.refunds FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Order owners view their refunds"
  ON public.refunds FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = refunds.order_id AND o.user_id = auth.uid()
  ));

GRANT SELECT ON public.refunds TO authenticated;
GRANT ALL ON public.refunds TO service_role;

-- Denormalized running total + reason summary on orders. The edge function
-- updates this as part of the refund transaction so Mitt Kaisen / admin
-- listings don't need to aggregate from refunds.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS refunded_sek numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_refund_reason text;
