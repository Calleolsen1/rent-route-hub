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
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import heroImage from "@/assets/kaisen-hero.jpg";
import groupImageAsset from "@/assets/kaisen-group-europe-skyline.jpg.asset.json";
const groupImage = groupImageAsset.url;
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

/** Time each hero slide stays before the next one slides in. */
const HERO_AUTOPLAY_MS = 3000;

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
      "KAISEN ordnade vår F1-resa till Monaco ner i minsta detalj. VIP-paddock, hotell med utsikt över banan och middag på Michelin-restaurang - helt magiskt.",
    author: "Erik Lindström",
    role: "VD, Nordic Ventures",
    rating: 5,
  },
  {
    quote:
      "Vi var 45 personer på företagsresa till Barcelona. KAISEN skötte allt och alla var begeistrade. Absolut bästa företagsresan vi haft.",
    author: "Anna Bergström",
    role: "HR-chef, Scandic Industries",
    rating: 5,
  },
  {
    quote:
      "Som affärsresenär värdesätter jag att allt bara fungerar. Med KAISENs VIP-service är varje resa smidig och stressfri.",
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
  const [heroApi, setHeroApi] = useState<CarouselApi>();
  const [heroPaused, setHeroPaused] = useState(false);
  const [heroQuery, setHeroQuery] = useState("");
  const navigate = useNavigate();
  const [featured, setFeatured] = useState<FeaturedOffer[]>([]);
  const [curatedTrips, setCuratedTrips] = useState<FeaturedOffer[]>([]);
  const [experienceRows, setExperienceRows] = useState<
    Array<{
      title: string;
      subtitle: string;
      description: string;
      image: string;
      href: string;
      tag: string;
      ctaLabel?: string;
    }> | null
  >(null);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>(fallbackHeroSlides);
  // Photos stay hidden until the admin-managed rows arrive, so visitors never
  // see the bundled fallback images flash before the real ones.
  const [slidesLoaded, setSlidesLoaded] = useState(false);
  const [experiencesLoaded, setExperiencesLoaded] = useState(false);

  // Hero autoplay: next slide every HERO_AUTOPLAY_MS. Paused while the
  // pointer is on the hero or the tab is hidden, and the clock restarts on
  // every slide change — so a manual click never gets a slide yanked away a
  // moment later. Off for visitors who ask for reduced motion.
  useEffect(() => {
    if (!heroApi || heroPaused || heroSlides.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer = 0;
    const restart = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(function tick() {
        if (document.visibilityState === "visible") heroApi.scrollNext();
        timer = window.setTimeout(tick, HERO_AUTOPLAY_MS);
      }, HERO_AUTOPLAY_MS);
    };
    restart();
    heroApi.on("select", restart);
    return () => {
      window.clearTimeout(timer);
      heroApi.off("select", restart);
    };
  }, [heroApi, heroPaused, heroSlides.length]);
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
      if (rows.length === 0) { setSlidesLoaded(true); return; } // keep fallback
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
      setSlidesLoaded(true);
    })().catch(() => setSlidesLoaded(true));
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

  // Admin-curated experience cards ("Upplevelser. På riktigt.").
  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from("home_experiences")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      const rows = (data ?? []) as Array<any>;
      if (!rows.length) { setExperiencesLoaded(true); return; }
      setExperienceRows(
        rows.map((r, i) => ({
          title: r.title,
          subtitle: r.subtitle ?? "",
          description: r.description ?? "",
          image: resolveImageUrl(r.image_url ?? "", ASSET_LOOKUP, services[i % services.length].image),
          href: r.href ?? "/contact",
          tag: r.tag ?? "",
          ctaLabel: r.cta_label ?? "Läs mer",
        })),
      );
      setExperiencesLoaded(true);
    })().catch(() => setExperiencesLoaded(true));
  }, []);


  // Admin-curated trips first, then ticket events. The static inquiry tiles
  // only top up the row when there are fewer than 3 cards, so the section is
  // never sparse - even with the ticket API switched off.
  const baseOffers: FeaturedOffer[] = [...curatedTrips, ...featured];
  const combinedOffers: FeaturedOffer[] =
    baseOffers.length >= 3 ? baseOffers : [...baseOffers, ...inquiryOffers];

  // The section shows the trips the admin has flagged as popular. If none are
  // flagged yet, fall back to the first five so the row is never empty.
  const popularOffers = combinedOffers.filter((o) => o.isPopular);
  const filteredOffers = popularOffers.length
    ? popularOffers
    : combinedOffers.slice(0, 5);





  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Search bar - full width, above hero (Intrepid-style) */}
      <section className="bg-background">
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-4 sm:px-6 md:px-10 pt-4 sm:pt-6 md:pt-8 pb-3 sm:pb-4">
          <SearchTypeahead />
        </div>
      </section>


      {/* Hero carousel - contained rounded card, Intrepid-style */}
      <section className="relative bg-background pb-4 md:pb-6">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-4 sm:px-6 md:px-10">
          <div
            className="relative rounded-2xl md:rounded-3xl overflow-hidden"
            onMouseEnter={() => setHeroPaused(true)}
            onMouseLeave={() => setHeroPaused(false)}
          >
            <Carousel
              opts={{ loop: true }}
              className="w-full"
              setApi={(api) => {
                if (!api) return;
                api.on("select", () => setActiveHero(api.selectedScrollSnap()));
                setHeroApi(api);
              }}
            >
              <CarouselContent>
                {heroSlides.map((slide, idx) => (
                  <CarouselItem key={idx}>
                    <div className={`relative h-[54vh] min-h-[340px] max-h-[640px] md:h-[58vh] md:min-h-[420px] overflow-hidden bg-navy ${slidesLoaded ? "" : "[&>*]:invisible"}`}>
                      {slidesLoaded && (
                        <img
                          src={slide.image}
                          alt={slide.title}
                          className="absolute inset-0 w-full h-full object-cover"
                          loading={idx === 0 ? "eager" : "lazy"}
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/40 to-transparent" />
                      {/* Side padding clears the prev/next arrows (shown from sm). */}
                      <div className="relative h-full flex items-end p-5 pb-12 sm:p-8 sm:pl-20 md:p-14 md:pl-24">
                        <div className="max-w-xl">
                          <p className="text-[11px] eyebrow text-white uppercase mb-2 sm:mb-4 font-sans">
                            {slide.eyebrow}
                          </p>
                          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light text-white leading-tight mb-4 sm:mb-6">
                            {slide.title}
                            <br />
                            <em className="font-light italic text-white">{slide.italic}</em>
                          </h1>
                          <Link to={slide.primary.to}>
                            <Button
                              size="lg"
                              className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground px-6 sm:px-7 h-11 sm:h-12 text-sm font-medium"
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
              <CarouselPrevious className="hidden sm:flex left-4 md:left-6 bg-white hover:bg-white/90 text-foreground border-0 h-11 w-11 shadow-md" />
              <CarouselNext className="hidden sm:flex right-4 md:right-6 bg-white hover:bg-white/90 text-foreground border-0 h-11 w-11 shadow-md" />
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
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-10">
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
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
            <h2 className="font-sans font-semibold text-xl md:text-2xl text-foreground relative pb-2 after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-16 after:h-[2px] after:bg-primary">
              Populära resor
            </h2>
            <Link
              to="/resor"
              className="self-start md:self-auto inline-flex items-center justify-center text-sm font-semibold text-foreground border border-border px-5 py-2.5 rounded-full hover:bg-foreground hover:text-background transition-colors"
            >
              Utforska alla resor
            </Link>
          </div>

          <Carousel opts={{ align: "start", dragFree: true }}>
            <CarouselContent className="-ml-4">
              {filteredOffers.map((offer) => (
                <CarouselItem
                  key={offer.title}
                  className="pl-4 basis-[62%] sm:basis-1/2 md:basis-1/3 lg:basis-1/4"
                >
                  <Link
                    to={offer.href}
                    className="group block h-full bg-card rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.10)] transition-shadow"
                  >
                    <div className="relative aspect-[16/10] sm:aspect-[4/3] overflow-hidden">
                      <img
                        src={offer.image}
                        alt={offer.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                      {offer.isNew && (
                        <span className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-white text-foreground text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded">
                          Ny
                        </span>
                      )}
                      <h3 className="absolute inset-x-0 bottom-0 p-3 sm:p-4 font-sans font-bold text-white text-base sm:text-lg md:text-xl leading-tight">
                        {offer.title}
                      </h3>
                    </div>
                    <div className="p-3 sm:p-5">
                      {offer.days && (
                        <p className="text-xs text-foreground/60 mb-1">{offer.days}</p>
                      )}
                      <p className="font-sans font-semibold text-foreground text-sm sm:text-base mb-3 sm:mb-5 leading-snug">
                        {offer.tag} · {offer.date}
                      </p>
                      <div className="border-t border-border/60 pt-3 sm:pt-4">
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
                        <Button asChild className="mt-3 sm:mt-5 h-10 sm:h-12 w-full rounded-full text-sm sm:text-base font-semibold">
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
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-10">
          <div className="flex items-center justify-between mb-8 gap-6">
            <h2 className="font-sans font-semibold text-xl md:text-2xl text-foreground relative pb-2 after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-16 after:h-[2px] after:bg-primary">
              Upplevelser. På riktigt.
            </h2>
            <Link to="/resor" className="hidden md:inline-flex items-center gap-2 text-sm font-semibold text-primary border border-primary/30 px-5 py-2.5 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors">
              Se alla
            </Link>
          </div>

          <Carousel opts={{ align: "start" }}>
            <CarouselContent className={`-ml-4 transition-opacity duration-300 ${experiencesLoaded ? "opacity-100" : "opacity-0"}`}>
              {(experienceRows ?? services).map((service: any) => (
                <CarouselItem key={service.title} className="pl-4 basis-[62%] sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
                  <Link to={service.href} className="group block h-full">
                    <div className="relative overflow-hidden rounded-lg aspect-[16/10] sm:aspect-[4/3] mb-2 sm:mb-3">
                      <img
                        src={service.image}
                        alt={service.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-navy/20 to-transparent" />
                      {service.tag ? (
                        <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
                          <span className="text-[8px] sm:text-[9px] tracking-[0.2em] uppercase bg-primary text-primary-foreground px-2 py-0.5 sm:px-2.5 sm:py-1 font-sans">
                            {service.tag}
                          </span>
                        </div>
                      ) : null}
                      <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                        <h3 className="font-display text-base sm:text-lg text-white mb-0.5 leading-tight">{service.title}</h3>
                        <p className="text-[9px] sm:text-[10px] tracking-wider text-white uppercase font-sans">{service.subtitle}</p>
                      </div>
                    </div>
                    <p className="text-muted-foreground text-[11px] sm:text-xs leading-relaxed mb-1.5 sm:mb-2 line-clamp-3">{service.description}</p>
                    <span className="text-primary text-[11px] sm:text-xs font-medium tracking-wide flex items-center gap-2 transition-all group-hover:gap-3">
                      {service.ctaLabel ?? "Läs mer"} <ArrowRight className="h-3 w-3" />
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
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 md:px-10">
          <h2 className="font-sans font-semibold text-3xl md:text-5xl text-foreground text-center mb-16 md:mb-20">
            Erfarenhet som gör skillnad
          </h2>

          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="max-w-xl">
              <h3 className="font-sans font-bold text-2xl md:text-4xl text-foreground mb-6 leading-tight whitespace-pre-line">
                {"Personlig service\nSenior kompetens"}
              </h3>
              <p className="text-foreground/70 text-base md:text-lg leading-relaxed mb-8 whitespace-pre-line">

                {"I en värld där allt fler resor bokas online går vi åt andra hållet. Vi tror på den personliga kontakten, den erfarna rådgivaren och värdet av att ha någon som verkligen bryr sig om hela resan.\n\nHos KAISEN möter du seniora Resespecialister med erfarenheten, kunskapen och nätverket att skapa resor utöver det vanliga. Vi lyssnar på dina önskemål, delar med oss av vår expertis och ser till att varje detalj hänger ihop.\n\nFör oss är personlig service inte ett tillval utan en självklar del av varje resa vi skapar."}
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



      {/* Våra kunder - testimonials carousel */}
      <section className="py-10 md:py-14 bg-cream">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-10">
          <div className="text-center mb-14">
            <p className="text-[11px] sm:text-xs eyebrow text-primary uppercase mb-4 font-sans">Våra kunder</p>
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
      <section className="py-12 sm:py-16 md:py-24 bg-background">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-10">
          <div className="relative overflow-hidden rounded-3xl bg-navy p-10 md:p-16 grid md:grid-cols-[1fr_auto] gap-10 items-center">
            {/* Decorative blurred orbs */}
            <div className="pointer-events-none absolute -top-24 -right-16 w-80 h-80 rounded-full bg-primary/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 -left-20 w-96 h-96 rounded-full bg-primary/40 blur-3xl" />

            <div className="relative max-w-2xl">
              <p className="text-[11px] eyebrow text-primary uppercase mb-4 font-sans font-semibold">Kontakta oss</p>
              <h2 className="font-sans text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
                Ditt nästa äventyr börjar med ett <em className="italic font-light text-white">samtal</em>
              </h2>
              <p className="text-base text-white/70 leading-relaxed">
                Prata med en av våra resespecialister. Inga mallar, inga algoritmer – bara erfarenhet, expertis och personlig rådgivning för att skapa en resa utifrån just dina önskemål.
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
