-- Retire the hand-uploaded football seating charts.
--
-- Football now uses the supplier's official plans (tc_venues), which match
-- the block names on the tickets; the uploaded Emirates chart did not (it
-- showed B40–B65 where the tickets say blocks 67–76). The two F1 charts
-- (Monza, Las Vegas) stay: Travel Connection has no F1 plans yet.
--
-- A row must keep a photo or a chart (CHECK constraint), so rows that were
-- only a chart are deleted; rows with a stadium photo just lose the chart.
DELETE FROM public.team_venue_photos
 WHERE sport = 'soccer' AND image_url IS NULL AND seatmap_url IS NOT NULL;

UPDATE public.team_venue_photos
   SET seatmap_url = NULL, seatmap_note = NULL
 WHERE sport = 'soccer' AND seatmap_url IS NOT NULL;
