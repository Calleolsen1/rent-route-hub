
-- 1. Enums
CREATE TYPE public.inquiry_type AS ENUM ('group','conference','training_camp','vip','contact');
CREATE TYPE public.inquiry_status AS ENUM ('new','in_progress','quoted','won','lost');

-- 2. Table
CREATE TABLE public.inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type public.inquiry_type NOT NULL,
  status public.inquiry_status NOT NULL DEFAULT 'new',

  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  company text,

  group_size integer,
  preferred_dates_start date,
  preferred_dates_end date,
  destination text,
  budget_sek integer,
  sport_or_topic text,

  message text NOT NULL,
  source_page text,

  assigned_admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_notes text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX inquiries_status_idx ON public.inquiries (status);
CREATE INDEX inquiries_type_idx   ON public.inquiries (type);
CREATE INDEX inquiries_created_idx ON public.inquiries (created_at DESC);

-- 3. Grants
GRANT INSERT ON public.inquiries TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.inquiries TO authenticated;
GRANT ALL ON public.inquiries TO service_role;

-- 4. RLS
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- Anyone (anon or signed-in) can submit an inquiry
CREATE POLICY "Anyone can submit inquiries"
ON public.inquiries FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only admins can read / update / delete
CREATE POLICY "Admins can view inquiries"
ON public.inquiries FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update inquiries"
ON public.inquiries FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete inquiries"
ON public.inquiries FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 5. updated_at trigger
CREATE TRIGGER update_inquiries_updated_at
BEFORE UPDATE ON public.inquiries
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
