import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, LogIn, MapPin, Calendar, CreditCard, Users, Headphones, FileText, ChevronRight, ChevronDown, ChevronUp, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

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
 answer: "Vi håller på att bygga vår kundportal 'Mitt Kaisen'. Snart kan du skapa ett konto och följa din resa, fakturor och uppdateringar i realtid. Tills dess hanterar vi allt via e-post och telefon.",
 },
 {
 question: "Jag har glömt mitt lösenord",
 answer: "Kundportalen är ännu inte lanserad. Kontakta oss på hello@kaisentravel.com så hjälper vi dig med din kontoinfo.",
 },
 {
 question: "Hur håller jag koll på min resa?",
 answer: "Just nu skickar vi all information om din resa via e-post — bekräftelser, fakturor och uppdateringar. Vår kommande portal 'Mitt Kaisen' kommer samla allt på ett ställe.",
 },
 {
 question: "Uppdatera mina kontaktuppgifter",
 answer: "Skicka ett mejl till hello@kaisentravel.com med dina nya kontaktuppgifter så uppdaterar vi dem åt dig omedelbart.",
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
 answer: "Avbokningsregler varierar beroende på resa och tidpunkt. Vi informerar alltid om villkoren innan du bekräftar. Kontakta oss direkt om du behöver avboka — vi hjälper dig på bästa möjliga sätt.",
 },
 {
 question: "Var finns mina resehandlingar och vouchers?",
 answer: "Alla resehandlingar skickas till din e-postadress i god tid innan avresa. Har du inte fått dem — kontakta oss på hello@kaisentravel.com så skickar vi om dem direkt.",
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
 answer: "Ja, för de flesta bokningar krävs en handpenning vid bekräftelse — vanligtvis 20–30% av totalsumman. Resterande belopp faktureras normalt 30 dagar efter bokning eller enligt överenskommelse.",
 },
 {
 question: "Hur får jag min faktura?",
 answer: "Fakturan skickas automatiskt till din e-postadress vid bekräftelse och vid eventuella uppdateringar. Behöver du en kopia eller ändrad fakturaadress — kontakta oss på hello@kaisentravel.com.",
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
 answer: "Det bekräftade priset gäller — vi tar aldrig ut extra kostnader utan att informera dig i förväg. Ändras externa kostnader väsentligt kontaktar vi alltid dig innan vi bekräftar.",
 },
 ],
 },
 {
 icon: Users,
 slug: "gruppresor",
 title: "Gruppresor",
 desc: "Specifika frågor om att resa i grupp — logistik, priser och upplägg.",
 articles: [
 {
 question: "Hur många personer krävs för en gruppresa?",
 answer: "Vi arbetar med grupper från 8 personer och uppåt — utan något tak. Vi har arrangerat resor för upp till 200+ personer.",
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
 answer: "Vi tar hänsyn till alla specialbehov — allergier, dietrestriktioner och tillgänglighetsbehov. Uppge detta i din förfrågan så ordnar vi det.",
 },
 {
 question: "Kan ni arrangera företagsevent utomlands?",
 answer: "Absolut — det är ett av våra starkaste områden. Vi har 25+ års erfarenhet av incentiveresor, konferenser och företagsgetaways. Kontakta oss för ett skräddarsytt förslag.",
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
 answer: "Vi arbetar med destinationer över hela världen — med särskilt fokus på Europa. Populära destinationer inkluderar Monaco, Barcelona, London, Milano och Skandinavien. Men hör av dig — vi fixar det mesta.",
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
 answer: "Incoming innebär att vi tar emot internationella grupper i Sverige och ordnar hela deras vistelse — transport, boende, aktiviteter och guidning. Perfekt för utländska företag och organisationer.",
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
 answer: "Ring oss direkt på +44 20 1234 5678. Vi har en akutlinje för aktiva kunder som är tillgänglig dygnet runt, alla dagar.",
 },
 {
 question: "Hur kontaktar jag er utanför kontorstid?",
 answer: "Akuta ärenden under pågående resa: ring +44 20 1234 5678. För icke-akuta ärenden — skicka ett mejl till hello@kaisentravel.com så svarar vi nästa arbetsdag.",
 },
 {
 question: "Vad händer vid förseningar och störningar?",
 answer: "Vi följer din resa aktivt och kontaktar dig proaktivt vid störningar som påverkar dina bokningar. Vi ordnar alternativa lösningar så snabbt som möjligt.",
 },
 {
 question: "Hur lämnar jag klagomål eller feedback?",
 answer: "Vi tar all feedback på allvar. Skicka ett mejl till hello@kaisentravel.com eller fyll i kontaktformuläret. Vi återkommer alltid med svar och åtgärder.",
 },
 ],
 },
];

