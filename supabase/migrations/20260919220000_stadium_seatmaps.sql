-- Seating chart per home team, alongside the stadium photo.
--
-- No fixture API supplies these: football-data.org and Jolpica both return
-- schedules only. They have to be uploaded, which is fine — a chart is
-- per-stadium and changes rarely, so 80-odd uploads cover the catalogue
-- permanently.
--
-- Deliberately NOT an interactive seat picker. The site sells trips on
-- request and holds no seat inventory, so there is nothing to select. The
-- chart's job is to let a customer say "long side, lower tier" in their
-- enquiry, which is what ops needs to quote.

ALTER TABLE public.team_venue_photos
  ADD COLUMN IF NOT EXISTS seatmap_url text;

-- image_url was NOT NULL when a row could only mean "a stadium photo".
-- Now a row can hold either slot independently, and uploading a seating
-- chart for a team with no photo yet is a normal thing to do.
ALTER TABLE public.team_venue_photos
  ALTER COLUMN image_url DROP NOT NULL;

-- A row with neither image is meaningless — it would just be an empty
-- placeholder the admin list has to filter around.
ALTER TABLE public.team_venue_photos
  DROP CONSTRAINT IF EXISTS team_venue_photos_has_image;
ALTER TABLE public.team_venue_photos
  ADD CONSTRAINT team_venue_photos_has_image
  CHECK (image_url IS NOT NULL OR seatmap_url IS NOT NULL);

COMMENT ON COLUMN public.team_venue_photos.seatmap_url IS
  'Static seating chart for this team''s home ground. Reference image for enquiries, not a seat picker.';

-- Surface it in the admin worklist next to the photo.
CREATE OR REPLACE VIEW public.home_team_photo_coverage AS
SELECT
  e.sport,
  COALESCE(e.home_team, e.race_name) AS match_key,
  count(*)                           AS event_count,
  min(e.venue_name)                  AS sample_venue,
  max(p.image_url)                   AS image_url,
  max(p.seatmap_url)                 AS seatmap_url
FROM public.events e
LEFT JOIN public.team_venue_photos p
  ON p.sport = e.sport
 AND p.match_key = COALESCE(e.home_team, e.race_name)
WHERE e.status = 'upcoming'
  AND COALESCE(e.home_team, e.race_name) IS NOT NULL
GROUP BY e.sport, COALESCE(e.home_team, e.race_name);

ALTER VIEW public.home_team_photo_coverage SET (security_invoker = true);
GRANT SELECT ON public.home_team_photo_coverage TO anon, authenticated;
