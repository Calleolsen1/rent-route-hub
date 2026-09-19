import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Trophy, Briefcase, Heart, Mountain, Utensils, Check, PartyPopper, Waves, Wine, Bus, MessageSquare } from "lucide-react";
import Footer from "@/components/Footer";
import RequestCta from "@/components/RequestCta";
import Navbar from "@/components/Navbar";
import FloatingInquiryButton from "@/components/FloatingInquiryButton";
import { useInquiryDialog } from "@/components/InquiryDialog";
import groupImage from "@/assets/kaisen-group.jpg";
import groupSports from "@/assets/group-sports.jpg";
import groupCorporate from "@/assets/group-corporate.jpg";
import groupAdventure from "@/assets/group-adventure.jpg";

const experiences = [
  {
    icon: Trophy,
    title: "Sport på riktigt",
    tagline: "Fotboll i London · F1 i Monaco · Golf i Skottland",
    desc: "Biljetter, boende och transfer - för hela gänget. Inte en enda pappa ska behöva \u201cfixa allt\u201d.",
  },
  {
    icon: PartyPopper,
    title: "Möhippa & Svensexa",
    tagline: "Prag · Barcelona · Amsterdam · Tallinn",
    desc: "Hela paketet med aktiviteter, middagar och logistik. Den blivande bruden/brudgummen får minnen för livet.",
  },
  {
    icon: Briefcase,
    title: "Företags-Getaway",
    tagline: "Kickoffer · Incentive · Team Building",
    desc: "Resor som faktikt stärker laget. Vi skräddarsyr efter era mål och budget.",
  },
  {
    icon: Mountain,
    title: "Äventyr & Natur",
    tagline: "Skidåkning · Vandring · Kayak · Roadtrip",
    desc: "För grupper som vill ha mer än poolkanten. Aktiva resor som ger historier att berätta.",
  },
  {
    icon: Wine,
    title: "Gastronomi & Vin",
    tagline: "Vintours i Frankrike · Matlagning i Italien",
    desc: "Upplevelser för gäng som uppskattar smak. Vinprovningar, stjärnkrogar och lokala marknader.",
  },
  {
    icon: Users,
    title: "Familjeresor",
    tagline: "Flera generationer · Res tillsammans",
    desc: "Från barnbarn till morföräldrar. Vi hittar det som fungerar för alla åldrar.",
  },
];

const activities = [
  { icon: Bus, text: "Privat transport & flygplatstransfer" },
  { icon: Waves, text: "Guidade aktiviteter & utflykter" },
  { icon: Utensils, text: "Bokade middagar & gemensamma måltider" },
  { icon: Trophy, text: "Biljetter till event & matcher" },
  { icon: Heart, text: "Team building-upplägg" },
  { icon: Check, text: "Support dygnet runt under resan" },
];

import { usePageMeta } from "@/lib/usePageMeta";
import { useSiteContent } from "@/hooks/useSiteContent";

const GROUP_KEYS = ["group_hero_eyebrow", "group_hero_title", "group_hero_tagline", "group_activities"];

const FALLBACK_GROUP_ACTIVITIES = [
  "Privat transport & flygplatstransfer",
  "Guidade aktiviteter & utflykter",
  "Bokade middagar & gemensamma måltider",
  "Biljetter till event & matcher",
  "Team building-upplägg",
  "Support dygnet runt under resan",
];

