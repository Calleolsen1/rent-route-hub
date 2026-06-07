import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Users, Trophy, Star, Shield, Globe, Calendar, MapPin, Flag, Search } from "lucide-react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import heroImage from "@/assets/kaisen-hero.jpg";
import groupImage from "@/assets/kaisen-group.jpg";
import sportsImage from "@/assets/kaisen-sports.jpg";
import incomingImage from "@/assets/kaisen-incoming.jpg";
import weekendImage from "@/assets/kaisen-weekend.jpg";
import vipImage from "@/assets/kaisen-vip.jpg";
import luxuryImage from "@/assets/kaisen-luxury.jpg";

const heroSlides = [
  {
    image: heroImage,
    eyebrow: "Personlig Reseservice",
    title: "Resor skapade",
    italic: "Just för dig",
    description:
      "Sportresor, gruppresor, träningsläger och VIP-service — levererat med personlig omsorg av en dedikerad resekonsult.",
    primary: { label: "Planera din resa", to: "/contact" },
    secondary: { label: "Utforska tjänster", to: "/services" },
  },
  {
    image: sportsImage,
    eyebrow: "Reklamvideo kommer",
    title: "Upplev sportens",
    italic: "största ögonblick",
    description:
      "F1-race i Monaco, Premier League på Anfield eller Champions League-finaler — vi ordnar biljetter, boende och VIP-access.",
    primary: { label: "Se sportresor", to: "/services/sportresor" },
    secondary: { label: "Kontakta oss", to: "/contact" },
  },
  {
    image: groupImage,
    eyebrow: "Sökfunktion kommer",
    title: "Gruppresor &",
    italic: "konferenser",
    description:
      "Från företagsevent till kompisgäng — vi sköter hela logistiken för grupper från 8 upp till 200+ personer.",
    primary: { label: "Läs mer", to: "/group-travel" },
    secondary: { label: "Få offert", to: "/contact" },
  },
  {
    image: incomingImage,
    eyebrow: "Träningsläger",
    title: "Träna där",
    italic: "proffsen tränar",
    description:
      "Fotboll, simning, friidrott och fler sporter — kompletta läger med boende, transfer och planhyra.",
    primary: { label: "Se träningsläger", to: "/services/traningslager" },
    secondary: { label: "Kontakt", to: "/contact" },
  },
];

const stats = [
  { value: "2 400+", label: "Resor arrangerade" },
  { value: "98%", label: "Nöjda kunder" },
  { value: "60+", label: "Destinationer" },
  { value: "25+", label: "År av expertis" },
];

const quickOffers = [
  { icon: Flag, title: "F1 Monza", date: "6 sep 2026", tag: "F1", href: "/services/sportresor?f1=italien-monza" },
  { icon: Trophy, title: "Real Madrid – Barça", date: "26 okt 2026", tag: "Fotboll", href: "/services/sportresor?league=la-liga&team=real-madrid" },
  { icon: Users, title: "Gruppresa Lissabon", date: "Q1 2027", tag: "Grupp", href: "/group-travel" },
  { icon: MapPin, title: "Träningsläger La Manga", date: "Mars 2027", tag: "Träning", href: "/services/traningslager" },
  { icon: Flag, title: "F1 Las Vegas", date: "21 nov 2026", tag: "F1", href: "/services/sportresor?f1=las-vegas" },
  { icon: Trophy, title: "Premier League – Liverpool", date: "Nov 2026", tag: "Fotboll", href: "/services/sportresor?league=premier-league&team=liverpool" },
  { icon: Calendar, title: "Konferens Mallorca", date: "Maj 2027", tag: "Konferens", href: "/group-travel" },
  { icon: Flag, title: "F1 Abu Dhabi", date: "6 dec 2026", tag: "F1", href: "/services/sportresor?f1=abu-dhabi" },
];

const services = [
  {
    title: "Sportresor",
    subtitle: "F1 · Fotboll · Golf",
    description:
      "Upplev F1-race på Circuit de Monaco, Champions League-finaler eller exklusiva golfrundor på världens bästa banor.",
    image: sportsImage,
    href: "/services/sportresor",
    tag: "Premiumupplevelser",
  },
  {
    title: "Grupp & Konferens",
    subtitle: "Resor som samlar människor",
    description:
      "Från företagsevent och konferenser till kompisgäng och familjeresor. Vi sköter hela logistiken för grupper från 8 upp till 200+ personer.",
    image: groupImage,
    href: "/group-travel",
    tag: "8–200+ personer",
  },
  {
    title: "Träningsläger",
    subtitle: "Fotboll · Simning · Friidrott",
    description:
      "Kompletta träningsläger på de bästa destinationerna — boende, transfer, planhyra och måltider ingår.",
    image: incomingImage,
    href: "/services/traningslager",
    tag: "Lag & klubbar",
  },
  {
    title: "Weekendresor",
    subtitle: "Europa på nolltid",
    description:
      "En lång helg i Paris, Lissabon eller Prag? Vi paketerar weekendresor med hotell, aktiviteter och smidig logistik.",
    image: weekendImage,
    href: "/services/weekend-getaway",
    tag: "Europa · Helgresor",
  },
  {
    title: "VIP-service",
    subtitle: "Din personliga reseassistent",
    description:
      "En dedikerad rådgivare som hanterar all din reseservice — privata resor, affärsresor och sista minuten-ändringar.",
    image: vipImage,
    href: "/services/vip-service",
    tag: "Exklusivt · Personligt",
  },
];

