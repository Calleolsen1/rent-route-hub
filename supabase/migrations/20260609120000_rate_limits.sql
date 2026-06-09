-- Rate limiting for public endpoints.
--
-- One row per (endpoint, identifier). Identifier is usually IP, but could be
-- a user_id or session_id when authenticated. Sliding-window counter.
--
-- Applied to: submit-inquiry, newsletter signup, xs2-reserve,
-- xs2-renew-reservation, create-quote-checkout.

CREATE TABLE public.rate_limits (
  key text PRIMARY KEY,
  count int NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_rate_limits_window ON public.rate_limits(window_start);

-- Never SELECT-able from the client; edge functions hit via RPC.
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.rate_limits TO service_role;

-- Atomic: increments + returns whether the call is still within budget.
-- Returns TRUE = allowed, FALSE = rate limited.
CREATE OR REPLACE FUNCTION public.consume_rate_limit(
  p_key text,
  p_max int,
  p_window_sec int
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_count int;
BEGIN
  INSERT INTO public.rate_limits (key, count, window_start)
  VALUES (p_key, 1, now())
  ON CONFLICT (key) DO UPDATE
  SET
    count = CASE
      WHEN public.rate_limits.window_start < now() - (p_window_sec || ' seconds')::interval THEN 1
      ELSE public.rate_limits.count + 1
    END,
    window_start = CASE
      WHEN public.rate_limits.window_start < now() - (p_window_sec || ' seconds')::interval THEN now()
      ELSE public.rate_limits.window_start
    END
  RETURNING count INTO v_count;

  RETURN v_count <= p_max;
END;
$$;

GRANT EXECUTE ON FUNCTION public.consume_rate_limit(text, int, int) TO anon, authenticated, service_role;

-- Periodic cleanup: drop rows older than 1 day. Called opportunistically
-- from edge functions or via cron later.
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_count integer;
BEGIN
  DELETE FROM public.rate_limits WHERE window_start < now() - interval '1 day';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;
GRANT EXECUTE ON FUNCTION public.cleanup_rate_limits() TO service_role;
