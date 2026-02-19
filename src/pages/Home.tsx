import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Trophy, Star, Shield } from "lucide-react";
import Footer from "@/components/Footer";
import FAQSection from "@/components/home/FAQSection";
import heroImage from "@/assets/kaisen-hero.jpg";
import groupImage from "@/assets/kaisen-group.jpg";
import sportsImage from "@/assets/kaisen-sports.jpg";
import luxuryImage from "@/assets/kaisen-luxury.jpg";

const stats = [
  { value: "2,400+", label: "Trips Organized" },
  { value: "98%", label: "Client Satisfaction" },
  { value: "60+", label: "Destinations" },
  { value: "15+", label: "Years of Excellence" },
];

const services = [
  {
    title: "Group Travel",
    subtitle: "Journeys Better Together",
    description: "From corporate retreats to family reunions and friend getaways, we craft seamless group experiences tailored to your collective vision.",
    image: groupImage,
    href: "/group-travel",
    tag: "Groups of 8–200",
  },
  {
    title: "Sports & Adventure",
    subtitle: "Compete. Explore. Thrive.",
    description: "Golf tournaments in Scotland, ski weekends in the Alps, sailing regattas in the Mediterranean — elite sporting experiences curated for enthusiasts.",
    image: sportsImage,
    href: "/services#sports",
    tag: "Elite Experiences",
  },
  {
    title: "Luxury Escapes",
    subtitle: "Uncompromising Excellence",
    description: "Private villas, chartered yachts, and exclusive access to experiences money can't easily buy. For those who expect the very best.",
    image: luxuryImage,
    href: "/services#luxury",
    tag: "Ultra-Premium",
  },
];

const testimonials = [
  {
    quote: "Kaisen didn't just plan our company retreat — they transformed it into a defining moment for our team. Every detail was perfectly considered.",
    author: "James Holloway",
    role: "CEO, Meridian Partners",
    rating: 5,
  },
  {
    quote: "We've traveled extensively, but nothing compares to the level of personalization Kaisen delivers. It felt like they knew exactly what we wanted before we did.",
    author: "Sophie Laurent",
    role: "Travel Enthusiast",
    rating: 5,
  },
  {
    quote: "Our golf trip to Scotland was flawless. Tee times at St Andrews, private caddies, castle accommodation — pure magic from start to finish.",
    author: "Marcus Reid",
    role: "Golf Club Captain",
    rating: 5,
  },
];

const whyUs = [
  {
    icon: Users,
    title: "Person to Person",
    description: "A dedicated travel advisor guides you from first conversation to final farewell. No bots, no call centers.",
  },
  {
    icon: Trophy,
    title: "Specialist Expertise",
    description: "Deep knowledge in group dynamics, sports logistics, and luxury hospitality ensures nothing is left to chance.",
  },
  {
    icon: Star,
    title: "Handpicked Quality",
    description: "Every hotel, guide, experience, and transfer is personally vetted by our team of seasoned travelers.",
  },
  {
    icon: Shield,
    title: "Total Peace of Mind",
    description: "24/7 support throughout your journey. We're always just a call away, wherever in the world you are.",
  },
];

