import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Integritetspolicy() {
  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="bg-cream py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <p className="text-[11px] sm:text-xs eyebrow text-primary uppercase mb-3 font-sans">
            Juridiskt
          </p>
          <h1 className="font-display text-4xl md:text-5xl mb-2">Integritetspolicy</h1>
          <p className="text-sm text-muted-foreground">Senast uppdaterad: {new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Stockholm" })}</p>
        </div>
      </section>

      <section className="py-12 bg-background">
        <div className="container mx-auto px-4 max-w-3xl space-y-10">
          <Section title="1. Personuppgiftsansvarig">
            <p>
              KAISEN Travel Group AB ("KAISEN", "vi") är personuppgiftsansvarig för behandlingen av personuppgifter på{" "}
              <code>kaisengroup.se</code>. Kontakta oss på{" "}
              <a href="mailto:info@kaisengroup.se" className="underline">info@kaisengroup.se</a> för frågor om denna policy eller dina rättigheter.
            </p>
          </Section>

          <Section title="2. Vilka uppgifter vi samlar in">
            <p>När du använder vår webbplats kan vi samla in följande uppgifter om dig:</p>
            <ul>
              <li><strong>Kontaktuppgifter</strong> - namn, e-postadress, telefonnummer som du anger i förfrågningsformulär eller vid beställning.</li>
              <li><strong>Beställningsuppgifter</strong> - vilka biljetter, paket eller resor du har bokat, fakturahistorik och betalningsstatus (men inte kortuppgifter, som hanteras av Stripe).</li>
              <li><strong>Kontoinformation</strong> - om du skapar ett konto i Mitt KAISEN: lösenord (hashad), profilbild och inställningar.</li>
              <li><strong>Tekniska uppgifter</strong> - IP-adress, webbläsartyp och cookies (se avsnitt 5).</li>
            </ul>
          </Section>

          <Section title="3. Hur vi använder uppgifterna">
            <p>Vi behandlar dina personuppgifter för att:</p>
            <ul>
              <li>Genomföra köp, leverera biljetter och fullgöra avtalet med dig.</li>
              <li>Skicka orderbekräftelser, fakturor och leveransinformation.</li>
              <li>Hantera kundsupport och svara på förfrågningar.</li>
              <li>Förbättra vår webbplats och våra tjänster.</li>
              <li>Uppfylla rättsliga skyldigheter (bokföringslag, GDPR).</li>
            </ul>
            <p>
              Den rättsliga grunden är i första hand <strong>fullgörande av avtal</strong> (köp, beställning) och <strong>berättigat intresse</strong> (drift och förbättring av tjänsten).
            </p>
          </Section>

          <Section title="4. Tredje parter och biträdesavtal">
            <p>Vi delar uppgifter med följande underleverantörer som är personuppgiftsbiträden:</p>
            <ul>
              <li><strong>Stripe</strong> (USA / EU) - kortbetalningar och fakturering.</li>
              <li><strong>football-data.org</strong> (EU) - matchdata; vi hämtar speltider och lag, inga personuppgifter lämnas.</li>
              <li><strong>Resend</strong> (USA) - utskick av e-post (orderbekräftelse, lösenordsåterställning).</li>
              <li><strong>Supabase</strong> (EU) - databas, autentisering och fillagring.</li>
              <li><strong>Cloudflare</strong> (USA / EU) - botskydd via Turnstile på formulär (IP-adress och webbläsarsignaler behandlas tillfälligt).</li>
              <li><strong>Sentry</strong> (USA) - felövervakning i frontend (anonym sessions-id, webbläsarstack och URL vid fel).</li>
            </ul>
            <p>
              Vi har ingått personuppgiftsbiträdesavtal (DPA) med samtliga och tillämpar standardavtalsklausuler för överföringar utanför EU/EES.
            </p>
          </Section>

          <Section title="5. Cookies">
            <p>
              Vi använder cookies som är nödvändiga för att webbplatsen ska fungera (inloggning, kundvagn, betalsession). Vid första besöket frågar vi om ditt samtycke till valfria cookies via vår cookie-banner. Du kan när som helst ändra ditt val via länken längst ner på sidan.
            </p>
            <p>
              Nödvändiga cookies omfattar bland annat session-cookies för Mitt KAISEN-inloggning, Stripe-betalsessions-cookies och vårt eget cookie-samtyckes-val (sparat i localStorage). Vi använder för närvarande inga marknadsförings- eller analyscookies.
            </p>
          </Section>

          <Section title="6. Lagringstid">
            <p>
              Beställningsuppgifter sparas i sju (7) år enligt bokföringslagen. Förfrågningar som inte leder till köp sparas i 24 månader. Konton i Mitt KAISEN sparas så länge kontot är aktivt. Du kan när som helst begära radering enligt avsnitt 7.
            </p>
          </Section>

          <Section title="7. Dina rättigheter">
            <p>Enligt GDPR har du rätt att:</p>
            <ul>
              <li>Begära <strong>tillgång</strong> till de uppgifter vi har om dig.</li>
              <li>Få felaktiga uppgifter <strong>rättade</strong>.</li>
              <li>Begära <strong>radering</strong> ("rätten att bli glömd") om vi inte längre har rättslig grund att behandla dem.</li>
              <li>Begära <strong>begränsning</strong> av behandlingen.</li>
              <li>Få uppgifterna <strong>i ett portabelt format</strong>.</li>
              <li>Lämna in <strong>klagomål</strong> till Integritetsskyddsmyndigheten (IMY).</li>
            </ul>
            <p>
              Skicka begäran till{" "}
              <a href="mailto:info@kaisengroup.se" className="underline">info@kaisengroup.se</a>. Vi svarar inom 30 dagar.
            </p>
          </Section>

          <Section title="8. Säkerhet">
            <p>
              Vi använder TLS för all dataöverföring, krypterar lösenord och har strikt åtkomstkontroll till produktionsdatabasen. Du som kund är ansvarig för att hålla ditt lösenord till Mitt KAISEN säkert.
            </p>
          </Section>

          <Section title="9. Ändringar i policyn">
            <p>
              Vi kan uppdatera denna policy. Vid väsentliga förändringar informerar vi via e-post eller via en notis på webbplatsen. Den aktuella versionen finns alltid på denna sida.
            </p>
          </Section>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-display text-2xl mb-3">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-foreground/85 [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:space-y-1.5 [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs">
        {children}
      </div>
    </div>
  );
}
