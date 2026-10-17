import { Link } from "react-router-dom";
import { Phone, Mail, Clock, MessageSquare, ArrowRight, AlertCircle, CheckCircle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

const channels = [
 {
 icon: Phone,
 title: "Ring oss",
 desc: "Du når oss vardagar 09:00-17:00. Vid brådskande ärende finner du vårt journummer på er bokningsbekräftelse.",
 detail: "+46 418 350 200",
 href: "tel:+46418350200",
 cta: "Ring nu",
 },
 {
 icon: Mail,
 title: "E-post",
 desc: "Vi svarar alltid samma dag sålänge e-post inkommer under ordinarie öppetider.",
 detail: "info@kaisengroup.se",
 href: "mailto:info@kaisengroup.se",
 cta: "Skicka mejl",
 },
 {
 icon: MessageSquare,
 title: "Kontaktformulär",
 desc: "Fyll i vårt formulär för Reseförfrågan så återkopplar vi snarast möjligt med ett skräddarsytt förslag på reseupplägg.",
 href: "/contact",
 cta: "Öppna formulär",
 internal: true,
 },
];

const supportTypes = [
 {
 icon: AlertCircle,
 color: "text-red-500",
 bg: "bg-red-50",
 title: "Akuta ärenden under resa",
 desc: "Befinner du dig på resa och har ett akut problem? Ring oss direkt på +46 8 000 00 00. Vi har jour för aktiva kunder och svarar även utanför kontorstid.",
 },
 {
 icon: HelpCircle,
 color: "text-primary",
 bg: "bg-primary/10",
 title: "Frågor om bokning",
 desc: "Har du frågor om en pågående eller kommande bokning? Kontakta oss via e-post eller formulär med ditt bokningsnummer så hjälper vi dig snabbt.",
 },
 {
 icon: CheckCircle,
 color: "text-green-600",
 bg: "bg-green-50",
 title: "Feedback & förbättringar",
 desc: "Har du rest med oss och vill dela med dig av dina intryck? Vi tar alltid emot feedback - positiv och negativ - för att bli bättre.",
 },
];

import { usePageMeta } from "@/lib/usePageMeta";

export default function Support() {
 usePageMeta({
   title: "Support - Kaisen Travel Group",
   description: "Behöver du hjälp under resan eller med din beställning? Vi finns tillgängliga dygnet runt för aktiva kunder.",
 });
 return (
 <div className="min-h-screen">
 <Navbar />

 {/* Hero */}
 <section className="bg-navy py-12 sm:py-20 border-b border-white/10">
 <div className="container mx-auto px-4 text-center">
 <p className="text-[11px] sm:text-xs eyebrow text-white/75 uppercase mb-4 font-sans">Support</p>
 <h1 className="font-display text-4xl md:text-6xl text-white mb-4">
 Vi finns här för <em className="italic font-light text-white">dig</em>
 </h1>
 <p className="text-white/60 max-w-xl mx-auto leading-relaxed">
 Personlig och snabb service - oavsett om du planerar, packar eller redan är på plats.
 </p>
 </div>
 </section>

 {/* Office hours banner */}
 <div className="bg-primary/10 border-b border-primary/20 py-3">
 <div className="container mx-auto px-4 flex items-center justify-center gap-2 text-sm">
 <Clock className="h-4 w-4 text-primary" />
 <span className="text-foreground font-medium">Kontorstid:</span>
 <span className="text-muted-foreground">Mån-Fre 09:00-17:00</span>
 </div>
 </div>

 {/* Contact channels */}
 <section className="py-10 md:py-14 bg-background">
 <div className="container mx-auto px-4">
 <div className="text-center mb-12">
              <h2 className="font-display text-3xl text-foreground">Kontakta oss</h2>

 </div>
 <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
 {channels.map((ch) => (
 <div key={ch.title} className="border border-border bg-card p-8 text-center hover:border-primary/40 transition-colors">
 <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
 <ch.icon className="h-5 w-5 text-primary" />
 </div>
 <h3 className="font-display text-xl text-foreground mb-2">{ch.title}</h3>
 <p className="text-sm text-muted-foreground leading-relaxed mb-3">{ch.desc}</p>
 {ch.detail && (
 <p className="text-sm font-medium text-primary mb-5">{ch.detail}</p>
 )}
 {ch.internal ? (
 <Link to={ch.href}>
 <Button variant="outline" className="rounded-full border-primary text-primary hover:bg-primary hover:text-primary-foreground text-xs tracking-wider w-full">
 {ch.cta} <ArrowRight className="h-3 w-3 ml-1" />
 </Button>
 </Link>
 ) : (
 <a href={ch.href}>
 <Button variant="outline" className="rounded-full border-primary text-primary hover:bg-primary hover:text-primary-foreground text-xs tracking-wider w-full">
 {ch.cta} <ArrowRight className="h-3 w-3 ml-1" />
 </Button>
 </a>
 )}
 </div>
 ))}
 </div>
 </div>
 </section>

 {/* Support types */}
 <section className="py-10 md:py-14 bg-cream">
 <div className="container mx-auto px-4">
 <div className="text-center mb-12">
 <p className="text-[11px] sm:text-xs eyebrow text-primary uppercase mb-4 font-sans">Typer av ärenden</p>
 <h2 className="font-display text-3xl text-foreground">Hur kan vi hjälpa?</h2>
 </div>
 <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
 {supportTypes.map((st) => (
 <div key={st.title} className="border border-border bg-card p-6">
 <div className={`w-10 h-10 ${st.bg} rounded-full flex items-center justify-center mb-4`}>
 <st.icon className={`h-5 w-5 ${st.color}`} />
 </div>
 <h3 className="font-display text-lg text-foreground mb-3">{st.title}</h3>
 <p className="text-sm text-muted-foreground leading-relaxed">{st.desc}</p>
 </div>
 ))}
 </div>
 </div>
 </section>

 {/* Promise section */}
 <section className="py-10 md:py-14 bg-navy">
 <div className="container mx-auto px-4 text-center max-w-2xl">
 <p className="text-[11px] sm:text-xs eyebrow text-primary uppercase mb-4 font-sans">Vårt löfte</p>
 <h2 className="font-display text-3xl text-white mb-6">
 Vi svarar alltid - <em className="italic font-light text-white">på riktigt</em>
 </h2>
 <p className="text-white/60 leading-relaxed mb-8">
 Hos Kaisen Travel Group pratar du alltid med en riktig människa. Inga automatiserade svar, ingen kö. En dedikerad rådgivare tar hand om ditt ärende från start till mål.
 </p>
 <div className="grid grid-cols-3 gap-3 sm:gap-6 border-t border-white/10 pt-8">
 {[
 { value: "1 tim", label: "Svarstid på mejl" },
 { value: "24/7", label: "Akutlinje under resa" },
 { value: "100%", label: "Personlig kontakt" },
 ].map((s) => (
 <div key={s.label}>
 <div className="font-display text-2xl text-primary mb-1">{s.value}</div>
 <div className="text-xs tracking-wider text-white/40 uppercase font-sans">{s.label}</div>
 </div>
 ))}
 </div>
 </div>
 </section>

 {/* Also see FAQ */}
 <section className="py-12 bg-background border-t border-border">
 <div className="container mx-auto px-4 text-center">
 <p className="text-muted-foreground text-sm mb-4">Letar du efter svar på en specifik fråga?</p>
 <Link to="/faq">
 <Button variant="outline" className="rounded-full border-primary text-primary hover:bg-primary hover:text-primary-foreground tracking-wider text-sm">
 Gå till FAQ <ArrowRight className="h-4 w-4 ml-2" />
 </Button>
 </Link>
 </div>
 </section>

 <Footer />
 </div>
 );
}