const Home = () => {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative min-h-[92vh] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Kaisen Travel Group — Luxury group travel"
            className="w-full h-full object-cover"
            loading="eager"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-navy/60 to-transparent" />
        </div>

        <div className="relative container mx-auto px-4 pb-16 md:pb-24 pt-32">
          <div className="max-w-2xl">
            <p className="text-xs tracking-[0.3em] text-gold-light uppercase mb-6 font-sans">
              Personalized Luxury Travel
            </p>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-light text-white leading-tight mb-6">
              Journeys Crafted<br />
              <em className="font-light italic text-gold-light">Just for You</em>
            </h1>
            <p className="text-white/70 text-lg leading-relaxed mb-10 max-w-lg">
              Group adventures, sporting escapes, and luxury experiences — all delivered with the care and attention of a trusted personal advisor.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/contact">
                <Button size="lg" className="rounded-none bg-primary hover:bg-primary/90 text-primary-foreground px-8 tracking-wider text-sm">
                  Plan Your Journey
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/services">
                <Button size="lg" variant="outline" className="rounded-none border-white/40 text-white hover:bg-white/10 px-8 tracking-wider text-sm">
                  Explore Experiences
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-60">
          <div className="w-px h-12 bg-white/50 animate-pulse" />
        </div>
      </section>

      {/* Stats */}
      <section className="bg-primary py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat) => (
              <div key={stat.label}>
                <div className="font-display text-3xl md:text-4xl text-primary-foreground mb-1">{stat.value}</div>
                <div className="text-xs tracking-widest uppercase text-primary-foreground/70 font-sans">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="kaisen-section bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-xs tracking-[0.3em] text-primary uppercase mb-4 font-sans">Our Specialities</p>
            <h2 className="font-display text-4xl md:text-5xl text-foreground mb-4">
              Experiences That Define<br />
              <em className="italic font-light">a Lifetime</em>
            </h2>
            <div className="w-12 h-px bg-primary mx-auto" />
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {services.map((service) => (
              <Link key={service.title} to={service.href} className="group block">
                <div className="relative overflow-hidden aspect-[3/4] mb-5">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-navy/20 to-transparent" />
                  <div className="absolute top-4 left-4">
                    <span className="text-[10px] tracking-[0.2em] uppercase bg-primary text-primary-foreground px-3 py-1 font-sans">
                      {service.tag}
                    </span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="font-display text-2xl text-white mb-1">{service.title}</h3>
                    <p className="text-xs tracking-wider text-gold-light uppercase font-sans">{service.subtitle}</p>
                  </div>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">{service.description}</p>
                <span className="text-primary text-sm font-medium tracking-wide group-hover:gap-3 flex items-center gap-2 transition-all">
                  Discover More <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why Kaisen */}
      <section className="kaisen-section bg-navy">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs tracking-[0.3em] text-gold uppercase mb-4 font-sans">Why Kaisen</p>
              <h2 className="font-display text-4xl md:text-5xl text-white mb-6 leading-tight">
                Travel Designed<br />
                <em className="italic font-light text-gold-light">Around You</em>
              </h2>
              <p className="text-white/60 leading-relaxed mb-10 text-base">
                In a world of automated bookings and generic packages, Kaisen Travel Group stands apart. We believe the best travel experiences begin with a genuine human connection — a conversation, a shared vision, and a commitment to getting every detail right.
              </p>
              <div className="grid sm:grid-cols-2 gap-8">
                {whyUs.map((item) => (
                  <div key={item.title} className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <item.icon className="h-4 w-4 text-gold" />
                    </div>
                    <div>
                      <h4 className="font-display text-lg text-white mb-1">{item.title}</h4>
                      <p className="text-white/50 text-sm leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[4/5] overflow-hidden">
                <img
                  src={luxuryImage}
                  alt="Personalized luxury travel"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-primary p-6 max-w-[200px]">
                <div className="font-display text-3xl text-primary-foreground mb-1">15+</div>
                <div className="text-[10px] tracking-[0.2em] uppercase text-primary-foreground/70 font-sans">Years crafting extraordinary journeys</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="kaisen-section bg-cream">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-xs tracking-[0.3em] text-primary uppercase mb-4 font-sans">What Our Clients Say</p>
            <h2 className="font-display text-4xl md:text-5xl text-foreground">
              Stories from the<br />
              <em className="italic font-light">Journey</em>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t) => (
              <div key={t.author} className="bg-card p-8 border border-border">
                <div className="flex gap-1 mb-6">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-primary text-primary" />
                  ))}
                </div>
                <blockquote className="font-display text-xl text-foreground leading-relaxed mb-6 italic">
                  "{t.quote}"
                </blockquote>
                <div>
                  <div className="font-medium text-foreground text-sm">{t.author}</div>
                  <div className="text-xs text-muted-foreground tracking-wide mt-1">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="relative py-28 overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImage} alt="CTA background" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-navy/80" />
        </div>
        <div className="relative container mx-auto px-4 text-center">
          <p className="text-xs tracking-[0.3em] text-gold uppercase mb-4 font-sans">Ready to Begin?</p>
          <h2 className="font-display text-4xl md:text-6xl text-white mb-6">
            Your Next Great Adventure<br />
            <em className="italic font-light text-gold-light">Starts with a Conversation</em>
          </h2>
          <p className="text-white/60 max-w-lg mx-auto mb-10 leading-relaxed">
            Speak with a Kaisen travel advisor today. No templates, no algorithms — just genuine expertise dedicated to your perfect trip.
          </p>
          <Link to="/contact">
            <Button size="lg" className="rounded-none bg-primary hover:bg-primary/90 px-10 tracking-widest text-sm">
              Start Planning Now
              <ArrowRight className="ml-3 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <FAQSection />

      <Footer />
    </div>
  );
};

export default Home;
