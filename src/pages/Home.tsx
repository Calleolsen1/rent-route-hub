import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Trophy, Star, Shield, Globe, Plane } from "lucide-react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import FAQSection from "@/components/home/FAQSection";
import heroImage from "@/assets/kaisen-hero.jpg";
import groupImage from "@/assets/kaisen-group.jpg";
import sportsImage from "@/assets/kaisen-sports.jpg";
import luxuryImage from "@/assets/kaisen-luxury.jpg";

const stats = [
  { value: "2 400+", label: "Resor arrangerade" },
  { value: "98%", label: "Nöjda kunder" },
  { value: "60+", label: "Destinationer" },
  { value: "15+", label: "År av expertis" },
];

const services = [
  {
    title: "Sportresor",
    subtitle: "F1 · Fotboll · Golf",
    description: "Upplev F1-race på Circuit de Monaco, Champions League-finaler eller exklusiva golfrundor på världens bästa banor. Vi ordnar allt — biljetter, boende och VIP-access.",
    image: sportsImage,
    href: "/services#sports",
    tag: "Premiumupplevelser",
  },
  {
    title: "Gruppresor",
    subtitle: "Resor som samlar människor",
    description: "Från företagsevent och konferenser till kompisgäng och familjeresor. Vi sköter hela logistiken för grupper från 8 upp till 200+ personer.",
    image: groupImage,
    href: "/group-travel",
    tag: "8–200+ personer",
  },
  {
    title: "Incoming",
    subtitle: "Ta emot världen i Sverige",
    description: "Vi tar hand om internationella grupper och delegationer som besöker Sverige — med skräddarsydda program, guider och upplevelser som lyfter fram det bästa Sverige har att erbjuda.",
    image: heroImage,
    href: "/services#incoming",
    tag: "Sverige som destination",
  },
  {
    title: "Weekendresor",
    subtitle: "Europa på nolltid",
    description: "En lång helg i Paris, Lissabon eller Prag? Vi paketerar de bästa weekendresorna i Europa med hotell, aktiviteter och smidig logistik — utan att du behöver lyfta ett finger.",
    image: luxuryImage,
    href: "/services#weekend",
    tag: "Europa · Helgresor",
  },
  {
    title: "VIP-service",
    subtitle: "Din personliga reseassistent",
    description: "En dedikerad rådgivare som hanterar all din reseservice — privata resor, affärsresor, sista minuten-ändringar och allt däremellan. För dig som kräver det bästa.",
    image: luxuryImage,
    href: "/services#vip",
    tag: "Exklusivt · Personligt",
  },
];

const testimonials = [
  {
    quote: "Kaisen ordnade vår F1-resa till Monaco ner i minsta detalj. VIP-paddock, hotell med utsikt över banan och middag på Michelin-restaurang — helt magiskt.",
    author: "Erik Lindström",
    role: "VD, Nordic Ventures",
    rating: 5,
  },
  {
    quote: "Vi var 45 personer på företagsresa till Barcelona. Kaisen skötte allt och alla var begeistrade. Absolut bästa företagsresan vi haft.",
    author: "Anna Bergström",
    role: "HR-chef, Scandic Industries",
    rating: 5,
  },
  {
    quote: "Som affärsresenär värdesätter jag att allt bara fungerar. Med Kaisens VIP-service är varje resa smidig och stressfri, oavsett om det är Tokyo eller London.",
    author: "Marcus Johansson",
    role: "Konsult, internationell verksamhet",
    rating: 5,
  },
];

const whyUs = [
  {
    icon: Users,
    title: "Personlig kontakt",
    description: "En dedikerad resekonsult guidar dig från första samtal till hemkomst. Inga chatbotar, inget callcenter.",
  },
  {
    icon: Trophy,
    title: "Sportspecialister",
    description: "Djup kunskap om F1, fotboll och golf garanterar att du kommer åt det andra inte kan — VIP-access, paddock-pass och de bästa platserna.",
  },
  {
    icon: Globe,
    title: "Incoming-experter",
    description: "Vi är lika starka på att ta emot internationella gäster i Sverige som att skicka svenska grupper ut i världen.",
  },
  {
    icon: Shield,
    title: "Alltid tillgängliga",
    description: "24/7-support under hela resan. Vi finns alltid ett samtal bort, var i världen du än befinner dig.",
  },
];

