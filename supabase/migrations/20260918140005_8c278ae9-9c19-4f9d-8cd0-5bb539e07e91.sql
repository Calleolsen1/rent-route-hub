ALTER TABLE public.booking_documents
  ADD COLUMN IF NOT EXISTS html text,
  ADD COLUMN IF NOT EXISTS quote_id uuid REFERENCES public.quotes(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS booking_documents_booking_id_idx ON public.booking_documents(booking_id);
CREATE INDEX IF NOT EXISTS booking_documents_quote_id_idx ON public.booking_documents(quote_id);