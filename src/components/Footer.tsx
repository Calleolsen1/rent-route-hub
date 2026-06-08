import { useState } from "react";
import { Link } from "react-router-dom";
import { Instagram, Facebook, Linkedin, Twitter } from "lucide-react";

const Footer = () => {
  const [email, setEmail] = useState("");

  return (
    <footer className="bg-navy text-white">
      <div className="w-full max-w-[1600px] mx-auto px-6 md:px-10 py-8 md:py-10">
        {/* Newsletter */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-10 items-start pb-6">
          <div>
            <h2 className="font-sans font-semibold text-2xl md:text-3xl text-white">
              Anmäl dig och håll dig uppdaterad!
            </h2>
          </div>
          <div>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="flex items-end gap-3 border-b border-white/40 pb-1.5"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ange din e-postadress...*"
                className="flex-1 bg-transparent text-white placeholder:text-white/60 text-base focus:outline-none py-2"
              />
              <button
                type="submit"
                className="border border-white text-white text-sm font-medium px-6 py-2 rounded-full hover:bg-white hover:text-navy transition-colors"
              >
                Anmäl
              </button>
            </form>
            <p className="text-sm text-white/70 mt-3 leading-relaxed">

              Genom att skicka in detta formulär godkänner jag att Kaisen Travel Group lagrar och behandlar mina personuppgifter enligt våra{" "}
              <Link to="/faq" className="underline hover:text-white">Allmänna villkor</Link>{" "}
              &amp;{" "}
              <Link to="/faq" className="underline hover:text-white">Integritetspolicy</Link>.
            </p>
          </div>
        </div>

        {/* Logo + social */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-1 pb-5">
          <Link to="/" className="inline-block">
            <div className="font-display text-2xl md:text-3xl font-semibold text-white tracking-[0.25em]">KAISEN</div>
            <div className="text-xs tracking-[0.3em] text-white/70 font-sans uppercase mt-1">Travel Group</div>
          </Link>
          <div className="flex gap-4 text-white">
            <a href="#" aria-label="Facebook" className="hover:text-gold transition-colors"><Facebook className="h-4 w-4" /></a>
            <a href="#" aria-label="Twitter" className="hover:text-gold transition-colors"><Twitter className="h-4 w-4" /></a>
            <a href="#" aria-label="Instagram" className="hover:text-gold transition-colors"><Instagram className="h-4 w-4" /></a>
            <a href="#" aria-label="LinkedIn" className="hover:text-gold transition-colors"><Linkedin className="h-4 w-4" /></a>
          </div>
        </div>

        <div className="border-t border-white/20" />

        {/* Link columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 py-7">
          <div>
            <h3 className="text-white font-sans font-semibold text-base mb-4">Tjänster</h3>
            <ul className="space-y-2.5 text-sm text-white/80">


              <li><Link to="/services/sportresor" className="hover:text-gold transition-colors">Sportresor</Link></li>
              <li><Link to="/group-travel" className="hover:text-gold transition-colors">Gruppresor</Link></li>
              <li><Link to="/services/weekend-getaway" className="hover:text-gold transition-colors">Weekendresor</Link></li>
              <li><Link to="/services/konferens" className="hover:text-gold transition-colors">Konferens</Link></li>
              <li><Link to="/services/vip-service" className="hover:text-gold transition-colors">VIP-service</Link></li>
              <li><Link to="/services/affarsresor" className="hover:text-gold transition-colors">Affärsresor</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-sans font-semibold text-base mb-4">Företaget</h3>
            <ul className="space-y-2.5 text-sm text-white/80">

              <li><Link to="/about" className="hover:text-gold transition-colors">Om oss</Link></li>
              <li><Link to="/contact" className="hover:text-gold transition-colors">Planera din resa</Link></li>
              <li><Link to="/faq" className="hover:text-gold transition-colors">FAQ</Link></li>
              <li><Link to="/help-center" className="hover:text-gold transition-colors">Hjälpcenter</Link></li>
              <li><Link to="/support" className="hover:text-gold transition-colors">Support</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-sans font-semibold text-base mb-4">Kontakt</h3>
            <ul className="space-y-2.5 text-sm text-white/80">

              <li>123 Mayfair Lane,<br />London, UK W1K 2AB</li>
              <li><a href="tel:+442012345678" className="hover:text-gold transition-colors">+44 20 1234 5678</a></li>
              <li><a href="mailto:hello@kaisentravel.com" className="hover:text-gold transition-colors">hello@kaisentravel.com</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/20" />

        {/* Bottom row */}
        <div className="pt-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-sm text-white/70">

          <p>© {new Date().getFullYear()} Kaisen Travel Group. Alla rättigheter förbehållna.</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link to="/faq" className="hover:text-white transition-colors">Integritetspolicy</Link>
            <span className="text-white/30">|</span>
            <Link to="/faq" className="hover:text-white transition-colors">Allmänna villkor</Link>
            <span className="text-white/30">|</span>
            <Link to="/faq" className="hover:text-white transition-colors">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