const Home = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      {/* Hero */}
      <section className="relative min-h-[92vh] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Kaisen Travel Group — Lyxiga gruppresor"
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-navy/60 to-transparent" />
        </div>

        <div className="relative container mx-auto px-4 pb-16 md:pb-24 pt-32">
          <div className="max-w-2xl">
            <p className="text-xs tracking-[0.3em] text-gold-light uppercase mb-6 font-sans">
              Personlig Reseservice
            </p>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-light text-white leading-tight mb-6">
              Resor skapade<br />
              <em className="font-light italic text-gold-light">Just för dig</em>
            </h1>
            <p className="text-white/70 text-lg leading-relaxed mb-10 max-w-lg">
              Sportresor, gruppresor, incoming och VIP-service — allt levererat med personlig omsorg av en dedikerad resekonsult.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/contact">
                <Button size="lg" className="rounded-none bg-primary hover:bg-primary/90 text-primary-foreground px-8 tracking-wider text-sm">
                  Planera din resa
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/services">
                <Button size="lg" variant="outline" className="rounded-none border-white/40 text-white hover:bg-white/10 px-8 tracking-wider text-sm">
                  Utforska tjänster
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-60">
          <div className="w-px h-12 bg-white/50 animate-pulse" />
        </div>
      </section>

      {/* Stats */}
      <section className="bg-primary py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat) => (
              <div key={stat.label}>
                <div className="font-display text-3xl md:text-4xl text-primary-foreground mb-1">{stat.value}</div>
                <div className="text-xs tracking-widest uppercase text-primary-foreground/70 font-sans">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="kaisen-section bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-xs tracking-[0.3em] text-primary uppercase mb-4 font-sans">Våra Specialområden</p>
            <h2 className="font-display text-4xl md:text-5xl text-foreground mb-4">
              Upplevelser som<br />
              <em className="italic font-light">formar minnen</em>
            </h2>
            <div className="w-12 h-px bg-primary mx-auto" />
          </div>

          {/* Top 3 services */}
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            {services.slice(0, 3).map((service) => (
              <Link key={service.title} to={service.href} className="group block">
                <div className="relative overflow-hidden aspect-[3/4] mb-5">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-navy/20 to-transparent" />
                  <div className="absolute top-4 left-4">
                    <span className="text-[10px] tracking-[0.2em] uppercase bg-primary text-primary-foreground px-3 py-1 font-sans">
                      {service.tag}
                    </span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="font-display text-2xl text-white mb-1">{service.title}</h3>
                    <p className="text-xs tracking-wider text-gold-light uppercase font-sans">{service.subtitle}</p>
                  </div>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">{service.description}</p>
                <span className="text-primary text-sm font-medium tracking-wide flex items-center gap-2 transition-all group-hover:gap-3">
                  Läs mer <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            ))}
          </div>

          {/* Bottom 2 services */}
          <div className="grid md:grid-cols-2 gap-6">
            {services.slice(3).map((service) => (
              <Link key={service.title} to={service.href} className="group block">
                <div className="relative overflow-hidden aspect-[16/7] mb-5">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-navy/20 to-transparent" />
                  <div className="absolute top-4 left-4">
                    <span className="text-[10px] tracking-[0.2em] uppercase bg-primary text-primary-foreground px-3 py-1 font-sans">
                      {service.tag}
                    </span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="font-display text-2xl text-white mb-1">{service.title}</h3>
                    <p className="text-xs tracking-wider text-gold-light uppercase font-sans">{service.subtitle}</p>
                  </div>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">{service.description}</p>
                <span className="text-primary text-sm font-medium tracking-wide flex items-center gap-2 transition-all group-hover:gap-3">
                  Läs mer <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why Kaisen */}
      <section className="kaisen-section bg-navy">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs tracking-[0.3em] text-gold uppercase mb-4 font-sans">Varför Kaisen</p>
              <h2 className="font-display text-4xl md:text-5xl text-white mb-6 leading-tight">
                Resor designade<br />
                <em className="italic font-light text-gold-light">kring dig</em>
              </h2>
              <p className="text-white/60 leading-relaxed mb-10 text-base">
                I en värld av automatiserade bokningar och standardpaket sticker Kaisen Travel Group ut. Vi tror att de bästa reseupplevelserna börjar med en riktig mänsklig kontakt — ett samtal, en gemensam vision och ett åtagande att få varje detalj att stämma.
              </p>
              <div className="grid sm:grid-cols-2 gap-8">
                {whyUs.map((item) => (
                  <div key={item.title} className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <item.icon className="h-4 w-4 text-gold" />
                    </div>
                    <div>
                      <h4 className="font-display text-lg text-white mb-1">{item.title}</h4>
                      <p className="text-white/50 text-sm leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[4/5] overflow-hidden">
                <img
                  src={luxuryImage}
                  alt="Personlig lyxresa"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-primary p-6 max-w-[200px]">
                <div className="font-display text-3xl text-primary-foreground mb-1">15+</div>
                <div className="text-[10px] tracking-[0.2em] uppercase text-primary-foreground/70 font-sans">År av extraordinära resor</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="kaisen-section bg-cream">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-xs tracking-[0.3em] text-primary uppercase mb-4 font-sans">Vad våra kunder säger</p>
            <h2 className="font-display text-4xl md:text-5xl text-foreground">
              Berättelser från<br />
              <em className="italic font-light">resan</em>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t) => (
              <div key={t.author} className="bg-card p-8 border border-border">
                <div className="flex gap-1 mb-6">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-primary text-primary" />
                  ))}
                </div>
                <blockquote className="font-display text-xl text-foreground leading-relaxed mb-6 italic">
                  "{t.quote}"
                </blockquote>
                <div>
                  <div className="font-medium text-foreground text-sm">{t.author}</div>
                  <div className="text-xs text-muted-foreground tracking-wide mt-1">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="relative py-28 overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImage} alt="CTA bakgrund" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-navy/80" />
        </div>
        <div className="relative container mx-auto px-4 text-center">
          <p className="text-xs tracking-[0.3em] text-gold uppercase mb-4 font-sans">Redo att börja?</p>
          <h2 className="font-display text-4xl md:text-6xl text-white mb-6">
            Ditt nästa äventyr<br />
            <em className="italic font-light text-gold-light">börjar med ett samtal</em>
          </h2>
          <p className="text-white/60 max-w-lg mx-auto mb-10 leading-relaxed">
            Prata med en Kaisen-konsult idag. Inga mallar, inga algoritmer — bara genuin expertis dedikerad till din perfekta resa.
          </p>
          <Link to="/contact">
            <Button size="lg" className="rounded-none bg-primary hover:bg-primary/90 px-10 tracking-widest text-sm">
              Börja planera nu
              <ArrowRight className="ml-3 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <FAQSection />

      <Footer />
    </div>
  );
};

export default Home;
