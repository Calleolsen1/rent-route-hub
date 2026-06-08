-- Custom-trip quote → payment flow.
--
-- Companion to the inquiry funnel: customer fills inquiry form → admin
-- composes a quote with line items → customer receives email with a public
-- /quote/:token link → clicks pay → Stripe checkout → webhook creates an
-- orders row linked back to the quote.
--
-- Quotes are accessed publicly via a UUID `public_token` (not by inquiry/quote
-- UUID, to keep IDs unguessable). RLS allows anonymous SELECT only through a
-- SECURITY DEFINER RPC that verifies the token.

CREATE TABLE public.quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id uuid REFERENCES public.inquiries(id) ON DELETE SET NULL,
  public_token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,

  customer_email text NOT NULL,
  customer_name text,

  title text NOT NULL,
  intro_message text,

  total_sek numeric(10,2) NOT NULL CHECK (total_sek >= 0),
  currency text NOT NULL DEFAULT 'SEK',

  status text NOT NULL DEFAULT 'sent' CHECK (status IN (
    'draft', 'sent', 'accepted', 'expired', 'cancelled'
  )),
  expires_at timestamptz NOT NULL,
  sent_at timestamptz,
  accepted_at timestamptz,

  stripe_checkout_session_id text,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,

  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_quotes_inquiry ON public.quotes(inquiry_id);
CREATE INDEX idx_quotes_status ON public.quotes(status);
CREATE INDEX idx_quotes_expires ON public.quotes(expires_at) WHERE status = 'sent';

CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage quotes"
  ON public.quotes FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Note: anonymous reads happen via the SECURITY DEFINER RPC below, not a
-- direct table policy.

GRANT SELECT, INSERT, UPDATE ON public.quotes TO authenticated;
GRANT ALL ON public.quotes TO service_role;

-- ----------------------------------------------------------------------

CREATE TABLE public.quote_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  description text NOT NULL,
  qty integer NOT NULL DEFAULT 1 CHECK (qty > 0),
  unit_price_sek numeric(10,2) NOT NULL CHECK (unit_price_sek >= 0),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_quote_items_quote ON public.quote_items(quote_id, sort_order);

ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage quote items"
  ON public.quote_items FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.quote_items TO authenticated;
GRANT ALL ON public.quote_items TO service_role;

-- ----------------------------------------------------------------------

-- Link from orders → originating quote (for quote-payment orders).
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS quote_id uuid REFERENCES public.quotes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_quote ON public.orders(quote_id) WHERE quote_id IS NOT NULL;

-- ----------------------------------------------------------------------

-- Public-by-token lookup. Returns the quote + its items as a single JSON
-- payload. Hides nothing — anyone with the token can see everything we'd put
-- in the customer-facing email anyway. Returns NULL for unknown/expired
-- tokens so the public page can show a clean "quote not found / expired"
-- state without distinguishing the two.
CREATE OR REPLACE FUNCTION public.get_quote_by_token(p_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_quote public.quotes;
  v_items jsonb;
BEGIN
  SELECT * INTO v_quote
  FROM public.quotes
  WHERE public_token = p_token
    AND status IN ('sent', 'accepted');
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', id,
      'description', description,
      'qty', qty,
      'unit_price_sek', unit_price_sek,
      'sort_order', sort_order
    )
    ORDER BY sort_order, created_at
  ), '[]'::jsonb)
  INTO v_items
  FROM public.quote_items
  WHERE quote_id = v_quote.id;

  RETURN jsonb_build_object(
    'id', v_quote.id,
    'public_token', v_quote.public_token,
    'customer_email', v_quote.customer_email,
    'customer_name', v_quote.customer_name,
    'title', v_quote.title,
    'intro_message', v_quote.intro_message,
    'total_sek', v_quote.total_sek,
    'currency', v_quote.currency,
    'status', v_quote.status,
    'expires_at', v_quote.expires_at,
    'sent_at', v_quote.sent_at,
    'accepted_at', v_quote.accepted_at,
    'order_id', v_quote.order_id,
    'items', v_items
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_quote_by_token(uuid) TO anon, authenticated;

-- Background sweep: mark sent quotes as expired once past expires_at.
-- Called opportunistically from edge functions (no pg_cron dependency).
CREATE OR REPLACE FUNCTION public.expire_old_quotes()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.quotes
  SET status = 'expired', updated_at = now()
  WHERE status = 'sent' AND expires_at < now();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.expire_old_quotes() TO authenticated, service_role;
