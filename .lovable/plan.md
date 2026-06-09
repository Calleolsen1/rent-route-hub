## Plan: Deploya alla edge functions

Kör `supabase--deploy_edge_functions` med samtliga 21 funktioner i `supabase/functions/`:

**XS2 integration (4):**
- xs2-get-event-tickets
- xs2-reserve
- xs2-renew-reservation
- xs2-sync

**Betalningar (4):**
- create-checkout
- create-quote-checkout
- payments-webhook
- sync-stripe-price

**Fakturor & quotes (4):**
- get-invoice
- send-invoice
- send-group-invoice
- send-quote-email

**Konton & admin (5):**
- create-client-account
- create-demo-accounts
- admin-check-config
- admin-refund-order
- admin-send-message

**Övrigt (4):**
- send-email
- submit-inquiry
- get-ticket-prices

## Efter deploy
1. Kontrollera deploy-output — alla ska visa "deployed".
2. Probe `/admin/diagnostics` så XS2_API_KEY + XS2_BASE_URL visar gröna bockar och `xs2-get-event-tickets` returnerar ok.
3. Rapportera tillbaka resultatet till dig så du kan säga åt Claude "klart, kör vidare".

## Workflow framåt för Claude Code
- Frontend → git push, Lovable plockar upp.
- Migrations → be mig köra `supabase--migration` eller paste i SQL editor.
- Edge functions → be mig köra deploy (du kan inte själv köra `npx supabase functions deploy` mot ett Lovable-managed projekt utan service-token).
