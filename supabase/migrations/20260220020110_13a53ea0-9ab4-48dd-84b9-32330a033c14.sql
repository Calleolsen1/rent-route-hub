
ALTER TABLE public.trip_members
  ADD COLUMN IF NOT EXISTS invoice_paid_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS invoice_paid_amount NUMERIC DEFAULT NULL;

COMMENT ON COLUMN public.trip_members.invoice_paid_at IS 'When payment was received from this member';
COMMENT ON COLUMN public.trip_members.invoice_paid_amount IS 'Amount actually paid by this member';
