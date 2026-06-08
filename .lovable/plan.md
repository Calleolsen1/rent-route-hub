## Goal

Make Stripe the single source of truth for ticket prices. Fetch the price live every time an event page is viewed, then add a per-category markup (percentage + fixed SEK). The customer sees one all-in price; the markup is hidden.

## What changes for the admin

In **Admin → Trips → Tickets** (the category editor), the price field is replaced by:

- **Stripe lookup_key** (read-only once "Skapa Stripe-pris" has been clicked) — this is the source of truth for the base price
- **Påslag %** (markup percentage, e.g. `10` for +10%)
- **Påslag SEK** (fixed markup amount, e.g. `25`)

The `unit_price_sek` column stays in the DB but is no longer authoritative — it becomes a cached "last seen" value only, refreshed on every fetch. Admin can no longer edit it directly.

## What the customer sees

- Event page, cart, order summary, invoice: one final price per ticket = `stripe_amount + (stripe_amount × markup_pct) + markup_fixed`, rounded to whole SEK
- No "booking fee" line, no breakdown
- Stripe Checkout charges that same final amount (not the raw Stripe price)

## Technical implementation

### 1. Database migration

Add two columns to `ticket_categories`:

```text
markup_pct       numeric(5,2) NOT NULL DEFAULT 0   -- e.g. 10.00 = +10%
markup_fixed_sek numeric(10,2) NOT NULL DEFAULT 0  -- e.g. 25.00 = +25 SEK
```

Update `create_order_with_items` RPC to recompute total from a passed-in `p_unit_price_sek` (the live price + markup, computed server-side in the edge function) rather than reading the stale `unit_price_sek` column.

### 2. New edge function: `get-ticket-prices`

Input: `{ event_id }` (or `{ category_ids: [...] }`)
Logic:
1. Read all `ticket_categories` rows for the event (lookup_key, markup_pct, markup_fixed_sek)
2. Batch-fetch Stripe prices via `stripe.prices.list({ lookup_keys: [...] })`
3. For each category: `final = round(stripe_amount_sek × (1 + markup_pct/100) + markup_fixed_sek)`
4. Return `[{ category_id, base_sek, final_sek, currency }]`
5. Side effect: write `final_sek` back into `ticket_categories.unit_price_sek` so DB stays roughly in sync (best-effort, non-blocking)

`verify_jwt = false`, public (anyone viewing an event page calls it).

### 3. Update `create-checkout`

Already resolves Stripe price via lookup_key. Change it to:
- Compute `final_sek` exactly like `get-ticket-prices` (same formula, same rounding)
- Pass that amount to Stripe via `price_data` (inline price), NOT the raw `price` id — so the customer pays the marked-up amount
- Use the original Stripe product so the dashboard still shows the right product name

### 4. Frontend changes

- `EventDetail.tsx`, `Checkout.tsx`, `UpcomingEventsList.tsx`, order summary: replace direct reads of `unit_price_sek` with a call to `get-ticket-prices` on mount. Show a small skeleton while loading.
- Admin tickets editor: remove "Pris SEK" input, add "Påslag %" and "Påslag SEK" inputs. Show a read-only "Aktuellt Stripe-pris" line that calls `get-ticket-prices` so admin can preview the final amount.

### 5. Order/invoice integrity

When a guest places an order, the `order_items.unit_price_sek` is written from the freshly computed `final_sek` at order creation time. That row is immutable — invoices and order history always show what the customer actually paid, even if Stripe prices later change.

## Out of scope (your call later)

- Webhook on `price.updated` → DB sync (you said "build later")
- Showing markup as a separate "Bokningsavgift" line
- Bulk markup defaults (global / per event)

## Testing in the preview

1. **Set up a category**: Admin → Trips → pick a trip → Tickets tab → "Skapa Stripe-pris" (creates a 1000 SEK price in Stripe sandbox, lookup_key written to DB). Set Påslag % = 10, Påslag SEK = 50.
2. **Verify display**: Open the public event page. Price should show **1150 kr** (1000 × 1.10 + 50). Cart and order summary should match.
3. **Verify charge**: Click "Till kassan" → fill guest email → Stripe embedded checkout. The amount Stripe shows should also be **1150 kr**.
4. **Pay with test card**: `4242 4242 4242 4242`, any future expiry (e.g. `12/34`), any CVC (e.g. `123`), any postal code.
5. **Verify post-payment**:
   - Order in DB has `total_sek = 1150` and `status = paid`
   - Invoice email arrives with 1150 kr line
   - Guest account auto-created, welcome email arrives
   - `ticket_categories.unit_price_sek` has been updated to 1150
6. **Change Stripe price**: In Stripe dashboard, archive the price and create a new one at 1200 SEK with the same lookup_key. Reload the event page — price should now show **1370 kr** (1200 × 1.10 + 50) without any admin action.
7. **Decline test**: Try card `4000 0000 0000 0002` to confirm failed payments don't decrement inventory or create invoices.