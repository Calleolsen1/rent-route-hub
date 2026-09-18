ALTER TABLE public.booking_items
  ADD COLUMN IF NOT EXISTS is_round_trip boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS return_flight_number text,
  ADD COLUMN IF NOT EXISTS return_depart_at timestamptz;