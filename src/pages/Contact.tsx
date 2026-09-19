import { MapPin, Phone, Mail, Clock } from "lucide-react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import InquiryForm from "@/components/InquiryForm";
import heroImage from "@/assets/contact-hero.jpg";
import { usePageMeta } from "@/lib/usePageMeta";
import { useSiteContent } from "@/hooks/useSiteContent";

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
    { icon: MapPin, label: "Adress", value: get("contact_address", "Helsingborg, Sweden") },
    { icon: Clock, label: "Öppettider", value: get("contact_hours", "Mån-Fre 09-18") },
  ];
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative h-[32vh] min-h-[220px] flex items-end">
        <div className="absolute inset-0">
          <img src={heroImage} alt="Kontakta Kaisen" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-navy/70" />
        </div>
        <div className="relative container mx-auto px-4 pb-14">
          <p className="text-xs tracking-[0.3em] text-white uppercase mb-3 font-sans">{get("contact_hero_eyebrow", "Kom i kontakt")}</p>
          <h1 className="font-display text-4xl md:text-6xl text-white">
            {get("contact_hero_title", "Planera Er Resa")}
          </h1>
        </div>
      </section>

      <section className="py-12 md:py-16 bg-cream">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-12 lg:gap-16">
            {/* Contact Info */}
            <div className="lg:col-span-1">
              <p className="text-xs tracking-[0.3em] text-primary uppercase mb-4 font-sans">{get("contact_section_eyebrow", "Tala med oss")}</p>
              <h2 className="font-display text-3xl text-foreground mb-2">
                {get("contact_section_title", "Vi startar med ett Samtal")}
              </h2>
              <div className="w-8 h-px bg-primary mb-8" />
              <p className="text-muted-foreground leading-relaxed mb-10 text-sm">
                {get("contact_intro", "Föredrar du att ringa eller mejla direkt? Ingen mall - bara ett riktigt samtal. En dedikerad rådgivare återkommer normalt inom 24 timmar på vardagar.")}
              </p>
              <div className="space-y-6">
                {contactInfo.map((info) => (
                  <div key={info.label} className="flex items-start gap-4">
                    <div className="w-9 h-9 flex-shrink-0 bg-primary/10 rounded-full flex items-center justify-center">
                      <info.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-xs tracking-wider text-muted-foreground uppercase mb-0.5 font-sans">{info.label}</div>
                      {info.href ? (
                        <a href={info.href} className="text-sm text-foreground hover:text-primary transition-colors">
                          {info.value}
                        </a>
                      ) : (
                        <span className="text-sm text-foreground">{info.value}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-2">
              <InquiryForm
                type="contact"
                eyebrow="Reseförfrågan"
                heading="Berätta Om Er Resa"
                intro="Skriv några rader om vad ni planerar - antal personer, ungefärliga datum, destination och önskemål. Vi återkommer med ett förslag."
                showTripParts
              />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
