-- Official seating plans from Travel Connection.
--
-- Each supplier venue has a seating-plan image whose areas are painted in
-- the same colours as the ticket categories sold there (Emirates: Cannon
-- Club blocks B67–B80 yellow = category colour #FFD663). The match page uses
-- that to light up where a ticket is, with no manual mapping.
--
-- travelconnection-sync copies each plan into our own public bucket once:
-- the browser must read the image's pixels to highlight areas, which needs
-- CORS headers the supplier's storage doesn't send, and a copy keeps working
-- if the supplier moves files.

CREATE TABLE IF NOT EXISTS public.tc_venues (
  tc_venue_id  integer PRIMARY KEY,
  name         text NOT NULL,
  city         text,
  -- The supplier's URL we copied from; a new URL means a new plan to copy.
  source_url   text,
  -- Path inside the venue-plans bucket, null until copied.
  plan_path    text,
  plan_error   text,
  copied_at    timestamptz,
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tc_venues ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins read tc_venues" ON public.tc_venues;
CREATE POLICY "Admins read tc_venues"
  ON public.tc_venues FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
GRANT SELECT ON public.tc_venues TO authenticated;
GRANT ALL ON public.tc_venues TO service_role;

-- Public bucket: plans are public images, and the page loads them with
-- crossOrigin="anonymous" to read pixels. Only the service role writes.
INSERT INTO storage.buckets (id, name, public)
VALUES ('venue-plans', 'venue-plans', true)
ON CONFLICT (id) DO UPDATE SET public = true;
