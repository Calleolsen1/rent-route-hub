import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronUp, ArrowRight, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

type FAQItem = {
 question: string;
 answer: string;
 category: string;
};

const faqs: FAQItem[] = [
 // Allmänt
 {
 category: "allmant",
 question: "Vad är Kaisen Travel Group?",
 answer: "Kaisen Travel Group är ett personligt reseföretag med stor erfarenhet. Vi arrangerar skräddarsydda resor för privatpersoner, grupper och företag - från sportevent och konferenser till weekendresor och VIP-service. Vi arbetar alltid med en dedikerad rådgivare per kund."
 },
 {
 category: "allmant",
 question: "Hur skiljer ni er från vanliga resebyråer?",
 answer: "Vi erbjuder inga standardpaket. Varje resa skapas utifrån dina önskemål - destination, budget, grupstorlek och upplevelse. Du har alltid en personlig kontakt som ansvarar för hela resan, från första förfrågan till hemkomst."
 },
 {
 category: "allmant",
 question: "Hur kontaktar jag Kaisen Travel Group?",
 answer: "Du kan nå oss via kontaktformuläret på hemsidan, telefon eller e-post. Vi svarar inom en timme under kontorstid (mån-fre 09-18, lör 10-16). För akuta ärenden under pågående resa finns vi tillgängliga dygnet runt."
 },
 {
 category: "allmant",
 question: "Vilka typer av resor arrangerar ni?",
 answer: "Vi arrangerar sportresor (F1, fotboll, golf), gruppresor (8-200+ personer), affärsresor, konferenser & incentiveresor, weekend getaways i Europa, VIP-service och incoming-tjänster för internationella grupper som besöker Sverige."
 },
 // Bokning & Process
 {
 category: "bokning",
 question: "Hur bokar jag en resa?",
 answer: "Skicka en förfrågan via vårt kontaktformulär eller ring oss. En dedikerad rådgivare återkommer inom en timme och vi börjar planera resan tillsammans. Ingen resa är för stor eller för liten."
 },
 {
 category: "bokning",
 question: "Hur lång tid tar det att planera en resa?",
 answer: "Det beror på resans komplexitet. En enklare weekendresa kan vi ofta sätta ihop på 24-48 timmar. Stora gruppresor och evenemang kräver ofta 4-12 veckors planeringstid för bästa tillgänglighet och pris."
 },
 {
 category: "bokning",
 question: "Kan jag boka med kort varsel?",
 answer: "Ja, vi hanterar även sista minuten-bokningar. Kontakta oss direkt per telefon eller e-post för snabbast möjliga hjälp. Vi gör allt vi kan för att lösa det."
 },
 {
 category: "bokning",
 question: "Vad händer om jag behöver avboka?",
 answer: "Avbokningsregler varierar beroende på resa, leverantörer och tidpunkt. Vi informerar alltid tydligt om villkoren innan du bekräftar. Vi hjälper dig även att hantera eventuella avbokningar på bästa möjliga sätt."
 },
 // Betalning
 {
 category: "betalning",
 question: "Vilka betalningsvillkor gäller?",
 answer: "Standardbetalningsvillkor är 30 dagar från fakturadatum. För bokningar som görs nära avresedatumet kan kortare betaltid gälla. Vi fakturerar normalt i SEK och kan hantera EUR eller GBP på begäran."
 },
 {
 category: "betalning",
 question: "Krävs det en handpenning?",
 answer: "För de flesta bokningar krävs en handpenning vid bekräftelse, vanligtvis 20-30% av totalsumman. Resterande belopp faktureras normalt 30 dagar efter bokning eller enligt överenskommelse."
 },
 {
 category: "betalning",
 question: "Vilka betalningsmetoder accepterar ni?",
 answer: "Vi accepterar banköverföring (föredras), kortbetalning och faktura. Företagskunder erbjuds alltid fakturabetalning med 30 dagars kredit."
 },
 {
 category: "betalning",
 question: "Vad händer om priset ändras efter bokning?",
 answer: "Det bekräftade priset gäller - vi tar aldrig ut extra kostnader utan att informera dig i förväg. Om externa kostnader (t.ex. flygpriser) förändras väsentligt kontaktar vi alltid dig innan vi bekräftar."
 },
 // Gruppresor
 {
 category: "grupp",
 question: "Hur många personer krävs för en gruppresa?",
 answer: "Vi arbetar med grupper från 8 personer och uppåt, utan något tak - vi har arrangerat resor för upp till 200+ personer. Ju större grupp, desto bättre kan vi oftast förhandla fram priser och upplevelser."
 },
 {
 category: "grupp",
 question: "Vad ingår i en gruppresa?",
 answer: "Vanligtvis transport, boende, aktiviteter och logistikkoordinering. Vi skräddarsyr exakt vad som ingår utifrån era önskemål och budget. Vi kan också hantera allt från visum till grupptransfer och lokala guider."
 },
 {
 category: "grupp",
 question: "Kan ni arrangera företagsevent utomlands?",
 answer: "Absolut - det är ett av våra starkaste områden. Vi har stor erfarenhet av incentiveresor, konferenser och företagsgetaways. Kontakta oss för ett skräddarsytt förslag."
 },
];

