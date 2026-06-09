-- 20260609150000_event_prices.sql
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS min_price_sek numeric(10,2),
  ADD COLUMN IF NOT EXISTS max_price_sek numeric(10,2),
  ADD COLUMN IF NOT EXISTS compare_at_price_sek numeric(10,2);

INSERT INTO public.platform_settings (setting_key, setting_value, setting_type, description)
VALUES (
  'compare_at_default_pct',
  '0',
  'decimal',
  'Procent över aktuellt pris som visas som överstruket jämförelsepris på event utan eget compare_at. 0 = av (inga syntetiska rabatter). VARNING: Att visa ett höjt jämförelsepris som rabatt utan att priset faktiskt varit högre kan strida mot Prisinformationslagen och Marknadsföringslagen. Använd endast om du har historik på högre prissättning.'
)
ON CONFLICT (setting_key) DO NOTHING;

-- 20260609160000_xs2_fulfillment_retry.sql
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS fulfillment_attempt_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fulfillment_last_attempt_at timestamptz,
  ADD COLUMN IF NOT EXISTS tickets_ready_email_sent_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_orders_fulfillment_pending
  ON public.orders (paid_at)
  WHERE status IN ('paid', 'fulfilled')
    AND tickets_ready_email_sent_at IS NULL;