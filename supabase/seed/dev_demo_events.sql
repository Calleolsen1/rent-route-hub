-- ===========================================================================
-- DEV-ONLY SEED — demo sports events for end-to-end UI testing.
--
-- Apply ONLY in dev / staging — never production.
--
-- Prerequisites: migration 20260608220000_xs2event_foundation.sql must be
-- applied (adds is_featured, xs2_reservation_id, reservation_expires_at).
--
-- How to run:
--   Option A (Supabase Studio): open SQL editor for the dev project, paste
--                               this file, click Run.
--   Option B (CLI):             psql <DEV_DB_URL> -f supabase/seed/dev_demo_events.sql
--
-- The `external_event_id`, `external_category_id`, and `external_sub_category`
-- values MUST match the MOCK_FIXTURES in supabase/functions/_shared/xs2event.ts
-- so the mock-mode client serves matching tickets when XS2_API_KEY is unset.
--
-- Idempotent — re-running re-upserts. Safe to run multiple times.
-- ===========================================================================

-- --- 1. Liverpool vs Arsenal -------------------------------------------------
INSERT INTO public.events (
  source, external_event_id, external_tournament_id,
  sport, tournament_name, home_team, away_team, race_name,
  venue_name, city, country, starts_at, ends_at,
  status, is_featured,
  description,
  cover_image_url,
  last_synced_at
) VALUES (
  'xs2event', 'evt_demo_liverpool_arsenal', 'trn_demo_premier_league',
  'soccer', 'Premier League 2026/27', 'Liverpool FC', 'Arsenal FC', NULL,
  'Anfield', 'Liverpool', 'GB',
  now() + INTERVAL '35 days', now() + INTERVAL '35 days 2 hours',
  'upcoming', true,
  'Klassisk Premier League-rond på Anfield. Atmosfären på Kop End är legendarisk — och Liverpool–Arsenal är en av Englands äldsta rivaliteter.',
  NULL,
  now()
)
ON CONFLICT (external_event_id) WHERE source = 'xs2event' AND external_event_id IS NOT NULL
DO UPDATE SET
  starts_at = EXCLUDED.starts_at,
  ends_at = EXCLUDED.ends_at,
  is_featured = EXCLUDED.is_featured,
  description = EXCLUDED.description,
  last_synced_at = EXCLUDED.last_synced_at;

INSERT INTO public.ticket_categories (
  event_id, external_category_id, external_sub_category,
  name, description, party_size_together,
  unit_price_sek, currency, qty_available,
  markup_pct, markup_fixed_sek,
  last_synced_at
)
SELECT e.id, c.cat_id, 'singleday_regular',
       c.cat_name, c.cat_desc, c.party,
       0, 'SEK', c.stock,
       15, 0,
       now()
FROM public.events e
CROSS JOIN (VALUES
  ('ctg_liv_vip',      'VIP Hospitality',  'Lounge, mat och dryck ingår', 4, 18),
  ('ctg_liv_premium',  'Premium långsida', 'Bästa läget på Anfield',      6, 36),
  ('ctg_liv_standard', 'Kop End',          'Hemmaläktaren — bästa atmosfären', 8, 80)
) AS c(cat_id, cat_name, cat_desc, party, stock)
WHERE e.external_event_id = 'evt_demo_liverpool_arsenal' AND e.source = 'xs2event'
ON CONFLICT (event_id, external_category_id, external_sub_category)
WHERE external_category_id IS NOT NULL
DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  party_size_together = EXCLUDED.party_size_together,
  qty_available = EXCLUDED.qty_available,
  last_synced_at = EXCLUDED.last_synced_at;

