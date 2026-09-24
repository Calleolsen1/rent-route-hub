-- Seating plans live in a PRIVATE bucket.
--
-- 20260924120000_venue_plans asked for a public bucket, which this Lovable
-- Cloud workspace doesn't allow, so the bucket was never created and no plan
-- could be copied. Private works just as well: travelconnection-tickets
-- hands the page a signed URL, and Supabase Storage sends
-- Access-Control-Allow-Origin: * on signed URLs too, which the browser needs
-- to read the plan's pixels. Only the service role reads or writes here.
INSERT INTO storage.buckets (id, name, public)
VALUES ('venue-plans', 'venue-plans', false)
ON CONFLICT (id) DO UPDATE SET public = false;
