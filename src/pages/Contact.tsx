import { MapPin, Phone, Mail, Clock } from "lucide-react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import InquiryForm from "@/components/InquiryForm";
const heroImage = PHOTO["contact-hero"];
import { usePageMeta } from "@/lib/usePageMeta";
import { useSiteContent } from "@/hooks/useSiteContent";
import PageHero from "@/components/site/PageHero";
import { PHOTO } from "@/data/photos";

const CONTACT_KEYS = [
  "contact_hero_eyebrow",
  "contact_hero_title",
  "contact_section_eyebrow",
  "contact_section_title",
  "contact_intro",
  "contact_phone",
  "contact_email",
  "contact_address",
  "contact_hours",
];

export default function Contact() {
  usePageMeta({
    title: "Kontakt - Kaisen Travel Group",
    description: "Skicka en förfrågan så återkommer en av våra rådgivare inom 24 timmar med ett förslag.",
  });
  const { get } = useSiteContent(CONTACT_KEYS);
  const phone = get("contact_phone", "+46 8 123 45 67");
  const email = get("contact_email", "info@kaisengroup.se");
  const contactInfo = [
    { icon: Phone, label: "Telefon", value: phone, href: `tel:${phone.replace(/\s+/g, "")}` },
    { icon: Mail, label: "E-post", value: email, href: `mailto:${email}` },
    { icon: MapPin, label: "Adress", value: get("contact_address", "Landskrona, Sverige") },
    { icon: Clock, label: "Öppettider", value: get("contact_hours", "Mån-Fre 09-18") },
  ];
  return (
    <div className="min-h-screen">
      <Navbar />

      <PageHero
        image={heroImage}
        imageAlt="Kontakta KAISEN"
        eyebrow={get("contact_hero_eyebrow", "Kom i kontakt")}
        title={get("contact_hero_title", "Planera er resa")}
        action={null}
      />

      <section className="sb-section">
        <div className="sb-container">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Contact details precede the form on phones and desktop. */}
            <div id="contact-inquiry" className="lg:col-span-7 order-2 scroll-mt-24 sb-card p-5 sm:p-8">
              <InquiryForm
                type="contact"
                eyebrow="Reseförfrågan"
                heading="Berätta om er resa"
                intro="Skriv några rader om vad ni planerar: antal personer, ungefärliga datum, resmål och önskemål. Vi återkommer med ett förslag."
                showTripParts
              />
            </div>

            {/* Contact Info */}
            <div className="lg:col-span-5 order-1">
              <p className="eyebrow text-primary uppercase mb-1">{get("contact_section_eyebrow", "Tala med oss")}</p>
              <h2 className="font-display text-3xl md:text-[40px] text-foreground mb-4">
                {get("contact_section_title", "Vi börjar med ett samtal")}
              </h2>
              <p className="text-foreground/80 leading-relaxed mb-6 lg:mb-8 text-[15px] whitespace-pre-line">
                {get("contact_intro", "Ring eller mejla oss direkt om du hellre vill det. En rådgivare återkommer normalt inom 24 timmar på vardagar.")}
              </p>
              {/* Plain list with dividers; the small icon is only a cue, not a tile */}
              <dl className="divide-y divide-border border-y border-border">
                {contactInfo.map((info) => (
                  <div key={info.label} className="flex items-baseline justify-between gap-4 py-3.5">
                    <dt className="eyebrow text-muted-foreground uppercase shrink-0">{info.label}</dt>
                    <dd className="text-right">
                      {info.href ? (
                        <a href={info.href} className="inline-flex items-center gap-1.5 text-[15px] font-medium text-foreground hover:text-primary transition-colors">
                          <info.icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                          {info.value}
                        </a>
                      ) : (
                        <span className="text-[15px] font-medium text-foreground">{info.value}</span>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
