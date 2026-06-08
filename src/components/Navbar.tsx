import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User, LogOut, Menu, X, ChevronDown, Globe } from "lucide-react";
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

const footballLeagues = [
  {
    league: "Bundesliga",
    teams: ["Bayern München", "Borussia Dortmund"],
  },
  {
    league: "La Liga",
    teams: ["Atlético Madrid", "FC Barcelona", "Real Madrid"],
  },
  {
    league: "Premier League",
    teams: ["Arsenal", "Chelsea", "Liverpool", "Manchester City", "Manchester United", "Tottenham Hotspur"],
  },
  {
    league: "Serie A",
    teams: ["Milan", "Inter", "Juventus", "Roma"],
  },
];

const f1Races = [
  { label: "Ungern", date: "26 juli" },
  { label: "Italien – Monza", date: "6 september" },
  { label: "Spanien – Madrid", date: "13 september" },
  { label: "USA – Austin", date: "25 oktober" },
  { label: "Las Vegas", date: "21 november" },
  { label: "Qatar", date: "29 november" },
  { label: "Abu Dhabi", date: "6 december" },
  { label: "Miami", date: "9 maj 2027" },
  { label: "Monaco", date: "6 juni 2027" },
  { label: "Algarve", date: "13 juni 2027" },
];

const slug = (s: string) =>
  s.toLowerCase().replace(/å|ä/g, "a").replace(/ö/g, "o").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const Navbar = () => {
  const { user, signOut } = useAuth();
  const { isAdmin, isHost } = useUserRole();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<null | "fotboll" | "f1" | "sprak">(null);
  const [mobileSubmenu, setMobileSubmenu] = useState<string | null>(null);

  return (
    <>
      <nav className="border-b border-border/40 bg-card/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="w-full max-w-[1600px] mx-auto px-6 md:px-10">
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
            <div className="hidden lg:flex items-center gap-7">
              {/* FOTBOLL mega menu */}
              <div className="relative" onMouseEnter={() => setOpenMenu("fotboll")} onMouseLeave={() => setOpenMenu(null)}>
                <button className="flex items-center gap-1 text-sm tracking-wide font-medium text-foreground/80 hover:text-primary transition-colors py-2">
                  Fotboll
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${openMenu === "fotboll" ? "rotate-180" : ""}`} />
                </button>
                {openMenu === "fotboll" && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 bg-card border border-border shadow-xl z-50 w-[760px] p-6 grid grid-cols-4 gap-6">
                    {footballLeagues.map((lg) => (
                      <div key={lg.league}>
                        <Link
                          to={`/services/sportresor#${slug(lg.league)}`}
                          onClick={() => setOpenMenu(null)}
                          className="block text-[11px] tracking-[0.2em] uppercase text-primary font-semibold mb-3 hover:underline"
                        >
                          {lg.league}
                        </Link>
                        <ul className="space-y-1.5">
                          {lg.teams.map((team) => (
                            <li key={team}>
                              <Link
                                to={`/services/sportresor/fotboll/${slug(team)}`}
                                onClick={() => setOpenMenu(null)}
                                className="text-sm text-foreground/80 hover:text-primary transition-colors"
                              >
                                {team}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* F1 dropdown */}
              <div className="relative" onMouseEnter={() => setOpenMenu("f1")} onMouseLeave={() => setOpenMenu(null)}>
                <button className="flex items-center gap-1 text-sm tracking-wide font-medium text-foreground/80 hover:text-primary transition-colors py-2">
                  F1
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${openMenu === "f1" ? "rotate-180" : ""}`} />
                </button>
                {openMenu === "f1" && (
                  <div className="absolute top-full left-0 bg-card border border-border shadow-xl z-50 min-w-[260px] py-2">
                    {f1Races.map((r) => (
                      <Link
                        key={r.label}
                        to={`/services/sportresor/f1/${slug(r.label)}`}
                        onClick={() => setOpenMenu(null)}
                        className="flex items-center justify-between gap-6 px-5 py-2.5 hover:bg-accent transition-colors group"
                      >
                        <span className="text-sm font-medium text-foreground group-hover:text-primary tracking-wide">{r.label}</span>
                        <span className="text-xs text-muted-foreground">{r.date}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <Link to="/group-travel" className="text-sm tracking-wide font-medium text-foreground/80 hover:text-primary transition-colors">
                Grupp & Konferens
              </Link>
              <Link to="/services/traningslager" className="text-sm tracking-wide font-medium text-foreground/80 hover:text-primary transition-colors">
                Träningsläger
              </Link>
              <Link to="/about" className="text-sm tracking-wide font-medium text-foreground/80 hover:text-primary transition-colors">
                Om oss
              </Link>
              <Link to="/contact" className="text-sm tracking-wide font-medium text-foreground/80 hover:text-primary transition-colors">
                Kontakt
              </Link>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Language */}
              <div className="hidden lg:block relative" onMouseEnter={() => setOpenMenu("sprak")} onMouseLeave={() => setOpenMenu(null)}>
                <button className="flex items-center gap-1 text-sm text-foreground/70 hover:text-primary transition-colors py-2" aria-label="Språk">
                  <Globe className="h-4 w-4" />
                  <span className="text-xs uppercase tracking-wider">SV</span>
                </button>
                {openMenu === "sprak" && (
                  <div className="absolute top-full right-0 bg-card border border-border shadow-lg z-50 min-w-[140px] py-2">
                    <button className="w-full text-left px-4 py-2 text-sm hover:bg-accent transition-colors">Svenska</button>
                    <button className="w-full text-left px-4 py-2 text-sm hover:bg-accent transition-colors">Engelska</button>
                  </div>
                )}
              </div>

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="hidden lg:flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>Mitt konto</span>
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
                  className="hidden lg:flex border-primary text-primary hover:bg-primary hover:text-primary-foreground rounded-none px-6 tracking-wider text-xs"
                  onClick={() => setAuthDialogOpen(true)}
                >
                  Logga in
                </Button>
              )}

              <Link to="/contact" className="hidden lg:block">
                <Button
                  size="sm"
                  className="rounded-none px-6 tracking-wider text-xs bg-primary hover:bg-primary/90"
                >
                  Planera din resa
                </Button>
              </Link>

              {/* Mobile menu toggle */}
              <button
                className="lg:hidden p-2"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Växla meny"
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t bg-card px-4 py-6 space-y-1 max-h-[calc(100vh-4rem)] overflow-y-auto">
            {/* Fotboll */}
            <button
              className="w-full flex items-center justify-between py-3 px-2 text-sm font-medium tracking-wide text-foreground"
              onClick={() => setMobileSubmenu(mobileSubmenu === "fotboll" ? null : "fotboll")}
            >
              Fotboll
              <ChevronDown className={`h-4 w-4 transition-transform ${mobileSubmenu === "fotboll" ? "rotate-180" : ""}`} />
            </button>
            {mobileSubmenu === "fotboll" && (
              <div className="pl-4 pb-2 space-y-3">
                {footballLeagues.map((lg) => (
                  <div key={lg.league}>
                    <p className="text-[10px] tracking-[0.2em] uppercase text-primary font-semibold py-1">{lg.league}</p>
                    {lg.teams.map((team) => (
                      <Link
                        key={team}
                        to={`/services/sportresor/fotboll/${slug(team)}`}
                        className="block py-1.5 px-2 text-sm text-foreground/80"
                        onClick={() => setMobileOpen(false)}
                      >
                        {team}
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* F1 */}
            <button
              className="w-full flex items-center justify-between py-3 px-2 text-sm font-medium tracking-wide text-foreground"
              onClick={() => setMobileSubmenu(mobileSubmenu === "f1" ? null : "f1")}
            >
              F1
              <ChevronDown className={`h-4 w-4 transition-transform ${mobileSubmenu === "f1" ? "rotate-180" : ""}`} />
            </button>
            {mobileSubmenu === "f1" && (
              <div className="pl-4 pb-2">
                {f1Races.map((r) => (
                  <Link
                    key={r.label}
                    to={`/services/sportresor/f1/${slug(r.label)}`}
                    className="flex items-center justify-between py-2 px-2 text-sm"
                    onClick={() => setMobileOpen(false)}
                  >
                    <span className="text-foreground/80">{r.label}</span>
                    <span className="text-xs text-muted-foreground">{r.date}</span>
                  </Link>
                ))}
              </div>
            )}

            {[
              { label: "Grupp & Konferens", to: "/group-travel" },
              { label: "Träningsläger", to: "/services/traningslager" },
              { label: "Om oss", to: "/about" },
              { label: "Kontakt", to: "/contact" },
            ].map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className="block text-sm font-medium tracking-wide py-3 px-2 text-foreground/80 hover:text-primary transition-colors border-t border-border/40"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            <div className="pt-4 space-y-3 border-t border-border/40">
              {user ? (
                <>
                  <Link to="/guest/dashboard" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" className="w-full rounded-none">Mitt konto</Button>
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
