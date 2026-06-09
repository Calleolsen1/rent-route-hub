-- Schedule xs2-retry-pending hourly.
--
-- pg_cron + pg_net call the edge function with the service role key. The
-- function walks paid orders missing ticket files, retries xs2 confirm /
-- getETicketZipUrl, and emails the customer when tickets become available.
--
-- xs2 supplier ticket issuance is typically 1-7 days before event, so
-- hourly polling is plenty — faster cadence just burns API quota.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Idempotent unschedule (in case this migration is re-run)
DO $$
BEGIN
  PERFORM cron.unschedule('xs2-retry-pending-hourly');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- The service-role key must be stored in Supabase Vault before this cron
-- can fire — Supabase does NOT expose service_role to pg_cron by default.
-- Set it via the Supabase dashboard once:
--   Project Settings → Vault → New Secret
--   name = service_role_key
--   value = <project service role key>
--
-- Until then, cron runs will fail silently (the http_post body will be
-- malformed). Read manually-triggered runs work fine via the function URL.

SELECT cron.schedule(
  'xs2-retry-pending-hourly',
  '7 * * * *', -- minute 7 every hour (offset from other syncs)
  $$
  SELECT net.http_post(
    url := 'https://itaefkyfuvwicvarnfke.supabase.co/functions/v1/xs2-retry-pending',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(
        (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1),
        ''
      )
    ),
    body := jsonb_build_object('trigger', 'cron')
  );
  $$
);
