import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { formatEventDateTime } from "@/lib/formatSek";
import { resolveImageUrl } from "@/components/admin/ImageUploader";
import { PriceTag } from "@/components/PriceTag";
import { usePublicPricesEnabled } from "@/hooks/usePublicPrices";
import { SearchTypeahead } from "@/components/SearchTypeahead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Users, Trophy, Star, Shield, Globe, Calendar, MapPin, Flag, Search } from "lucide-react";
import Footer from "@/components/Footer";
import RequestCta from "@/components/RequestCta";
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
import f1Image from "@/assets/sport-f1.jpg";
import fotbollImage from "@/assets/sport-fotboll.jpg";
import valenciaImage from "@/assets/camp-valencia-pitch.jpg.asset.json";
import luxuryImage from "@/assets/kaisen-luxury.jpg";
import offerF1Monza from "@/assets/offer-f1-monza.jpg";
import offerLisbon from "@/assets/offer-lisbon.jpg";

import offerLiverpool from "@/assets/offer-liverpool.jpg";
import offerMallorca from "@/assets/offer-mallorca.jpg";

// Lookup so DB-driven slides can reference bundled assets by name without
// shipping their URLs in the DB. Uploaded images use full https URLs instead.
const ASSET_LOOKUP: Record<string, string> = {
  "kaisen-hero": heroImage,
  "kaisen-sports": sportsImage,
  "kaisen-group": groupImage,
  "kaisen-incoming": incomingImage,
};

type HeroSlide = {
  image: string;
  eyebrow: string;
  title: string;
  italic: string;
  description: string;
  primary: { label: string; to: string };
};

// Fallback slides used until admin saves any in the DB (or if the query fails).
// Matches the original hardcoded set verbatim.
const fallbackHeroSlides: HeroSlide[] = [
  {
    image: heroImage,
    eyebrow: "Personlig Reseservice",
    title: "Resor skapade",
    italic: "Just för dig",
    description:
      "Sportresor, gruppresor, träningsläger och VIP-service - levererat med personlig omsorg av en dedikerad resekonsult.",
    primary: { label: "Planera din resa", to: "/contact" },
  },
  {
    image: sportsImage,
    eyebrow: "Reklamvideo kommer",
    title: "Upplev sportens",
    italic: "största ögonblick",
    description:
      "F1-race i Monaco, Premier League på Anfield eller Champions League-finaler - vi ordnar biljetter, boende och VIP-access.",
    primary: { label: "Se sportresor", to: "/services/sportresor" },
  },
  {
    image: groupImage,
    eyebrow: "Grupp & Konferens",
    title: "Gruppresor &",
    italic: "konferenser",
    description:
      "Från företagsevent till kompisgäng - vi sköter hela logistiken för grupper från 8 upp till 200+ personer.",
    primary: { label: "Läs mer", to: "/group-travel" },
  },
  {
    image: incomingImage,
    eyebrow: "Träningsläger",
    title: "Träna där",
    italic: "proffsen tränar",
    description:
      "Fotboll, simning, friidrott och fler sporter - kompletta läger med boende, transfer och planhyra.",
    primary: { label: "Se träningsläger", to: "/services/traningslager" },
  },
];

// TODO: fyll i riktiga siffror här och avkommentera stats-sektionen längre ner
// const stats = [
//   { value: "...", label: "Resor arrangerade" },
//   { value: "...", label: "Nöjda kunder" },
//   { value: "...", label: "Destinationer" },
//   { value: "...", label: "År av expertis" },
// ];

// Inquiry-funnel tiles (group / training / conference) - these aren't supplier
// ticket events, they're CTAs into the inquiry form, so they stay static.
const inquiryOffers: FeaturedOffer[] = [
  { image: offerLisbon, title: "Gruppresa Lissabon", date: "Q1 2027", tag: "Grupp", days: "5 dagar", fromPrice: null, compareAtPrice: null, compareAtPct: null, currentPriceSek: null, href: "/group-travel", isNew: false },
  { image: offerMallorca, title: "Konferens Mallorca", date: "Maj 2027", tag: "Konferens", days: "4 dagar", fromPrice: null, compareAtPrice: null, compareAtPct: null, currentPriceSek: null, href: "/group-travel", isNew: false },
];

type FeaturedOffer = {
  image: string;
  title: string;
  date: string;
  tag: string;
  days: string | null;
  fromPrice: string | null;
  compareAtPrice: number | null;
  compareAtPct: number | null;
  currentPriceSek: number | null;
  href: string;
  isNew: boolean;
  isPopular?: boolean;
};

