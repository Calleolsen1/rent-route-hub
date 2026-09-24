DELETE FROM public.team_venue_photos
 WHERE sport = 'soccer' AND image_url IS NULL AND seatmap_url IS NOT NULL;

UPDATE public.team_venue_photos
   SET seatmap_url = NULL, seatmap_note = NULL
 WHERE sport = 'soccer' AND seatmap_url IS NOT NULL;