# Dev seeds

SQL files in this directory are **dev/staging only** — never apply in production.

## `dev_demo_events.sql`

Inserts 4 sports events (3 soccer, 1 F1) with realistic Swedish copy, matching the `MOCK_FIXTURES` in `supabase/functions/_shared/xs2event.ts`. Lets you exercise the full booking flow before xs2event credentials arrive.

### Prerequisites

The `20260608220000_xs2event_foundation.sql` migration must be applied first (adds `is_featured`, `xs2_reservation_id`, `reservation_expires_at`, `xs2_sync_log`).

### How to apply

**Option A — Supabase Studio (simplest):**
1. Open https://supabase.com/dashboard/project/itaefkyfuvwicvarnfke/sql/new
2. Paste the contents of `dev_demo_events.sql`
3. Click **Run**
4. The trailing `SELECT` should show 4 events with their category counts

**Option B — Supabase CLI:**
```bash
supabase db push                               # apply migrations first
psql "$DEV_DATABASE_URL" -f supabase/seed/dev_demo_events.sql
```

### Mock mode (no xs2event credentials needed)

When `XS2_API_KEY` is **not** set in Supabase Edge Function secrets, the xs2event client falls back to mock fixtures defined in `_shared/xs2event.ts`. The seeded events' `external_event_id`s match the fixture keys, so:

- `xs2-get-event-tickets` returns realistic tickets with multiple suppliers per category
- `xs2-reserve` returns a fake `reservation_id` with a real 10-minute `expires_at`
- `payments-webhook` (after Stripe payment) returns a fake `booking_id` and a placeholder e-ticket URL

This lets you walk **Home → EventDetail → Reserve → Stripe sandbox → Confirm → OrderConfirmation → Mitt Kaisen** end-to-end before credentials arrive.

### Going live

When credentials land, set the `XS2_API_KEY` secret in Supabase. Mock mode auto-disables on next function invocation. The seeded `evt_demo_*` events stay around until you delete them (or they'll just fail to fetch live tickets — you can soft-delete by setting `status = 'cancelled'`).

```sql
-- Optional: clean up demo events once real data is syncing
UPDATE public.events
   SET status = 'cancelled', is_featured = false
 WHERE external_event_id LIKE 'evt_demo_%';
```
