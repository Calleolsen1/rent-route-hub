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
 title: "Akuta ärende under resa",
 desc: "Befinner du dig på resa och behöver kontakta oss utanför ordinarie öppettider finner du vårt journummer på er bokningsbekräftelse. Det går även bra att skicka e-post till info@kaisengroup.se",
 },
 {
 icon: HelpCircle,
 color: "text-primary",
 bg: "bg-primary/10",
 title: "Frågor om er bokning",
 desc: "Har du frågor om en pågående eller kommande bokning går det bra att ringa oss eller skicka e-post. Ange gärna ditt bokningsnummer så återkommer vi snarast möjligt.",
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
 <section className="relative overflow-hidden bg-navy-deep">
 <div aria-hidden className="pointer-events-none absolute -right-20 -top-40 h-[420px] w-[520px] rotate-[18deg] rounded-[80px] bg-white/[0.05]" />
 <div aria-hidden className="pointer-events-none absolute right-[30%] -bottom-56 h-[360px] w-[420px] -rotate-[24deg] rounded-[80px] bg-white/[0.035]" />
 <div className="relative w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-10 py-8 md:py-12">
 <p className="eyebrow text-sky-300 uppercase mb-1.5">Support</p>
 <h1 className="font-display text-[34px] sm:text-5xl md:text-6xl text-white mb-3">
 Vi finns här för <em className="italic font-light text-white">dig</em>
 </h1>
 <p className="text-white/85 max-w-2xl text-sm md:text-base leading-relaxed">
 Personlig och snabb service - oavsett om du planerar, packar eller redan är på plats.
 </p>
 </div>
 </section>

 {/* Office hours banner */}
 <div className="bg-cream border-b border-border py-3">
 <div className="sb-container flex items-center justify-center gap-2 text-sm">
 <Clock className="h-4 w-4 text-primary" />
 <span className="text-foreground font-medium">Kontorstid:</span>
 <span className="text-muted-foreground">Mån-Fre 09:00-17:00</span>
 </div>
 </div>

 {/* Contact channels */}
 <section className="sb-section bg-background">
 <div className="sb-container">
 <div className="mb-8 md:mb-10">
              <h2 className="font-display text-3xl md:text-[44px] text-foreground">Kontakta oss</h2>

 </div>
 <div className="grid md:grid-cols-3 gap-4">
 {channels.map((ch) => (
 <div key={ch.title} className="sb-card p-6 flex flex-col hover:border-primary/50 hover:shadow-md transition-all">
 <div className="w-11 h-11 bg-primary rounded-md flex items-center justify-center mb-4">
 <ch.icon className="h-5 w-5 text-white" />
 </div>
 <h3 className="font-display text-xl text-foreground mb-2">{ch.title}</h3>
 <p className="text-sm text-muted-foreground leading-relaxed mb-3">{ch.desc}</p>
 {ch.detail && (
 <p className="font-display text-lg font-semibold text-primary mb-5">{ch.detail}</p>
 )}
 {ch.internal ? (
 <Link to={ch.href}>
 <Button variant="outline" className="h-10 rounded-lg border-primary text-primary hover:bg-primary hover:text-primary-foreground font-display uppercase font-semibold tracking-wide text-[15px] w-full">
 {ch.cta} <ArrowRight className="h-3 w-3 ml-1" />
 </Button>
 </Link>
 ) : (
 <a href={ch.href}>
 <Button variant="outline" className="h-10 rounded-lg border-primary text-primary hover:bg-primary hover:text-primary-foreground font-display uppercase font-semibold tracking-wide text-[15px] w-full">
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
 <section className="sb-section-alt">
 <div className="sb-container">
 <div className="mb-8 md:mb-10">
 <p className="eyebrow text-primary uppercase mb-1">Typ av ärende</p>
 <h2 className="font-display text-3xl md:text-[44px] text-foreground">Hur kan vi hjälpa till?</h2>
 </div>
 <div className="grid md:grid-cols-3 gap-4">
 {supportTypes.map((st) => (
 <div key={st.title} className="sb-card p-6">
 <div className={`w-10 h-10 ${st.bg} rounded-md flex items-center justify-center mb-4`}>
 <st.icon className={`h-5 w-5 ${st.color}`} />
 </div>
 <h3 className="font-display text-xl text-foreground mb-2">{st.title}</h3>
 <p className="text-sm text-muted-foreground leading-relaxed">{st.desc}</p>
 </div>
 ))}
 </div>
 </div>
 </section>

 {/* Promise section */}
 <section className="sb-container py-10 md:py-14">
 <div className="relative overflow-hidden rounded-lg bg-primary text-white">
 <div aria-hidden className="pointer-events-none absolute -left-24 -top-28 h-[380px] w-[380px] rotate-12 rounded-[64px] bg-white/[0.06]" />
 <div aria-hidden className="pointer-events-none absolute -right-28 -bottom-40 h-[380px] w-[380px] -rotate-12 rounded-[64px] bg-white/[0.04]" />
 <div className="relative px-6 py-10 md:px-16 md:py-14 text-center max-w-3xl mx-auto">
 <p className="eyebrow text-sky-200 uppercase mb-2">Vårt löfte</p>
 <h2 className="font-display text-3xl md:text-[44px] text-white mb-5">
 Vi svarar alltid - <em className="italic font-light text-white">på riktigt</em>
 </h2>
 <p className="text-white/80 leading-relaxed mb-8">
 Hos KAISEN möter du människor med erfarenhet och kunskap. Ingen automatiserad kundservice eller opersonliga standardsvar – bara personlig kontakt med en resespecialist som hjälper dig hela vägen.
 </p>
 <div className="grid grid-cols-3 gap-3 sm:gap-6 border-t border-white/15 pt-8">
 {[
 { value: "24h", label: "SNABB ÅTERKOPPLING" },
 { value: "24/7", label: "TRYGGHET UNDER RESAN" },
 { value: "100%", label: "PERSONLIG KONTAKT" },
 ].map((s) => (
 <div key={s.label}>
 <div className="font-display text-3xl md:text-4xl font-bold italic text-white mb-1">{s.value}</div>
 <div className="font-display text-xs sm:text-sm font-semibold tracking-wide text-white/70 uppercase">{s.label}</div>
 </div>
 ))}
 </div>
 </div>
 </div>
 </section>

 {/* Also see FAQ */}
 <section className="pb-4 bg-background">
 <div className="sb-container text-center">
 <p className="text-muted-foreground text-sm mb-4">Letar du efter svar på en specifik fråga?</p>
 <Link to="/faq">
 <Button variant="outline" className="h-10 rounded-lg border-primary text-primary hover:bg-primary hover:text-primary-foreground px-6 font-display uppercase font-semibold tracking-wide text-[15px]">
 Gå till FAQ <ArrowRight className="h-4 w-4 ml-2" />
 </Button>
 </Link>
 </div>
 </section>

 <Footer />
 </div>
 );
}
