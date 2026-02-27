
## Skapa 3 testkonton för din pappa

Systemet har redan demokonton (admin@demo.com, host@demo.com, guest@demo.com) men de är för intern testning. Vi skapar tre separata konton direkt i databasen med hjälp av Supabase service role — på samma sätt som admin-panelens "Skapa kundkonto" fungerar, men vi gör det direkt via ett SQL-migration-script som körs en gång.

### De 3 kontona som skapas

| Roll | E-post | Tillfälligt lösenord |
|------|--------|---------------------|
| Admin | papa.admin@kaisengroup.se | KaisenDemo2025! |
| Arrangör (Host) | papa.host@kaisengroup.se | KaisenDemo2025! |
| Resenär (Guest) | papa.guest@kaisengroup.se | KaisenDemo2025! |

Din pappa kan byta lösenord när som helst via "Glömt lösenord?" på inloggningssidan.

### Tekniska steg

1. **Skapa en ny edge function** `create-demo-accounts` som körs en gång med service role key och:
   - Skapar tre användare i auth-systemet med `admin.createUser()` (med `email_confirm: true` så att de kan logga in direkt utan att behöva klicka på en länk)
   - Skapar profiler i `profiles`-tabellen med namn och e-post
   - Tilldelar rätt roller i `user_roles`-tabellen: `admin`, `host`, och `guest`

2. **Kör edge-funktionen en gång** direkt via `curl_edge_functions` för att skapa kontona

3. **Bekräftar** att kontona är skapade genom att verifiera i databasen

### Viktigt att notera

- Kontona skapas med ett fördefinierat lösenord och `email_confirm: true` — din pappa kan logga in direkt utan att behöva klicka på någon länk i ett välkomstmejl
- Kontona är riktiga konton (inte demo-konton) och lagras permanent i systemet
- Din pappa kan sedan testa alla tre rollerna och se hur varje vy ser ut
- Inloggningssida för admin/host/guest: `kaisengroup.se/mitt-kaisen/login`

### Inloggningsinstruktioner att skicka till din pappa

```
Admin-konto:   papa.admin@kaisengroup.se  /  KaisenDemo2025!
Arrangör:      papa.host@kaisengroup.se   /  KaisenDemo2025!
Resenär:       papa.guest@kaisengroup.se  /  KaisenDemo2025!

Logga in på: kaisengroup.se/mitt-kaisen/login
```
