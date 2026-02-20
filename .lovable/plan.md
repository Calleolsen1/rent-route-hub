
# Arrangörsfunktionen – Plan

## Vad vi bygger

En **gruppresa-funktion** där en person utses till arrangör för en resa. Arrangören kan se hela resegruppen och skicka fakturor/påminnelser till deltagarna. Admin kan också hantera allt detta centralt.

---

## Konceptet i tre delar

### 1. Gruppresor & arrangörsutnämning
En resa kan kopplas till flera resenärer (en grupp). En av dem utses till **arrangör** (organizer). Arrangören har utökade rättigheter för just den resan.

### 2. Arrangörsvyn (gäst-portal)
Arrangören ser en ny flik "Min grupp" med hela resegruppen och kan skicka fakturainformation/påminnelser till deltagarna.

### 3. Adminvyn
Admin kan skapa gruppresor, lägga till deltagare, utse arrangör och skicka fakturor till alla eller enskilda deltagare.

---

## Databasändringar

### Ny kolumn: `trips.group_id`
Resor som tillhör samma grupp kopplas ihop med ett gemensamt `group_id` (UUID). Alternativt: en separat `trip_groups`-tabell.

Vi väljer en **`trip_groups`-tabell** + `trip_members`-tabell för att hantera många-till-många relationer:

```text
trip_groups
├── id (uuid, PK)
├── name (text)             -- gruppresans namn, t.ex. "Barcelona FC 2025"
├── trip_id (uuid, FK → trips) -- mallresan (admin-skapad)
├── organizer_user_id (uuid)   -- vald arrangör
├── created_by_admin_id (uuid)
├── created_at, updated_at

trip_members
├── id (uuid, PK)
├── group_id (uuid, FK → trip_groups)
├── user_id (uuid)             -- gästens user_id
├── trip_id (uuid, FK → trips) -- personens enskilda resa
├── status (text)              -- 'invited', 'confirmed', 'cancelled'
├── invoice_sent_at (timestamp, nullable)
├── invoice_amount (numeric, nullable)
├── invoice_currency (text, default 'SEK')
├── invoice_notes (text, nullable)
├── created_at
```

**RLS-policies:**
- Gäster: kan läsa `trip_groups` och `trip_members` för grupper de är med i
- Arrangör: kan läsa alla medlemmar i sina grupper (via `organizer_user_id`)
- Admin: full CRUD

### Kolumn på `trips`: `group_id` (nullable FK → trip_groups)
Varje enskild resa kan kopplas till en grupp.

---

## Ny Edge Function: `send-group-invoice`

En backend-funktion som skickar faktura/notifiering till en eller flera deltagare. Funktionen:
1. Verifierar att anroparen är admin **eller** arrangör för gruppen
2. Uppdaterar `trip_members.invoice_sent_at`
3. (I demo-läge) loggar bara till konsolen – ingen riktig e-post i denna iteration

---

## Admingränssnitt – Ändringar i `AdminTripsManagement`

**Ny flik "Gruppresor"** i admin-sidan:
- Lista över alla `trip_groups`
- Skapa ny gruppresa: välj deltagare (sök bland kunder), utse arrangör, sätt fakturabelopp
- Per grupp: se alla medlemmar, status, om faktura är skickad
- Knappar: "Skicka faktura till alla", "Skicka faktura till vald person"

**Faktura-dialog:**
- Belopp (SEK)
- Meddelande/anteckning
- Välj: alla deltagare eller specifika

---

## Gästgränssnitt – Arrangörsvyn

Om inloggad användare är arrangör för en aktiv grupp → ny flik **"Min grupp"** visas i `Trips.tsx`-flikarna.

Fliken visar:
- Gruppresans namn och destination
- Lista över alla deltagare med namn, e-post, status
- Fakturastatus per person (skickad / ej skickad)
- Knapp: "Skicka faktura" → öppnar dialog (anropar `send-group-invoice`)

---

## Ändringar i filer

### Nya filer
| Fil | Syfte |
|-----|-------|
| `supabase/migrations/xxx_trip_groups.sql` | Skapar `trip_groups` + `trip_members` tabeller med RLS |
| `supabase/functions/send-group-invoice/index.ts` | Edge function för att "skicka" faktura |
| `src/components/admin/TripGroupsManagement.tsx` | Admin-UI för gruppresor |
| `src/components/guest/GroupTripView.tsx` | Arrangörsvyn i gäst-portalen |

### Ändrade filer
| Fil | Ändring |
|-----|---------|
| `src/components/admin/AdminTripsManagement.tsx` | Lägg till "Gruppresor"-flik |
| `src/pages/guest/Trips.tsx` | Lägg till "Min grupp"-flik villkorligt om arrangör |
| `supabase/config.toml` | Registrera ny edge function |

---

## Flöde steg för steg

```text
ADMIN-FLÖDE:
1. Admin skapar enskilda resor per resenär (befintlig funktion)
2. Admin skapar en "Gruppresa" → väljer vilka trip_id:n/users som ingår
3. Admin utser en av deltagarna som arrangör
4. Admin kan skicka faktura direkt från admin-panelen till alla/valda

ARRANGÖRS-FLÖDE:
1. Arrangören loggar in → ser "Min grupp"-flik
2. Ser hela gruppen med status
3. Kan skicka faktura/påminnelse till en eller alla deltagare
4. Faktura-status uppdateras i realtid

GÄST-FLÖDE (ej arrangör):
1. Ser sina egna resor som vanligt
2. Ser inte "Min grupp"-fliken
```

---

## Vad som INTE byggs i denna iteration
- Riktig e-postleverans (det kräver en e-posttjänst som Resend/SendGrid) – fakturan loggas och status uppdateras men inget mejl skickas på riktigt ännu
- Betalningsintegration – faktura är informativ, inte en riktig betalningslänk

---

## Sammanfattning av ordning

1. **Databas**: Skapa `trip_groups` + `trip_members` med RLS
2. **Edge Function**: `send-group-invoice`  
3. **Admin-UI**: `TripGroupsManagement` med ny flik i `AdminTripsManagement`
4. **Gäst-UI**: `GroupTripView` + villkorlig flik i `Trips.tsx`
