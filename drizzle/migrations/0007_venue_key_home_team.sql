CREATE TEMP TABLE venue_key_map ON COMMIT DROP AS
SELECT DISTINCT ON (old_key) old_key, new_key
FROM (
  SELECT
    btrim(COALESCE(NULLIF(venue_name, ''), NULLIF(race_name, ''), home_team)) AS old_key,
    btrim(CASE WHEN sport = 'formula1'
               THEN COALESCE(NULLIF(race_name, ''), venue_name)
               ELSE COALESCE(NULLIF(home_team, ''), venue_name, race_name) END) AS new_key
  FROM public.events
) e
WHERE old_key IS NOT NULL AND new_key IS NOT NULL AND old_key <> new_key
GROUP BY old_key, new_key
ORDER BY old_key, count(*) DESC;

UPDATE public.supplier_category_links t
SET seat_category_id = COALESCE(t.seat_category_id, s.seat_category_id),
    hidden = t.hidden OR s.hidden
FROM public.supplier_category_links s
JOIN venue_key_map m ON s.venue_key = m.old_key
WHERE t.venue_key = m.new_key
  AND t.supplier = s.supplier
  AND t.supplier_category_id = s.supplier_category_id;

DELETE FROM public.supplier_category_links s
USING venue_key_map m, public.supplier_category_links t
WHERE s.venue_key = m.old_key
  AND t.venue_key = m.new_key
  AND t.supplier = s.supplier
  AND t.supplier_category_id = s.supplier_category_id;

UPDATE public.supplier_category_links s SET venue_key = m.new_key
FROM venue_key_map m WHERE s.venue_key = m.old_key;

UPDATE public.seat_categories s SET venue_key = m.new_key, updated_at = now()
FROM venue_key_map m WHERE s.venue_key = m.old_key;