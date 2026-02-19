import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import heroImage from "@/assets/kaisen-hero.jpg";
import luxuryImage from "@/assets/kaisen-luxury.jpg";
import groupImage from "@/assets/kaisen-group.jpg";

const team = [
  {
    name: "Alexandra Voss",
    role: "Founder & Chief Travel Advisor",
    bio: "With 20 years curating journeys across 6 continents, Alexandra founded Kaisen on one principle: travel should be transformative, not transactional.",
  },
  {
    name: "James Carver",
    role: "Head of Group Experiences",
    bio: "A former events director, James has organized everything from 10-person wine tours to 500-guest corporate expeditions across Europe and Asia.",
  },
  {
    name: "Isabelle Morel",
    role: "Luxury & Lifestyle Director",
    bio: "Isabelle's unmatched network of property owners, concierges, and cultural figures ensures Kaisen guests access experiences simply not available elsewhere.",
  },
  {
    name: "Ravi Sharma",
    role: "Sports Travel Specialist",
    bio: "A former touring professional, Ravi designs sporting journeys for enthusiasts who want access, performance, and prestige in equal measure.",
  },
];

const values = [
  { title: "Human First", desc: "We believe the best travel service comes from genuine human relationships — not algorithms or automated processes." },
  { title: "Excellence Without Exception", desc: "From first contact to final farewell, every touchpoint reflects our commitment to exceptional quality." },
  { title: "Curious & Passionate", desc: "Our advisors are true travel enthusiasts. We explore so you can trust our recommendations entirely." },
  { title: "Discretion Always", desc: "We handle our clients' plans with the highest level of confidentiality and professional discretion." },
];

export default function About() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative h-[50vh] min-h-[360px] flex items-end">
        <div className="absolute inset-0">
          <img src={heroImage} alt="About Kaisen Travel Group" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-navy/70" />
        </div>
        <div className="relative container mx-auto px-4 pb-14">
          <p className="text-xs tracking-[0.3em] text-gold uppercase mb-3 font-sans">Our Story</p>
          <h1 className="font-display text-4xl md:text-6xl text-white">
            About <em className="italic font-light text-gold-light">Kaisen</em>
          </h1>
        </div>
      </section>

      {/* Story */}
      <section className="kaisen-section bg-cream">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs tracking-[0.3em] text-primary uppercase mb-4 font-sans">Who We Are</p>
              <h2 className="font-display text-3xl md:text-4xl text-foreground mb-2 leading-tight">
                Born from a Belief That<br />
                <em className="italic font-light">Travel Should Feel Personal</em>
              </h2>
              <div className="w-10 h-px bg-primary mb-8" />
              <div className="space-y-5 text-muted-foreground leading-relaxed">
                <p>
                  Kaisen Travel Group was founded in 2009 by Alexandra Voss, a seasoned travel professional who believed the industry had forgotten something essential: the human touch.
                </p>
                <p>
                  The name Kaisen draws from the Japanese philosophy of <em>kaizen</em> — continuous improvement. It defines how we approach every client relationship and every journey we craft: with curiosity, care, and an unwavering commitment to getting better.
                </p>
                <p>
                  Today, our team of specialist advisors works with individuals, groups, corporations, and sports communities across the world — always anchored in genuine conversation and personalized service.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[4/5] overflow-hidden">
                <img src={luxuryImage} alt="Our story" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-4 -right-4 bg-navy p-6 max-w-[180px]">
                <div className="font-display text-3xl text-white mb-1">2009</div>
                <div className="text-[10px] tracking-[0.2em] uppercase text-gold font-sans">Founded with a vision</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="kaisen-section bg-navy">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-xs tracking-[0.3em] text-gold uppercase mb-4 font-sans">Our Values</p>
            <h2 className="font-display text-4xl text-white">
              What We Stand For
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((v) => (
              <div key={v.title} className="border-t border-white/10 pt-6">
                <h3 className="font-display text-xl text-white mb-3">{v.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="kaisen-section bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-xs tracking-[0.3em] text-primary uppercase mb-4 font-sans">The People Behind the Journeys</p>
            <h2 className="font-display text-4xl text-foreground">
              Meet Your <em className="italic font-light">Advisors</em>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member) => (
              <div key={member.name} className="group">
                <div className="aspect-square overflow-hidden mb-5 bg-muted">
                  <img
                    src={groupImage}
                    alt={member.name}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                  />
                </div>
                <h3 className="font-display text-xl text-foreground mb-0.5">{member.name}</h3>
                <div className="text-[10px] tracking-[0.2em] uppercase text-primary mb-3 font-sans">{member.role}</div>
                <p className="text-muted-foreground text-sm leading-relaxed">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl md:text-4xl text-primary-foreground mb-6">
            Ready to Meet Your Advisor?
          </h2>
          <p className="text-primary-foreground/70 max-w-md mx-auto mb-10 leading-relaxed">
            A genuine conversation is where every great journey begins.
          </p>
          <Link to="/contact">
            <Button size="lg" variant="outline" className="rounded-none border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary px-10 tracking-wider text-sm">
              Get in Touch
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
