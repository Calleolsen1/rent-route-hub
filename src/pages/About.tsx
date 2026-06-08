import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import heroImage from "@/assets/about-hero.jpg";
import founderImage from "@/assets/about-founder.jpg";

const values = [
{
 title: "Personlig Service",
 desc: "Vi tror att den bästa reseupplevelsen börjar med ett genuint samtal. Ingen mall, ingen automatisering — bara människor som bryr sig om din resa."
},
{
 title: "Expertis i Världsklass",
 desc: "Vårt team har djup erfarenhet inom alla resekategorier — från sportevent och konferenser till lyxresor och gruppresor i alla storlekar."
},
{
 title: "Pålitlighet",
 desc: "Med 25+ år i branschen och hundratals nöjda kunder vet vi vad som krävs för att leverera — varje gång, utan undantag."
},
{
 title: "Diskretion",
 desc: "Vi hanterar alla kundrelationer med fullständig konfidentialitet och professionell integritet — oavsett uppdragets storlek."
}];


const expertise = [
{ area: "Gruppresor & Logistik", years: "25+ år" },
{ area: "Sportevent & VIP-biljetter", years: "20+ år" },
{ area: "Konferenser & Incentive", years: "25+ år" },
{ area: "Affärs- & Privatresor", years: "15+ år" }];


