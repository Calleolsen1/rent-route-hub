import { Link } from "react-router-dom";
import { ArrowRight, LogIn, MapPin, Calendar, CreditCard, Users, Headphones, FileText, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

const topics = [
  {
    icon: LogIn,
    title: "Mitt konto & inloggning",
    desc: "Logga in, hantera ditt konto och spåra dina bokningar i realtid.",
    articles: [
      "Hur skapar jag ett konto?",
      "Jag har glömt mitt lösenord",
      "Hur håller jag koll på min resa?",
      "Uppdatera mina kontaktuppgifter",
    ],
    comingSoon: true,
  },
  {
    icon: Calendar,
    title: "Bokningar & Ändringar",
    desc: "Allt om hur din resa bokas, bekräftas och eventuellt ändras.",
    articles: [
      "Hur bekräftas min bokning?",
      "Kan jag ändra datum eller antal resenärer?",
      "Vad händer om jag behöver avboka?",
      "Resehandlingar och vouchers",
    ],
  },
  {
    icon: CreditCard,
    title: "Betalning & Fakturering",
    desc: "Betalningsvillkor, fakturor och hur vår faktureringsprocess fungerar.",
    articles: [
      "Standardbetalning — 30 dagars faktura",
      "Handpenning och delbetalning",
      "Hur får jag min faktura?",
      "Betalning i utländsk valuta",
    ],
  },
  {
    icon: Users,
    title: "Gruppresor",
    desc: "Specifika frågor om att resa i grupp — logistik, priser och upplägg.",
    articles: [
      "Minsta grupstorlek",
      "Gruprabatter och offertprocess",
      "Hantera resenärslista",
      "Specialkost och tillgänglighet",
    ],
  },
  {
    icon: MapPin,
    title: "Destinationer & Upplevelser",
    desc: "Information om våra destinationer, event och vad vi kan ordna på plats.",
    articles: [
      "Vilka destinationer arbetar ni med?",
      "Sportevent och VIP-biljetter",
      "Lokala guider och aktiviteter",
      "Incoming — ta emot grupper i Sverige",
    ],
  },
  {
    icon: Headphones,
    title: "Support under resan",
    desc: "Vad gör du om något uppstår under pågående resa — vi finns alltid tillgängliga.",
    articles: [
      "Akut hjälp under resan",
      "Kontakta oss utanför kontorstid",
      "Förseningar och störningar",
      "Klagomål och feedback",
    ],
  },
];

export default function HelpCenter() {
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
          <p className="text-white/60 max-w-xl mx-auto leading-relaxed">
            Hitta svar på dina frågor eller kontakta oss direkt — vi är alltid nära till hands.
          </p>
        </div>
      </section>

      {/* Coming soon: login portal teaser */}
      <section className="bg-primary/10 border-b border-primary/20 py-5">
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
              <Button size="sm" variant="outline" className="rounded-none border-primary text-primary hover:bg-primary hover:text-primary-foreground text-xs tracking-wider whitespace-nowrap">
                Få tidig åtkomst <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Topics grid */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-xs tracking-[0.3em] text-primary uppercase mb-4 font-sans">Ämnesområden</p>
            <h2 className="font-display text-3xl text-foreground">Bläddra efter ämne</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topics.map((topic) => (
              <div key={topic.title} className="border border-border bg-card p-6 hover:border-primary/40 transition-colors group">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-10 h-10 bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <topic.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl text-foreground mb-1">{topic.title}</h3>
                    {topic.comingSoon && (
                      <span className="text-[10px] tracking-wider uppercase bg-primary/10 text-primary px-2 py-0.5 font-sans">Kommer snart</span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{topic.desc}</p>
                <div className="w-6 h-px bg-primary mb-4" />
                <ul className="space-y-2">
                  {topic.articles.map((a) => (
                    <li key={a} className="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                      <ChevronRight className="h-3 w-3 text-primary flex-shrink-0" />
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works — booking update notifications */}
      <section className="py-16 bg-cream">
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
                desc: "Snart lanserar vi en inloggningssida där du kan se alla dina resor, fakturor och uppdateringar på ett ställe.",
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
          <Link to="/contact">
            <Button className="rounded-none bg-white text-primary hover:bg-white/90 px-10 tracking-wider text-sm font-semibold">
              Kontakta oss <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