const categories = [
 { value: "alla", label: "Alla frågor" },
 { value: "allmant", label: "Allmänt" },
 { value: "bokning", label: "Bokning & process" },
 { value: "betalning", label: "Betalning" },
 { value: "grupp", label: "Gruppresor" },
];

import { usePageMeta } from "@/lib/usePageMeta";

export default function FAQ() {
 usePageMeta({
   title: "Vanliga frågor - Kaisen Travel Group",
   description: "Svar på vanliga frågor om beställning, betalning, biljetter och avbokning hos Kaisen Travel Group.",
 });
 const [activeCategory, setActiveCategory] = useState("alla");
 const [openIndex, setOpenIndex] = useState<number | null>(null);

 const filtered = activeCategory === "alla" ? faqs : faqs.filter(f => f.category === activeCategory);

 return (
 <div className="min-h-screen">
 <Navbar />

 {/* Hero */}
 <section className="bg-navy py-20 border-b border-white/10">
 <div className="container mx-auto px-4 text-center">
 <p className="text-xs tracking-[0.3em] text-primary uppercase mb-4 font-sans">Vanliga frågor</p>
 <h1 className="font-display text-4xl md:text-6xl text-white mb-4">
 Här svarar vi på <em className="italic font-light text-white">Dina Frågor</em>
 </h1>
 <p className="text-white/60 max-w-xl mx-auto leading-relaxed">
 Hittar du inte svaret? Kontakta oss direkt - vi svarar alltid inom en timme under kontorstid.
 </p>
 </div>
 </section>

 {/* Category filter */}
 <section className="bg-cream border-b border-border sticky top-[64px] md:top-[80px] z-40">
 <div className="container mx-auto px-4">
 <div className="flex gap-1 overflow-x-auto py-4 scrollbar-hide">
 {categories.map((cat) => (
 <button
 key={cat.value}
 onClick={() => { setActiveCategory(cat.value); setOpenIndex(null); }}
 className={`whitespace-nowrap px-5 py-2 text-xs tracking-wider font-sans uppercase transition-colors flex-shrink-0 ${
 activeCategory === cat.value
 ? "bg-primary text-primary-foreground"
 : "bg-card border border-border text-muted-foreground hover:text-foreground"
 }`}
 >
 {cat.label}
 </button>
 ))}
 </div>
 </div>
 </section>

 {/* FAQ list */}
 <section className="py-10 md:py-14 bg-background">
 <div className="container mx-auto px-4 max-w-3xl">
 <div className="divide-y divide-border border border-border">
 {filtered.map((faq, i) => (
 <div key={i}>
 <button
 className="w-full flex items-center justify-between text-left px-6 py-5 hover:bg-accent/30 transition-colors gap-4"
 onClick={() => setOpenIndex(openIndex === i ? null : i)}
 >
 <span className="font-display text-lg text-foreground leading-snug">{faq.question}</span>
 {openIndex === i
 ? <ChevronUp className="h-4 w-4 text-primary flex-shrink-0" />
 : <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
 }
 </button>
 {openIndex === i && (
 <div className="px-6 pb-6 text-muted-foreground leading-relaxed text-sm bg-accent/10">
 {faq.answer}
 </div>
 )}
 </div>
 ))}
 </div>
 </div>
 </section>

 {/* Still have questions CTA */}
 <section className="py-10 md:py-14 bg-cream">
 <div className="container mx-auto px-4 text-center max-w-2xl">
 <h2 className="font-display text-3xl text-foreground mb-4">Hittar du inte svaret?</h2>
 <p className="text-muted-foreground leading-relaxed mb-8">
 Vi är alltid tillgängliga för ett personligt samtal. Ring, maila eller fyll i kontaktformuläret - vi svarar snabbt.
 </p>
 <div className="flex flex-col sm:flex-row gap-4 justify-center">
 <a href="tel:+442012345678">
 <Button variant="outline" className="rounded-full border-primary text-primary hover:bg-primary hover:text-primary-foreground px-8 tracking-wider text-sm w-full sm:w-auto">
 <Phone className="h-4 w-4 mr-2" /> Ring oss
 </Button>
 </a>
 <Link to="/contact">
 <Button className="rounded-full bg-primary hover:bg-primary/90 px-8 tracking-wider text-sm w-full sm:w-auto">
 Kontaktformulär <ArrowRight className="h-4 w-4 ml-2" />
 </Button>
 </Link>
 </div>
 </div>
 </section>

 <Footer />
 </div>
 );
}
