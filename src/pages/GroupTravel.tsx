import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";
import Footer from "@/components/Footer";
import RequestCta from "@/components/RequestCta";
import Navbar from "@/components/Navbar";
import FloatingInquiryButton from "@/components/FloatingInquiryButton";
import { useInquiryDialog } from "@/components/InquiryDialog";
import groupImageAsset from "@/assets/kaisen-group-europe-skyline.jpg.asset.json";
const groupImage = groupImageAsset.url;
import groupCorporate from "@/assets/group-corporate.jpg";
import groupAdventure from "@/assets/group-adventure.jpg";

import { usePageMeta } from "@/lib/usePageMeta";
import PageHero from "@/components/site/PageHero";
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
      intro: "Antal personer, ungefärliga datum, destination och budget - vi återkommer med ett skräddarsytt förslag.",
    });

  return (
    <div className="min-h-screen">
      <Navbar />

      <PageHero
        image={groupImage}
        imageAlt="Grupp- & konferensresor"
        eyebrow={get("group_hero_eyebrow", "Grupp- & konferensresor")}
        title={get("group_hero_title", "Erfarenhet som gör skillnad")}
        action={null}
      >
        {get("group_hero_tagline", "När många människor ska resa tillsammans blir detaljerna avgörande.")}
      </PageHero>

      {/* Erfarenhet som gör skillnad */}
      <section className="sb-section">
        <div className="sb-container">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-14 items-center">
            <div>
              <h2 className="font-display text-3xl md:text-[36px] lg:text-[44px] text-foreground mb-5">
                Erfarenhet som <em className="italic font-light">gör skillnad</em>
              </h2>
              <p className="text-foreground/80 text-[15px] leading-relaxed mb-5">
                När många människor ska resa tillsammans blir detaljerna avgörande. Med över 50 års samlad erfarenhet från resebranschen har vi en gedigen erfarenhet av att producera och genomföra grupp- och konferensresor i Europa.
              </p>
              <p className="text-foreground/80 text-[15px] leading-relaxed">
                Vi har byggt upp ett omfattande nätverk av hotell, destinationer, restauranger, aktiviteter och samarbetspartners som gör det möjligt att skapa resor med både kvalitet och personlighet. Oavsett om det handlar om en mindre ledningsgrupp, en företagskonferens eller en större gruppresa har vi erfarenheten och kapaciteten att ta hand om hela arrangemanget.
              </p>
            </div>
            <div className="aspect-[16/10] md:aspect-[4/3] overflow-hidden rounded-lg">
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
      <section className="sb-section-alt">
        <div className="sb-container">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-14 items-center">
            <div className="aspect-[16/10] md:aspect-[4/3] overflow-hidden rounded-lg md:order-1">
              <img
                src={groupAdventure}
                alt="Gruppresor och logistik"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
            <div>
              <h2 className="font-display text-3xl md:text-[36px] lg:text-[44px] text-foreground mb-5">
                Vi kan resan - <em className="italic font-light">och logistiken</em>
              </h2>
              <p className="text-foreground/80 text-[15px] leading-relaxed mb-5">
                En lyckad gruppresa handlar om så mycket mer än att boka rätt hotell och flyg. Det är logistiken mellan alla delar som gör skillnaden.
              </p>
              <p className="text-foreground/80 text-[15px] leading-relaxed mb-6">
                Vi är vana att planera och koordinera allt från transporter och hotell till middagar, aktiviteter, konferenser och upplevelser. Med vår erfarenhet ser vi detaljerna innan de blir problem och skapar ett genomtänkt flöde genom hela resan.
              </p>
              <div className="flex items-start gap-3 rounded-lg bg-card border border-border border-l-4 border-l-primary p-4">
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
      <section className="sb-section">
        <div className="sb-container">
          <div className="max-w-[880px]">
            <h2 className="font-display text-3xl md:text-[36px] lg:text-[44px] text-foreground mb-5">
              Professionell <em className="italic font-light">reseledarservice</em> på plats
            </h2>
            <p className="text-foreground/80 text-[15px] leading-relaxed mb-5">
              För den som vill få ut ännu mer av resan erbjuder vi professionell reseledarservice på plats - en service som kan ta gruppresan till en helt annan nivå.
            </p>
            <p className="text-foreground/80 text-[15px] leading-relaxed mb-5">
              Behoven kan se olika ut. Vår reseledare kan fungera som koordinator för gruppens logistik, finnas till hands under hela resan och säkerställa att allt fungerar smidigt. För den som vill komma närmare destinationen erbjuder vi även professionell guideservice, där våra reseledare delar med sig av sin kunskap och erfarenhet för att ge gruppen en djupare förståelse för resmålet.
            </p>
            <p className="text-foreground/80 text-[15px] leading-relaxed">
              På så sätt kan reseledarservicen anpassas efter just er resa - från trygg och professionell koordinering till en mer innehållsrik och personlig upplevelse av destinationen.
            </p>
          </div>
        </div>
      </section>

      {/* Erfarna på att skapa resor tillsammans */}
      <section className="sb-section-alt">
        <div className="sb-container">
          <div className="max-w-[880px]">
            <h2 className="font-display text-3xl md:text-[36px] lg:text-[44px] text-foreground mb-5">
              Erfarna på att skapa <em className="italic font-light">resor tillsammans</em>
            </h2>
            <p className="text-foreground/80 text-[15px] leading-relaxed mb-5">
              Vi tror på att börja med att lyssna. Vad är syftet med resan? Vad vill ni uppleva? Vilken känsla vill ni att deltagarna ska ta med sig hem?
            </p>
            <p className="text-foreground/80 text-[15px] leading-relaxed mb-6">
              Utifrån era önskemål skapar vi en resa där destination, boende, aktiviteter och upplevelser hänger ihop.
            </p>
            <p className="font-display text-2xl md:text-[30px] font-semibold uppercase text-foreground mb-10">
              Ni berättar vad ni vill uppnå. <em className="italic font-light">Vi tar hand om resten.</em>
            </p>
            <div className="relative overflow-hidden rounded-lg bg-primary p-8 md:p-10 text-center">
              <p className="text-white text-lg md:text-xl font-light leading-relaxed max-w-2xl mx-auto">
                Har ni en idé om nästa konferens- eller gruppresa? Kontakta oss så börjar vi planera tillsammans.
              </p>
              <Button onClick={openGroupInquiry} className="mt-6 h-11 rounded-lg bg-white text-primary hover:bg-white/85 px-8 font-display uppercase font-semibold tracking-wide text-base">
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
          intro: "Antal personer, ungefärliga datum, destination och budget - vi återkommer med ett skräddarsytt förslag.",
        }}
      />
      <RequestCta />
      <Footer />
    </div>
  );
}
