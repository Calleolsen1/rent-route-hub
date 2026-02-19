import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Map, Calendar, Check } from "lucide-react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import groupImage from "@/assets/kaisen-group.jpg";
import heroImage from "@/assets/kaisen-hero.jpg";
import luxuryImage from "@/assets/kaisen-luxury.jpg";

const groupTypes = [
  { icon: Users, title: "Corporate & Incentive", desc: "Team building retreats, incentive trips, and annual conferences that motivate and inspire." },
  { icon: Map, title: "Family Reunions", desc: "Multi-generational journeys crafted to create memories everyone — from 8 to 80 — will cherish." },
  { icon: Calendar, title: "Social Groups", desc: "Book clubs, alumni gatherings, sports clubs, and friend groups who want to explore the world together." },
];

const process = [
  { step: "01", title: "Initial Consultation", desc: "We learn about your group — size, interests, budget, and the experience you're hoping for." },
  { step: "02", title: "Bespoke Proposal", desc: "Within 48 hours, your dedicated advisor presents a tailored itinerary with pricing options." },
  { step: "03", title: "Refinement", desc: "We collaborate until every detail is perfect — activities, accommodation, meals, and logistics." },
  { step: "04", title: "Seamless Delivery", desc: "From arrival to farewell, we manage everything so your group simply enjoys the experience." },
];

const inclusions = [
  "Private transportation & airport transfers",
  "Handpicked hotels negotiated at group rates",
  "Expert local guides at each destination",
  "Private dining experiences & tastings",
  "Custom welcome kits for each traveler",
  "24/7 on-trip support from Kaisen team",
  "Group travel insurance guidance",
  "Pre-departure information packs",
];

export default function GroupTravel() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative h-[55vh] min-h-[400px] flex items-end">
        <div className="absolute inset-0">
          <img src={groupImage} alt="Group Travel" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-navy/65" />
        </div>
        <div className="relative container mx-auto px-4 pb-14">
          <p className="text-xs tracking-[0.3em] text-gold uppercase mb-3 font-sans">Kaisen Group Travel</p>
          <h1 className="font-display text-4xl md:text-6xl text-white leading-tight">
            The Art of Traveling<br />
            <em className="italic font-light text-gold-light">Together</em>
          </h1>
        </div>
      </section>

      {/* Intro */}
      <section className="kaisen-section bg-cream">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <p className="font-display text-2xl md:text-3xl text-foreground italic font-light leading-relaxed mb-8">
              "Group travel, done right, creates bonds that last a lifetime. We orchestrate the logistics so you can focus on each other."
            </p>
            <div className="w-8 h-px bg-primary mx-auto" />
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {groupTypes.map((gt) => (
              <div key={gt.title} className="bg-card p-8 border border-border text-center">
                <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center mx-auto mb-5">
                  <gt.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display text-xl text-foreground mb-3">{gt.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{gt.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="kaisen-section bg-navy">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-xs tracking-[0.3em] text-gold uppercase mb-4 font-sans">Our Process</p>
            <h2 className="font-display text-4xl text-white">
              From Idea to<br />
              <em className="italic font-light text-gold-light">Unforgettable</em>
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {process.map((p) => (
              <div key={p.step} className="relative">
                <div className="font-display text-6xl text-gold/20 mb-4 leading-none">{p.step}</div>
                <h3 className="font-display text-xl text-white mb-3">{p.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's included */}
      <section className="kaisen-section bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs tracking-[0.3em] text-primary uppercase mb-4 font-sans">What's Included</p>
              <h2 className="font-display text-3xl md:text-4xl text-foreground mb-2">
                Every Detail,<br />
                <em className="italic font-light">Considered</em>
              </h2>
              <div className="w-10 h-px bg-primary mb-8" />
              <p className="text-muted-foreground leading-relaxed mb-10">
                Our group travel packages are comprehensive by design. We handle every component — from the first enquiry to the last goodbye — so your group arrives, explores, and returns with nothing but wonderful memories.
              </p>
              <ul className="grid sm:grid-cols-2 gap-3">
                {inclusions.map((inc) => (
                  <li key={inc} className="flex items-start gap-3 text-sm">
                    <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-foreground/80">{inc}</span>
                  </li>
                ))}
              </ul>
              <Link to="/contact" className="mt-10 inline-block">
                <Button className="rounded-none bg-primary hover:bg-primary/90 px-8 tracking-wider text-sm">
                  Request a Group Quote
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="space-y-4">
              <div className="aspect-[4/3] overflow-hidden">
                <img src={heroImage} alt="Group travel experience" className="w-full h-full object-cover" />
              </div>
              <div className="bg-primary p-6">
                <div className="font-display text-2xl text-primary-foreground mb-1">Groups from 8 to 200+</div>
                <p className="text-primary-foreground/70 text-sm">No group is too small or too large. We scale our service to suit your needs.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
