import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import sportsImage from "@/assets/kaisen-sports.jpg";
import luxuryImage from "@/assets/kaisen-luxury.jpg";
import groupImage from "@/assets/kaisen-group.jpg";
import heroImage from "@/assets/kaisen-hero.jpg";

const categories = [
  {
    id: "group",
    tag: "Group Travel",
    title: "Journeys Better Together",
    description: "Whether it's a milestone birthday, corporate off-site, family reunion, or a group of like-minded explorers, we orchestrate every detail so your only job is to enjoy the moment.",
    image: groupImage,
    features: [
      "Groups from 8 to 200+ travelers",
      "Dedicated group coordinator",
      "Negotiated group rates & exclusive access",
      "Custom itineraries for every interest level",
      "Airport transfers & logistics management",
      "On-the-ground support throughout",
    ],
    cta: "/group-travel",
    ctaLabel: "Explore Group Travel",
  },
  {
    id: "sports",
    tag: "Sports & Adventure",
    title: "Elite Sporting Experiences",
    description: "We are the go-to agency for sports enthusiasts who demand premium experiences. From golf pilgrimages to alpine ski weeks, sailing regattas to motorsport grand prix weekends — we take you to the heart of the action.",
    image: sportsImage,
    features: [
      "Golf — St Andrews, Augusta, Pebble Beach",
      "Skiing — Verbier, Zermatt, Aspen",
      "Sailing & Yacht charters",
      "Motorsport & Grand Prix packages",
      "Cycling, trekking & endurance events",
      "Private coaching & clinics available",
    ],
    cta: "/contact",
    ctaLabel: "Book a Sports Experience",
  },
  {
    id: "luxury",
    tag: "Luxury Escapes",
    title: "Uncompromising Excellence",
    description: "For travelers who expect perfection, we curate experiences that money alone cannot buy — exclusive access, private collections, Michelin dining, and accommodation that defines a destination.",
    image: luxuryImage,
    features: [
      "Private villa & château rentals",
      "Chartered yacht & private jet options",
      "Exclusive cultural & culinary access",
      "Michelin-starred dining reservations",
      "Art, fashion & architecture immersions",
      "Complete discretion & white-glove service",
    ],
    cta: "/contact",
    ctaLabel: "Enquire About Luxury",
  },
];

export default function Services() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative h-[50vh] min-h-[360px] flex items-end">
        <div className="absolute inset-0">
          <img src={heroImage} alt="Kaisen Experiences" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-navy/70" />
        </div>
        <div className="relative container mx-auto px-4 pb-14">
          <p className="text-xs tracking-[0.3em] text-gold uppercase mb-3 font-sans">Our Specialities</p>
          <h1 className="font-display text-4xl md:text-6xl text-white">
            Experiences & <em className="italic font-light text-gold-light">Services</em>
          </h1>
        </div>
      </section>

      {/* Intro */}
      <section className="bg-cream py-16">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <p className="font-display text-2xl md:text-3xl text-foreground italic font-light leading-relaxed">
            "Every journey begins with a single conversation. We listen first — then we build something extraordinary."
          </p>
          <div className="w-8 h-px bg-primary mx-auto mt-8" />
        </div>
      </section>

      {/* Service Sections */}
      {categories.map((cat, index) => (
        <section key={cat.id} id={cat.id} className="kaisen-section bg-background">
          <div className="container mx-auto px-4">
            <div className={`grid md:grid-cols-2 gap-12 lg:gap-20 items-center ${index % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""}`}>
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={cat.image}
                  alt={cat.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                />
              </div>
              <div>
                <span className="text-[10px] tracking-[0.25em] uppercase bg-accent text-accent-foreground px-3 py-1 font-sans">
                  {cat.tag}
                </span>
                <h2 className="font-display text-3xl md:text-4xl text-foreground mt-4 mb-2">{cat.title}</h2>
                <div className="w-10 h-px bg-primary mb-6" />
                <p className="text-muted-foreground leading-relaxed mb-8 text-base">{cat.description}</p>
                <ul className="space-y-3 mb-10">
                  {cat.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-foreground/80">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link to={cat.cta}>
                  <Button className="rounded-none bg-primary hover:bg-primary/90 px-8 tracking-wider text-sm">
                    {cat.ctaLabel}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* CTA */}
      <section className="bg-navy py-20">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs tracking-[0.3em] text-gold uppercase mb-4 font-sans">Bespoke by Nature</p>
          <h2 className="font-display text-3xl md:text-5xl text-white mb-6">
            Don't See What You're Looking For?
          </h2>
          <p className="text-white/60 max-w-lg mx-auto mb-10 leading-relaxed">
            Our expertise extends beyond categories. Tell us your vision and we'll make it happen.
          </p>
          <Link to="/contact">
            <Button size="lg" className="rounded-none bg-primary hover:bg-primary/90 px-10 tracking-wider text-sm">
              Talk to an Advisor
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
