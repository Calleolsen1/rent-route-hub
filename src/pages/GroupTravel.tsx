import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Footer from "@/components/Footer";
import RequestCta from "@/components/RequestCta";
import Navbar from "@/components/Navbar";
import FloatingInquiryButton from "@/components/FloatingInquiryButton";
import { useInquiryDialog } from "@/components/InquiryDialog";
const groupImage = PHOTO["kaisen-group"];
const groupCorporate = PHOTO["group-corporate"];
const groupAdventure = PHOTO["group-adventure"];

import { usePageMeta } from "@/lib/usePageMeta";
import PageHero from "@/components/site/PageHero";
import { useSiteContent } from "@/hooks/useSiteContent";
import { PHOTO } from "@/data/photos";

const GROUP_KEYS = ["group_hero_eyebrow", "group_hero_title", "group_hero_tagline", "group_activities"];

export default function GroupTravel() {
  usePageMeta({
    title: "Grupp- & konferensresor | Kaisen Travel Group",
    description: "Vi planerar och genomför grupp- och konferensresor i Europa, med över 50 års samlad erfarenhet från resebranschen. Vi tar ansvar för helheten så att ni kan fokusera på programmet.",
  });
  const { get } = useSiteContent(GROUP_KEYS);
  const { open: openInquiry } = useInquiryDialog();
  const openGroupInquiry = () =>
    openInquiry({
      type: "group",
      eyebrow: "Skicka förfrågan",
      heading: "Berätta om er gruppresa",
      intro: "Antal personer, ungefärliga datum, resmål och budget, så återkommer vi med ett förslag.",
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
                Vi har gjort det här <em className="italic font-light">länge</em>
              </h2>
              <p className="text-foreground/80 text-[15px] leading-relaxed mb-5">
                När många människor ska resa tillsammans blir detaljerna avgörande. Med över 50 års samlad erfarenhet från resebranschen har vi planerat och genomfört många grupp- och konferensresor i Europa.
              </p>
              <p className="text-foreground/80 text-[15px] leading-relaxed">
                Vi har byggt upp ett omfattande nätverk av hotell, destinationer, restauranger, aktiviteter och samarbetspartners som gör att vi kan ordna resor med hög kvalitet och egen karaktär. Oavsett om det handlar om en mindre ledningsgrupp, en företagskonferens eller en större gruppresa har vi erfarenheten och kapaciteten att ta hand om hela arrangemanget.
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
                Vi kan resan, <em className="italic font-light">och logistiken</em>
              </h2>
              <p className="text-foreground/80 text-[15px] leading-relaxed mb-5">
                En lyckad gruppresa handlar om mer än att boka rätt hotell och flyg. Det är logistiken mellan alla delar som avgör.
              </p>
              <p className="text-foreground/80 text-[15px] leading-relaxed mb-6">
                Vi är vana att planera och koordinera allt från transporter och hotell till middagar, aktiviteter, konferenser och upplevelser. Vi ser detaljerna innan de blir problem och ser till att dagarna hänger ihop.
              </p>
              <p className="border-l-2 border-primary pl-4 font-display text-xl md:text-2xl text-foreground leading-snug">
                Vi tar ansvar för helheten, så att ni kan fokusera på varandra och programmet.
              </p>
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
              Vill ni få ut ännu mer av resan kan vi skicka med en reseledare. För en grupp gör det stor skillnad.
            </p>
            <p className="text-foreground/80 text-[15px] leading-relaxed mb-5">
              Behoven ser olika ut. Reseledaren kan samordna gruppens logistik, finnas till hands under hela resan och se till att allt fungerar. Vill ni lära känna resmålet bättre kan reseledaren också guida och berätta om platserna ni besöker.
            </p>
            <p className="text-foreground/80 text-[15px] leading-relaxed">
              Ni väljer själva hur mycket reseledaren ska vara med, från enbart samordning till guidning under hela resan.
            </p>
          </div>
        </div>
      </section>

      {/* How we plan a group trip: numbered steps */}
      <section className="sb-section-alt">
        <div className="sb-container">
          <div className="max-w-2xl mb-8 md:mb-10">
            <h2 className="font-display text-3xl md:text-[36px] lg:text-[44px] text-foreground">
              Så planerar vi <em className="italic font-light">en gruppresa</em>
            </h2>
          </div>
          <ol className="grid md:grid-cols-3 gap-x-10">
            {[
              { t: "Vi lyssnar", d: "Vad är syftet med resan? Vad vill ni uppleva, och vad ska deltagarna ta med sig hem?" },
              { t: "Vi sätter ihop resan", d: "Utifrån era önskemål väljer vi resmål, boende, aktiviteter och program som hänger ihop." },
              { t: "Ni reser", d: "Ni berättar vad ni vill uppnå. Vi tar hand om resten, före och under resan." },
            ].map((step, i) => (
              <li key={step.t} className="border-t border-border py-6">
                <span className="font-display text-2xl text-primary/60 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="font-display text-xl text-foreground mt-2 mb-2">{step.t}</h3>
                <p className="text-foreground/80 text-[15px] leading-relaxed">{step.d}</p>
              </li>
            ))}
          </ol>
          <div className="mt-8 md:mt-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5 rounded-xl bg-primary p-6 md:p-8">
            <p className="text-white text-lg font-light leading-relaxed max-w-2xl">
              Har ni en idé om nästa konferens- eller gruppresa? Hör av er så börjar vi planera tillsammans.
            </p>
            <Button onClick={openGroupInquiry} className="h-11 rounded-full bg-white text-primary hover:bg-white/90 px-8 text-sm font-medium shrink-0">
              Skicka förfrågan
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      <FloatingInquiryButton
        inquiry={{
          type: "group",
          eyebrow: "Skicka förfrågan",
          heading: "Berätta om er gruppresa",
          intro: "Antal personer, ungefärliga datum, resmål och budget, så återkommer vi med ett förslag.",
        }}
      />
      <RequestCta />
      <Footer />
    </div>
  );
}
