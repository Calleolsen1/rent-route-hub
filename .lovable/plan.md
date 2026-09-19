# Startsidan utan biljett-API

Idag hämtas korten under "Aktuella resor" från biljettdatabasen. Utan API blir raden nästan tom - bara två fasta kort (Lissabon, Mallorca). Lösningen är att ni själva styr korten från admin, och att sidan aldrig kan se tom ut.

## Så blir det

**Ny adminsida: "Resor på startsidan"** (under Hemsidan i menyn)

Där lägger du upp resekort med:
- Bild (från bildbiblioteket eller uppladdad)
- Titel, t.ex. "Träningsläger Valencia"
- Etikett (Fotboll, Grupp, Konferens, F1, Träningsläger ...)
- Datumtext, t.ex. "Maj 2027" eller "5-9 maj 2027"
- Längd, t.ex. "5 dagar"
- Pris från (valfritt) - "Från 8 200 kr"
- Länk (till en sida på hemsidan eller direkt till förfrågningsformuläret)
- Knapptext, t.ex. "Se resan" eller "Gör förfrågan"
- Två markeringar: **Ny** och **Populär** - de styr flikarna "Nya resor" och "Populära resor"
- På/av samt ordning (dra eller sortering med nummer)

**Alltid full rad**
- Korten visas i den ordning du satt.
- Om du har färre än 3 aktiva kort fylls raden på med de fasta förfrågningskorten, så det aldrig ser glest ut.
- Flikarna visar alltid något: är inget markerat som "Ny" eller "Populär" visas de senast tillagda i stället för en tom yta.

**När API:t kopplas på senare**
Biljettevenemangen läggs in automatiskt i samma rad tillsammans med dina egna kort - inget behöver byggas om.

## Rutin för att hålla det färskt
- Markera nya kort som "Ny" - de hamnar först och syns under "Nya resor".
- Resor med passerat datum tonas automatiskt bort från startsidan så gamla datum aldrig ligger kvar.

## Tekniskt
- Ny tabell `home_trips` i Lovable Cloud: image_url, title, tag, date_label, days_label, price_from_sek, href, cta_label, is_new, is_popular, is_active, sort_order, valid_until. Publik läsning (is_active), skrivning låst till admin via `has_role(auth.uid(),'admin')`, med GRANT för anon/authenticated/service_role.
- Ny sida `src/pages/admin/HomeTrips.tsx` + rutt `/admin/hemsidan/resor`, byggd på samma mönster som Banners.tsx (ImagePicker, autosave på blur, sonner-toast).
- `src/pages/Home.tsx`: hämtar `home_trips`, slår ihop med ev. events-rader och fyller på med `inquiryOffers` upp till minst 3 kort; flikfiltren använder is_new/is_popular med fallback till de senaste korten; rader med passerat `valid_until` filtreras bort.