// Image fallbacks by sport when an event has no cover_image_url.
const sportImageFallback: Record<string, string> = {
  soccer: offerLiverpool,
  formula1: offerF1Monza,
};

function mapEventToOffer(ev: {
  id: string;
  sport: string;
  home_team: string | null;
  away_team: string | null;
  race_name: string | null;
  tournament_name: string;
  starts_at: string;
  cover_image_url: string | null;
  ends_at: string | null;
  min_price_sek: number | null;
  compare_at_price_sek: number | null;
  compare_at_pct: number | null;
}): FeaturedOffer {
  const title = ev.sport === "soccer"
    ? `${ev.home_team ?? ""} - ${ev.away_team ?? ""}`.trim()
    : ev.race_name ?? ev.tournament_name;
  const days = ev.ends_at
    ? `${Math.max(1, Math.round((new Date(ev.ends_at).getTime() - new Date(ev.starts_at).getTime()) / 86400000) + 1)} dagar`
    : null;
  return {
    image: ev.cover_image_url ?? sportImageFallback[ev.sport] ?? offerF1Monza,
    title,
    date: formatEventDateTime(ev.starts_at).split(" kl")[0],
    tag: ev.sport === "soccer" ? "Fotboll" : "F1",
    days,
    fromPrice: ev.min_price_sek ? new Intl.NumberFormat("sv-SE").format(ev.min_price_sek) : null,
    compareAtPrice: ev.compare_at_price_sek != null ? Number(ev.compare_at_price_sek) : null,
    compareAtPct: ev.compare_at_pct != null ? Number(ev.compare_at_pct) : null,
    currentPriceSek: ev.min_price_sek != null ? Number(ev.min_price_sek) : null,
    href: `/sport/event/${ev.id}`,
    isNew: false,
  };
}


const services = [
  {
    title: "Fotboll",
    subtitle: "Premier League · Champions League",
    description:
      "Från Premier League-derbyn till Champions League - vi paketerar resan med platser på läktaren, hotell och transfer.",
    image: fotbollImage,
    href: "/services/sportresor/fotboll",
    tag: "Matchupplevelser",
  },
  {
    title: "Formel 1",
    subtitle: "Monaco · Silverstone · Spa",
    description:
      "Känn adrenalinet när racerna dundrar förbi. Komplett F1-resa med bra platser, boende nära banan och all logistik ordnad.",
    image: f1Image,
    href: "/services/sportresor/f1",
    tag: "Premiumupplevelser",
  },
  {
    title: "Träningsläger",
    subtitle: "Fotboll · Simning · Friidrott",
    description:
      "Kompletta träningsläger på de bästa destinationerna - boende, transfer, planhyra och måltider ingår.",
    image: valenciaImage.url,
    href: "/services/traningslager",
    tag: "Lag & klubbar",
  },
  {
    title: "Grupp & Konferens",
    subtitle: "Resor som samlar människor",
    description:
      "Från företagsevent och konferenser till kompisgäng och familjeresor. Vi sköter hela logistiken för grupper från 8 upp till 200+ personer.",
    image: groupImage,
    href: "/group-travel",
    tag: "8-200+ personer",
  },
];