const testimonials = [
  {
    quote:
      "Kaisen ordnade vår F1-resa till Monaco ner i minsta detalj. VIP-paddock, hotell med utsikt över banan och middag på Michelin-restaurang — helt magiskt.",
    author: "Erik Lindström",
    role: "VD, Nordic Ventures",
    rating: 5,
  },
  {
    quote:
      "Vi var 45 personer på företagsresa till Barcelona. Kaisen skötte allt och alla var begeistrade. Absolut bästa företagsresan vi haft.",
    author: "Anna Bergström",
    role: "HR-chef, Scandic Industries",
    rating: 5,
  },
  {
    quote:
      "Som affärsresenär värdesätter jag att allt bara fungerar. Med Kaisens VIP-service är varje resa smidig och stressfri.",
    author: "Marcus Johansson",
    role: "Konsult, internationell verksamhet",
    rating: 5,
  },
  {
    quote:
      "Vårt träningsläger i Spanien blev över förväntan. Allt klaffade — boende, mat, planer och transfer. Kommer definitivt boka igen.",
    author: "Johan Eriksson",
    role: "Tränare, IFK Göteborg P-08",
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
    description: "Djup kunskap om F1, fotboll och golf — VIP-access, paddock-pass och de bästa platserna.",
  },
  {
    icon: Globe,
    title: "Globalt nätverk",
    description: "Lokala partners i över 60 destinationer säkrar de bästa upplevelserna oavsett vart du reser.",
  },
  {
    icon: Shield,
    title: "Alltid tillgängliga",
    description: "24/7-support under hela resan. Vi finns alltid ett samtal bort, var i världen du än befinner dig.",
  },
];

