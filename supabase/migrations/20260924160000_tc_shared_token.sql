-- One shared Travel Connection access token for all edge functions.
--
-- The supplier invalidates the previous token every time the account logs
-- in (verified 2026-09-24: the old token then gets 403 "invalid token").
-- With each function logging in for itself they knocked each other out —
-- a ticket lookup could kill the token a checkout was about to use. They now
-- read and write this single row (_shared/travelconnection.ts,
-- dbTokenStore) and only log in when it has stopped working.
--
-- Service role only: RLS on, no policies.
CREATE TABLE IF NOT EXISTS public.tc_tokens (
  id             text PRIMARY KEY,
  access_token   text NOT NULL,
  refresh_token  text,
  expires_at     timestamptz NOT NULL,
  base           text NOT NULL,
  updated_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tc_tokens ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.tc_tokens FROM anon, authenticated;
GRANT ALL ON public.tc_tokens TO service_role;