const testimonials = [
  {
    quote:
      "Kaisen ordnade vår F1-resa till Monaco ner i minsta detalj. VIP-paddock, hotell med utsikt över banan och middag på Michelin-restaurang - helt magiskt.",
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
      "Vårt träningsläger i Spanien blev över förväntan. Allt klaffade - boende, mat, planer och transfer. Kommer definitivt boka igen.",
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
    description: "Djup kunskap om F1, fotboll och golf - VIP-access, paddock-pass och de bästa platserna.",
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
  const navigate = useNavigate();
  const [featured, setFeatured] = useState<FeaturedOffer[]>([]);
  const [curatedTrips, setCuratedTrips] = useState<FeaturedOffer[]>([]);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>(fallbackHeroSlides);
  const [compareAtDefaultPct, setCompareAtDefaultPct] = useState<number>(0);
  const { enabled: showPrices } = usePublicPricesEnabled();

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any).rpc("get_platform_decimal", {
        p_key: "compare_at_default_pct",
        p_default: 0,
      });
      setCompareAtDefaultPct(Number(data ?? 0));
    })();
  }, []);
  const [testimonialsRows, setTestimonialsRows] = useState<typeof testimonials | null>(null);
  const [whyUsRows, setWhyUsRows] = useState<typeof whyUs | null>(null);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = heroQuery.trim();
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  };

  // Editable content from DB (testimonials, why-us). Falls back to the
  // hardcoded constants in this file if the tables are empty or unreachable.
  useEffect(() => {
    (async () => {
      const [{ data: t }, { data: w }] = await Promise.all([
        (supabase as any)
          .from("testimonials")
          .select("quote, author, role, rating")
          .eq("is_active", true)
          .order("sort_order", { ascending: true }),
        (supabase as any)
          .from("why_us_cards")
          .select("icon, title, description")
          .eq("is_active", true)
          .order("sort_order", { ascending: true }),
      ]);
      if (t && t.length) setTestimonialsRows(t as typeof testimonials);
      if (w && w.length) {
        // Map stored Lucide icon names back to imported components
        const ICON_MAP: Record<string, typeof Users> = { Users, Trophy, Globe, Shield };
        setWhyUsRows(
          (w as Array<{ icon: string; title: string; description: string }>).map((row) => ({
            icon: ICON_MAP[row.icon] ?? Users,
            title: row.title,
            description: row.description,
          })) as typeof whyUs,
        );
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from("home_slides")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      const rows = (data ?? []) as Array<{
        image_url: string;
        eyebrow: string | null;
        title: string;
        italic: string | null;
        description: string | null;
        cta_label: string | null;
        cta_to: string | null;
      }>;
      if (rows.length === 0) return; // keep fallback
      setHeroSlides(
        rows.map((r) => ({
          image: resolveImageUrl(r.image_url, ASSET_LOOKUP, heroImage),
          eyebrow: r.eyebrow ?? "",
          title: r.title,
          italic: r.italic ?? "",
          description: r.description ?? "",
          primary: {
            label: r.cta_label ?? "Läs mer",
            to: r.cta_to ?? "/",
          },
        })),
      );
    })();
  }, []);

  useEffect(() => {
    (async () => {
      // Cast to any: nested select + is_featured filter aren't yet in the
      // generated Supabase types (the column ships with the events foundation
      // migration). Regen `src/integrations/supabase/types.ts` after applying
      // the migration to drop this cast.
      const { data } = await (supabase as any)
        .from("events")
        .select(
          "id, sport, home_team, away_team, race_name, tournament_name, starts_at, ends_at, cover_image_url, min_price_sek, compare_at_price_sek, compare_at_pct",
        )
        .eq("is_featured", true)
        .eq("status", "upcoming")
        .gte("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: true })
        .limit(8);
      const rows = (data ?? []).map((ev: any) => mapEventToOffer(ev));
      setFeatured(rows);
    })();
  }, []);

  // Admin-curated trip cards ("Resor på startsidan"). These work without the
  // ticket API, so the row is never empty at launch.
  useEffect(() => {
    (async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await (supabase as any)
        .from("home_trips")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      const rows = ((data ?? []) as Array<any>)
        .filter((r) => !r.valid_until || r.valid_until >= today)
        .map((r) => ({
          image: resolveImageUrl(r.image_url ?? "", ASSET_LOOKUP, heroImage),
          title: r.title,
          date: r.date_label ?? "",
          tag: r.tag ?? "Resa",
          days: r.days_label ?? null,
          fromPrice: null,
          compareAtPrice: null,
          compareAtPct: null,
          currentPriceSek: r.price_from_sek != null ? Number(r.price_from_sek) : null,
          href: r.href ?? "/contact",
          isNew: !!r.is_new,
          isPopular: !!r.is_popular,
        })) as FeaturedOffer[];
      setCuratedTrips(rows);
    })();
  }, []);

  const offerTabs = [
    { id: "alla" as const, label: "Aktuella resor" },
    { id: "nya" as const, label: "Nya resor" },
    { id: "populara" as const, label: "Populära resor" },
  ];

  // Admin-curated trips first, then ticket events. The static inquiry tiles
  // only top up the row when there are fewer than 3 cards, so the section is
  // never sparse - even with the ticket API switched off.
  const baseOffers: FeaturedOffer[] = [...curatedTrips, ...featured];
  const combinedOffers: FeaturedOffer[] =
    baseOffers.length >= 3 ? baseOffers : [...baseOffers, ...inquiryOffers];

  // Tabs always show something: fall back to the full row when nothing is
  // flagged as new/popular.
  const newOffers = combinedOffers.filter((o) => o.isNew);
  const popularOffers = combinedOffers.filter((o) => o.isPopular);
  const filteredOffers =
    offerTab === "nya"
      ? newOffers.length
        ? newOffers
        : combinedOffers
      : offerTab === "populara"
      ? popularOffers.length
        ? popularOffers
        : combinedOffers.slice(0, 5)
      : combinedOffers;





  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Search bar - full width, above hero (Intrepid-style) */}
      <section className="bg-background">
        <div className="w-full max-w-4xl mx-auto px-6 md:px-10 pt-6 md:pt-8 pb-4">
          <SearchTypeahead />
        </div>
      </section>


      {/* Hero carousel - contained rounded card, Intrepid-style */}
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
                          <p className="text-[11px] tracking-[0.3em] text-white uppercase mb-4 font-sans">
                            {slide.eyebrow}
                          </p>
                          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-light text-white leading-tight mb-6">
                            {slide.title}
                            <br />
                            <em className="font-light italic text-white">{slide.italic}</em>
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
                    i === activeHero ? "w-8 bg-white" : "w-1.5 bg-white/50"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TODO: Stats-sektion borttagen tills riktiga siffror finns att redovisa.
          Avkommentera och fyll i i Home.tsx när data är på plats.
      <section className="bg-background pt-2 md:pt-3 pb-8 md:pb-10">
        <div className="w-full max-w-[1600px] mx-auto px-6 md:px-10">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border/60">
            <div className="px-6 py-4 md:py-2 text-center">
              <p className="font-sans font-semibold text-lg md:text-xl text-foreground leading-snug">
                ... resor<br className="hidden md:block" /> arrangerade
              </p>
            </div>
          </div>
        </div>
      </section>
      */}



      {/* Konkreta reseerbjudanden - Intrepid-style cards */}
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
              to="/resor"
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
                      {offer.days && (
                        <p className="text-xs text-foreground/60 mb-1">{offer.days}</p>
                      )}
                      <p className="font-sans font-semibold text-foreground text-base mb-5 leading-snug">
                        {offer.tag} · {offer.date}
                      </p>
                      <div className="border-t border-border/60 pt-4">
                        {showPrices ? (
                          <PriceTag
                            currentSek={offer.currentPriceSek}
                            compareAt={{
                              eventSek: offer.compareAtPrice,
                              eventPct: offer.compareAtPct,
                              defaultPct: compareAtDefaultPct,
                            }}
                          />
                        ) : (
                          <span className="text-sm text-muted-foreground">Pris på förfrågan</span>
                        )}
                        <Button asChild className="mt-5 h-12 w-full rounded-full text-base font-semibold">
                          <span>
                            Se erbjudanden
                            <ArrowRight className="ml-auto" />
                          </span>
                        </Button>
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

      {/* Längre erbjudanden - service cards carousel */}
      <section className="pt-4 pb-12 md:pb-16 bg-background">
        <div className="w-full max-w-[1600px] mx-auto px-6 md:px-10">
          <div className="flex items-center justify-between mb-8 gap-6">
            <h2 className="font-sans font-semibold text-xl md:text-2xl text-foreground relative pb-2 after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-16 after:h-[2px] after:bg-primary">
              Upplevelser som formar minnen
            </h2>
            <Link to="/resor" className="hidden md:inline-flex items-center gap-2 text-sm font-semibold text-primary border border-primary/30 px-5 py-2.5 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors">
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
                        <p className="text-[10px] tracking-wider text-white uppercase font-sans">{service.subtitle}</p>
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
          </Carousel>
        </div>
      </section>

      {/* Om oss */}
      <section className="py-10 md:py-14 bg-background">
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
                I en värld av automatiserade bokningar och standardpaket sticker Kaisen Travel Group ut. Vi tror att de bästa reseupplevelserna börjar med en riktig mänsklig kontakt - ett samtal, en gemensam vision och ett åtagande att få varje detalj att stämma.
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



      {/* Referenser - testimonials carousel */}
      <section className="py-10 md:py-14 bg-cream">
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
              {(testimonialsRows ?? testimonials).map((t) => (
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
            {/* Decorative blurred orbs */}
            <div className="pointer-events-none absolute -top-24 -right-16 w-80 h-80 rounded-full bg-primary/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 -left-20 w-96 h-96 rounded-full bg-primary/40 blur-3xl" />

            <div className="relative max-w-2xl">
              <p className="text-[11px] tracking-[0.3em] text-primary uppercase mb-4 font-sans font-semibold">Kontakta oss</p>
              <h2 className="font-sans text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
                Ditt nästa äventyr börjar med ett <em className="italic font-light text-white">samtal</em>
              </h2>
              <p className="text-base text-white/70 leading-relaxed">
                Prata med en Kaisen-konsult idag. Inga mallar, inga algoritmer - bara genuin expertis dedikerad till din perfekta resa.
              </p>
            </div>
            <Link to="/contact" className="relative md:justify-self-end">
              <Button size="lg" className="rounded-full bg-white hover:bg-white/90 text-navy font-semibold px-10 py-7 text-base shadow-lg">
                Börja planera nu
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>


      <RequestCta />
      <Footer />
    </div>
  );
};

export default Home;
