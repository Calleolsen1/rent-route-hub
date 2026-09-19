-- Retire xs2event. OneClicket is now the only ticket supplier.
--
-- The xs2 edge functions, shared client and UI branches are gone in the same
-- change; this migration deals with the data they left behind.
--
-- Deliberately NOT dropped: orders.xs2_reservation_id / orders.xs2_booking_id.
-- Three historical orders still carry those values and they are the only
-- record of how those bookings were made. Dropping a column on a live table
-- is irreversible without a restore, and dead columns cost nothing — so they
-- stay as history. Nothing reads or writes them any more.

-- 1. The sync log is no longer xs2-specific.
ALTER TABLE IF EXISTS public.xs2_sync_log RENAME TO supplier_sync_log;

ALTER TABLE public.supplier_sync_log
  ALTER COLUMN source SET DEFAULT 'oneclicket';

-- Index/constraint names follow the old table; rename so they stay legible.
ALTER INDEX IF EXISTS idx_sync_log_source_resource_started
  RENAME TO idx_supplier_sync_log_source_resource_started;

ALTER TABLE public.supplier_sync_log
  DROP CONSTRAINT IF EXISTS xs2_sync_log_resource_type_check;
ALTER TABLE public.supplier_sync_log
  ADD CONSTRAINT supplier_sync_log_resource_type_check
  CHECK (resource_type IN ('events', 'categories', 'products'));

-- Old xs2 run history has no meaning now that the functions are gone.
DELETE FROM public.supplier_sync_log WHERE source = 'xs2event';

-- 2. Retire xs2-sourced events.
--
-- Two cases, because order_items.event_id is a plain FK with no ON DELETE:
-- an event that was ever ordered CANNOT be deleted without destroying order
-- history, and the FK would reject it anyway.
--
--   a) never ordered  -> delete outright (ticket_categories cascade)
--   b) has order rows -> mark 'cancelled' so it drops out of every listing
--      (they all filter status = 'upcoming') while the order keeps resolving.

UPDATE public.events e
   SET status = 'cancelled',
       updated_at = now()
 WHERE e.source = 'xs2event'
   AND EXISTS (SELECT 1 FROM public.order_items oi WHERE oi.event_id = e.id);

DELETE FROM public.events e
 WHERE e.source = 'xs2event'
   AND NOT EXISTS (SELECT 1 FROM public.order_items oi WHERE oi.event_id = e.id);

-- 3. Release the xs2 hold on any order that never got paid. Without this they
--    sit in 'pending' for ever — nothing can renew the reservation now.
UPDATE public.orders
   SET status = 'cancelled',
       notes = coalesce(notes || ' | ', '') || 'Auto-cancelled: xs2event supplier retired',
       updated_at = now()
 WHERE status IN ('pending', 'awaiting_payment')
   AND xs2_reservation_id IS NOT NULL;