export default function GroupTravel() {
  usePageMeta({
    title: "Gruppresor - 8 till 200+ personer | Kaisen Travel Group",
    description: "Skräddarsydda gruppresor, företagsevent och incentiveresor. Vi sköter logistiken - från flyg och hotell till middag och aktiviteter.",
  });
  const { get, getArray } = useSiteContent(GROUP_KEYS);
  const { open: openInquiry } = useInquiryDialog();
  const openGroupInquiry = () =>
    openInquiry({
      type: "group",
      eyebrow: "Skicka förfrågan",
      heading: "Berätta om er gruppresa",
      intro: "Antal personer, ungefärliga datum, destination och budget - vi återkommer med ett skräddarsytt förslag inom 24 timmar på vardagar.",
    });
  const editableActivities = getArray("group_activities", FALLBACK_GROUP_ACTIVITIES);
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative h-[42vh] min-h-[320px] flex items-end">
        <div className="absolute inset-0">
          <img src={groupImage} alt="Gruppresor" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-navy/65" />
        </div>
        <div className="relative container mx-auto px-4 pb-14">
          <p className="text-xs tracking-[0.3em] text-primary uppercase mb-3 font-sans">{get("group_hero_eyebrow", "Gruppresor")}</p>
          <h1 className="font-display text-4xl md:text-6xl text-white leading-tight">
            {get("group_hero_title", "Bättre tillsammans - Alltid")}
          </h1>
          <p className="text-white/70 mt-4 text-lg font-light max-w-lg">
            {get("group_hero_tagline", "Sport, äventyr eller fest - vi planerar, ni upplever.")}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={openGroupInquiry} className="rounded-full bg-primary hover:bg-primary/90 px-7 py-6 text-sm tracking-wider">
                <MessageSquare className="mr-2 h-4 w-4" />
                Skicka förfrågan
              </Button>
          </div>
        </div>
      </section>

      {/* Experience Grid - SALES FIRST */}
      <section className="py-14 md:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-xs tracking-[0.3em] text-primary uppercase mb-3 font-sans">Vad Vill Ni Uppleva?</p>
            <h2 className="font-display text-3xl md:text-4xl text-foreground">
              Upplevelser för <em className="italic font-light">alla gäng</em>
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {experiences.map((exp) => {
              const Icon = exp.icon;
              return (
                <div key={exp.title} className="group bg-cream border border-border p-8 hover:border-primary transition-all duration-300">
                  <Icon className="h-6 w-6 text-primary mb-4" />
                  <h3 className="font-display text-xl text-foreground mb-1">{exp.title}</h3>
                  <p className="text-xs tracking-wider text-primary uppercase font-sans mb-3">{exp.tagline}</p>
                  <div className="w-6 h-px bg-primary mb-4" />
                  <p className="text-muted-foreground text-sm leading-relaxed">{exp.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Sport - image + short pitch */}
      <section className="py-12 md:py-16 bg-cream">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <span className="text-[10px] tracking-[0.25em] uppercase bg-accent text-accent-foreground px-3 py-1 font-sans">
                Sport & Vänner
              </span>
              <h2 className="font-display text-3xl md:text-4xl text-foreground mt-4 mb-2">
                Matcher ni aldrig glömmer
              </h2>
              <div className="w-10 h-px bg-primary mb-6" />
              <p className="text-muted-foreground leading-relaxed mb-6">
                Premier League, Monaco Grand Prix, Champions League - vi fixar biljetter, boende och transfer för hela gänget. En kontaktpunkt. Noll huvudbry.
              </p>
              <div className="grid grid-cols-2 gap-3 mb-8">
                {["Biljetter till matcher & event", "Gruppbokade hotell", "Privat transfer", "Cityguide & tips"].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-foreground/80">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
              <Button onClick={openGroupInquiry} className="rounded-full bg-primary hover:bg-primary/90 px-8 tracking-wider text-sm">
                  Planera er sportresa
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
            <div className="aspect-[4/3] overflow-hidden">
              <img
                src={groupSports}
                alt="Sportevent med grupp"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Corporate - reversed */}
      <section className="py-12 md:py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="aspect-[4/3] overflow-hidden md:order-1">
              <img
                src={groupCorporate}
                alt="Företagets getaway"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
            <div>
              <span className="text-[10px] tracking-[0.25em] uppercase bg-accent text-accent-foreground px-3 py-1 font-sans">
                Företag & Team
              </span>
              <h2 className="font-display text-3xl md:text-4xl text-foreground mt-4 mb-2">
                Resor som bygger lag
              </h2>
              <div className="w-10 h-px bg-primary mb-6" />
              <p className="text-muted-foreground leading-relaxed mb-6">
                Kickoff i Barcelona. Incentive till Kroatien. Retreat i Toscana. Vi skapar upplevelser som teamet pratar om länge - och faktiskt stärker sammanhållningen.
              </p>
              <div className="grid grid-cols-2 gap-3 mb-8">
                {["Boende & logistik", "Aktiviteter & teambuilding", "Middagar & event", "Pris efter budget"].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-foreground/80">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
              <Button onClick={openGroupInquiry} className="rounded-full bg-primary hover:bg-primary/90 px-8 tracking-wider text-sm">
                  Offert för företagsresa
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
          </div>
        </div>
      </section>

      {/* What's included - compact */}
      <section className="py-14 md:py-20 bg-cream">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs tracking-[0.3em] text-primary uppercase mb-3 font-sans">Vad Ingår</p>
              <h2 className="font-display text-3xl md:text-4xl text-foreground mb-2">
                Allt ordnat - <em className="italic font-light">ingenting glömt</em>
              </h2>
              <div className="w-10 h-px bg-primary mb-8" />
              <div className="grid sm:grid-cols-2 gap-4 mb-10">
                {editableActivities.map((text, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-foreground/80 text-sm">{text}</span>
                  </div>
                ))}
              </div>
              <div className="bg-navy p-6 inline-block">
                <div className="font-display text-2xl text-white mb-1">6 - 200+ personer</div>
                <p className="text-white/60 text-sm">Ingen grupp är för liten eller för stor.</p>
              </div>
            </div>
            <div className="aspect-[4/3] overflow-hidden">
              <img
                src={groupAdventure}
                alt="Äventyrsresa i grupp"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
          </div>
        </div>
      </section>

      <FloatingInquiryButton
        inquiry={{
          type: "group",
          eyebrow: "Skicka förfrågan",
          heading: "Berätta om er gruppresa",
          intro: "Antal personer, ungefärliga datum, destination och budget - vi återkommer med ett skräddarsytt förslag inom 24 timmar på vardagar.",
        }}
      />
      <RequestCta />
      <Footer />
    </div>
  );
}
