-- Fix: convert partial unique indexes to real UNIQUE constraints.
--
-- The foundation migration created partial unique indexes (e.g.
-- `WHERE source = 'xs2event' AND external_event_id IS NOT NULL`) but
-- PostgREST's `ON CONFLICT (col)` inference can't use partial indexes.
-- xs2-sync failed with:
--   events upsert failed: there is no unique or exclusion constraint
--   matching the ON CONFLICT specification
--
-- Replacing with regular UNIQUE constraints. PostgreSQL's default
-- behavior allows multiple NULLs in a UNIQUE column, so manual/mock
-- events (which keep external_event_id NULL) don't conflict with each
-- other or with xs2-sourced events.

-- events ---------------------------------------------------------------
DROP INDEX IF EXISTS public.uq_events_xs2_external_id;

ALTER TABLE public.events
  DROP CONSTRAINT IF EXISTS uq_events_external_event_id;
ALTER TABLE public.events
  ADD CONSTRAINT uq_events_external_event_id UNIQUE (external_event_id);

-- ticket_categories ---------------------------------------------------
DROP INDEX IF EXISTS public.uq_ticket_categories_xs2_external;

ALTER TABLE public.ticket_categories
  DROP CONSTRAINT IF EXISTS uq_ticket_categories_external;
ALTER TABLE public.ticket_categories
  ADD CONSTRAINT uq_ticket_categories_external
  UNIQUE (event_id, external_category_id, external_sub_category);
