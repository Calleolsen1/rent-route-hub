ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS vat_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS vat_rate numeric NOT NULL DEFAULT 2.67;