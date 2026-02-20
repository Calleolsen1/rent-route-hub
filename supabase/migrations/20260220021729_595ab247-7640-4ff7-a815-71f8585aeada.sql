
-- Create storage bucket for trip attachments (PDFs, tickets)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'trip-attachments',
  'trip-attachments',
  true,
  52428800, -- 50MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- RLS policies for trip-attachments bucket
CREATE POLICY "Admins can upload trip attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'trip-attachments' AND
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update trip attachments"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'trip-attachments' AND
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete trip attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'trip-attachments' AND
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Trip attachments are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'trip-attachments');

-- Add pricing and payment fields to trips table
ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS price_total numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS price_currency text DEFAULT 'SEK',
  ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'invoice',
  ADD COLUMN IF NOT EXISTS payment_due_date date DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS invoice_sent_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS invoice_number text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS invoice_notes text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS price_breakdown jsonb DEFAULT '[]'::jsonb;
