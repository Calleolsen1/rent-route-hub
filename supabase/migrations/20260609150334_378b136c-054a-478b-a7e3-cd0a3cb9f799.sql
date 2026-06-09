DROP INDEX IF EXISTS public.uq_events_xs2_external_id;
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS uq_events_external_event_id;
ALTER TABLE public.events ADD CONSTRAINT uq_events_external_event_id UNIQUE (external_event_id);

DROP INDEX IF EXISTS public.uq_ticket_categories_xs2_external;
ALTER TABLE public.ticket_categories DROP CONSTRAINT IF EXISTS uq_ticket_categories_external;
ALTER TABLE public.ticket_categories ADD CONSTRAINT uq_ticket_categories_external UNIQUE (event_id, external_category_id, external_sub_category);