ALTER TABLE public.booking_items
  ADD COLUMN IF NOT EXISTS vat_rate numeric;