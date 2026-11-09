import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, LogIn, MapPin, Calendar, CreditCard, Users, Headphones, FileText, ChevronRight, ChevronDown, ChevronUp, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import CtaBand from "@/components/site/CtaBand";

type Article = {
 question: string;
 answer: string;
};

type Topic = {
 icon: React.ElementType;
 title: string;
 slug: string;
 desc: string;
 articles: Article[];
 comingSoon?: boolean;
};

const topics: Topic[] = [
 {
 icon: LogIn,
 slug: "konto",
 title: "Mitt konto & inloggning",
 desc: "Logga in, hantera ditt konto och spåra dina bokningar.",
 comingSoon: true,
 articles: [
 {
 question: "Hur skapar jag ett konto?",
 answer: "Vi håller på att bygga vår kundportal 'Mitt KAISEN'. Snart kan du skapa ett konto och följa din resa, fakturor och uppdateringar i realtid. Tills dess hanterar vi allt via e-post och telefon.",
 },
 {
 question: "Jag har glömt mitt lösenord",
 answer: "Kundportalen är ännu inte lanserad. Kontakta oss på info@kaisengroup.se så hjälper vi dig med din kontoinfo.",
 },
 {
 question: "Hur håller jag koll på min resa?",
 answer: "Just nu skickar vi all information om din resa via e-post - bekräftelser, fakturor och uppdateringar. Vår kommande portal 'Mitt KAISEN' kommer samla allt på ett ställe.",
 },
 {
 question: "Uppdatera mina kontaktuppgifter",
 answer: "Skicka ett mejl till info@kaisengroup.se med dina nya kontaktuppgifter så uppdaterar vi dem åt dig omedelbart.",
 },
 ],
 },
 {
 icon: Calendar,
 slug: "bokningar",
 title: "Bokningar & Ändringar",
 desc: "Allt om hur din resa bokas, bekräftas och eventuellt ändras.",
 articles: [
 {
 question: "Hur bekräftas min bokning?",
 answer: "När vi har bekräftat din resa får du en bokningsbekräftelse direkt till din e-postadress. Bekräftelsen innehåller all information om resan, priser och betalningsvillkor.",
 },
 {
 question: "Kan jag ändra datum eller antal resenärer?",
 answer: "Ja, vi försöker alltid hjälpa till med ändringar. Kontakta oss så tidigt som möjligt så undersöker vi möjligheterna. Tilläggsavgifter kan tillkomma beroende på leverantörers regler.",
 },
 {
 question: "Vad händer om jag behöver avboka?",
 answer: "Avbokningsregler varierar beroende på resa och tidpunkt. Vi informerar alltid om villkoren innan du bekräftar. Kontakta oss direkt om du behöver avboka - vi hjälper dig på bästa möjliga sätt.",
 },
 {
 question: "Var finns mina resehandlingar och vouchers?",
 answer: "Alla resehandlingar skickas till din e-postadress i god tid innan avresa. Har du inte fått dem - kontakta oss på info@kaisengroup.se så skickar vi om dem direkt.",
 },
 {
 question: "Kan jag boka med kort varsel?",
 answer: "Ja! Vi hanterar sista minuten-bokningar. Kontakta oss direkt via telefon eller e-post för snabbast möjlig hjälp.",
 },
 ],
 },
 {
 icon: CreditCard,
 slug: "betalning",
 title: "Betalning & Fakturering",
 desc: "Betalningsvillkor, fakturor och hur vår faktureringsprocess fungerar.",
 articles: [
 {
 question: "Vilka betalningsvillkor gäller?",
 answer: "Standardbetalningsvillkor är 30 dagar från fakturadatum. För bokningar nära avresedatumet kan kortare betaltid gälla. Vi informerar alltid tydligt om detta innan du bekräftar.",
 },
 {
 question: "Krävs det en handpenning?",
 answer: "Ja, för de flesta bokningar krävs en handpenning vid bekräftelse - vanligtvis 20-30% av totalsumman. Resterande belopp faktureras normalt 30 dagar efter bokning eller enligt överenskommelse.",
 },
 {
 question: "Hur får jag min faktura?",
 answer: "Fakturan skickas automatiskt till din e-postadress vid bekräftelse och vid eventuella uppdateringar. Behöver du en kopia eller ändrad fakturaadress - kontakta oss på info@kaisengroup.se.",
 },
 {
 question: "Vilka betalningsmetoder accepterar ni?",
 answer: "Vi accepterar banköverföring (föredras), kortbetalning och faktura. Företagskunder erbjuds alltid fakturabetalning med 30 dagars kredit.",
 },
 {
 question: "Kan jag betala i utländsk valuta?",
 answer: "Vi fakturerar normalt i SEK. EUR och GBP kan hanteras på begäran. Kontakta oss så löser vi det.",
 },
 {
 question: "Vad händer om priset ändras efter bokning?",
 answer: "Det bekräftade priset gäller - vi tar aldrig ut extra kostnader utan att informera dig i förväg. Ändras externa kostnader väsentligt kontaktar vi alltid dig innan vi bekräftar.",
 },
 ],
 },
 {
 icon: Users,
 slug: "gruppresor",
 title: "Gruppresor",
 desc: "Specifika frågor om att resa i grupp - logistik, priser och upplägg.",
 articles: [
 {
 question: "Hur många personer krävs för en gruppresa?",
 answer: "Vi arbetar med grupper från 8 personer och uppåt - utan något tak. Vi har arrangerat resor för upp till 200+ personer.",
 },
 {
 question: "Vad ingår i en gruppresa?",
 answer: "Vanligtvis transport, boende, aktiviteter och logistikkoordinering. Vi skräddarsyr exakt vad som ingår utifrån era önskemål och budget. Vi hanterar allt från visum till lokala guider.",
 },
 {
 question: "Erbjuder ni gruprabatter?",
 answer: "Ja, ju större grupp desto bättre kan vi förhandla fram priser. Kontakta oss för en kostnadsfri offert anpassad efter er grupp.",
 },
 {
 question: "Hur hanterar ni specialkost och tillgänglighet?",
 answer: "Vi tar hänsyn till alla specialbehov - allergier, dietrestriktioner och tillgänglighetsbehov. Uppge detta i din förfrågan så ordnar vi det.",
 },
 {
 question: "Kan ni arrangera företagsevent utomlands?",
 answer: "Absolut - det är ett av våra starkaste områden. Vi har stor erfarenhet av incentiveresor, konferenser och företagsgetaways. Kontakta oss för ett skräddarsytt förslag.",
 },
 ],
 },
 {
 icon: MapPin,
 slug: "destinationer",
 title: "Destinationer & Upplevelser",
 desc: "Information om våra destinationer, event och vad vi kan ordna på plats.",
 articles: [
 {
 question: "Vilka destinationer arbetar ni med?",
 answer: "Vi arbetar med destinationer över hela världen - med särskilt fokus på Europa. Populära destinationer inkluderar Monaco, Barcelona, London, Milano och Skandinavien. Men hör av dig - vi fixar det mesta.",
 },
 {
 question: "Kan ni ordna VIP-biljetter till sportevent?",
 answer: "Ja! Vi specialiserar oss på VIP-upplevelser till F1, fotboll, golf och tennis. Hör av dig med önskad destination och event så tar vi fram ett förslag.",
 },
 {
 question: "Erbjuder ni lokala guider och aktiviteter?",
 answer: "Ja, vi kan ordna lokala guider, privata turer, restaurangbokningar och skräddarsydda upplevelser på plats.",
 },
 {
 question: "Vad är Incoming-tjänsten?",
 answer: "Incoming innebär att vi tar emot internationella grupper i Sverige och ordnar hela deras vistelse - transport, boende, aktiviteter och guidning. Perfekt för utländska företag och organisationer.",
 },
 ],
 },
 {
 icon: Headphones,
 slug: "support-under-resa",
 title: "Support under resan",
 desc: "Vad gör du om något uppstår under pågående resa.",
 articles: [
 {
 question: "Vad gör jag vid akut hjälp under resan?",
 answer: "Ring oss direkt på +46 8 000 00 00. Vi har en akutlinje för aktiva kunder som är tillgänglig dygnet runt, alla dagar.",
 },
 {
 question: "Hur kontaktar jag er utanför kontorstid?",
 answer: "Akuta ärenden under pågående resa: ring +46 8 000 00 00. För icke-akuta ärenden - skicka ett mejl till info@kaisengroup.se så svarar vi nästa arbetsdag.",
 },
 {
 question: "Vad händer vid förseningar och störningar?",
 answer: "Vi följer din resa aktivt och kontaktar dig proaktivt vid störningar som påverkar dina bokningar. Vi ordnar alternativa lösningar så snabbt som möjligt.",
 },
 {
 question: "Hur lämnar jag klagomål eller feedback?",
 answer: "Vi tar all feedback på allvar. Skicka ett mejl till info@kaisengroup.se eller fyll i kontaktformuläret. Vi återkommer alltid med svar och åtgärder.",
 },
 ],
 },
];

