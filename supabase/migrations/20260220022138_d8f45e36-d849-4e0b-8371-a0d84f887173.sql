
-- Add booking_checklist column to trips table
-- This stores checkbox state for each component (admin-only vs customer-visible)
ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS booking_checklist jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS customer_notified_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS payment_confirmed_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS payment_confirmed_by_admin_id uuid;
