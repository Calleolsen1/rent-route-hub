-- Official seating plans from Travel Connection.
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