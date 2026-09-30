-- DPA Sports Travel hotel searches, cached by dpa-hotels so a busy match
-- page doesn't call DPA on every view (a search takes 1–3 s, and has hung for
-- minutes). Key = environment|city|arrival|nights|rooms. Only the edge
-- function (service role) touches it: RLS on, no policies.
CREATE TABLE IF NOT EXISTS public.dpa_search_cache (
  key text PRIMARY KEY,
  hotels jsonb NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dpa_search_cache ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS dpa_search_cache_fetched_at_idx
  ON public.dpa_search_cache (fetched_at);