const Home = () => {
  const [activeHero, setActiveHero] = useState(0);

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero carousel — slightly shorter so next section peeks */}
      <section className="relative">
        <Carousel
          opts={{ loop: true }}
          className="w-full"
          setApi={(api) => {
            if (!api) return;
            api.on("select", () => setActiveHero(api.selectedScrollSnap()));
          }}
        >
          <CarouselContent>
            {heroSlides.map((slide, idx) => (
              <CarouselItem key={idx}>
                <div className="relative h-[62vh] min-h-[480px] overflow-hidden">
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading={idx === 0 ? "eager" : "lazy"}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/50 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-r from-navy/60 to-transparent" />
                  <div className="relative container mx-auto px-4 h-full flex items-end pb-16 md:pb-20 pt-24">
                    <div className="max-w-2xl">
                      <p className="text-xs tracking-[0.3em] text-gold-light uppercase mb-5 font-sans">
                        {slide.eyebrow}
                      </p>
                      <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-light text-white leading-tight mb-5">
                        {slide.title}
                        <br />
                        <em className="font-light italic text-gold-light">{slide.italic}</em>
                      </h1>
                      <p className="text-white/75 text-base md:text-lg leading-relaxed mb-8 max-w-lg">
                        {slide.description}
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Link to={slide.primary.to}>
                          <Button
                            size="lg"
                            className="rounded-none bg-primary hover:bg-primary/90 text-primary-foreground px-8 tracking-wider text-sm"
                          >
                            {slide.primary.label}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                        <Link to={slide.secondary.to}>
                          <Button
                            size="lg"
                            variant="outline"
                            className="rounded-none border-white/60 text-white bg-white/10 hover:bg-white/20 px-8 tracking-wider text-sm"
                          >
                            {slide.secondary.label}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-4 md:left-8 bg-white/10 hover:bg-white/20 text-white border-white/30 h-11 w-11" />
          <CarouselNext className="right-4 md:right-8 bg-white/10 hover:bg-white/20 text-white border-white/30 h-11 w-11" />
        </Carousel>

        {/* Dots */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {heroSlides.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 transition-all ${
                i === activeHero ? "w-8 bg-gold-light" : "w-1.5 bg-white/40"
              }`}
            />
          ))}
        </div>
      </section>

      {/* Stats / nyckeltal */}
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

      {/* Konkreta reseerbjudanden — swipeable icon cards */}
      <section className="py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-10 gap-6">
            <div>
              <p className="text-xs tracking-[0.3em] text-primary uppercase mb-3 font-sans">Aktuella erbjudanden</p>
              <h2 className="font-display text-3xl md:text-4xl text-foreground">
                Bokningsbara <em className="italic font-light">just nu</em>
              </h2>
            </div>
            <Link to="/services" className="hidden md:inline-flex items-center gap-2 text-sm text-primary tracking-wider uppercase hover:gap-3 transition-all">
              Se alla <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <Carousel opts={{ align: "start", dragFree: true }}>
            <CarouselContent className="-ml-4">
              {quickOffers.map((offer) => (
                <CarouselItem key={offer.title} className="pl-4 basis-[78%] sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
                  <Link
                    to={offer.href}
                    className="group block border border-border bg-card p-6 h-full hover:border-primary transition-colors"
                  >
                    <div className="flex items-start justify-between mb-6">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <offer.icon className="h-5 w-5" />
                      </div>
                      <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-sans">
                        {offer.tag}
                      </span>
                    </div>
                    <h3 className="font-display text-lg text-foreground mb-1 leading-snug">{offer.title}</h3>
                    <p className="text-xs text-muted-foreground tracking-wider uppercase mb-6">{offer.date}</p>
                    <span className="inline-flex items-center gap-2 text-xs text-primary tracking-wider uppercase group-hover:gap-3 transition-all">
                      Boka <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex -left-5 h-10 w-10" />
            <CarouselNext className="hidden md:flex -right-5 h-10 w-10" />
          </Carousel>
        </div>
      </section>

      {/* Längre erbjudanden — service cards carousel */}
      <section className="py-16 md:py-24 bg-cream">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-10 gap-6">
            <div>
              <p className="text-xs tracking-[0.3em] text-primary uppercase mb-3 font-sans">Våra specialområden</p>
              <h2 className="font-display text-3xl md:text-4xl text-foreground">
                Upplevelser som <em className="italic font-light">formar minnen</em>
              </h2>
            </div>
            <Link to="/services" className="hidden md:inline-flex items-center gap-2 text-sm text-primary tracking-wider uppercase hover:gap-3 transition-all">
              Se alla <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <Carousel opts={{ align: "start" }}>
            <CarouselContent className="-ml-6">
              {services.map((service) => (
                <CarouselItem key={service.title} className="pl-6 basis-[85%] sm:basis-1/2 lg:basis-1/3">
                  <Link to={service.href} className="group block h-full">
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
                    <p className="text-muted-foreground text-sm leading-relaxed mb-3">{service.description}</p>
                    <span className="text-primary text-sm font-medium tracking-wide flex items-center gap-2 transition-all group-hover:gap-3">
                      Läs mer <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex -left-5 h-10 w-10" />
            <CarouselNext className="hidden md:flex -right-5 h-10 w-10" />
          </Carousel>
        </div>
      </section>

      {/* Om oss */}
      <section className="kaisen-section bg-navy">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs tracking-[0.3em] text-gold uppercase mb-4 font-sans">Om oss</p>
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
              <Link to="/about" className="inline-flex items-center gap-2 mt-10 text-sm text-gold-light tracking-wider uppercase hover:gap-3 transition-all">
                Läs mer om oss <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="relative">
              <div className="aspect-[4/5] overflow-hidden">
                <img
                  src={luxuryImage}
                  alt="Glad resenär i vackert landskap"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-primary p-6 max-w-[200px]">
                <div className="font-display text-3xl text-primary-foreground mb-1">25+</div>
                <div className="text-[10px] tracking-[0.2em] uppercase text-primary-foreground/70 font-sans">År av extraordinära resor</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Referenser — testimonials carousel */}
      <section className="kaisen-section bg-cream">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-xs tracking-[0.3em] text-primary uppercase mb-4 font-sans">Referenser</p>
            <h2 className="font-display text-4xl md:text-5xl text-foreground">
              Berättelser från<br />
              <em className="italic font-light">resan</em>
            </h2>
          </div>

          <Carousel opts={{ align: "start", loop: true }}>
            <CarouselContent className="-ml-6">
              {testimonials.map((t) => (
                <CarouselItem key={t.author} className="pl-6 basis-[88%] md:basis-1/2 lg:basis-1/3">
                  <div className="bg-card p-8 border border-border h-full flex flex-col">
                    <div className="flex gap-1 mb-6">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-primary text-primary" />
                      ))}
                    </div>
                    <blockquote className="font-display text-lg text-foreground leading-relaxed mb-6 italic flex-1">
                      "{t.quote}"
                    </blockquote>
                    <div>
                      <div className="font-medium text-foreground text-sm">{t.author}</div>
                      <div className="text-xs text-muted-foreground tracking-wide mt-1">{t.role}</div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex -left-5 h-10 w-10" />
            <CarouselNext className="hidden md:flex -right-5 h-10 w-10" />
          </Carousel>
        </div>
      </section>

      {/* Kontakta oss CTA */}
      <section className="relative py-24 md:py-28 overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImage} alt="Kontakta oss bakgrund" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-navy/80" />
        </div>
        <div className="relative container mx-auto px-4 text-center">
          <p className="text-xs tracking-[0.3em] text-gold uppercase mb-4 font-sans">Kontakta oss</p>
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

      <Footer />
    </div>
  );
};

export default Home;
