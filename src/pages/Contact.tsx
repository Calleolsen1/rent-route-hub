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
    description: "Skicka en förfrågan så återkommer en konsult inom 24 timmar med ett skräddarsytt förslag.",
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
        title={get("contact_hero_title", "Planera Er Resa")}
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
                heading="Berätta Om Er Resa"
                intro="Skriv några rader om vad ni planerar - antal personer, ungefärliga datum, destination och önskemål. Vi återkommer med ett förslag."
                showTripParts
              />
            </div>

            {/* Contact Info */}
            <div className="lg:col-span-5 order-1">
              <p className="eyebrow text-primary uppercase mb-1">{get("contact_section_eyebrow", "Tala med oss")}</p>
              <h2 className="font-display text-3xl md:text-[40px] text-foreground mb-4">
                {get("contact_section_title", "Vi startar med ett Samtal")}
              </h2>
              <p className="text-foreground/80 leading-relaxed mb-6 lg:mb-8 text-[15px] whitespace-pre-line">
                {get("contact_intro", "Föredrar du att ringa eller mejla direkt? Ingen mall - bara ett riktigt samtal. En dedikerad rådgivare återkommer normalt inom 24 timmar på vardagar.")}
              </p>
              <div className="space-y-3">
                {contactInfo.map((info) => (
                  <div key={info.label} className="sb-card flex items-center gap-4 p-4">
                    <div className="w-10 h-10 flex-shrink-0 bg-primary rounded-md flex items-center justify-center">
                      <info.icon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="eyebrow !text-[13px] !tracking-[0.04em] text-muted-foreground uppercase mb-0.5">{info.label}</div>
                      {info.href ? (
                        <a href={info.href} className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                          {info.value}
                        </a>
                      ) : (
                        <span className="text-sm font-medium text-foreground">{info.value}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