-- --- 2. Real Madrid vs Barcelona --------------------------------------------
INSERT INTO public.events (
  source, external_event_id, external_tournament_id,
  sport, tournament_name, home_team, away_team, race_name,
  venue_name, city, country, starts_at, ends_at,
  status, is_featured,
  description,
  cover_image_url,
  last_synced_at
) VALUES (
  'xs2event', 'evt_demo_realmadrid_barcelona', 'trn_demo_la_liga',
  'soccer', 'La Liga 2026/27', 'Real Madrid', 'FC Barcelona', NULL,
  'Estadio Santiago Bernabéu', 'Madrid', 'ES',
  now() + INTERVAL '60 days', now() + INTERVAL '60 days 2 hours',
  'upcoming', true,
  'El Clásico på Bernabéu. Världens mest sedda fotbollsmatch — biljetterna går snabbt.',
  NULL,
  now()
)
ON CONFLICT (external_event_id) WHERE source = 'xs2event' AND external_event_id IS NOT NULL
DO UPDATE SET
  starts_at = EXCLUDED.starts_at,
  ends_at = EXCLUDED.ends_at,
  is_featured = EXCLUDED.is_featured,
  description = EXCLUDED.description,
  last_synced_at = EXCLUDED.last_synced_at;

INSERT INTO public.ticket_categories (
  event_id, external_category_id, external_sub_category,
  name, description, party_size_together,
  unit_price_sek, currency, qty_available,
  markup_pct, markup_fixed_sek,
  last_synced_at
)
SELECT e.id, c.cat_id, 'singleday_regular',
       c.cat_name, c.cat_desc, c.party,
       0, 'SEK', c.stock,
       15, 0,
       now()
FROM public.events e
CROSS JOIN (VALUES
  ('ctg_rma_vip',      'VIP Box',             'Privat box med 4 säten',          4, 12),
  ('ctg_rma_premium',  'Premium mittlinje',   'Bästa vyn på Bernabéu',           6, 28),
  ('ctg_rma_standard', 'Standard kortsida',   'Bra sikt, prisvärt',              8, 64)
) AS c(cat_id, cat_name, cat_desc, party, stock)
WHERE e.external_event_id = 'evt_demo_realmadrid_barcelona' AND e.source = 'xs2event'
ON CONFLICT (event_id, external_category_id, external_sub_category)
WHERE external_category_id IS NOT NULL
DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  party_size_together = EXCLUDED.party_size_together,
  qty_available = EXCLUDED.qty_available,
  last_synced_at = EXCLUDED.last_synced_at;

-- --- 3. F1 Italian GP (Monza) — multi-day ----------------------------------
INSERT INTO public.events (
  source, external_event_id, external_tournament_id,
  sport, tournament_name, home_team, away_team, race_name,
  venue_name, city, country, starts_at, ends_at,
  status, is_featured,
  description,
  cover_image_url,
  last_synced_at
) VALUES (
  'xs2event', 'evt_demo_f1_monza', 'trn_demo_formula1_2026',
  'formula1', 'Formula 1 2026', NULL, NULL, 'Italiens Grand Prix',
  'Autodromo Nazionale Monza', 'Monza', 'IT',
  now() + INTERVAL '85 days', now() + INTERVAL '87 days',
  'upcoming', true,
  'Formel 1 på den klassiska banan i Monza — högfartskurvor, Tifosi-stämning och Ferrari-hemmaplan.',
  NULL,
  now()
)
ON CONFLICT (external_event_id) WHERE source = 'xs2event' AND external_event_id IS NOT NULL
DO UPDATE SET
  starts_at = EXCLUDED.starts_at,
  ends_at = EXCLUDED.ends_at,
  is_featured = EXCLUDED.is_featured,
  description = EXCLUDED.description,
  last_synced_at = EXCLUDED.last_synced_at;

-- F1 has multiple sub_categories per category (weekend vs single-day passes).
INSERT INTO public.ticket_categories (
  event_id, external_category_id, external_sub_category,
  name, description, party_size_together,
  unit_price_sek, currency, qty_available,
  markup_pct, markup_fixed_sek,
  last_synced_at
)
SELECT e.id, c.cat_id, c.sub,
       c.cat_name, c.cat_desc, c.party,
       0, 'SEK', c.stock,
       15, 0,
       now()
