CREATE TABLE public.home_trips (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url text,
  title text NOT NULL,
  tag text,
  date_label text,
  days_label text,
  price_from_sek numeric,
  href text NOT NULL DEFAULT '/contact',
  cta_label text NOT NULL DEFAULT 'Gör förfrågan',
  is_new boolean NOT NULL DEFAULT false,
  is_popular boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  valid_until date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.home_trips TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.home_trips TO authenticated;
GRANT ALL ON public.home_trips TO service_role;

ALTER TABLE public.home_trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active home trips"
ON public.home_trips FOR SELECT
USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage home trips"
ON public.home_trips FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_home_trips_updated_at
BEFORE UPDATE ON public.home_trips
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();