export default function HelpCenter() {
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
 <section className="bg-navy py-20 border-b border-white/10">
 <div className="container mx-auto px-4 text-center">
 <p className="text-xs tracking-[0.3em] text-gold uppercase mb-4 font-sans">Hjälpcenter</p>
 <h1 className="font-display text-4xl md:text-6xl text-white mb-4">
 Hur kan vi <em className="italic font-light text-gold-light">hjälpa dig?</em>
 </h1>
 <p className="text-white/60 max-w-xl mx-auto leading-relaxed mb-8">
 Hitta svar på dina frågor eller kontakta oss direkt — vi svarar alltid inom en timme.
 </p>
 {/* Search */}
 <div className="max-w-md mx-auto relative">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
 <input
 type="text"
 placeholder="Sök efter svar..."
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-gold/60 transition-colors"
 />
 </div>
 </div>
 </section>

 {/* Coming soon: login portal teaser */}
 <section className="bg-primary/10 border-b border-primary/20 py-4">
 <div className="container mx-auto px-4">
 <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
 <LogIn className="h-4 w-4 text-primary" />
 </div>
 <div>
 <p className="text-sm font-medium text-foreground">Mitt Kaisen — Lanseras snart</p>
 <p className="text-xs text-muted-foreground">Logga in och håll koll på din resa, fakturor och uppdateringar i realtid.</p>
 </div>
 </div>
 <Link to="/contact">
 <Button size="sm" variant="outline" className="rounded-full border-primary text-primary hover:bg-primary hover:text-primary-foreground text-xs tracking-wider whitespace-nowrap">
 Få tidig åtkomst <ChevronRight className="h-3 w-3 ml-1" />
 </Button>
 </Link>
 </div>
 </div>
 </section>

 {/* Topics with expandable articles */}
 <section className="py-10 md:py-14 bg-background">
 <div className="container mx-auto px-4 max-w-3xl">
 {search && filtered.length === 0 && (
 <div className="text-center py-16 text-muted-foreground">
 <p className="text-lg mb-2">Inga resultat för "{search}"</p>
 <p className="text-sm">Prova ett annat sökord eller <Link to="/contact" className="text-primary underline">kontakta oss direkt</Link>.</p>
 </div>
 )}

 <div className="space-y-4">
 {filtered.map((topic) => (
 <div key={topic.slug} className="border border-border bg-card">
 {/* Topic header */}
 <button
 className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-accent/20 transition-colors"
 onClick={() => {
 setOpenTopic(openTopic === topic.slug ? null : topic.slug);
 setOpenArticle(null);
 }}
 >
 <div className="flex items-center gap-4">
 <div className="w-10 h-10 bg-primary/10 flex items-center justify-center flex-shrink-0">
 <topic.icon className="h-5 w-5 text-primary" />
 </div>
 <div className="text-left">
 <div className="flex items-center gap-2">
 <span className="font-display text-lg text-foreground">{topic.title}</span>
 {topic.comingSoon && (
 <span className="text-[10px] tracking-wider uppercase bg-primary/10 text-primary px-2 py-0.5 font-sans">Kommer snart</span>
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
 className="w-full flex items-center justify-between text-left px-6 py-4 hover:bg-accent/10 transition-colors gap-4"
 onClick={() => setOpenArticle(openArticle === key ? null : key)}
 >
 <div className="flex items-center gap-3">
 <ChevronRight className="h-3 w-3 text-primary flex-shrink-0" />
 <span className="text-sm text-foreground">{article.question}</span>
 </div>
 {openArticle === key
 ? <ChevronUp className="h-3 w-3 text-primary flex-shrink-0" />
 : <ChevronDown className="h-3 w-3 text-muted-foreground flex-shrink-0" />
 }
 </button>
 {openArticle === key && (
 <div className="px-6 pb-5 pt-1 ml-6 bg-accent/5">
 <p className="text-sm text-muted-foreground leading-relaxed">{article.answer}</p>
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
 <section className="py-10 md:py-14 bg-cream">
 <div className="container mx-auto px-4">
 <div className="text-center mb-12">
 <p className="text-xs tracking-[0.3em] text-primary uppercase mb-4 font-sans">Transparens</p>
 <h2 className="font-display text-3xl text-foreground mb-2">
 Alltid uppdaterad — <em className="italic font-light">utan ansträngning</em>
 </h2>
 <div className="w-10 h-px bg-primary mx-auto" />
 </div>
 <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
 {[
 {
 icon: FileText,
 title: "Automatiska fakturor",
 desc: "Varje gång något uppdateras i din bokning skickas en ny faktura eller bekräftelse direkt till din e-post.",
 },
 {
 icon: Headphones,
 title: "E-postnotiser",
 desc: "Du får alltid ett mejl när vi gör en ändring — ingen uppdatering sker utan att du informeras.",
 },
 {
 icon: LogIn,
 title: "Reseportal (kommer snart)",
 desc: "Snart lanserar vi 'Mitt Kaisen' — en inloggningssida där du ser alla dina resor, fakturor och uppdateringar på ett ställe.",
 },
 ].map((item) => (
 <div key={item.title} className="text-center">
 <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
 <item.icon className="h-5 w-5 text-primary" />
 </div>
 <h3 className="font-display text-xl text-foreground mb-2">{item.title}</h3>
 <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
 </div>
 ))}
 </div>
 </div>
 </section>

 {/* CTA */}
 <section className="bg-primary py-16">
 <div className="container mx-auto px-4 text-center">
 <h2 className="font-display text-3xl text-primary-foreground mb-4">Hittade du inte svaret?</h2>
 <p className="text-primary-foreground/70 mb-8 max-w-md mx-auto">
 Vårt team svarar alltid inom en timme under kontorstid.
 </p>
 <div className="flex flex-col sm:flex-row gap-4 justify-center">
 <Link to="/support">
 <Button className="rounded-full bg-white text-primary hover:bg-white/90 px-10 tracking-wider text-sm font-semibold">
 Gå till Support <ArrowRight className="h-4 w-4 ml-2" />
 </Button>
 </Link>
 <Link to="/contact">
 <Button variant="outline" className="rounded-full border-white text-white hover:bg-white hover:text-primary px-10 tracking-wider text-sm font-semibold">
 Kontaktformulär
 </Button>
 </Link>
 </div>
 </div>
 </section>

 <Footer />
 </div>
 );
}
