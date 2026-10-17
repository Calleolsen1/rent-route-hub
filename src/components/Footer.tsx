import { useState } from "react";
import { Link } from "react-router-dom";
import { Instagram, Facebook, Linkedin, Twitter } from "lucide-react";
import { clearCookieConsent } from "@/components/CookieConsent";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Footer = () => {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error("Ange en giltig e-postadress");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await (supabase as any)
        .from("newsletter_signups")
        .insert({
          email: trimmed,
          source: window.location.pathname,
          user_agent: navigator.userAgent.slice(0, 200),
        });
      if (error) {
        // Unique constraint violation = already subscribed - treat as success
        if (error.code === "23505") {
          toast.success("Du är redan anmäld - tack!");
        } else {
          throw error;
        }
      } else {
        toast.success("Tack! Vi hör av oss med nyheter.");
      }
      setEmail("");
    } catch (e: any) {
      toast.error(e.message ?? "Något gick fel - försök igen");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="bg-navy-deep text-white border-t border-white/15">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-10 pt-10 md:pt-14 pb-24 md:pb-10">
        {/* Newsletter */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-16 items-end pb-10 md:pb-16">
          <div>
            <p className="text-[11px] eyebrow text-white/60 uppercase mb-4 font-sans">Nyhetsbrev</p>
            <h2 className="font-display text-2xl sm:text-3xl md:text-5xl text-white leading-[1.05]">
              Anmäl dig och håll dig <em className="italic font-light">uppdaterad</em>
            </h2>
          </div>
          <div>
            <form
              onSubmit={handleSubscribe}
              className="flex items-end gap-3 border-b border-white/40 pb-2"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ange din e-postadress...*"
                className="flex-1 bg-transparent text-white placeholder:text-white/50 text-base focus:outline-none py-2"
                disabled={submitting}
              />
              <button
                type="submit"
                disabled={submitting}
                className="border border-white text-white text-xs tracking-[0.2em] uppercase font-sans px-6 py-2.5 rounded-full hover:bg-white hover:text-navy transition-colors disabled:opacity-50"
              >
                {submitting ? "Skickar..." : "Anmäl"}
              </button>
            </form>
            <p className="text-xs text-white/60 mt-3 leading-relaxed">
              Genom att skicka in detta formulär godkänner jag att Kaisen Travel Group lagrar och behandlar mina personuppgifter enligt våra{" "}
              <Link to="/anvandarvillkor" className="underline hover:text-white">Användarvillkor</Link>{" "}
              &amp;{" "}
              <Link to="/integritetspolicy" className="underline hover:text-white">Integritetspolicy</Link>.
            </p>
          </div>
        </div>

        <div className="border-t border-white/15" />

        {/* Logo + link columns */}
        <div className="grid grid-cols-2 md:grid-cols-12 gap-8 md:gap-12 py-10 md:py-16">
          <div className="col-span-2 md:col-span-4">
            <Link to="/" className="inline-block">
              <div className="font-display text-3xl text-white tracking-[0.25em]">KAISEN</div>
              <div className="text-[10px] tracking-[0.3em] text-white/60 font-sans uppercase mt-1.5">Travel Group</div>
            </Link>
            <p className="text-sm text-white/60 leading-relaxed mt-6 max-w-xs">
              Vi skapar minnesvärda sportresor, träningsläger och gruppresor med gedigen erfarenhet, hög kompetens och personlig service.
            </p>

          </div>

          <div className="md:col-span-3">
            <h3 className="text-[11px] eyebrow text-white/60 uppercase font-sans mb-5">Tjänster</h3>
            <ul className="space-y-3 text-sm text-white/85">
              <li><Link to="/services/sportresor" className="hover:text-white transition-colors">Sportresor</Link></li>
              <li><Link to="/group-travel" className="hover:text-white transition-colors">Gruppresor</Link></li>
              <li><Link to="/services/weekend-getaway" className="hover:text-white transition-colors">Weekendresor</Link></li>
              <li><Link to="/services/konferens" className="hover:text-white transition-colors">Konferens</Link></li>
              <li><Link to="/services/vip-service" className="hover:text-white transition-colors">VIP-service</Link></li>
              <li><Link to="/services/affarsresor" className="hover:text-white transition-colors">Affärsresor</Link></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h3 className="text-[11px] eyebrow text-white/60 uppercase font-sans mb-5">Företaget</h3>
            <ul className="space-y-3 text-sm text-white/85">
              <li><Link to="/about" className="hover:text-white transition-colors">Om oss</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Planera din resa</Link></li>
              <li><Link to="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
              <li><Link to="/help-center" className="hover:text-white transition-colors">Hjälpcenter</Link></li>
              <li><Link to="/support" className="hover:text-white transition-colors">Support</Link></li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <h3 className="text-[11px] eyebrow text-white/60 uppercase font-sans mb-5">Kontakt</h3>
            <ul className="space-y-3 text-sm text-white/85">
              <li>Kaisen Travel Group AB</li>
              <li><a href="mailto:info@kaisengroup.se" className="hover:text-white transition-colors">info@kaisengroup.se</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/15" />

        {/* Bottom row */}
        <div className="pt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs text-white/60">
          <p>© {new Date().getFullYear()} Kaisen Travel Group. Alla rättigheter förbehållna.</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link to="/integritetspolicy" className="hover:text-white transition-colors">Integritetspolicy</Link>
            <span className="text-white/25">|</span>
            <Link to="/anvandarvillkor" className="hover:text-white transition-colors">Användarvillkor</Link>
            <span className="text-white/25">|</span>
            <button onClick={clearCookieConsent} className="hover:text-white transition-colors">Cookie-inställningar</button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
