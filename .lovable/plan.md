
## Problem Analysis

The Overview dashboard (Översikt) shows all zeros because:

**KPI Cards** — source data from `trip_groups` + `trip_members`, which are empty. The actual trip data is in the `trips` table.

**Kommande resor** — queries `trips` with `start_date >= today`, but one existing trip has start_date `2026-02-18` (yesterday) which is now filtered out, and the other has `null` start_date, so neither shows up.

**Senaste fakturor** — queries `trip_members` for invoice_sent_at entries — also empty since no groups exist.

**Gruppsummering** — shows trip groups which is empty.

The core issue: the system has two separate concepts that need to be unified on the Overview:
- **Individual trips** (in `trips` table) — where the real data lives
- **Group trips** (in `trip_groups` + `trip_members`) — currently empty

---

## Plan

### 1. Fix "Kommande resor" (Upcoming Trips)

**File:** `src/pages/admin/Overview.tsx`

Change the query to include trips with `null` start_date OR future dates:
- Remove the strict `gte("start_date", today)` filter — or make it `OR start_date IS NULL`
- Show up to 5 trips ordered by `start_date` ascending (nulls last)

```ts
// Before:
.gte("start_date", new Date().toISOString().split("T")[0])

// After — include null dates and use status filter instead:
.in("status", ["upcoming", "ongoing"])
.order("start_date", { ascending: true, nullsFirst: false })
.limit(5)
```

### 2. Fix KPI Cards to use the `trips` table

**File:** `src/pages/admin/Overview.tsx`

Currently, all 4 KPI values are derived from `trip_groups`. Since trips live in the `trips` table, remap as follows:

| KPI | Current source | Fixed source |
|---|---|---|
| Aktiva grupper | `trip_groups.length` | Count of trips with status `upcoming` or `ongoing` |
| Bekräftade resenärer | `trip_members` with status `confirmed` | Count of trips with `payment_status = paid` vs total |
| Fakturor skickade | `trip_members.invoice_sent_at` | Count of trips with `invoice_sent_at IS NOT NULL` |
| Utestående belopp | Sum of invoice_amount - paid | Sum of `price_total` where `payment_status != paid` |

Add a new query for trips-based KPIs:
```ts
const { data: tripsData } = useQuery({
  queryKey: ["admin-trips-kpi"],
  queryFn: async () => {
    const { data } = await supabase
      .from("trips")
      .select("id, status, payment_status, price_total, price_currency, invoice_sent_at");
    return data ?? [];
  }
});
```

Then derive KPIs:
- **Aktiva resor** = trips with status `upcoming` or `ongoing`
- **Betalda resor** = `X / Y` format — paid vs total
- **Fakturor skickade** = count of `invoice_sent_at IS NOT NULL`
- **Utestående belopp** = sum of `price_total` where payment_status = `unpaid` or `partial`

### 3. Fix "Senaste fakturor" section

**File:** `src/pages/admin/Overview.tsx`

Change the query from `trip_members` to `trips` — showing trips that have been invoiced:
```ts
const { data: recentInvoices } = useQuery({
  queryKey: ["admin-recent-invoices"],
  queryFn: async () => {
    const { data } = await supabase
      .from("trips")
      .select("id, title, destination, invoice_sent_at, price_total, price_currency, payment_status, guest_user_id, profiles:profiles(first_name, last_name, email)")
      .not("invoice_sent_at", "is", null)
      .order("invoice_sent_at", { ascending: false })
      .limit(6);
    return data ?? [];
  }
});
```

Render each item with customer name, trip name, amount, and paid/unpaid icon.

### 4. Replace "Gruppsummering" with "Resestatus" summary

**File:** `src/pages/admin/Overview.tsx`

Since `trip_groups` is empty, replace "Gruppsummering" with a **"Alla resor"** summary that lists all trips with their status and payment state. Each row shows:
- Trip title + destination
- Status badge (Kommande / Pågående / Avslutad)
- Payment badge (Obetald / Betald)
- Click → navigates to `/admin/trips`

### 5. Add auto-refresh with React Query `refetchInterval`

**File:** `src/pages/admin/Overview.tsx`

Add `refetchInterval: 30_000` (30 seconds) to all queries so the dashboard self-updates without needing a page reload.

---

## Files to Edit

- `src/pages/admin/Overview.tsx` — complete rewrite of data sources and KPI calculations to use the `trips` table instead of (empty) `trip_groups`. All UI structure stays the same.
