ALTER TABLE public.team_venue_photos ADD COLUMN IF NOT EXISTS seatmap_note text;

CREATE OR REPLACE VIEW public.home_team_photo_coverage AS
 SELECT e.sport,
    COALESCE(e.home_team, e.race_name) AS match_key,
    count(*) AS event_count,
    min(e.venue_name) AS sample_venue,
    max(p.image_url) AS image_url,
    max(p.seatmap_url) AS seatmap_url,
    max(p.seatmap_note) AS seatmap_note
   FROM events e
     LEFT JOIN team_venue_photos p ON p.sport = e.sport AND p.match_key = COALESCE(e.home_team, e.race_name)
  WHERE e.status = 'upcoming'::event_status AND COALESCE(e.home_team, e.race_name) IS NOT NULL
  GROUP BY e.sport, (COALESCE(e.home_team, e.race_name));