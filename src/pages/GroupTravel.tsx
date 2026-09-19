import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";
import Footer from "@/components/Footer";
import RequestCta from "@/components/RequestCta";
import Navbar from "@/components/Navbar";
import FloatingInquiryButton from "@/components/FloatingInquiryButton";
import { useInquiryDialog } from "@/components/InquiryDialog";
import groupImage from "@/assets/kaisen-group.jpg";
import groupCorporate from "@/assets/group-corporate.jpg";
import groupAdventure from "@/assets/group-adventure.jpg";

import { usePageMeta } from "@/lib/usePageMeta";
import { useSiteContent } from "@/hooks/useSiteContent";

const GROUP_KEYS = ["group_hero_eyebrow", "group_hero_title", "group_hero_tagline", "group_activities"];

export default function GroupTravel() {
  usePageMeta({
    title: "Grupp- & konferensresor | Kaisen Travel Group",
    description: "Vi producerar och genomför grupp- och konferensresor i Europa - med över 50 års samlad erfarenhet från resebranschen. Vi tar ansvar för helheten så att ni kan fokusera på upplevelsen.",
  });
  const { get } = useSiteContent(GROUP_KEYS);
  const { open: openInquiry } = useInquiryDialog();
  const openGroupInquiry = () =>
    openInquiry({
      type: "group",
      eyebrow: "Skicka förfrågan",
      heading: "Berätta om er gruppresa",
      intro: "Antal personer, ungefärliga datum, destination och budget - vi återkommer med ett skräddarsytt förslag inom 24 timmar på vardagar.",
    });

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative h-[42vh] min-h-[320px] flex items-end">
        <div className="absolute inset-0">
          <img src={groupImage} alt="Grupp- & konferensresor" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-navy/65" />
        </div>
        <div className="relative container mx-auto px-4 pb-14">
          <p className="text-[11px] sm:text-xs eyebrow text-white/75 uppercase mb-3 font-sans">{get("group_hero_eyebrow", "Grupp- & konferensresor")}</p>
          <h1 className="font-display text-4xl md:text-6xl text-white leading-tight">
            {get("group_hero_title", "Erfarenhet som gör skillnad")}
          </h1>
          <p className="text-white/70 mt-4 text-lg font-light max-w-lg">
            {get("group_hero_tagline", "När många människor ska resa tillsammans blir detaljerna avgörande.")}
          </p>
        </div>
      </section>

      {/* Erfarenhet som gör skillnad */}
      <section className="py-14 md:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <h2 className="font-display text-3xl md:text-4xl text-foreground mb-2">
                Erfarenhet som <em className="italic font-light">gör skillnad</em>
              </h2>
              <div className="w-10 h-px bg-primary mb-6" />
              <p className="text-muted-foreground leading-relaxed mb-5">
                När många människor ska resa tillsammans blir detaljerna avgörande. Med över 50 års samlad erfarenhet från resebranschen har vi en gedigen erfarenhet av att producera och genomföra grupp- och konferensresor i Europa.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Vi har byggt upp ett omfattande nätverk av hotell, destinationer, restauranger, aktiviteter och samarbetspartners som gör det möjligt att skapa resor med både kvalitet och personlighet. Oavsett om det handlar om en mindre ledningsgrupp, en företagskonferens eller en större gruppresa har vi erfarenheten och kapaciteten att ta hand om hela arrangemanget.
              </p>
            </div>
            <div className="aspect-[4/3] overflow-hidden">
              <img
                src={groupCorporate}
                alt="Konferensresa i grupp"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Vi kan resan - och logistiken */}
      <section className="py-12 md:py-16 bg-cream">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="aspect-[4/3] overflow-hidden md:order-1">
              <img
                src={groupAdventure}
                alt="Gruppresor och logistik"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
            <div>
              <h2 className="font-display text-3xl md:text-4xl text-foreground mt-4 mb-2">
                Vi kan resan - <em className="italic font-light">och logistiken</em>
              </h2>
              <div className="w-10 h-px bg-primary mb-6" />
              <p className="text-muted-foreground leading-relaxed mb-5">
                En lyckad gruppresa handlar om så mycket mer än att boka rätt hotell och flyg. Det är logistiken mellan alla delar som gör skillnaden.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Vi är vana att planera och koordinera allt från transporter och hotell till middagar, aktiviteter, konferenser och upplevelser. Med vår erfarenhet ser vi detaljerna innan de blir problem och skapar ett genomtänkt flöde genom hela resan.
              </p>
              <div className="flex items-start gap-3 bg-navy/5 border-l-2 border-primary p-4">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-foreground font-medium">
                  Vi tar ansvar för helheten - så att ni kan fokusera på upplevelsen.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Professionell reseledarservice på plats */}
      <section className="py-12 md:py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-display text-3xl md:text-4xl text-foreground mb-2">
              Professionell <em className="italic font-light">reseledarservice</em> på plats
            </h2>
            <div className="w-10 h-px bg-primary mx-auto mb-8" />
            <p className="text-muted-foreground leading-relaxed mb-5">
              För den som vill få ut ännu mer av resan erbjuder vi professionell reseledarservice på plats - en service som kan ta gruppresan till en helt annan nivå.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-5">
              Behoven kan se olika ut. Vår reseledare kan fungera som koordinator för gruppens logistik, finnas till hands under hela resan och säkerställa att allt fungerar smidigt. För den som vill komma närmare destinationen erbjuder vi även professionell guideservice, där våra reseledare delar med sig av sin kunskap och erfarenhet för att ge gruppen en djupare förståelse för resmålet.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              På så sätt kan reseledarservicen anpassas efter just er resa - från trygg och professionell koordinering till en mer innehållsrik och personlig upplevelse av destinationen.
            </p>
          </div>
        </div>
      </section>

      {/* Erfarna på att skapa resor tillsammans */}
      <section className="py-12 md:py-16 bg-cream">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-display text-3xl md:text-4xl text-foreground mb-2 text-center">
              Erfarna på att skapa <em className="italic font-light">resor tillsammans</em>
            </h2>
            <div className="w-10 h-px bg-primary mx-auto mb-8" />
            <p className="text-muted-foreground leading-relaxed mb-5">
              Vi tror på att börja med att lyssna. Vad är syftet med resan? Vad vill ni uppleva? Vilken känsla vill ni att deltagarna ska ta med sig hem?
            </p>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Utifrån era önskemål skapar vi en resa där destination, boende, aktiviteter och upplevelser hänger ihop.
            </p>
            <p className="font-display text-2xl md:text-3xl text-foreground text-center mb-12">
              Ni berättar vad ni vill uppnå. <em className="italic font-light">Vi tar hand om resten.</em>
            </p>
            <div className="bg-navy p-8 md:p-10 text-center">
              <p className="text-white text-lg md:text-xl font-light leading-relaxed max-w-2xl mx-auto">
                Har ni en idé om nästa konferens- eller gruppresa? Kontakta oss så börjar vi planera tillsammans.
              </p>
              <Button onClick={openGroupInquiry} className="mt-6 rounded-full bg-primary hover:bg-primary/90 px-8 py-6 text-sm tracking-wider">
                Skicka förfrågan
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
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
