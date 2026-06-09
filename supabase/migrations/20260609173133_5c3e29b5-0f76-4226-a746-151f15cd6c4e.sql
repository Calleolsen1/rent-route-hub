-- Multi-level jämförelsepris (compare-at / strikethrough).
--
-- Resolution priority (most specific wins, SEK beats % at the same level):
--   1. ticket_categories.compare_at_price_sek
--   2. ticket_categories.compare_at_pct (applied to category price)
--   3. events.compare_at_price_sek
--   4. events.compare_at_pct (applied to current price)
--   5. platform_settings.compare_at_default_pct
--
-- Sport- and tournament-level bulk operations write to events.compare_at_pct
-- on every event in the group (flattened — no separate group storage).
-- Trade-off: new events added later won't auto-inherit the group's setting,
-- but the admin can re-run the bulk in two clicks. No inheritance bugs, no
-- slug normalization, simpler reads.

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS compare_at_pct numeric(5,2);

ALTER TABLE public.ticket_categories
  ADD COLUMN IF NOT EXISTS compare_at_price_sek numeric(10,2),
  ADD COLUMN IF NOT EXISTS compare_at_pct numeric(5,2);

-- Helper RPC: bulk-set a percent override on every event in a tournament
-- or sport. Used by the admin "Sätt jämförelsepris för hela gruppen"
-- dialog. Pass either p_sport or p_tournament_name; the other should be null.
CREATE OR REPLACE FUNCTION public.set_group_compare_at_pct(
  p_pct numeric,
  p_sport text DEFAULT NULL,
  p_tournament_name text DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected integer := 0;
BEGIN
  IF p_pct IS NULL OR p_pct < 0 OR p_pct > 500 THEN
    RAISE EXCEPTION 'Pct must be between 0 and 500';
  END IF;
  IF p_tournament_name IS NOT NULL THEN
    UPDATE public.events
       SET compare_at_pct = p_pct
     WHERE tournament_name = p_tournament_name;
    GET DIAGNOSTICS affected = ROW_COUNT;
  ELSIF p_sport IS NOT NULL THEN
    UPDATE public.events
       SET compare_at_pct = p_pct
     WHERE sport::text = p_sport;
    GET DIAGNOSTICS affected = ROW_COUNT;
  ELSE
    RAISE EXCEPTION 'Either p_sport or p_tournament_name required';
  END IF;
  RETURN affected;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_group_compare_at_pct(numeric, text, text)
  TO authenticated;