FROM public.events e
CROSS JOIN (VALUES
  ('ctg_mnz_paddock',    'weekend_regular', 'Paddock Club (helgpass)',    'VIP, mat & dryck hela helgen',    4, 10),
  ('ctg_mnz_grandstand', 'weekend_regular', 'Grandstand 7 (helgpass)',    'Klassisk läktare nära start/mål', 6, 32),
  ('ctg_mnz_grandstand', 'sun_regular',     'Grandstand 7 (race-dagen)',  'Endast söndagens race',           6, 48)
) AS c(cat_id, sub, cat_name, cat_desc, party, stock)
WHERE e.external_event_id = 'evt_demo_f1_monza' AND e.source = 'xs2event'
ON CONFLICT (event_id, external_category_id, external_sub_category)
WHERE external_category_id IS NOT NULL
DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  party_size_together = EXCLUDED.party_size_together,
  qty_available = EXCLUDED.qty_available,
  last_synced_at = EXCLUDED.last_synced_at;

-- --- 4. AC Milan vs Inter ---------------------------------------------------
INSERT INTO public.events (
  source, external_event_id, external_tournament_id,
  sport, tournament_name, home_team, away_team, race_name,
  venue_name, city, country, starts_at, ends_at,
  status, is_featured,
  description,
  cover_image_url,
  last_synced_at
) VALUES (
  'xs2event', 'evt_demo_milan_inter', 'trn_demo_serie_a',
  'soccer', 'Serie A 2026/27', 'AC Milan', 'Inter', NULL,
  'San Siro', 'Milano', 'IT',
  now() + INTERVAL '42 days', now() + INTERVAL '42 days 2 hours',
  'upcoming', false,
  'Derby della Madonnina — Italiens hetaste derby. Två klubbar delar samma arena, en stad delar sig på mitten.',
  NULL,
  now()
)
ON CONFLICT (external_event_id) WHERE source = 'xs2event' AND external_event_id IS NOT NULL
DO UPDATE SET
  starts_at = EXCLUDED.starts_at,
  ends_at = EXCLUDED.ends_at,
  is_featured = EXCLUDED.is_featured,
  description = EXCLUDED.description,
  last_synced_at = EXCLUDED.last_synced_at;

INSERT INTO public.ticket_categories (
  event_id, external_category_id, external_sub_category,
  name, description, party_size_together,
  unit_price_sek, currency, qty_available,
  markup_pct, markup_fixed_sek,
  last_synced_at
)
SELECT e.id, c.cat_id, 'singleday_regular',
       c.cat_name, c.cat_desc, c.party,
       0, 'SEK', c.stock,
       15, 0,
       now()
FROM public.events e
CROSS JOIN (VALUES
  ('ctg_acm_vip',     'VIP Hospitality',  'San Siro Lounge', 4, 12),
  ('ctg_acm_premium', 'Tribuna d''Onore', 'Premiumläktaren', 6, 36)
) AS c(cat_id, cat_name, cat_desc, party, stock)
WHERE e.external_event_id = 'evt_demo_milan_inter' AND e.source = 'xs2event'
ON CONFLICT (event_id, external_category_id, external_sub_category)
WHERE external_category_id IS NOT NULL
DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  party_size_together = EXCLUDED.party_size_together,
  qty_available = EXCLUDED.qty_available,
  last_synced_at = EXCLUDED.last_synced_at;

-- Sanity check
SELECT e.external_event_id, e.tournament_name, e.is_featured,
       COUNT(c.id) AS category_count
FROM public.events e
LEFT JOIN public.ticket_categories c ON c.event_id = e.id
WHERE e.source = 'xs2event'
GROUP BY e.id, e.external_event_id, e.tournament_name, e.is_featured
ORDER BY e.starts_at;
