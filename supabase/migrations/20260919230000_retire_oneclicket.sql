-- Retire OneClicket. football-data.org and Jolpica now supply every fixture.
--
-- Both sources were live at once, so every page was showing each game twice:
-- 883 OneClicket events alongside 1,654 from football-data, e.g. Arsenal with
-- 21 home fixtures from each. The five seeded 'mock' demo events go too —
-- they were never real inventory and appear on public listings.
--
-- Same two-case handling as the xs2 retirement, because order_items.event_id
-- is a plain FK with no ON DELETE: an event that was ever ordered cannot be
-- deleted, so it is cancelled instead and drops out of every listing (they
-- all filter status = 'upcoming').

UPDATE public.events e
   SET status = 'cancelled',
       updated_at = now()
 WHERE e.source IN ('oneclicket', 'mock')
   AND EXISTS (SELECT 1 FROM public.order_items oi WHERE oi.event_id = e.id);

DELETE FROM public.events e
 WHERE e.source IN ('oneclicket', 'mock')
   AND NOT EXISTS (SELECT 1 FROM public.order_items oi WHERE oi.event_id = e.id);

-- ticket_categories cascade with their events. Any that survive belong to a
-- cancelled, ordered event and are part of that order's history.

-- Old sync history for a supplier that no longer exists.
DELETE FROM public.supplier_sync_log WHERE source = 'oneclicket';

-- Supplier-specific columns on ticket_categories are dead: fixtures now come
-- from a schedule API with no inventory. Left in place rather than dropped —
-- dropping columns on a live table is irreversible without a restore, and
-- nothing reads them.
COMMENT ON COLUMN public.ticket_categories.supplier_version_id IS
  'DEAD: OneClicket version id. Supplier retired 2026-09-19; nothing reads this.';

-- oneclicket_orders is kept for the same reason. It is empty — no live order
-- was ever placed, since ordering stayed gated off.
COMMENT ON TABLE public.oneclicket_orders IS
  'DEAD: OneClicket retired 2026-09-19. Empty; kept rather than dropped.';
