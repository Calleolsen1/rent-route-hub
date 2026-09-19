CREATE POLICY "Service role manages rate limits"
  ON public.rate_limits
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

ALTER VIEW public.public_profiles SET (security_invoker = true);