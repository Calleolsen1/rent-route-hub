
# Automatisk kontoskapning med e-postutskick — Mitt Kaisen

## Vad vi bygger

När admin skapar ett konto för en kund i Mitt Kaisen-systemet ska följande hända automatiskt:
1. Kontot skapas i systemet
2. Kunden får ett välkomstmejl med sina inloggningsuppgifter
3. Kunden kan sedan logga in via `/mitt-kaisen` och använda "Glömt lösenord" för att sätta eget lösenord

---

## Flöde steg för steg

```text
Admin skapar kund (namn + e-post)
           ↓
Backend-funktion skapar konto med ett temporärt lösenord
           ↓
Välkomstmejl skickas automatiskt till kunden
           ↓
Kunden loggar in via /mitt-kaisen
           ↓
Kunden klickar "Glömt lösenord" → Nytt lösenord via e-post
```

---

## Teknisk plan

### 1. Ny Edge Function: `create-client-account`

En backend-funktion som admin anropar för att skapa ett kundkonto. Den:
- Skapar ett Supabase Auth-konto med ett slumpmässigt temporärt lösenord
- Sätter korrekt roll (`guest`) i `user_roles`-tabellen
- Skickar ett välkomstmejl (via Supabase inbyggda SMTP) med:
  - Kundens namn
  - Inloggningslänk till `/mitt-kaisen`
  - Instruktion om att använda "Glömt lösenord" för att sätta eget lösenord

```typescript
// supabase/functions/create-client-account/index.ts
// Tar emot: { email, first_name, last_name }
// Skapar konto → tilldelar roll → skickar välkomstmejl
```

### 2. Admin UI — Skapa kundkonto

Ett nytt formulär/dialog i admin-panelen (under Användarhantering) med fälten:
- Förnamn
- Efternamn
- E-postadress
- Knapp: "Skapa konto & skicka välkomstmejl"

### 3. Mitt Kaisen Login-sida (`/mitt-kaisen`)

En ny snygg inloggningssida med Kaisens branding som innehåller:
- E-post + lösenordsfält
- Länk: "Glömt lösenord?" → skickar reset-mail via Supabase
- Tydlig text: "Fått inloggningsuppgifter? Logga in här"

Separeras helt från den vanliga login-dialogen.

### 4. Uppdatera Glömt Lösenord-flödet (`/forgot-password`)

Det befintliga `/forgot-password` fungerar redan men behöver:
- Översättas till svenska
- Ändras så det skickar ett riktigt reset-mail (använder `supabase.auth.resetPasswordForEmail`)
- Redirect-URL pekas till `/mitt-kaisen/aterstall-losenord`
- En ny sida `/mitt-kaisen/aterstall-losenord` skapas där kunden sätter nytt lösenord

### 5. Mitt Kaisen Layout & Dashboard

Ny layout (`MittKaisenLayout`) som ersätter GuestLayout för `/mitt-kaisen/*`-rutter:
- Logo: "Mitt Kaisen" (mörkblå/guld)
- Navigering på svenska: Översikt, Mina Resor, Fakturor, Min Profil, Logga ut
- Återanvänder befintliga gästsidor men med ny URL-struktur

---

## Filer som skapas / ändras

| Fil | Åtgärd | Beskrivning |
|---|---|---|
| `supabase/functions/create-client-account/index.ts` | Ny | Backend-funktion som skapar konto + skickar mejl |
| `src/pages/MittKaisenLogin.tsx` | Ny | Branded inloggningssida |
| `src/pages/MittKaisenResetPassword.tsx` | Ny | Sidan där kunden sätter nytt lösenord |
| `src/layouts/MittKaisenLayout.tsx` | Ny | Layout med Kaisens branding |
| `src/pages/mitt-kaisen/Dashboard.tsx` | Ny | Välkomstsida för inloggad kund |
| `src/components/admin/CreateClientDialog.tsx` | Ny | Admin-dialog för att skapa kundkonto |
| `src/components/admin/UserManagement.tsx` | Ändras | Lägg till "Skapa kund"-knapp |
| `src/App.tsx` | Ändras | Lägg till `/mitt-kaisen/*`-rutter |
| `src/pages/ForgotPassword.tsx` | Ändras | Översätt till svenska + fixa reset-flödet |

---

## Välkomstmejl — innehåll

Mejlet som skickas automatiskt ser ut såhär:

```
Ämne: Välkommen till Mitt Kaisen — Din Reseportal

Hej [Förnamn],

Ditt konto hos Kaisen Travel är nu skapat.

Logga in här: [länk till /mitt-kaisen]

Eftersom detta är ditt första inlogg rekommenderar vi att du 
klickar på "Glömt lösenord?" för att sätta ett eget lösenord.

E-post: [email]

Välkommen ombord!
Kaisen Travel
```

---

## Säkerhet

- Admin-funktionen kräver service role key (körs server-side, aldrig i webbläsaren)
- Kunden tilldelas `guest`-roll via `user_roles`-tabellen (inte via profil — följer säkerhetskraven)
- Reset-lösenord-flödet använder Supabase inbyggda säkra token-system
- Mitt Kaisen-rutter är skyddade — omdirigerar till `/mitt-kaisen` om inte inloggad
