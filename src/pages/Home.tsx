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
import offerF1Monza from "@/assets/offer-f1-monza.jpg";
import offerRealBarca from "@/assets/offer-real-barca.jpg";
import offerLisbon from "@/assets/offer-lisbon.jpg";
import offerLaManga from "@/assets/offer-lamanga.jpg";
import offerF1Vegas from "@/assets/offer-f1-vegas.jpg";
import offerLiverpool from "@/assets/offer-liverpool.jpg";
import offerMallorca from "@/assets/offer-mallorca.jpg";
import offerF1AbuDhabi from "@/assets/offer-f1-abudhabi.jpg";

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
  { image: offerF1Monza, title: "F1 Monza", date: "6 sep 2026", tag: "F1", days: "4 dagar", fromPrice: "24 900", oldPrice: "29 900", href: "/services/sportresor?f1=italien-monza", isNew: false },
  { image: offerRealBarca, title: "Real Madrid – Barça", date: "26 okt 2026", tag: "Fotboll", days: "3 dagar", fromPrice: "18 400", oldPrice: "22 000", href: "/services/sportresor?league=la-liga&team=real-madrid", isNew: true },
  { image: offerLisbon, title: "Gruppresa Lissabon", date: "Q1 2027", tag: "Grupp", days: "5 dagar", fromPrice: "9 800", oldPrice: "12 500", href: "/group-travel", isNew: false },
  { image: offerLaManga, title: "Träningsläger La Manga", date: "Mars 2027", tag: "Träning", days: "7 dagar", fromPrice: "14 200", oldPrice: "17 000", href: "/services/traningslager", isNew: false },
  { image: offerF1Vegas, title: "F1 Las Vegas", date: "21 nov 2026", tag: "F1", days: "6 dagar", fromPrice: "42 000", oldPrice: "48 500", href: "/services/sportresor?f1=las-vegas", isNew: true },
  { image: offerLiverpool, title: "Premier League – Liverpool", date: "Nov 2026", tag: "Fotboll", days: "3 dagar", fromPrice: "16 900", oldPrice: "19 500", href: "/services/sportresor?league=premier-league&team=liverpool", isNew: false },
  { image: offerMallorca, title: "Konferens Mallorca", date: "Maj 2027", tag: "Konferens", days: "4 dagar", fromPrice: "11 500", oldPrice: "14 000", href: "/group-travel", isNew: false },
  { image: offerF1AbuDhabi, title: "F1 Abu Dhabi", date: "6 dec 2026", tag: "F1", days: "5 dagar", fromPrice: "32 500", oldPrice: "38 000", href: "/services/sportresor?f1=abu-dhabi", isNew: false },
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
  const [offerTab, setOfferTab] = useState<"alla" | "nya" | "populara">("alla");

  const offerTabs = [
    { id: "alla" as const, label: "Aktuella resor" },
    { id: "nya" as const, label: "Nya resor" },
    { id: "populara" as const, label: "Populära resor" },
  ];

  const filteredOffers =
    offerTab === "nya"
      ? quickOffers.filter((o) => o.isNew)
      : offerTab === "populara"
      ? quickOffers.slice(0, 5)
      : quickOffers;

  const navigate = useNavigate();

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = heroQuery.trim();
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  };


  return (
    <div
      className="min-h-screen"
      style={{
        // Roadtrips-inspired blue & white palette (homepage only)
        ['--primary' as any]: '201 100% 21%', // #00456B
        ['--primary-foreground' as any]: '0 0% 100%',
        ['--ring' as any]: '201 100% 21%',
        ['--navy' as any]: '201 100% 21%',
        ['--navy-foreground' as any]: '0 0% 100%',
        ['--gold' as any]: '210 39% 45%', // #4673A0
        ['--gold-light' as any]: '210 39% 65%',
        ['--gold-pale' as any]: '210 50% 95%',
        ['--accent' as any]: '210 50% 95%',
        ['--accent-foreground' as any]: '201 100% 21%',
      }}
    >
      <Navbar />

      {/* Search bar — full width, above hero (Intrepid-style with date range) */}
      <section className="bg-background">
        <div className="w-full max-w-4xl mx-auto px-6 md:px-10 pt-6 md:pt-8 pb-4">
          <form
            onSubmit={handleHeroSearch}
            className="flex items-stretch bg-white border border-border rounded-full shadow-sm p-1.5 md:p-2"
          >
            {/* Search input */}
            <div className="relative flex items-center flex-1 pl-4 md:pl-5">
              <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0" strokeWidth={2} />
              <Input
                type="search"
                value={heroQuery}
                onChange={(e) => setHeroQuery(e.target.value)}
                placeholder="Sök destination, lag, race eller resetyp..."
                className="h-11 md:h-12 border-0 bg-transparent pl-3 text-base focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none placeholder:text-muted-foreground"
              />
            </div>

            {/* Divider */}
            <div className="hidden md:block w-px bg-border my-2.5" />

            {/* Date range */}
            <div className="hidden md:flex items-center gap-2 px-5">
              <Calendar className="h-5 w-5 text-muted-foreground flex-shrink-0" strokeWidth={2} />
              <Input
                type="text"
                aria-label="Startdatum"
                placeholder="Startdatum"
                onFocus={(e) => (e.currentTarget.type = "date")}
                onBlur={(e) => { if (!e.currentTarget.value) e.currentTarget.type = "text"; }}
                className="h-11 md:h-12 w-[120px] border-0 bg-transparent px-1 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
              />
              <span className="text-muted-foreground">—</span>
              <Input
                type="text"
                aria-label="Slutdatum"
                placeholder="Slutdatum"
                onFocus={(e) => (e.currentTarget.type = "date")}
                onBlur={(e) => { if (!e.currentTarget.value) e.currentTarget.type = "text"; }}
                className="h-11 md:h-12 w-[120px] border-0 bg-transparent px-1 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
              />
            </div>

            <Button
              type="submit"
              className="h-11 md:h-12 rounded-full bg-primary hover:bg-primary/90 px-7 text-sm font-medium flex-shrink-0"
            >
              Sök
              <Search className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </div>
      </section>

      {/* Hero carousel — contained rounded card, Intrepid-style */}
      <section className="relative bg-background pb-4 md:pb-6">
        <div className="w-full max-w-[1600px] mx-auto px-6 md:px-10">
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
      <section className="bg-background pt-2 md:pt-3 pb-8 md:pb-10">
        <div className="w-full max-w-[1600px] mx-auto px-6 md:px-10">

          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border/60">
            <div className="px-6 py-4 md:py-2 text-center">
              <p className="font-sans font-semibold text-lg md:text-xl text-foreground leading-snug">
                2 400+ resor<br className="hidden md:block" /> arrangerade
              </p>
            </div>
            <div className="px-6 py-4 md:py-2 text-center">
              <p className="font-sans font-semibold text-lg md:text-xl text-foreground leading-snug">
                98% nöjda<br className="hidden md:block" /> kunder
              </p>
            </div>
            <div className="px-6 py-4 md:py-2 text-center">
              <p className="font-sans font-semibold text-lg md:text-xl text-foreground leading-snug">
                60+ destinationer<br className="hidden md:block" /> världen över
              </p>
            </div>
          </div>
        </div>
      </section>



      {/* Konkreta reseerbjudanden — Intrepid-style cards */}
      <section className="pt-4 pb-8 md:pb-10 bg-background">
        <div className="w-full max-w-[1600px] mx-auto px-6 md:px-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
            <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
              {offerTabs.map((tab) => {
                const active = tab.id === offerTab;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setOfferTab(tab.id)}
                    className={`relative pb-3 font-sans font-semibold text-base md:text-lg transition-colors ${
                      active ? "text-foreground" : "text-foreground/50 hover:text-foreground/80"
                    }`}
                  >
                    {tab.label}
                    {active && (
                      <span className="absolute left-0 right-0 -bottom-px h-[3px] bg-primary rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
            <Link
              to="/services"
              className="self-start md:self-auto inline-flex items-center justify-center text-sm font-semibold text-foreground border border-border px-5 py-2.5 rounded-full hover:bg-foreground hover:text-background transition-colors"
            >
              Utforska alla resor
            </Link>
          </div>

          <Carousel opts={{ align: "start", dragFree: true }}>
            <CarouselContent className="-ml-5">
              {filteredOffers.map((offer) => (
                <CarouselItem
                  key={offer.title}
                  className="pl-5 basis-[80%] sm:basis-1/2 md:basis-1/3 lg:basis-1/4"
                >
                  <Link
                    to={offer.href}
                    className="group block h-full bg-card rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.10)] transition-shadow"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img
                        src={offer.image}
                        alt={offer.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                      {offer.isNew && (
                        <span className="absolute top-3 right-3 bg-white text-foreground text-[11px] font-semibold px-2.5 py-1 rounded">
                          Ny
                        </span>
                      )}
                      <h3 className="absolute inset-x-0 bottom-0 p-4 font-sans font-bold text-white text-lg md:text-xl leading-tight">
                        {offer.title}
                      </h3>
                    </div>
                    <div className="p-5">
                      <p className="text-xs text-foreground/60 mb-1">{offer.days}</p>
                      <p className="font-sans font-semibold text-foreground text-base mb-5 leading-snug">
                        {offer.tag} · {offer.date}
                      </p>
                      <div className="border-t border-border/60 pt-4 text-right text-sm">
                        <span className="text-foreground/50">Från </span>
                        <span className="text-foreground/40 line-through mr-1">{offer.oldPrice} SEK</span>
                        <span className="font-bold text-foreground">{offer.fromPrice} SEK</span>
                      </div>
                    </div>
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex -left-5 h-10 w-10 bg-white border-border shadow-md" />
            <CarouselNext className="hidden md:flex -right-5 h-10 w-10 bg-white border-border shadow-md" />
          </Carousel>
        </div>

      </section>

      {/* Längre erbjudanden — service cards carousel */}
      <section className="pt-4 pb-12 md:pb-16 bg-background">
        <div className="w-full max-w-[1600px] mx-auto px-6 md:px-10">
          <div className="flex items-center justify-between mb-8 gap-6">
            <h2 className="font-sans font-semibold text-xl md:text-2xl text-foreground relative pb-2 after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-16 after:h-[2px] after:bg-primary">
              Upplevelser som formar minnen
            </h2>
            <Link to="/services" className="hidden md:inline-flex items-center gap-2 text-sm font-semibold text-primary border border-primary/30 px-5 py-2.5 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors">
              Se alla
            </Link>
          </div>

          <Carousel opts={{ align: "start" }}>
            <CarouselContent className="-ml-4">
              {services.map((service) => (
                <CarouselItem key={service.title} className="pl-4 basis-[70%] sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
                  <Link to={service.href} className="group block h-full">
                    <div className="relative overflow-hidden rounded-lg aspect-[4/3] mb-3">
                      <img
                        src={service.image}
                        alt={service.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-navy/20 to-transparent" />
                      <div className="absolute top-3 left-3">
                        <span className="text-[9px] tracking-[0.2em] uppercase bg-primary text-primary-foreground px-2.5 py-1 font-sans">
                          {service.tag}
                        </span>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="font-display text-lg text-white mb-0.5">{service.title}</h3>
                        <p className="text-[10px] tracking-wider text-gold-light uppercase font-sans">{service.subtitle}</p>
                      </div>
                    </div>
                    <p className="text-muted-foreground text-xs leading-relaxed mb-2">{service.description}</p>
                    <span className="text-primary text-xs font-medium tracking-wide flex items-center gap-2 transition-all group-hover:gap-3">
                      Läs mer <ArrowRight className="h-3 w-3" />
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
      <section className="py-20 md:py-28 bg-cream">
        <div className="w-full max-w-[1400px] mx-auto px-6 md:px-10">
          <h2 className="font-sans font-semibold text-3xl md:text-5xl text-foreground text-center mb-16 md:mb-20">
            Vad gör oss annorlunda
          </h2>

          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="max-w-xl">
              <h3 className="font-sans font-bold text-2xl md:text-4xl text-foreground mb-6 leading-tight">
                Resor designade kring dig
              </h3>
              <p className="text-foreground/70 text-base md:text-lg leading-relaxed mb-8">
                I en värld av automatiserade bokningar och standardpaket sticker Kaisen Travel Group ut. Vi tror att de bästa reseupplevelserna börjar med en riktig mänsklig kontakt — ett samtal, en gemensam vision och ett åtagande att få varje detalj att stämma.
              </p>
              <Link
                to="/about"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-semibold px-7 py-3 rounded-full hover:bg-primary/90 transition-colors"
              >
                Läs mer om oss
              </Link>
            </div>

            <div className="relative rounded-2xl overflow-hidden aspect-[5/4] md:aspect-[4/3]">
              <img
                src={luxuryImage}
                alt="Glad resenär i vackert landskap"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>



      {/* Referenser — testimonials carousel */}
      <section className="kaisen-section bg-background">
        <div className="w-full max-w-[1600px] mx-auto px-6 md:px-10">
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
      <section className="py-16 md:py-24 bg-background">
        <div className="w-full max-w-[1600px] mx-auto px-6 md:px-10">
          <div className="relative overflow-hidden rounded-3xl bg-navy p-10 md:p-16 grid md:grid-cols-[1fr_auto] gap-10 items-center">
            {/* Decorative blurred gold orbs */}
            <div className="pointer-events-none absolute -top-24 -right-16 w-80 h-80 rounded-full bg-gold/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 -left-20 w-96 h-96 rounded-full bg-primary/40 blur-3xl" />

            <div className="relative max-w-2xl">
              <p className="text-[11px] tracking-[0.3em] text-gold uppercase mb-4 font-sans font-semibold">Kontakta oss</p>
              <h2 className="font-sans text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
                Ditt nästa äventyr börjar med ett <em className="italic font-light text-gold-light">samtal</em>
              </h2>
              <p className="text-base text-white/70 leading-relaxed">
                Prata med en Kaisen-konsult idag. Inga mallar, inga algoritmer — bara genuin expertis dedikerad till din perfekta resa.
              </p>
            </div>
            <Link to="/contact" className="relative md:justify-self-end">
              <Button size="lg" className="rounded-full bg-gold hover:bg-gold/90 text-navy font-semibold px-8 text-sm shadow-lg">
                Börja planera nu
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>


      <Footer />
    </div>
  );
};

export default Home;
