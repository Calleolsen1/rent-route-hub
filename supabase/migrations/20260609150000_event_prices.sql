-- Cache min/max ticket prices on events for list-view rendering, plus a
-- compare_at field for strikethrough "discount" display.
--
-- xs2event docs recommend NOT caching ticket data because availability +
-- price change frequently. But xs2's event-list response includes
-- min_ticket_price_eur and max_ticket_price_eur as aggregate hints — those
-- are stable enough to use for "Från X kr" labels in cards. EventDetail
-- still fetches live ticket prices for the actual buy flow.
--
-- compare_at_price_sek is the OPTIONAL strikethrough number. Two ways it
-- gets a value:
--   1. xs2-sync seeds it from xs2's face_value (real comparison — what the
--      ticket costs at the box office)
--   2. Admin sets it manually per event in /admin/tickets
--
-- If still NULL, PriceTag falls back to platform setting
-- `compare_at_default_pct` which synthesizes a comparison (current * 1 + pct/100).
-- A platform default of 0 disables the synthetic fallback entirely.

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
