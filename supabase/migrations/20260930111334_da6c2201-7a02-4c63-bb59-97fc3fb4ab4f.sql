CREATE TABLE IF NOT EXISTS public.dpa_search_cache (
  key text PRIMARY KEY,
  hotels jsonb NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dpa_search_cache ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS dpa_search_cache_fetched_at_idx
  ON public.dpa_search_cache (fetched_at);