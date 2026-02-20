
# Arrangörsportal – Ombyggnad + Fakturering

## Vad vi bygger

En komplett ombyggnad av host-panelen till en **svensk arrangörsportal** med fyra sektioner:

1. **Översikt** – Välkomstdashboard med gruppsummering
2. **Min grupp** – Resenärslista + hotellrumfördelning
3. **Fakturering** – Dedikerad fakturasida med historik och utskick
4. **Meddelanden** – Inbox (befintlig)

---

## Filöversikt

| Fil | Åtgärd |
|-----|--------|
| `src/components/host/HostSidebar.tsx` | Bygg om navigation till svenska + arrangörsmenyn |
| `src/layouts/HostLayout.tsx` | Svenska sidtitlar, ta bort irrelevant logik |
| `src/pages/host/Dashboard.tsx` | Bygg om till arrangörsöversikt på svenska |
| `src/pages/host/GroupView.tsx` | Ny sida – Min grupp (resenärer + hotellrum) |
| `src/pages/host/InvoicingView.tsx` | Ny sida – Fakturering |
| `src/components/host/HostPageHeader.tsx` | "Logout" → "Logga ut" |
| `src/App.tsx` | Lägg till /host/group och /host/invoicing routes |

---

## 1. Sidebar – `HostSidebar.tsx`

Ny navigation (på svenska):

```
Översikt       →  /host/dashboard   (LayoutGrid)
Min grupp      →  /host/group       (Users)
Fakturering    →  /host/invoicing   (FileText)
Meddelanden    →  /host/inbox       (Inbox)
──────────────────────────────────
Logga ut
```

Tas bort från nav: Listings, Bookings, Payouts, Earnings Report.
Logotyp: Byt "Rentely" till arrangörsvarumärket (behålls som prop, sätts till "Kaisen" i HostLayout).
"Log Out" → "Logga ut".

---

## 2. Layout – `HostLayout.tsx`

- Byt sidtitlar till svenska:
  - `/host/dashboard` → "Översikt"
  - `/host/group` → "Min grupp"
  - `/host/invoicing` → "Fakturering"
  - `/host/inbox` → "Meddelanden"
- Ta bort "Become a Host"-blocket (irrelevant för arrangörer)
- Ändra logoText från `"Rentely"` till `"Kaisen"`
- Ta bort `shouldHideHeader` för create/edit-listing (inte aktuellt längre)

---

## 3. Dashboard – `src/pages/host/Dashboard.tsx`

Helt ombyggd arrangörsöversikt. Tar bort all earnings/listings-data. Visar istället:

**Välkomst-sektion:** Hej [namn]! + gruppresans namn och destination (hämtat från arrangörens `trip_groups`)

**Statistik-kort (4 stycken):**
- Antal resenärer i gruppen
- Antal bekräftade
- Fakturor skickade
- Nästa avresedag

**Genvägar:**
- Knapp "Se gruppen" → /host/group
- Knapp "Skicka faktura" → /host/invoicing

Data hämtas via:
```
supabase.from("trip_groups").select("*, trip_members(*)").eq("organizer_user_id", user.id)
```

---

## 4. Ny sida – `src/pages/host/GroupView.tsx`

Återanvänder logiken från `GroupTripView`-komponenten men som en hel sida i host-layouten. Visar:

**Grupplista per grupp:**
- Gruppnamn, destination
- Tabell med alla resenärer: namn, e-post, status (Inbjuden/Bekräftad/Avbokad)
- Fakturastatus per rad
- Checkbox per person för selektiv fakturering

**Hotellrumfördelning (ny sektion per grupp):**
- Tabell: Deltagare | Hotell | Incheckning | Utcheckning | Bekräftelse
- Data hämtas från varje deltagares enskilda `trips`-rad

Knapparna "Skicka faktura" öppnar InvoiceDialog (samma som i GroupTripView).

---

## 5. Ny sida – `src/pages/host/InvoicingView.tsx`

En dedikerad fakturasida med tre sektioner:

### Sektion A: Skicka ny faktura
- Välj grupp (dropdown om arrangör har flera grupper)
- Välj mottagare: Alla / Specifika (checkboxar)
- Belopp (SEK)
- Meddelande
- Knapp: "Skicka faktura"

### Sektion B: Fakturastatus
En tabell som visar alla gruppmedlemmar med:
- Namn | E-post | Belopp | Datum skickat | Status
- Filtrera per grupp
- Ikoner: ✓ Skickad / ⏳ Ej skickad

### Sektion C: Historik
Senaste fakturor skickade, sorterade efter datum. Varje rad: person, belopp, datum.

All data hämtas från `trip_members.invoice_sent_at`, `invoice_amount`, `invoice_currency`, `invoice_notes`.

---

## 6. App.tsx – Nya routes

Lägg till under `/host`:
```tsx
<Route path="group" element={<GroupView />} />
<Route path="invoicing" element={<InvoicingView />} />
```

Befintliga routes (listings, bookings, payouts, earnings-report) lämnas kvar tekniskt men syns inte i nav.

---

## 7. HostPageHeader – "Logout" → "Logga ut"

Liten ändring i dropdown-menyn.

---

## Flöde

```
Arrangör loggar in
        ↓
Översikt – ser gruppens status + snabbkort
        ↓
Min grupp – ser alla resenärer, hotellrum
        ↓
Fakturering – skickar fakturor, ser historik
```
