# Back office för Kaisen

Admin delas i två delar med samma inloggning:

- **Hemsidan** (som idag): startsida, banners, innehåll, navigation, team, bilder.
- **Back office** (nytt): kunder, hotell, bokningar, dokument, rapporter.

```text
/admin
 ├─ Hemsida      Översikt · Banners · Innehåll · Navigation · Team · Bilder
 └─ Back office  Kunder · Hotell · Bokningar · Fakturor · Rapporter · Export
```

## Kunder
Kundregister skilt från inloggningskonton: företag/lag, kontaktperson, e-post, telefon,
adress, org.nr, fakturaadress, anteckningar. Sökbar lista, kundkort med alla bokningar,
skickade bekräftelser och fakturor. Befintliga förfrågningar kan kopplas till en kund.

## Hotell
Eget hotellregister: namn, adress, stad, land, kontaktperson, e-post, telefon,
webbplats, anteckningar, bilder. Väljs direkt när en bokning skapas.

## Bokningar
En bokning = en resa för en kund, med resdatum (avresa/hemkomst), antal resenärer,
destination och status (utkast, bekräftad, betald, genomförd, avbokad).

Varje bokning har rader av fyra typer:
- **Hotell** – hotell ur registret, in-/utcheckning, rumstyp, antal rum
- **Flyg** – manuellt: flygbolag, flightnummer, sträcka, datum/tid, bokningsreferens
- **Biljetter** – match/event, kategori, antal
- **Transfer** – sträcka, datum, fordon

Varje rad har inköpspris och försäljningspris, så marginalen räknas fram per rad och
per bokning. Resenärslista per bokning (namn, födelsedatum, passuppgifter) för
flyg- och hotellunderlag.

## Bekräftelse och faktura
- **Bekräftelse**: knapp på bokningen skapar ett resedokument med hotell, flyg,
  biljetter och transfer, och mailar det till kunden (samma e-postuppsättning som idag).
- **Faktura**: fakturanummer i löpande serie, förfallodatum, momsrad, delbetalningar
  och betalstatus. Skickas som mail med PDF-vänlig länk. Manuell markering "betald"
  plus automatisk status när kortbetalning används.
- Allt som skickas loggas på kundkortet med tidpunkt.

## Rapporter
- **Avresekalender** – vilka som reser vecka för vecka framåt
- **Såld volym framåt** – bokat värde per månad och destination
- **Vinst** – försäljning minus inköp per bokning, kund, destination och månad,
  med möjlighet att fylla i/justera inköpspriser direkt i listan
- **Obetalda fakturor** – förfallna och kommande
- Alla rapporter går att exportera till Excel/CSV.

## Bokföring (Spiris) – förberedelse nu, koppling senare
Fakturor och betalningar får de fält bokföringen kräver (kundnummer, fakturanummer,
momssats, konto, betaldatum) och en exportfil. Själva kopplingen till Spiris görs när
vi har åtkomst och inloggningsuppgifter till deras gränssnitt.

## Teknisk plan
Nya tabeller i Lovable Cloud, alla admin-låsta via `has_role(auth.uid(),'admin')`
med GRANT till `authenticated`/`service_role`:

- `customers`, `customer_contacts`
- `hotels`
- `bookings`, `booking_items` (typ: hotel/flight/ticket/transfer, `cost_sek`, `sale_sek`),
  `booking_travellers`
- `booking_documents` (bekräftelser/fakturor, mailstatus)
- `invoices`, `invoice_items`, `invoice_payments` (löpande nummerserie via sequence)

Vyer/funktioner för rapporter: `booking_margin_view`, `upcoming_departures_view`,
`sales_forecast_view`.

Edge functions:
- `send-booking-confirmation` – renderar HTML och skickar via Resend
- `send-booking-invoice` – faktura-HTML + betalningslänk, återanvänder befintlig
  Stripe-uppsättning
- `export-accounting` – CSV/SIE-export som Spiris kan läsa

Frontend: ny `/admin/backoffice`-sektion med sidor Kunder, Hotell, Bokningar,
Fakturor, Rapporter. Befintliga sidor lämnas orörda; menyn grupperas i två rubriker.

## Ordning för bygget
1. Databas (kunder, hotell, bokningar, rader, resenärer, fakturor)
2. Kunder + hotell-CRUD
3. Bokningsvy med rader, priser och resenärer
4. Bekräftelse + faktura via mail
5. Rapporter och export
6. Spiris-koppling när uppgifter finns
