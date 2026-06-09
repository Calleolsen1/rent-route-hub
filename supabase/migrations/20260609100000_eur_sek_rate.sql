-- EUR → SEK conversion rate.
--
-- xs2event returns ticket prices in EUR (cents). Swedish customers see SEK.
-- This setting drives the conversion; admins update it manually so prices
-- don't fluctuate during a customer's checkout session.
--
-- Edit at /admin/markup-defaults.

INSERT INTO public.platform_settings (setting_key, setting_value, setting_type, description)
VALUES (
  'eur_to_sek_rate',
  '11.5',
  'decimal',
  'Växelkurs EUR → SEK för xs2event-biljetter. Uppdatera manuellt — påverkar nya prisberäkningar omedelbart.'
)
ON CONFLICT (setting_key) DO NOTHING;
