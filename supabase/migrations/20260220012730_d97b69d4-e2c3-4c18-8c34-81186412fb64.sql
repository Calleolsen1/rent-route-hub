
-- Add passport details to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS nationality TEXT,
  ADD COLUMN IF NOT EXISTS passport_number TEXT,
  ADD COLUMN IF NOT EXISTS passport_expiry DATE;

-- Create trips table (admin-managed, read-only for guests)
CREATE TABLE public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_user_id UUID NOT NULL,
  title TEXT NOT NULL,
  destination TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'upcoming', -- upcoming, ongoing, completed, cancelled
  notes TEXT,
  -- Hotel
  hotel_name TEXT,
  hotel_address TEXT,
  hotel_checkin DATE,
  hotel_checkout DATE,
  hotel_confirmation TEXT,
  hotel_notes TEXT,
  hotel_stars INTEGER,
  -- Flights (array of flight objects)
  flights JSONB DEFAULT '[]'::jsonb,
  -- Transfers
  transfers JSONB DEFAULT '[]'::jsonb,
  -- Schedule/itinerary
  schedule JSONB DEFAULT '[]'::jsonb,
  -- Tickets (e.g. event tickets, museum passes)
  tickets JSONB DEFAULT '[]'::jsonb,
  -- Meta
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by_admin_id UUID
);

-- Enable RLS
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

-- Guests can view their own trips (read-only)
CREATE POLICY "Guests can view their own trips"
  ON public.trips FOR SELECT
  USING (auth.uid() = guest_user_id);

-- Only admins can insert trips
CREATE POLICY "Admins can insert trips"
  ON public.trips FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update trips
CREATE POLICY "Admins can update trips"
  ON public.trips FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete trips
CREATE POLICY "Admins can delete trips"
  ON public.trips FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_trips_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.update_trips_updated_at();
