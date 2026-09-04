# Uppdatera tre lägerkort på Träningsläger-sidan

Tre ändringar i `src/pages/services/Traningslager.tsx` (camps-arrayen).

## 1. Byt ut Algarve, Portugal → Valencia, Spanien (Parador de El Saler)

- **Plats:** Valencia, Spanien
- **Rubrik:** Träningsläger för lag med ambitioner
- **Text:** "Parador de El Saler ligger naturskönt mellan Albufera naturpark och Medelhavet, ca 18 km från Valencia. Egen naturgräsplan i perfekt skick samt training center med gym och spa. Klubbar som Valencia CF, Levante UD och UD Las Palmas lägger ofta sina läger här." (något komprimerad för att passa kortet)
- **Pris:** behåll "från 7 500 kr / person" tills vidare
- **Bild:** hämta 1–2 riktiga bilder från Parador de El Salers webbplats (parador.es). Om ingen bild går att hämta p.g.a. upphovsrätt/teknik, generera en realistisk ersättningsbild och flagga det för dig.

## 2. Uppdatera texten för Torremolinos (simning)

- Behåll bild, plats och rubrik ("50-metersbassäng under öppen himmel")
- **Ny text:** "Sol, värme och hårda träningspass i uppvärmd 50-metersbassäng — ett simläger i Torremolinos är den perfekta kombinationen av träning och gemenskap. Med bra träningsmöjligheter, härligt klimat och roliga aktiviteter får simmarna chansen att utvecklas både i bassängen och som lag."

## 3. Uppdatera Belek → Antalya, Turkiet (Ramada Resort)

- **Plats:** Antalya, Turkiet
- **Rubrik:** behåll "Allt-inkluderat i förstklassig miljö"
- **Text:** "Ramada Resort är ett mycket prisvärt och högkvalitativt alternativ för träningsläger, där hög hotellstandard kombineras med riktigt fina fotbollsplaner och ett fullt utrustat gym & spa. Perfekt för lag som söker maximalt sportsligt värde och hög komfort."
- **Pris:** ändra till "från 5 900 kr / person"
- **Bild:** bild saknas — jag genererar en realistisk bild (hotellanläggning med fotbollsplaner) eller hämtar från Ramada Resorts webbplats om möjligt. Du kan byta den själv senare.

## Tekniskt

- Bilder hämtas via curl eller genereras, sparas i `src/assets/` (som Lovable-asset om filerna är stora)
- Importeras i `Traningslager.tsx` och ersätter befintliga kortdata
- Ingen backend- eller databasändring behövs
