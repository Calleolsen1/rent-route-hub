

## Horisontell scrollmeny pa startsidan

Skapar en horisontell scrollbar med resekategorier (liknande Intrepid Travel-exemplet i bilden) som sitter under hero-sektionen och scrollar med sidan. Kategorier lankar till respektive tjanstesida.

### Vad som byggs

En ny komponent `CategoryScrollBar` med horisontellt scrollbara knappar/taggar for era tjanster (Sportresor, Gruppresor, Incoming, Weekendresor, VIP-service, Konferens, Affarsresor). Varje knapp lankar till respektive sida. Baren har:
- Horisontell scroll pa mobil, full bredd pa desktop
- Ikoner bredvid varje kategori
- Subtil skuggning/border for att skilja den fran ovriga sektioner
- Smooth scroll-beteende

### Tekniska steg

1. **Skapa `src/components/home/CategoryScrollBar.tsx`** — ny komponent med en horisontellt scrollbar row av kategori-knappar med ikoner (Plane, Trophy, Users, Sun, Crown, Building, Briefcase). Anvander `overflow-x-auto` med dold scrollbar och `scroll-smooth`. Varje knapp ar en `Link` till tjanstesidan.

2. **Uppdatera `src/pages/Home.tsx`** — importera och placera `CategoryScrollBar` mellan hero-sektionen och stats-sektionen.