export default function About() {
 return (
 <div className="min-h-screen">
 <Navbar />

 {/* Hero */}
 <section className="relative h-[50vh] min-h-[360px] flex items-end">
 <div className="absolute inset-0">
 <img src={heroImage} alt="Om Kaisen Travel Group" className="w-full h-full object-cover" />
 <div className="absolute inset-0 bg-navy/70" />
 </div>
 <div className="relative container mx-auto px-4 pb-14">
 <p className="text-xs tracking-[0.3em] text-primary uppercase mb-3 font-sans">Om oss</p>
 <h1 className="font-display text-4xl md:text-6xl text-white">
 Vår <em className="italic font-light text-white">Historia</em>
 </h1>
 </div>
 </section>

 {/* Story + founder image */}
 <section className="py-12 md:py-16 bg-cream">
 <div className="container mx-auto px-4">
 <div className="grid md:grid-cols-2 gap-16 items-center">
 <div>
 <p className="text-xs tracking-[0.3em] text-primary uppercase mb-4 font-sans">Vilka vi är</p>
 <h2 className="font-display text-3xl md:text-4xl text-foreground mb-2 leading-tight">
 25 År av Passion för<br />
 <em className="italic font-light">Resor som Imponerar</em>
 </h2>
 <div className="w-10 h-px bg-primary mb-8" />
 <div className="space-y-5 text-muted-foreground leading-relaxed">
 <p>Kaisen Travel Group grundades av ett erfaret reseproffs med över 25 års erfarenhet i branschen. Vi har alltid trott att resor ska kännas personliga och inte som en produkt ur en hylla.

 </p>
 <p>
 Under åren har vi arrangerat gruppresor för Svenska Fotbollsförbundet, stora börsnoterade bolag och internationella organisationer. Uppdragen har varierat från VM-resor och elitsportsevent till storskaliga konferenser och incentiveresor runt om i världen.
 </p>
 <p>
 Idag har vi ett brett team med specialister inom alla resekategorier — men vår filosofi är densamma som dag ett: varje kund förtjänar personlig uppmärksamhet och en resa som är skräddarsydd just för dem.
 </p>
 </div>
 </div>
 <div className="relative">
 <div className="aspect-[4/5] overflow-hidden">
 <img src={founderImage} alt="Grundare Kaisen Travel Group" className="w-full h-full object-cover" />
 </div>
 <div className="absolute -bottom-4 -right-4 bg-navy p-6 max-w-[200px]">
 <div className="font-display text-3xl text-white mb-1">25+</div>
 <div className="text-[10px] tracking-[0.2em] uppercase text-primary font-sans">År i branschen</div>
 </div>
 </div>
 </div>
 </div>
 </section>

 {/* References strip */}
 <section className="bg-navy py-16 border-t border-primary/20">
 <div className="container mx-auto px-4">
 <p className="text-center text-xs tracking-[0.3em] text-primary uppercase mb-10 font-sans">Tidigare uppdrag & kunder</p>
 <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
 {[
 { label: "Svenska Fotbollsförbundet", detail: "VM & EM-gruppresor" },
 { label: "Stora Börsbolag", detail: "Incentive & konferenser" },
 { label: "Internationella Organisationer", detail: "Storskaliga event" },
 { label: "Privata Sällskap", detail: "Skräddarsydda resor" }].
 map((ref) =>
 <div key={ref.label} className="border-t border-white/10 pt-6">
 <h3 className="font-display text-lg text-white mb-2">{ref.label}</h3>
 <p className="text-white/40 text-xs tracking-[0.15em] uppercase font-sans">{ref.detail}</p>
 </div>
 )}
 </div>
 </div>
 </section>

 {/* Values */}
 <section className="py-12 md:py-16 bg-background">
 <div className="container mx-auto px-4">
 <div className="text-center mb-14">
 <p className="text-xs tracking-[0.3em] text-primary uppercase mb-4 font-sans">Vad vi står för</p>
 <h2 className="font-display text-3xl md:text-4xl text-foreground">
 Våra Värderingar
 </h2>
 </div>
 <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
 {values.map((v) =>
 <div key={v.title} className="border-t border-border pt-6">
 <h3 className="font-display text-xl text-foreground mb-3">{v.title}</h3>
 <div className="w-6 h-px bg-primary mb-4" />
 <p className="text-muted-foreground text-sm leading-relaxed">{v.desc}</p>
 </div>
 )}
 </div>
 </div>
 </section>

 {/* Expertise */}
 <section className="py-12 md:py-16 bg-cream">
 <div className="container mx-auto px-4">
 <div className="grid md:grid-cols-2 gap-16 items-center">
 <div>
 <p className="text-xs tracking-[0.3em] text-primary uppercase mb-4 font-sans">Vårt Team</p>
 <h2 className="font-display text-3xl md:text-4xl text-foreground mb-2">
 Bred Expertis — <em className="italic font-light">Djup Erfarenhet</em>
 </h2>
 <div className="w-10 h-px bg-primary mb-8" />
 <p className="text-muted-foreground leading-relaxed mb-8">
 Vi är ett team av resespecialister med lång erfarenhet inom varje nisch vi arbetar med. Ingen fråga är för komplex, ingen grupp för stor — vi har sett och löst det mesta under åren.
 </p>
 <p className="text-muted-foreground leading-relaxed">
 Det som skiljer oss åt är kombinationen av branscherfarenhet och personligt engagemang. Vi behandlar varje uppdrag som om det vore vårt eget.
 </p>
 </div>
 <div className="space-y-0 border border-border">
 {expertise.map((e, i) =>
 <div
 key={e.area}
 className={`flex items-center justify-between p-6 hover:bg-accent/30 transition-colors ${
 i < expertise.length - 1 ? "border-b border-border" : ""}`
 }>

 <span className="font-display text-lg text-foreground">{e.area}</span>
 <span className="text-primary text-sm font-sans tracking-wider">{e.years}</span>
 </div>
 )}
 </div>
 </div>
 </div>
 </section>

 {/* CTA */}
 <section className="bg-primary py-20">
 <div className="container mx-auto px-4 text-center">
 <h2 className="font-display text-3xl md:text-4xl text-primary-foreground mb-6">
 Redo att Planera Er Resa?
 </h2>
 <p className="text-primary-foreground/70 max-w-md mx-auto mb-10 leading-relaxed">
 En personlig konversation är alltid startpunkten för en bra resa. Kontakta oss idag.
 </p>
 <Link to="/contact">
 <Button size="lg" className="rounded-full bg-white text-primary hover:bg-white/90 px-10 tracking-wider text-sm font-semibold border-0">
 Kom i kontakt
 <ArrowRight className="ml-2 h-4 w-4" />
 </Button>
 </Link>
 </div>
 </section>

 <Footer />
 </div>);

}