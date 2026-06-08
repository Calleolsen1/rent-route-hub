
# Kaisen — what we'll do before plugging in the XS2Event API

Locked decisions:
- **Visual identity:** Navy + neutrals. **No gold anywhere** (will be saved as a permanent project rule).
- **Tickets:** Fotboll + F1 only at launch, ticket-only (no hotel bundle).
- **Inquiries:** Grupp & Konferens + Träningsläger are inbound forms — no online purchase.
- **Merchant of record:** Kaisen, via Stripe (Lovable's built-in seamless Stripe Payments).
- **Ticket provider:** XS2Event (`docs.xs2event.com`). Their model: Tournament → Event → Tickets (grouped by `event_id` + `category_id` + `sub_category`). Tickets data changes constantly — never cache it.
- **Legacy cleanup:** Delete the entire property-rental product (listings, hosts, search, checkout, become-host, marketplace admin pages).

Total estimated build: 5 phases. Phases 1–4 are pre-API; Phase 5 is the integration itself.

---

## Phase 1 — Cleanup & de-gold (foundation)

**1.1 Remove gold from the design system**
- `index.css` + `tailwind.config.ts`: drop `--gold`, `--gold-light`, `--gold-pale` tokens (replace with neutrals).
- Replace every `text-gold*`, `bg-gold*`, gold gradients/orbs across all `src/pages/**`, `src/components/**`.
- Italic accent words in hero headlines → `text-primary` (navy) or muted.
- Eyebrow labels → `text-primary` instead of `text-gold`.

**1.2 Delete the property-rental product**
Files to remove:
- Pages: `Search.tsx`, `ListingDetail.tsx`, `Checkout.tsx`, `BookingConfirmation.tsx`, `BecomeHost.tsx`, `GuestDashboard.tsx` (old)
- All of `src/pages/host/**` and `src/components/host/**`
- Marketplace admin pages: `admin/ListingsManagement.tsx`, `ReviewListing.tsx`, `Commissions.tsx`, `Transactions.tsx`, `DisputesManagement.tsx`, `BookingsManagement.tsx`
- Components: `BookingWidget`, `listing/**`, `search/**`, `dispute/**`, `guest/CancelBookingDialog`, `DashboardPaymentsSummary`, etc. (full list discovered while removing routes)
- Layouts: `HostLayout`, old `GuestLayout` if marketplace-only
- Hooks: `useBookingDispute`, `useDisputeDetails`, `useFeaturedDestinations` (if listing-bound)
- Routes in `App.tsx`: `/search`, `/listing/:id`, `/checkout`, `/booking-confirmation/:id`, `/become-host`, `/host/**`, the property admin routes
- Edge functions no longer used: `search-listings`, `cancel-expired-bookings`, `mark-completed-bookings`, `process-pending-payouts` — delete with the function delete tool
- DB tables to drop (separate migration, after code is gone): `listings`, `listing_availability`, `listing_moderation_feedback`, `bookings`, `cancellation_policies`, `disputes`, `guest_debts`, `payouts`, `reviews`, `trip_groups`, `trip_members`, `transactions`, `cities`, `countries`, `states_regions`. Keep: `profiles`, `user_roles`, `messages`, `message_threads`, `faqs`, `platform_settings`.

**1.3 Restyle the surviving public pages to match Home**
Each gets the same hero pattern (navy overlay, eyebrow label, serif headline with italic navy accent word), `bg-cream` section bands, pill buttons, generous spacing:
- `About.tsx`, `Contact.tsx`, `FAQ.tsx`, `HelpCenter.tsx`, `Support.tsx`
- `Services.tsx`, `GroupTravel.tsx`
- `services/Sportresor.tsx`, `services/TeamPage.tsx`, `services/F1RacePage.tsx`, `services/Traningslager.tsx`
- `services/Affarsresor.tsx`, `services/Konferens.tsx`, `services/VIPService.tsx`, `services/WeekendGetaway.tsx`
- Footer + Navbar de-gold pass

**1.4 Move hardcoded data out of Navbar/TeamPage/F1RacePage**
Create `src/data/sports.ts` (or DB tables in Phase 2) so the menu, team pages, and F1 pages all read from one source. Lets us swap to API data in Phase 5 without touching UI.

---

## Phase 2 — Inquiry funnel (Grupp/Konferens/Träningsläger/Kontakt)

**2.1 DB**
```text
inquiries
  id, type ('group'|'conference'|'training_camp'|'contact'|'vip')
  status ('new'|'in_progress'|'quoted'|'won'|'lost')
  name, email, phone, company
  group_size, preferred_dates_start, preferred_dates_end
  destination, budget_sek, sport_or_topic
  message, source_page
  assigned_admin_id, created_at, updated_at
```
RLS: anyone can INSERT (anon allowed for the form); only admins can SELECT/UPDATE.

**2.2 Edge function `submit-inquiry`**
- Validates with Zod
- Stores row
- Emails `info@kaisengroup.se` via Resend (already wired)
- Auto-reply to customer
- Returns `{ ok, inquiry_id }`

**2.3 UI**
- Reusable `<InquiryForm type="…" />` component
- Embedded on `/group-travel`, `/services/konferens`, `/services/traningslager`, `/services/vip-service`, `/contact`
- Each page passes its `type` and any pre-set fields
- Success screen + confirmation copy

**2.4 Admin "Förfrågningar"**
- `/admin/inquiries` list with filters (type, status, assigned)
- Detail drawer: full info + status changer + assign-to + notes
- Reply button → opens existing Mitt Kaisen messaging or mailto

---

## Phase 3 — Ticket-flow scaffolding (mock data, no API yet)

**3.1 DB**
```text
events
  id, source ('xs2event'), external_event_id, external_tournament_id
  sport ('soccer'|'formula1'), tournament_name
  home_team, away_team, race_name
  venue_name, city, country
  starts_at, ends_at
  cover_image_url, status ('upcoming'|'sold_out'|'completed')
  last_synced_at

ticket_categories
  id, event_id, external_category_id, external_sub_category
  name, description, party_size_together
  unit_price_sek, currency, qty_available
  last_synced_at

orders
  id, user_id, status ('pending'|'paid'|'fulfilled'|'failed'|'refunded')
  stripe_payment_intent_id, total_sek, currency, customer_email,
  invoice_number, created_at

order_items
  id, order_id, event_id, category_id
  qty, unit_price_sek, sub_category
  external_ticket_ids (jsonb, filled after upstream purchase)

ticket_deliveries
  id, order_item_id, file_url, delivery_method, delivered_at
```
RLS: events + categories readable by `anon`; orders/items/deliveries scoped to `auth.uid()`; admin via `has_role`.

**3.2 New ticket UI (replaces old listing/checkout)**
- `/sport/event/:id` — event detail page (hero, venue info, kickoff, category picker, "Vad ingår" panel, sticky CTA)
- `/checkout/:orderId` — Kaisen ticket checkout (name, email, phone, optional passport, Stripe payment element)
- `/order/:orderId` — confirmation + ticket download
- `Sportresor`, `TeamPage`, `F1RacePage` get refreshed to read events from DB and link to event-detail pages
- Home's offer carousel becomes data-driven from `events`

**3.3 Mitt Kaisen "Mina biljetter"**
- New tab under `/mitt-kaisen/biljetter`
- Lists orders, lets user re-download tickets, view invoice

**3.4 Mock seeding**
- Seed a handful of events/categories so the entire flow can be clicked through end-to-end before any API work

---

## Phase 4 — Payments & emails

**4.1 Stripe (built-in seamless Payments)**
- Enable via `enable_stripe_payments`
- Edge function `create-checkout-session`: validates cart, reserves seats via a soft hold, creates Stripe session
- Webhook `stripe-webhook`: on `payment_intent.succeeded` mark order `paid`, trigger fulfilment

**4.2 Resend transactional emails**
- Order confirmation (with invoice PDF/HTML link)
- Ticket delivery (file or carrier instructions)
- Refund/cancellation notice
- Auto-reply for inquiries (Phase 2)
- All from `info@kaisengroup.se`, navy templates, no gold

**4.3 Invoicing**
- Reuse existing HTML-invoice pattern, restyled navy
- Auto-generated invoice number per order, downloadable from order detail and Mitt Kaisen

---

## Phase 5 — XS2Event integration

**5.1 Secret**
- Add `XS2EVENT_API_KEY` via the secrets tool

**5.2 Edge function `xs2event-sync`** (cron: hourly for events, daily for tournaments/venues/teams)
- Pulls Premier League, La Liga, Bundesliga, Serie A, F1 — only the leagues/races in our menu
- Upserts into `events` (`date_stop=ge:now()`)
- Does **not** cache tickets (per XS2Event docs — too volatile)

**5.3 Edge function `xs2event-tickets`** (called live from event-detail page)
- `GET /v1/tickets?event_id=…&ticket_status=available&stock:gt:0`
- Groups by `event_id` + `category_id` + `sub_category`
- Returns cheapest ticket per group + party-size-together info
- Server caches response for ~60 s to soften load

**5.4 Edge function `xs2event-purchase`** (called from Stripe webhook on `paid`)
- Reserves + purchases tickets upstream
- Writes `external_ticket_ids` + delivery info onto `order_items` / `ticket_deliveries`
- On upstream failure → mark order `failed`, fire refund, email customer + admin

**5.5 Admin "Beställningar"**
- `/admin/orders` list with status, payment, fulfilment, customer
- Detail view with re-trigger fulfilment, manual refund, resend ticket email

---

## Phase 6 — Launch polish

- SEO: page titles, meta descriptions, JSON-LD `SportsEvent` per event page, sitemap, robots
- Legal: ticket-purchase terms, privacy, cookie banner
- Analytics + error tracking
- Soft launch: one team + one race → expand once stable

---

## What I need from you before starting build mode

Nothing blocking — all decisions are made. Two small confirmations would speed things up:

1. **OK to fully drop the property-rental DB tables in Phase 1.2?** This is irreversible — once dropped, any data in `listings`, `bookings`, `payouts`, etc. is gone. (Demo data only, I assume.)
2. **Do we keep the existing `messages` / `message_threads` tables** for the admin↔customer inbox, or do you want messaging redesigned around orders/inquiries from scratch? My recommendation: **keep them** and just attach threads to orders/inquiries.

Switch to build mode when ready and I'll start with Phase 1.
