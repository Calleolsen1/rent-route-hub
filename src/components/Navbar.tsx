import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User, LogOut, Menu, X, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { AuthDialog } from "@/components/AuthDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const tjänsterLinks = [
  { label: "Sportresor", to: "/services/sportresor", desc: "F1, fotboll & golf" },
  { label: "Affärsresor", to: "/services/affarsresor", desc: "Smidiga businessresor" },
  { label: "Weekend Getaway", to: "/services/weekend-getaway", desc: "Helgresor i Europa" },
  { label: "Konferens", to: "/services/konferens", desc: "Möten & event utomlands" },
  { label: "VIP-service", to: "/services/vip-service", desc: "Komplett personlig service" },
];

const Navbar = () => {
  const { user, signOut } = useAuth();
  const { isAdmin, isHost } = useUserRole();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tjänsterOpen, setTjänsterOpen] = useState(false);

  return (
    <>
      <nav className="border-b border-border/40 bg-card/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 flex-shrink-0">
              <div className="flex flex-col leading-none">
                <span className="font-display text-xl md:text-2xl font-semibold tracking-wide text-foreground">
                  KAISEN
                </span>
                <span className="text-[9px] md:text-[10px] tracking-[0.25em] text-primary font-sans font-medium uppercase">
                  Travel Group
                </span>
              </div>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-8">
              {/* Tjänster dropdown */}
              <div className="relative" onMouseEnter={() => setTjänsterOpen(true)} onMouseLeave={() => setTjänsterOpen(false)}>
                <button className="flex items-center gap-1 text-sm tracking-wide font-medium text-foreground/80 hover:text-primary transition-colors py-2">
                  Tjänster
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${tjänsterOpen ? "rotate-180" : ""}`} />
                </button>
                {tjänsterOpen && (
                  <div className="absolute top-full left-0 bg-card border border-border shadow-lg z-50 min-w-[220px] py-2">
                    {tjänsterLinks.map((item) => (
                      <Link
                        key={item.label}
                        to={item.to}
                        className="flex flex-col px-5 py-3 hover:bg-accent transition-colors group"
                        onClick={() => setTjänsterOpen(false)}
                      >
                        <span className="text-sm font-medium text-foreground group-hover:text-primary tracking-wide">{item.label}</span>
                        <span className="text-xs text-muted-foreground mt-0.5">{item.desc}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <Link to="/group-travel" className="text-sm tracking-wide font-medium text-foreground/80 hover:text-primary transition-colors">
                Gruppresor
              </Link>
              <Link to="/about" className="text-sm tracking-wide font-medium text-foreground/80 hover:text-primary transition-colors">
                Om oss
              </Link>
              <Link to="/contact" className="text-sm tracking-wide font-medium text-foreground/80 hover:text-primary transition-colors">
                Kontakt
              </Link>
            </div>

            {/* Auth */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="hidden md:flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>Konto</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Mitt konto</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/guest/dashboard">Mina resor</Link>
                    </DropdownMenuItem>
                    {isHost && (
                      <DropdownMenuItem asChild>
                        <Link to="/host/dashboard">Host-panel</Link>
                      </DropdownMenuItem>
                    )}
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin/dashboard">Admin-panel</Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Logga ut
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="hidden md:flex border-primary text-primary hover:bg-primary hover:text-primary-foreground rounded-none px-6 tracking-wider text-xs"
                  onClick={() => setAuthDialogOpen(true)}
                >
                  Logga in
                </Button>
              )}

              <Link to="/contact">
                <Button
                  size="sm"
                  className="hidden md:flex rounded-none px-6 tracking-wider text-xs bg-primary hover:bg-primary/90"
                >
                  Planera din resa
                </Button>
              </Link>

              {/* Mobile menu toggle */}
              <button
                className="md:hidden p-2"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t bg-card px-4 py-6 space-y-1">
            <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground px-2 pb-1">Tjänster</p>
            {tjänsterLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className="block text-sm font-medium tracking-wide py-2 px-2 text-foreground/80 hover:text-primary transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 border-t space-y-1">
              {["Gruppresor", "Om oss", "Kontakt"].map((label) => {
                const to = label === "Gruppresor" ? "/group-travel" : label === "Om oss" ? "/about" : "/contact";
                return (
                  <Link key={label} to={to} className="block text-sm font-medium tracking-wide py-2 px-2 text-foreground/80 hover:text-primary transition-colors" onClick={() => setMobileOpen(false)}>
                    {label}
                  </Link>
                );
              })}
            </div>
            <div className="pt-4 space-y-3 border-t">
              {user ? (
                <>
                  <Link to="/guest/dashboard" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" className="w-full rounded-none">Mina resor</Button>
                  </Link>
                  <Button variant="ghost" className="w-full rounded-none" onClick={signOut}>
                    <LogOut className="h-4 w-4 mr-2" /> Logga ut
                  </Button>
                </>
              ) : (
                <Button variant="outline" className="w-full rounded-none border-primary text-primary" onClick={() => { setAuthDialogOpen(true); setMobileOpen(false); }}>
                  Logga in
                </Button>
              )}
              <Link to="/contact" onClick={() => setMobileOpen(false)}>
                <Button className="w-full rounded-none bg-primary">Planera din resa</Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
    </>
  );
};

export default Navbar;
