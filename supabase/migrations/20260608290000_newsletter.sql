-- Newsletter signups.
--
-- Public can INSERT (the footer form), admins can SELECT/DELETE. We don't need
-- updates — if someone changes email, they sign up again.

CREATE TABLE public.newsletter_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  source text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_newsletter_signups_email ON public.newsletter_signups (lower(email));

ALTER TABLE public.newsletter_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe"
  ON public.newsletter_signups FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins manage signups"
  ON public.newsletter_signups FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT INSERT ON public.newsletter_signups TO anon, authenticated;
GRANT SELECT, DELETE ON public.newsletter_signups TO authenticated;
GRANT ALL ON public.newsletter_signups TO service_role;
