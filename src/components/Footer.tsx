import { Link } from "react-router-dom";
import { Instagram, Facebook, Linkedin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-navy text-white/80 border-t-4 border-primary">
      <div className="w-full max-w-[1600px] mx-auto px-6 md:px-10 py-14 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-2 max-w-sm">
            <div className="mb-4">
              <div className="font-display text-xl font-semibold text-white tracking-wide">KAISEN</div>
              <div className="text-[10px] tracking-[0.25em] text-primary-foreground/80 font-sans uppercase mt-0.5">Travel Group</div>

            </div>
            <p className="text-sm leading-relaxed text-foreground/60 mb-5">
              Personlig reseservice skapad för dig. Gruppresor, sportevent och skräddarsydda upplevelser — levererade med hjärta och expertis i 25+ år.
            </p>
            <div className="flex gap-4">
              <a href="#" aria-label="Instagram" className="text-foreground/50 hover:text-primary transition-colors">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="#" aria-label="Facebook" className="text-foreground/50 hover:text-primary transition-colors">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="#" aria-label="LinkedIn" className="text-foreground/50 hover:text-primary transition-colors">
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Tjänster */}
          <div>
            <h3 className="text-foreground font-sans font-semibold text-sm mb-4">Tjänster</h3>
            <ul className="space-y-2.5 text-sm text-foreground/70">
              <li><Link to="/services/sportresor" className="hover:text-primary transition-colors">Sportresor</Link></li>
              <li><Link to="/group-travel" className="hover:text-primary transition-colors">Gruppresor</Link></li>
              <li><Link to="/services/weekend-getaway" className="hover:text-primary transition-colors">Weekendresor</Link></li>
              <li><Link to="/services/konferens" className="hover:text-primary transition-colors">Konferens</Link></li>
              <li><Link to="/services/vip-service" className="hover:text-primary transition-colors">VIP-service</Link></li>
              <li><Link to="/services/affarsresor" className="hover:text-primary transition-colors">Affärsresor</Link></li>
            </ul>
          </div>

          {/* Företaget */}
          <div>
            <h3 className="text-foreground font-sans font-semibold text-sm mb-4">Företaget</h3>
            <ul className="space-y-2.5 text-sm text-foreground/70">
              <li><Link to="/about" className="hover:text-primary transition-colors">Om oss</Link></li>
              <li><Link to="/contact" className="hover:text-primary transition-colors">Planera din resa</Link></li>
              <li><Link to="/faq" className="hover:text-primary transition-colors">FAQ</Link></li>
              <li><Link to="/help-center" className="hover:text-primary transition-colors">Hjälpcenter</Link></li>
              <li><Link to="/support" className="hover:text-primary transition-colors">Support</Link></li>
            </ul>
          </div>

          {/* Kontakt */}
          <div>
            <h3 className="text-foreground font-sans font-semibold text-sm mb-4">Kontakt</h3>
            <ul className="space-y-2.5 text-sm text-foreground/70">
              <li>123 Mayfair Lane,<br />London, UK W1K 2AB</li>
              <li><a href="tel:+442012345678" className="hover:text-primary transition-colors">+44 20 1234 5678</a></li>
              <li><a href="mailto:hello@kaisentravel.com" className="hover:text-primary transition-colors">hello@kaisentravel.com</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border/60 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-foreground/50">
          <p>© {new Date().getFullYear()} Kaisen Travel Group. Alla rättigheter förbehållna.</p>
          <div className="flex gap-6">
            <Link to="/faq" className="hover:text-primary transition-colors">Integritetspolicy</Link>
            <Link to="/faq" className="hover:text-primary transition-colors">Allmänna villkor</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
