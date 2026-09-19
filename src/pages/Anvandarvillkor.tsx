import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Anvandarvillkor() {
  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="bg-cream py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <p className="text-xs tracking-[0.3em] text-primary uppercase mb-3 font-sans">
            Juridiskt
          </p>
          <h1 className="font-display text-4xl md:text-5xl mb-2">Användarvillkor</h1>
          <p className="text-sm text-muted-foreground">Senast uppdaterad: {new Date().toLocaleDateString("sv-SE")}</p>
        </div>
      </section>

      <section className="py-12 bg-background">
        <div className="container mx-auto px-4 max-w-3xl space-y-10">
          <Section title="1. Tjänsten">
            <p>
              Kaisen Travel Group AB ("Kaisen") tillhandahåller försäljning av biljetter till sportevenemang samt skräddarsydda resepaket via webbplatsen <code>kaisengroup.se</code> och Mitt Kaisen. Dessa villkor reglerar din användning av tjänsten.
            </p>
            <p>
              Genom att lägga en beställning eller skicka en förfrågan godkänner du dessa villkor i sin helhet.
            </p>
          </Section>

          <Section title="2. Avtal och beställning">
            <p>
              Avtalet är bindande när du genomför betalning. För skräddarsydda offerter är avtalet bindande när du betalar offerten via den länk vi skickar.
            </p>
            <p>
              Du ansvarar för att uppgifter du lämnar (namn, e-post, antal biljetter) är korrekta. Felaktiga uppgifter kan leda till att leverans inte kan ske.
            </p>
          </Section>

          <Section title="3. Priser och betalning">
            <p>
              Alla priser anges i svenska kronor (SEK) inklusive moms. Betalning sker via Stripe med kort eller annan tillgänglig betalningsmetod. Vi tar inte emot kontant betalning.
            </p>
            <p>
              För skräddarsydda offerter gäller offerten till och med det datum som anges i offerten, normalt 14 dagar. Efter utgångsdatumet förbehåller vi oss rätten att justera priser.
            </p>
          </Section>

          <Section title="4. Ångerrätt, avbokning och återbetalning">
            <p>
              <strong>Ingen ångerrätt för sportbiljetter:</strong> Köp av biljetter till sport- och underhållningsevenemang som ska äga rum på ett bestämt datum är undantagna från konsumentens ångerrätt enligt 2 kap. 11 § punkt 12 distansavtalslagen (2005:59). Genom att slutföra köpet bekräftar du att du tagit del av detta undantag. Detta gäller även vid sjukdom, hinder eller ändrad reseplan.
            </p>
            <p>
              <strong>Skräddarsydda resor (paketresor):</strong> Avbokningsvillkor framgår av varje offert. Vi följer paketreselagen (2018:1217) inklusive konsumentens rätt att häva avtalet vid väsentlig ändring eller force majeure.
            </p>
            <p>
              <strong>Vid evenemang som ställs in eller flyttas väsentligt:</strong> Vi återbetalar betalt belopp till samma kort du betalade med så snart vi själva fått återbetalning från arrangören eller biljettleverantören. Administrativa avgifter kan dras av om det framgår av offerten.
            </p>
          </Section>

          <Section title="5. Leverans av biljetter">
            <p>
              E-biljetter levereras digitalt via e-post och i Mitt Kaisen senast 24 timmar före evenemanget, ofta tidigare. Vid leverans efter evenemangsdatum (sällsynt teknisk fördröjning) återbetalas hela köpet.
            </p>
            <p>
              Du ansvarar för att kontrollera att korrekt e-postadress angetts vid beställning. Vi ansvarar inte för biljetter som hamnar i skräppost.
            </p>
          </Section>

          <Section title="6. Ansvarsbegränsning">
            <p>
              Vår ansvar är begränsat till det belopp du betalat för den specifika beställningen. Vi ansvarar inte för indirekta skador, t.ex. förlorade resekostnader vid inställda evenemang som vi inte arrangerar.
            </p>
            <p>
              Vid force majeure (naturkatastrofer, krig, pandemier, myndighetsbeslut) bortfaller våra leveransåtaganden i den mån fullgörelse blir orimligt betungande.
            </p>
          </Section>

          <Section title="7. Immateriella rättigheter">
            <p>
              Allt innehåll på webbplatsen - texter, bilder, varumärken - tillhör Kaisen eller våra licensgivare och är skyddat enligt upphovsrättslagen. Du får inte kopiera, distribuera eller på annat sätt nyttja innehållet kommersiellt utan vårt skriftliga medgivande.
            </p>
          </Section>

          <Section title="8. Klagomål och tvister">
            <p>
              Skicka klagomål till{" "}
              <a href="mailto:info@kaisengroup.se" className="underline">info@kaisengroup.se</a>. Om vi inte kommer överens kan du vända dig till Allmänna reklamationsnämnden (ARN) eller behörig domstol.
            </p>
            <p>
              Svensk lag tillämpas på dessa villkor och eventuella tvister.
            </p>
          </Section>

          <Section title="9. Ändringar">
            <p>
              Vi förbehåller oss rätten att uppdatera dessa villkor. Den aktuella versionen finns alltid på denna sida. För redan ingångna avtal gäller de villkor som var aktuella vid köptillfället.
            </p>
          </Section>

          <Section title="10. Kontakt">
            <p>
              Kaisen Travel Group AB<br/>
              <a href="mailto:info@kaisengroup.se" className="underline">info@kaisengroup.se</a>
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
