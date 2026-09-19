ALTER TABLE public.xs2_sync_log
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'xs2event';

DROP INDEX IF EXISTS public.idx_xs2_sync_log_resource_started;
CREATE INDEX IF NOT EXISTS idx_sync_log_source_resource_started
  ON public.xs2_sync_log(source, resource_type, started_at DESC);

ALTER TABLE public.xs2_sync_log
  DROP CONSTRAINT IF EXISTS xs2_sync_log_resource_type_check;
ALTER TABLE public.xs2_sync_log
  ADD CONSTRAINT xs2_sync_log_resource_type_check
  CHECK (resource_type IN (
    'sports','tournaments','venues','teams','events','categories','products'
  ));

ALTER TABLE public.ticket_categories
  ADD COLUMN IF NOT EXISTS supplier_version_id text,
  ADD COLUMN IF NOT EXISTS supplier_buy_multiplier integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS supplier_split_type text,
  ADD COLUMN IF NOT EXISTS supplier_split_quantity integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS supplier_display_quantity integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.ticket_categories.supplier_version_id IS
  'OneClicket version id (raw, unprefixed) — the value insOrders expects.';
COMMENT ON COLUMN public.ticket_categories.supplier_split_type IS
  'Normalised purchase rule: any | all_together | avoid_leaving_one | multiples | singles.';

CREATE INDEX IF NOT EXISTS idx_ticket_categories_supplier_version
  ON public.ticket_categories(supplier_version_id)
  WHERE supplier_version_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.oneclicket_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  supplier_order_id text,
  supplier_order_code text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','placed','failed','cancelled')),
  request_payload jsonb NOT NULL,
  response_payload jsonb,
  error_message text,
  placed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.oneclicket_orders TO authenticated;
GRANT ALL ON public.oneclicket_orders TO service_role;
ALTER TABLE public.oneclicket_orders ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_oneclicket_orders_order ON public.oneclicket_orders(order_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_oneclicket_orders_supplier_id
  ON public.oneclicket_orders(supplier_order_id)
  WHERE supplier_order_id IS NOT NULL;

CREATE POLICY "Admins view oneclicket orders"
  ON public.oneclicket_orders FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_oneclicket_orders_updated_at ON public.oneclicket_orders;
CREATE TRIGGER update_oneclicket_orders_updated_at
  BEFORE UPDATE ON public.oneclicket_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();