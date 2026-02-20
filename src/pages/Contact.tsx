import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Phone, Mail, Clock, CheckCircle } from "lucide-react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import heroImage from "@/assets/contact-hero.jpg";

const schema = z.object({
  name: z.string().min(2, "Namnet måste vara minst 2 tecken").max(100),
  email: z.string().email("Ange en giltig e-postadress").max(255),
  phone: z.string().optional(),
  tripType: z.string().min(1, "Välj en resetyp"),
  groupSize: z.string().optional(),
  message: z.string().min(10, "Berätta lite mer om din resa").max(2000),
});

type FormData = z.infer<typeof schema>;

const contactInfo = [
  { icon: MapPin, label: "Adress", value: "123 Mayfair Lane, London, UK W1K 2AB" },
  { icon: Phone, label: "Telefon", value: "+44 20 1234 5678", href: "tel:+442012345678" },
  { icon: Mail, label: "E-post", value: "hello@kaisentravel.com", href: "mailto:hello@kaisentravel.com" },
  { icon: Clock, label: "Öppettider", value: "Mån–Fre 09–18, Lör 10–16" },
];

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    await new Promise((r) => setTimeout(r, 1000));
    console.log("Enquiry submitted:", data);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative h-[40vh] min-h-[280px] flex items-end">
        <div className="absolute inset-0">
          <img src={heroImage} alt="Kontakta Kaisen" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-navy/70" />
        </div>
        <div className="relative container mx-auto px-4 pb-14">
          <p className="text-xs tracking-[0.3em] text-gold uppercase mb-3 font-sans">Kom i kontakt</p>
          <h1 className="font-display text-4xl md:text-6xl text-white">
            Planera Er <em className="italic font-light text-gold-light">Resa</em>
          </h1>
        </div>
      </section>

      <section className="kaisen-section bg-cream">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-12 lg:gap-16">
            {/* Contact Info */}
            <div className="lg:col-span-1">
              <p className="text-xs tracking-[0.3em] text-primary uppercase mb-4 font-sans">Tala med oss</p>
              <h2 className="font-display text-3xl text-foreground mb-2">
                Vi startar med ett<br />
                <em className="italic font-light">Samtal</em>
              </h2>
              <div className="w-8 h-px bg-primary mb-8" />
              <p className="text-muted-foreground leading-relaxed mb-10 text-sm">
                Föredrar du att ringa eller mejla direkt? Ingen mall — bara ett riktigt samtal. En dedikerad rådgivare återkommer inom en timme under kontorstid.
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
            <div className="lg:col-span-2 bg-card border border-border p-8 md:p-10">
              {submitted ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <CheckCircle className="h-12 w-12 text-primary mb-6" />
                  <h3 className="font-display text-3xl text-foreground mb-3">Förfrågan Mottagen</h3>
                  <p className="text-muted-foreground max-w-sm leading-relaxed">
                    Tack för att du hörde av dig. En Kaisen-rådgivare återkommer inom en timme under kontorstid.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div>
                    <p className="text-xs tracking-[0.3em] text-primary uppercase mb-2 font-sans">Reseförfrågan</p>
                    <h3 className="font-display text-2xl text-foreground">Berätta Om Er Resa</h3>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="name" className="text-xs tracking-wider uppercase text-muted-foreground">Namn *</Label>
                      <Input id="name" {...register("name")} className="rounded-none border-border" placeholder="Ditt namn" />
                      {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-xs tracking-wider uppercase text-muted-foreground">E-post *</Label>
                      <Input id="email" type="email" {...register("email")} className="rounded-none border-border" placeholder="din@epost.se" />
                      {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className="text-xs tracking-wider uppercase text-muted-foreground">Telefon</Label>
                      <Input id="phone" {...register("phone")} className="rounded-none border-border" placeholder="+46 70 000 00 00" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs tracking-wider uppercase text-muted-foreground">Resetyp *</Label>
                      <Select onValueChange={(val) => setValue("tripType", val)}>
                        <SelectTrigger className="rounded-none border-border">
                          <SelectValue placeholder="Välj typ av resa" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="group">Gruppresa</SelectItem>
                          <SelectItem value="sports">Sportresa & Äventyr</SelectItem>
                          <SelectItem value="luxury">Lyxresa</SelectItem>
                          <SelectItem value="corporate">Företag / Incentive</SelectItem>
                          <SelectItem value="conference">Konferens</SelectItem>
                          <SelectItem value="weekend">Weekend Getaway</SelectItem>
                          <SelectItem value="vip">VIP-service</SelectItem>
                          <SelectItem value="other">Annat</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.tripType && <p className="text-xs text-destructive">{errors.tripType.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs tracking-wider uppercase text-muted-foreground">Grupstorlek (om aktuellt)</Label>
                    <Select onValueChange={(val) => setValue("groupSize", val)}>
                      <SelectTrigger className="rounded-none border-border">
                        <SelectValue placeholder="Välj grupstorlek" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="solo">Ensam / Par</SelectItem>
                        <SelectItem value="small">Liten grupp (3–10)</SelectItem>
                        <SelectItem value="medium">Mellanstor grupp (11–30)</SelectItem>
                        <SelectItem value="large">Stor grupp (31–100)</SelectItem>
                        <SelectItem value="xlarge">Extra stor (100+)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="message" className="text-xs tracking-wider uppercase text-muted-foreground">Berätta om er drömresa *</Label>
                    <Textarea
                      id="message"
                      {...register("message")}
                      className="rounded-none border-border min-h-[130px] resize-none"
                      placeholder="Destination, ungefärliga datum, budgetram, önskemål, särskilda krav..."
                    />
                    {errors.message && <p className="text-xs text-destructive">{errors.message.message}</p>}
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-none bg-primary hover:bg-primary/90 tracking-widest text-sm py-6"
                  >
                    {isSubmitting ? "Skickar förfrågan..." : "Skicka Förfrågan"}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    Vi återkommer inom 1 timme under kontorstid. All information hanteras konfidentiellt.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