import { usePageMeta } from "@/lib/usePageMeta";

export default function HelpCenter() {
 usePageMeta({
   title: "Hjälpcenter - Kaisen Travel Group",
   description: "Hjälpcenter med vanliga frågor om bokning, betalning, biljettleverans och kundsupport.",
 });
 const [openTopic, setOpenTopic] = useState<string | null>(null);
 const [openArticle, setOpenArticle] = useState<string | null>(null);
 const [search, setSearch] = useState("");

 const filtered = topics.map((topic) => ({
 ...topic,
 articles: topic.articles.filter(
 (a) =>
 !search ||
 a.question.toLowerCase().includes(search.toLowerCase()) ||
 a.answer.toLowerCase().includes(search.toLowerCase())
 ),
 })).filter((topic) => !search || topic.articles.length > 0);

 return (
 <div className="min-h-screen">
 <Navbar />

 {/* Hero */}
 <section className="relative overflow-hidden bg-navy-deep">
 <div aria-hidden className="pointer-events-none absolute -right-20 -top-40 h-[420px] w-[520px] rotate-[18deg] rounded-[80px] bg-white/[0.05]" />
 <div aria-hidden className="pointer-events-none absolute right-[30%] -bottom-56 h-[360px] w-[420px] -rotate-[24deg] rounded-[80px] bg-white/[0.035]" />
 <div className="relative w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-10 py-8 md:py-12">
 <p className="eyebrow text-sky-300 uppercase mb-1.5">Hjälpcenter</p>
 <h1 className="font-display text-[34px] sm:text-5xl md:text-6xl text-white mb-3">
 Hur kan vi <em className="italic font-light text-white">hjälpa dig?</em>
 </h1>
 <p className="text-white/85 max-w-2xl text-sm md:text-base leading-relaxed mb-6">
 Hitta svar på dina frågor eller kontakta oss direkt - vi svarar alltid inom en timme.
 </p>
 {/* Search */}
 <div className="max-w-md relative">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
 <input
 type="text"
 placeholder="Sök efter svar..."
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 className="w-full h-11 rounded-md bg-white text-foreground placeholder:text-muted-foreground pl-11 pr-4 text-base focus:outline-none focus:ring-2 focus:ring-white/60 transition-colors"
 />
 </div>
 </div>
 </section>

 {/* Coming soon: login portal teaser */}
 <section className="bg-cream border-b border-border py-4">
 <div className="sb-container">
 <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 bg-primary rounded-md flex items-center justify-center flex-shrink-0">
 <LogIn className="h-4 w-4 text-white" />
 </div>
 <div>
 <p className="font-display uppercase font-semibold text-base text-foreground">Mitt KAISEN - Lanseras snart</p>
 <p className="text-xs text-muted-foreground">Logga in och håll koll på din resa, fakturor och uppdateringar i realtid.</p>
 </div>
 </div>
 <Link to="/contact">
 <Button size="sm" variant="outline" className="h-9 rounded-lg border-primary text-primary hover:bg-primary hover:text-primary-foreground font-display uppercase font-semibold tracking-wide text-[15px] whitespace-nowrap">
 Få tidig åtkomst <ChevronRight className="h-3 w-3 ml-1" />
 </Button>
 </Link>
 </div>
 </div>
 </section>

 {/* Topics with expandable articles */}
 <section className="sb-section bg-background">
 <div className="sb-container max-w-3xl">
 {search && filtered.length === 0 && (
 <div className="text-center py-16 text-muted-foreground">
 <p className="text-lg mb-2">Inga resultat för "{search}"</p>
 <p className="text-sm">Prova ett annat sökord eller <Link to="/contact" className="text-primary underline">kontakta oss direkt</Link>.</p>
 </div>
 )}

 <div className="space-y-3">
 {filtered.map((topic) => (
 <div key={topic.slug} className={`sb-card overflow-hidden transition-colors ${openTopic === topic.slug ? "border-primary/50" : ""}`}>
 {/* Topic header */}
 <button
 className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-cream transition-colors"
 onClick={() => {
 setOpenTopic(openTopic === topic.slug ? null : topic.slug);
 setOpenArticle(null);
 }}
 >
 <div className="flex items-center gap-4">
 <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
 <topic.icon className="h-5 w-5 text-primary" />
 </div>
 <div className="text-left">
 <div className="flex items-center gap-2">
 <span className="font-display text-lg md:text-xl uppercase font-semibold text-foreground">{topic.title}</span>
 {topic.comingSoon && (
 <span className="rounded bg-primary/10 text-primary px-2 py-0.5 font-display text-xs uppercase font-semibold tracking-wide">Kommer snart</span>
 )}
 </div>
 <span className="text-xs text-muted-foreground">{topic.articles.length} artiklar</span>
 </div>
 </div>
 {openTopic === topic.slug
 ? <ChevronUp className="h-4 w-4 text-primary flex-shrink-0" />
 : <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
 }
 </button>

 {/* Articles */}
 {openTopic === topic.slug && (
 <div className="border-t border-border divide-y divide-border">
 {topic.articles.map((article, i) => {
 const key = `${topic.slug}-${i}`;
 return (
 <div key={key}>
 <button
 className="w-full flex items-center justify-between text-left px-5 py-3.5 hover:bg-cream transition-colors gap-4"
 onClick={() => setOpenArticle(openArticle === key ? null : key)}
 >
 <div className="flex items-center gap-3">
 <ChevronRight className="h-3 w-3 text-primary flex-shrink-0" />
 <span className="text-[15px] font-medium text-foreground">{article.question}</span>
 </div>
 {openArticle === key
 ? <ChevronUp className="h-3 w-3 text-primary flex-shrink-0" />
 : <ChevronDown className="h-3 w-3 text-muted-foreground flex-shrink-0" />
 }
 </button>
 {openArticle === key && (
 <div className="px-5 pb-5 pt-1 ml-6">
 <p className="text-[15px] text-foreground/80 leading-relaxed">{article.answer}</p>
 </div>
 )}
 </div>
 );
 })}
 </div>
 )}
 </div>
 ))}
 </div>
 </div>
 </section>

 {/* How updates work */}
 <section className="sb-section-alt">
 <div className="sb-container">
 <div className="mb-8 md:mb-10">
 <p className="eyebrow text-primary uppercase mb-1">Transparens</p>
 <h2 className="font-display text-3xl md:text-[36px] lg:text-[44px] text-foreground">
 Alltid uppdaterad - <em className="italic font-light">utan ansträngning</em>
 </h2>
 </div>
 <div className="grid md:grid-cols-3 gap-4">
 {[
 {
 icon: FileText,
 title: "Automatiska fakturor",
 desc: "Varje gång något uppdateras i din bokning skickas en ny faktura eller bekräftelse direkt till din e-post.",
 },
 {
 icon: Headphones,
 title: "E-postnotiser",
 desc: "Du får alltid ett mejl när vi gör en ändring - ingen uppdatering sker utan att du informeras.",
 },
 {
 icon: LogIn,
 title: "Reseportal (kommer snart)",
 desc: "Snart lanserar vi 'Mitt KAISEN' - en inloggningssida där du ser alla dina resor, fakturor och uppdateringar på ett ställe.",
 },
 ].map((item) => (
 <div key={item.title} className="sb-card p-5">
 <div className="w-10 h-10 bg-primary rounded-md flex items-center justify-center mb-4">
 <item.icon className="h-5 w-5 text-white" />
 </div>
 <h3 className="font-display text-xl text-foreground mb-1.5">{item.title}</h3>
 <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
 </div>
 ))}
 </div>
 </div>
 </section>

 <CtaBand
 title="Hittade du inte svaret?"
 text="Vårt team svarar alltid inom en timme under kontorstid."
 >
 <Link to="/support" className="sb-btn-light">
 Gå till Support <ArrowRight className="h-4 w-4" />
 </Link>
 <Link to="/contact" className="sb-btn border border-white text-white hover:bg-white hover:text-primary">
 Kontaktformulär
 </Link>
 </CtaBand>

 <Footer />
 </div>
 );
}
