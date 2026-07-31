
# Shopify-style admin with live preview

Rebuild `/admin` as a two-pane workspace: editor on the left, live site preview on the right that updates as you type.

## Layout

```text
┌─────────────┬──────────────────────┬──────────────────────────┐
│  Sidebar    │  Editor panel        │  Live preview (iframe)   │
│  (nav)      │  (forms + uploads)   │  Desktop / Tablet / Mobile│
│             │                      │  URL switcher            │
└─────────────┴──────────────────────┴──────────────────────────┘
```

- **Sidebar** (existing): Hem, Hero-banners, Resor/Events, Team, Testimonials, Why-us, FAQ, Sidinnehåll, Bildbibliotek, Menyer, Beställningar, Användare.
- **Editor panel**: form for the selected item, drag-drop image upload (goes to Storage `listing-images` / `email-assets` / new `site-images` bucket), inline image picker from Bildbibliotek.
- **Preview panel**:
  - `<iframe>` pointed at the public route for what you're editing (e.g. editing Hero → `/`, editing a trip → `/resor/:slug`, editing team → `/om-oss`).
  - Device toggle (desktop 1280 / tablet 768 / mobile 390) resizes the iframe.
  - "Open in new tab" + URL bar to preview any route.
  - **Live refresh**: on every form change (debounced 400 ms) → autosave draft → `postMessage` to iframe → iframe refetches. No full reload flicker.

## Real-time mechanism

1. Editor writes to DB (draft or published field) via Supabase.
2. Supabase **Realtime** subscription in the iframe listens on the row/table.
3. On change → component refetches → UI updates instantly. Works for `site_content`, `home_slides`, `events`, `team_members`, `testimonials`, `why_us_cards`, `faqs`.

Fallback for pages not yet wired to Realtime: `postMessage({type:'refresh'})` triggers a soft refetch.

## Draft vs Published (Shopify-style)

Add to editable tables (where not present): `draft_data jsonb`, `published_at timestamptz`.
- Editor saves to `draft_data` continuously (autosave).
- "Publish" button copies draft → live columns.
- Preview iframe has a `?preview=1&token=…` param → when present, components read `draft_data` instead of live columns. Token is a short-lived signed value so only the admin sees drafts.

## Photo management (the core of your ask)

- **Bildbibliotek** (`/admin/media`) becomes the single source: grid, search, tags, replace, delete, copy URL.
- Every image field across admin uses the same **ImagePicker** component: upload new OR pick from library.
- New Storage bucket **`site-images`** (public) for hero/team/marketing images. Existing buckets kept for their current purposes.
- Team page: new `team_members` table (name, role, bio, photo_url, sort_order, published) + `/admin/team` CRUD.
- Trip images: verify `events.image_url` (+ gallery) editable in `/admin/events` with the same picker.

## Scope of this build

**In scope now**
1. New admin shell `AdminWorkspace` with sidebar + editor + resizable live preview iframe + device switcher.
2. Reusable `ImagePicker` + `MediaLibrary` upgrades (drag-drop, replace, tags).
3. `site-images` bucket + RLS.
4. `team_members` table + `/admin/team` editor + public team section reading from it.
5. Realtime subscriptions on `site_content`, `home_slides`, `team_members`, `testimonials`, `why_us_cards`, `faqs`, `events`.
6. Preview token + `?preview=1` support for `site_content` and `home_slides` (proof of concept for draft/publish).

**Out of scope (follow-ups if you want)**
- Draft/publish on every table (start with the two above, expand table-by-table).
- Version history / rollback.
- Multi-admin presence indicators.
- Stripe go-live, XS2 sync, Resend domain verification — separate tracks we already discussed.

## Technical notes

- Preview iframe uses the same origin (`/`) so Supabase auth cookies flow; admin token passed via `postMessage`, never in the URL for prod.
- Iframe sandbox: `allow-scripts allow-same-origin allow-forms`.
- Debounced autosave with optimistic UI; conflict resolution = last-write-wins with a toast if the row changed under you.
- All new tables get the 4-step migration (CREATE → GRANT → RLS → POLICY) with admin-only write, public read where appropriate.

## Deliverable order

1. Migration: `team_members` table, `site-images` bucket, draft columns on `site_content` + `home_slides`.
2. `AdminWorkspace` layout + preview iframe + device switcher.
3. `ImagePicker` component + Bildbibliotek upgrades.
4. Team editor + public team section.
5. Realtime wiring on the listed tables.
6. Preview-token flow for drafts.

Approve and I'll start with the migration.
