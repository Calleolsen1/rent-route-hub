import { Link } from "react-router-dom";
import { ArrowRight, Check, Users, Projector, Utensils, Wifi, Car, Award, Mic2, Coffee, Palette, MessageSquare } from "lucide-react";
import Footer from "@/components/Footer";
import RequestCta from "@/components/RequestCta";
import Navbar from "@/components/Navbar";
import PageHero from "@/components/site/PageHero";
import FloatingInquiryButton from "@/components/FloatingInquiryButton";
import { useInquiryDialog } from "@/components/InquiryDialog";
import konferensHero from "@/assets/konferens-hero.jpg";
import konferens1 from "@/assets/konferens-dinner.jpg";
import konferens2 from "@/assets/konferens-event.jpg";

const packages = [
  {
    icon: Mic2,
    title: "Konferens & Möten",
    tagline: "Lokaler · AV-teknik · Koordinering",
    desc: "Vi bokar rätt lokal för er grupps storlek och teknikbehov. Allt från små mötesrum till kongresshallar.",
  },
  {
    icon: Utensils,
    title: "Catering & Middagar",
    tagline: "Fika · Lunch · Galamiddag",
    desc: "Från enkel fika till flerrättersmiddagar med underhållning. Mat som ger energi och imponerar.",
  },
  {
    icon: Palette,
    title: "Aktiviteter & Upplevelser",
    tagline: "Teambuilding · Kultur · Äventyr",
    desc: "Matlagningskurser, privata museibesök, vinprovningar eller utomhusäventyr. Kombinera jobb med minnen.",
  },
  {
    icon: Car,
    title: "Transport & Logistik",
    tagline: "Flyg · Transfer · Shuttle",
    desc: "Vi hanterar alla deltagares resor - från flygbiljetter till shuttlebussar mellan hotell och lokal.",
  },
  {
    icon: Wifi,
    title: "Teknik & IT-support",
    tagline: "Uppkoppling · Streaming · Helpdesk",
    desc: "Stabil wifi, hybrid-lösningar och tekniker på plats. Så inget strular när det väl gäller.",
  },
  {
    icon: Award,
    title: "Event & Underhållning",
    tagline: "Speaker · Shower · Middagsarrangemang",
    desc: "Talare, shower och kvällsarrangemang som höjer evenemanget. Vi koordinerar hela upplevelsen.",
  },
];

const formats = [
  { title: "Dagsmöte", desc: "Lokal, teknik, lunch och fika - allt klart när ni kommer.", guests: "10-50" },
  { title: "2-3 dagars konferens", desc: "Boende, middagar och aktiviteter. Komplett paket.", guests: "20-150" },
  { title: "Incentive-resa", desc: "Belöna era bästa medarbetare med en upplevelse utomlands.", guests: "10-100" },
  { title: "Stor kongress", desc: "Internationella kongresser i Europas bästa kongresscentra.", guests: "100-500+" },
];

export default function Konferens() {
  const { open: openInquiry } = useInquiryDialog();
  const openKonferensInquiry = () =>
    openInquiry({
      type: "conference",
      eyebrow: "Begär offert",
      heading: "Berätta om er konferens",
      intro: "Antal deltagare, ungefärliga datum, destination och budget. Vi återkommer med ett komplett förslag.",
    });
  return (
    <div className="min-h-screen">
      <Navbar />

      <PageHero
        image={konferensHero}
        imageAlt="Konferensresor utomlands"
        eyebrow="Konferens & Event"
        title={<>Event som <em className="italic text-white">imponerar</em></>}
        action={
          <button type="button" onClick={openKonferensInquiry} className="sb-btn-light">
            <MessageSquare className="h-4 w-4" />
            Begär offert
          </button>
        }
      >
        Vi sköter detaljerna. Du fokuserar på innehållet.
      </PageHero>

      {/* Packages Grid - SALES FIRST */}
      <section className="sb-section">
        <div className="sb-container">
          <p className="eyebrow text-primary uppercase mb-1">Vad Vi Fixar</p>
          <h2 className="font-display text-3xl md:text-[36px] lg:text-[44px] text-foreground mb-8 md:mb-10">
            Helheten - <em className="italic">från idé till avslut</em>
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {packages.map((pkg) => (
              <div key={pkg.title} className="group sb-card p-6 hover:border-primary/50 hover:shadow-md transition-all duration-300">
                <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-primary text-white"><pkg.icon className="h-5 w-5" /></span>
                <h3 className="font-display text-xl text-foreground mb-1">{pkg.title}</h3>
                <p className="eyebrow !text-[13px] !tracking-[0.04em] text-primary uppercase mb-3">{pkg.tagline}</p>
                <p className="text-muted-foreground text-sm leading-relaxed">{pkg.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Formats - compact cards */}
      <section className="sb-section-alt">
        <div className="sb-container grid md:grid-cols-2 gap-8 lg:gap-14 items-center">
          <div>
            <p className="eyebrow text-primary uppercase mb-1">Format</p>
            <h2 className="font-display text-3xl md:text-[36px] lg:text-[44px] text-foreground mb-6">
              Anpassat efter er
            </h2>
            <div className="space-y-3">
              {formats.map((f) => (
                <div key={f.title} className="sb-card p-5 hover:border-primary/50 transition-colors">
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <h3 className="font-display text-xl text-foreground">{f.title}</h3>
                    <span className="shrink-0 rounded-md bg-primary/10 px-2 py-1 font-display text-sm font-semibold uppercase tracking-wide text-primary">{f.guests} deltagare</span>
                  </div>
                  <p className="text-muted-foreground text-sm">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="aspect-[16/10] md:aspect-[4/3] overflow-hidden rounded-lg">
            <img
              src={konferens2}
              alt="Konferens utomlands"
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
            />
          </div>
        </div>
      </section>

      {/* Full Service - short pitch */}
      <section className="sb-section">
        <div className="sb-container grid md:grid-cols-2 gap-8 lg:gap-14 items-center">
          <div className="aspect-[16/10] md:aspect-[4/3] overflow-hidden rounded-lg md:order-1">
            <img
              src={konferens1}
              alt="Konferensmiddag"
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
            />
          </div>
          <div>
            <p className="eyebrow text-primary uppercase mb-1">Komplett service</p>
            <h2 className="font-display text-3xl md:text-[36px] lg:text-[44px] text-foreground mb-4">
              En kontaktpunkt. Allt löst.
            </h2>
            <p className="text-foreground/80 leading-relaxed mb-6 text-[15px]">
              Istället för att ringa hotell, lokal, catering och teknik separat - pratar du med oss. Vi koordinerar hela kedjan och ser till att inget glöms.
            </p>
            <div className="grid grid-cols-2 gap-3 mb-8">
              {["Lokalbokning", "AV & teknik", "Catering", "Logistik", "Aktiviteter", "Support på plats"].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-foreground/85">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary text-white"><Check className="h-3.5 w-3.5" /></span>
                  {item}
                </div>
              ))}
            </div>
            <button type="button" onClick={openKonferensInquiry} className="sb-btn-primary">
              Begär offert
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      <FloatingInquiryButton
        label="Begär offert"
        inquiry={{
          type: "conference",
          eyebrow: "Begär offert",
          heading: "Berätta om er konferens",
          intro: "Antal deltagare, ungefärliga datum, destination och budget. Vi återkommer med ett komplett förslag.",
        }}
      />
      <RequestCta />
      <Footer />
    </div>
  );
}
