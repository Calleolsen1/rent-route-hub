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
 desc: "Vi svarar samma dag, så länge mejlet kommer in under ordinarie öppettider.",
 detail: "info@kaisengroup.se",
 href: "mailto:info@kaisengroup.se",
 cta: "Skicka mejl",
 },
 {
 icon: MessageSquare,
 title: "Kontaktformulär",
 desc: "Fyll i vårt formulär för Reseförfrågan så återkommer vi så snart vi kan med ett förslag på reseupplägg.",
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
 title: "Akuta ärenden under resan",
 desc: "Befinner du dig på resa och behöver kontakta oss utanför ordinarie öppettider finner du vårt journummer på er bokningsbekräftelse. Det går också bra att mejla info@kaisengroup.se.",
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
 title: "Feedback",
 desc: "Har du rest med oss och vill dela med dig av dina intryck? Vi tar gärna emot både positiv och negativ feedback, den hjälper oss att bli bättre.",
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
 <div className="relative w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-10 py-8 md:py-12">
 <p className="eyebrow text-white/75 uppercase mb-1.5">Support</p>
 <h1 className="font-display text-[34px] sm:text-5xl md:text-6xl text-white mb-3">
 Vi finns här för <em className="italic font-light text-white">dig</em>
 </h1>
 <p className="text-white/85 max-w-2xl text-sm md:text-base leading-relaxed">
 Hör av dig när du planerar, inför avresan eller när du redan är på plats.
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
              <h2 className="font-display text-3xl md:text-[36px] lg:text-[44px] text-foreground">Kontakta oss</h2>

 </div>
 <div className="grid md:grid-cols-3 gap-x-10 gap-y-8">
 {channels.map((ch) => (
 <div key={ch.title} className="flex flex-col border-t border-border pt-5">
 <h3 className="flex items-center gap-2 font-display text-2xl text-foreground mb-2">
 <ch.icon className="h-4 w-4 text-primary" aria-hidden />
 {ch.title}
 </h3>
 <p className="text-sm text-muted-foreground leading-relaxed mb-3">{ch.desc}</p>
 {ch.detail && (
 <p className="text-base font-medium text-primary mb-5">{ch.detail}</p>
 )}
 {ch.internal ? (
 <Link to={ch.href}>
 <Button variant="outline" className="mt-auto h-11 rounded-full border-primary text-primary hover:bg-primary hover:text-primary-foreground text-sm font-medium w-full sm:w-auto px-6">
 {ch.cta} <ArrowRight className="h-3 w-3 ml-1" />
 </Button>
 </Link>
 ) : (
 <a href={ch.href}>
 <Button variant="outline" className="mt-auto h-11 rounded-full border-primary text-primary hover:bg-primary hover:text-primary-foreground text-sm font-medium w-full sm:w-auto px-6">
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
 <p className="eyebrow text-primary uppercase mb-2">Typ av ärende</p>
 <h2 className="font-display text-3xl md:text-[36px] lg:text-[44px] text-foreground">Hur kan vi hjälpa till?</h2>
 </div>
 <dl className="divide-y divide-border border-y border-border max-w-4xl">
 {supportTypes.map((st) => (
 <div key={st.title} className="grid md:grid-cols-[260px_1fr] gap-1 md:gap-8 py-5">
 <dt className="font-display text-xl text-foreground">{st.title}</dt>
 <dd className="text-sm text-muted-foreground leading-relaxed">{st.desc}</dd>
 </div>
 ))}
 </dl>
 </div>
 </section>

 {/* Promise section */}
 <section className="sb-container py-10 md:py-14">
 <div className="rounded-2xl bg-navy text-white">
 <div className="px-6 py-10 md:px-14 md:py-14 max-w-3xl">
 <p className="eyebrow text-white/75 uppercase mb-2">Vårt löfte</p>
 <h2 className="font-display text-3xl md:text-[36px] lg:text-[44px] text-white mb-5">
 Du pratar alltid med <em className="italic font-light text-white">en människa</em>
 </h2>
 <p className="text-white/80 leading-relaxed mb-8">
 Hos KAISEN svarar en erfaren resespecialist, inte en automatisk kundtjänst. Samma person hjälper dig från första frågan till hemresan.
 </p>
 <div className="grid grid-cols-3 gap-3 sm:gap-6 border-t border-white/15 pt-8">
 {[
 { value: "24h", label: "Snabb återkoppling" },
 { value: "24/7", label: "Trygghet under resan" },
 { value: "100%", label: "Personlig kontakt" },
 ].map((s) => (
 <div key={s.label}>
 <div className="font-display text-3xl md:text-4xl text-white mb-1">{s.value}</div>
 <div className="text-xs sm:text-sm text-white/70">{s.label}</div>
 </div>
 ))}
 </div>
 </div>
 </div>
 </section>

 {/* Also see FAQ */}
 <section className="pb-4 bg-background">
 <div className="sb-container">
 <p className="text-muted-foreground text-sm mb-4">Letar du efter svar på en specifik fråga?</p>
 <Link to="/faq">
 <Button variant="outline" className="h-11 rounded-full border-primary text-primary hover:bg-primary hover:text-primary-foreground px-7 text-sm font-medium">
 Gå till FAQ <ArrowRight className="h-4 w-4 ml-2" />
 </Button>
 </Link>
 </div>
 </section>

 <Footer />
 </div>
 );
}
