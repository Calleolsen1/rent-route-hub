import { useState } from "react";
import { Link } from "react-router-dom";
import { AuthDialog } from "./AuthDialog";
import { MapPin, Phone, Mail, Instagram, Facebook, Linkedin } from "lucide-react";

const Footer = () => {
  const [authDialogOpen, setAuthDialogOpen] = useState(false);

  return (
    <>
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
                Personalized travel experiences crafted for discerning travelers. Group journeys, sports adventures, and luxury escapes — all curated with human touch.
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

            {/* Experiences */}
            <div>
              <h3 className="text-white font-display text-lg mb-2">Experiences</h3>
              <div className="w-8 h-px bg-gold mb-5" />
              <ul className="space-y-3 text-sm">
                <li><Link to="/services" className="hover:text-gold transition-colors">All Experiences</Link></li>
                <li><Link to="/group-travel" className="hover:text-gold transition-colors">Group Travel</Link></li>
                <li><Link to="/services#sports" className="hover:text-gold transition-colors">Sports & Adventure</Link></li>
                <li><Link to="/services#luxury" className="hover:text-gold transition-colors">Luxury Escapes</Link></li>
                <li><Link to="/search" className="hover:text-gold transition-colors">Browse Listings</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-white font-display text-lg mb-2">Company</h3>
              <div className="w-8 h-px bg-gold mb-5" />
              <ul className="space-y-3 text-sm">
                <li><Link to="/about" className="hover:text-gold transition-colors">About Us</Link></li>
                <li><Link to="/contact" className="hover:text-gold transition-colors">Plan Your Trip</Link></li>
                <li><Link to="/faq" className="hover:text-gold transition-colors">FAQ</Link></li>
                <li><Link to="/help-center" className="hover:text-gold transition-colors">Help Center</Link></li>
                <li><Link to="/support" className="hover:text-gold transition-colors">Support</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-white font-display text-lg mb-2">Contact</h3>
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
            <p>© {new Date().getFullYear()} Kaisen Travel Group. All rights reserved.</p>
            <div className="flex gap-6">
              <Link to="/faq" className="hover:text-gold transition-colors">Privacy Policy</Link>
              <Link to="/faq" className="hover:text-gold transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
    </>
  );
};

export default Footer;
