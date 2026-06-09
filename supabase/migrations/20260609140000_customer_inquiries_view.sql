-- Let authenticated users see their own inquiries (matched by email).
-- Used by Mitt Kaisen "Mina förfrågningar" page.

CREATE POLICY "Users see their own inquiries"
  ON public.inquiries FOR SELECT
  TO authenticated
  USING (email = auth.email());
