-- Run the three syncs every night, in dependency order:
--
--   01:00 UTC  football-sync           fixtures from football-data.org (~80s)
--   01:05 UTC  f1-sync                 F1 calendar from Jolpica
--   01:15 UTC  travelconnection-sync   link supplier tickets onto those fixtures
--
-- Travel Connection runs last because it matches onto the fixtures the first
-- two just refreshed — a moved kickoff or a new cup tie must exist before the
-- supplier product for it can be linked. 01:00 UTC is 02:00–03:00 in Sweden.
--
-- Auth: the functions keep verify_jwt = true, which the public anon key
-- satisfies. What authorises the job is x-cron-secret — a random value made
-- here, stored in cron_secrets, and compared by _shared/cron_auth.ts. Unlike
-- the old xs2 cron this needs nothing copied into Vault by hand.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ─── Shared secret ────────────────────────────────────────────────────────
-- RLS on, no policies, nothing granted to anon/authenticated: only the
-- service role (the edge functions) and postgres (the cron job) can read it.
CREATE TABLE IF NOT EXISTS public.cron_secrets (
  name        text PRIMARY KEY,
  secret      text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cron_secrets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.cron_secrets FROM anon, authenticated;
GRANT ALL ON public.cron_secrets TO service_role;

-- Two UUIDs of randomness. Kept if it already exists, so re-running this
-- migration doesn't break a job mid-flight.
INSERT INTO public.cron_secrets (name, secret)
VALUES (
  'nightly_sync',
  replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')
)
ON CONFLICT (name) DO NOTHING;

-- ─── Caller ───────────────────────────────────────────────────────────────
-- One function so the three schedules stay one line each. SECURITY DEFINER
-- because pg_cron runs as postgres but the secret read should not depend on
-- whoever last edited the job.
CREATE OR REPLACE FUNCTION public.invoke_sync_function(p_function text)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_secret text;
BEGIN
  SELECT secret INTO v_secret FROM public.cron_secrets WHERE name = 'nightly_sync';
  RETURN net.http_post(
    url := 'https://itaefkyfuvwicvarnfke.supabase.co/functions/v1/' || p_function,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      -- Public anon key (it is in the site's own JS bundle); only gets the
      -- request past the gateway. x-cron-secret is the real credential.
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0YWVma3lmdXZ3aWN2YXJuZmtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MjI3ODcsImV4cCI6MjA4NzA5ODc4N30.I0TaztysgtEwbef-6q7SEChKZJDwRdwolbsx7UxUHzE',
      'x-cron-secret', v_secret
    ),
    body := '{}'::jsonb,
    -- football-sync takes ~80s; pg_net's 5s default would drop the request.
    timeout_milliseconds := 180000
  );
END;
$$;

REVOKE ALL ON FUNCTION public.invoke_sync_function(text) FROM PUBLIC, anon, authenticated;

-- ─── Schedules (idempotent) ───────────────────────────────────────────────
DO $$
DECLARE
  j text;
BEGIN
  FOREACH j IN ARRAY ARRAY['nightly-football-sync', 'nightly-f1-sync', 'nightly-travelconnection-sync'] LOOP
    BEGIN
      PERFORM cron.unschedule(j);
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END LOOP;
END $$;

SELECT cron.schedule('nightly-football-sync', '0 1 * * *',
  $$ SELECT public.invoke_sync_function('football-sync'); $$);

SELECT cron.schedule('nightly-f1-sync', '5 1 * * *',
  $$ SELECT public.invoke_sync_function('f1-sync'); $$);

SELECT cron.schedule('nightly-travelconnection-sync', '15 1 * * *',
  $$ SELECT public.invoke_sync_function('travelconnection-sync'); $$);
