import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Instagram, Facebook, Linkedin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-navy text-white/80">
      <div className="container mx-auto px-4 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="mb-6">
              <div className="font-display text-2xl font-semibold text-white tracking-wide">KAISEN</div>
              <div className="text-[10px] tracking-[0.25em] text-gold font-sans uppercase mt-0.5">Travel Group</div>
            </div>
            <p className="text-sm leading-relaxed text-white/60 mb-6">
              Personlig reseservice skapad för dig. Gruppresor, sportevent och skräddarsydda upplevelser — levererade med hjärta och expertis i 25+ år.
            </p>
            <div className="flex gap-4">
              <a href="#" aria-label="Instagram" className="text-white/40 hover:text-gold transition-colors">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="#" aria-label="Facebook" className="text-white/40 hover:text-gold transition-colors">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="#" aria-label="LinkedIn" className="text-white/40 hover:text-gold transition-colors">
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Tjänster */}
          <div>
            <h3 className="text-white font-display text-lg mb-2">Tjänster</h3>
            <div className="w-8 h-px bg-gold mb-5" />
            <ul className="space-y-3 text-sm">
              <li><Link to="/services/sportresor" className="hover:text-gold transition-colors">Sportresor</Link></li>
              <li><Link to="/group-travel" className="hover:text-gold transition-colors">Gruppresor</Link></li>
              <li><Link to="/services/weekend-getaway" className="hover:text-gold transition-colors">Weekendresor</Link></li>
              <li><Link to="/services/konferens" className="hover:text-gold transition-colors">Konferens</Link></li>
              <li><Link to="/services/vip-service" className="hover:text-gold transition-colors">VIP-service</Link></li>
              <li><Link to="/services/affarsresor" className="hover:text-gold transition-colors">Affärsresor</Link></li>
            </ul>
          </div>

          {/* Företaget */}
          <div>
            <h3 className="text-white font-display text-lg mb-2">Företaget</h3>
            <div className="w-8 h-px bg-gold mb-5" />
            <ul className="space-y-3 text-sm">
              <li><Link to="/about" className="hover:text-gold transition-colors">Om oss</Link></li>
              <li><Link to="/contact" className="hover:text-gold transition-colors">Planera din resa</Link></li>
              <li><Link to="/faq" className="hover:text-gold transition-colors">FAQ</Link></li>
              <li><Link to="/help-center" className="hover:text-gold transition-colors">Hjälpcenter</Link></li>
              <li><Link to="/support" className="hover:text-gold transition-colors">Support</Link></li>
            </ul>
          </div>

          {/* Kontakt */}
          <div>
            <h3 className="text-white font-display text-lg mb-2">Kontakt</h3>
            <div className="w-8 h-px bg-gold mb-5" />
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-gold mt-0.5 flex-shrink-0" />
                <span>123 Mayfair Lane, London, UK W1K 2AB</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-gold flex-shrink-0" />
                <a href="tel:+442012345678" className="hover:text-gold transition-colors">+44 20 1234 5678</a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-gold flex-shrink-0" />
                <a href="mailto:hello@kaisentravel.com" className="hover:text-gold transition-colors">hello@kaisentravel.com</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-white/40">
          <p>© {new Date().getFullYear()} Kaisen Travel Group. Alla rättigheter förbehållna.</p>
          <div className="flex gap-6">
            <Link to="/faq" className="hover:text-gold transition-colors">Integritetspolicy</Link>
            <Link to="/faq" className="hover:text-gold transition-colors">Allmänna villkor</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
