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
    eyebrow: "Grupp & Konferens",
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
  const [heroQuery, setHeroQuery] = useState("");
  const navigate = useNavigate();

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = heroQuery.trim();
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  };


  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Search bar — full width, above hero (Intrepid-style with date range) */}
      <section className="bg-background">
        <div className="container mx-auto px-4 pt-6 md:pt-8 pb-4">
          <form
            onSubmit={handleHeroSearch}
            className="flex flex-col md:flex-row items-stretch gap-2 md:gap-0 bg-card border border-border md:rounded-full rounded-2xl shadow-sm overflow-hidden p-2 md:pl-6 md:pr-2"
          >
            {/* Search input */}
            <div className="relative flex items-center flex-1 md:pr-6">
              <Search className="absolute left-3 md:left-0 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
              <Input
                type="search"
                value={heroQuery}
                onChange={(e) => setHeroQuery(e.target.value)}
                placeholder="Sök destination, lag, race eller resetyp..."
                className="h-12 md:h-14 border-0 bg-transparent pl-11 md:pl-9 text-base focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
              />
            </div>

            {/* Divider */}
            <div className="hidden md:block w-px bg-border my-3" />

            {/* Date range */}
            <div className="hidden md:flex items-center gap-2 px-6">
              <Calendar className="h-5 w-5 text-primary flex-shrink-0" />
              <Input
                type="text"
                aria-label="Start date"
                placeholder="Start date"
                onFocus={(e) => (e.currentTarget.type = "date")}
                onBlur={(e) => { if (!e.currentTarget.value) e.currentTarget.type = "text"; }}
                className="h-12 md:h-14 w-[140px] border-0 bg-transparent px-2 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none text-muted-foreground"
              />
              <span className="text-muted-foreground">—</span>
              <Input
                type="text"
                aria-label="End date"
                placeholder="End date"
                onFocus={(e) => (e.currentTarget.type = "date")}
                onBlur={(e) => { if (!e.currentTarget.value) e.currentTarget.type = "text"; }}
                className="h-12 md:h-14 w-[140px] border-0 bg-transparent px-2 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none text-muted-foreground"
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="h-12 md:h-14 md:rounded-full rounded-xl bg-primary hover:bg-primary/90 px-8 tracking-wider text-sm font-medium"
            >
              Sök
              <Search className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </div>
      </section>

      {/* Hero carousel — contained rounded card, Intrepid-style */}
      <section className="relative bg-background pb-12 md:pb-16">
        <div className="container mx-auto px-4">
          <div className="relative rounded-2xl md:rounded-3xl overflow-hidden">
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
                    <div className="relative h-[58vh] min-h-[420px] max-h-[640px] overflow-hidden">
                      <img
                        src={slide.image}
                        alt={slide.title}
                        className="absolute inset-0 w-full h-full object-cover"
                        loading={idx === 0 ? "eager" : "lazy"}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-navy/85 via-navy/30 to-transparent" />
                      <div className="relative h-full flex items-end p-8 md:p-14">
                        <div className="max-w-xl">
                          <p className="text-[11px] tracking-[0.3em] text-gold-light uppercase mb-4 font-sans">
                            {slide.eyebrow}
                          </p>
                          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-light text-white leading-tight mb-6">
                            {slide.title}
                            <br />
                            <em className="font-light italic text-gold-light">{slide.italic}</em>
                          </h1>
                          <Link to={slide.primary.to}>
                            <Button
                              size="lg"
                              className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground px-7 h-12 text-sm font-medium"
                            >
                              {slide.primary.label}
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-4 md:left-6 bg-white hover:bg-white/90 text-foreground border-0 h-11 w-11 shadow-md" />
              <CarouselNext className="right-4 md:right-6 bg-white hover:bg-white/90 text-foreground border-0 h-11 w-11 shadow-md" />
            </Carousel>

            {/* Dots */}
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {heroSlides.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 transition-all ${
                    i === activeHero ? "w-8 bg-gold-light" : "w-1.5 bg-white/50"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats highlights — Intrepid-style, 3 columns with vertical dividers */}
      <section className="bg-background pb-16 md:pb-20">
        <div className="container mx-auto px-4">
          <h2 className="text-center font-display text-2xl md:text-3xl text-foreground mb-10 md:mb-14">
            Personlig reseservice — för riktiga upplevelser, världen över
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
            {stats.slice(0, 3).map((stat) => (
              <div key={stat.label} className="px-6 py-6 md:py-2 text-center">
                <div className="font-display text-2xl md:text-3xl text-foreground mb-2">
                  {stat.value} {stat.label.toLowerCase()}
                </div>
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
