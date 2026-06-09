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
import { slugify as slug } from "@/data/sports";
import { useSports, useEntries, useTopMenu, type NavSport, type NavEntry } from "@/hooks/useNavigation";

const Navbar = () => {
  const { user, signOut } = useAuth();
  const { isAdmin, isHost } = useUserRole();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileSubmenu, setMobileSubmenu] = useState<string | null>(null);
  const sports = useSports();
  const entries = useEntries();
  const topMenu = useTopMenu();

  const entriesFor = (sportId: string) =>
    // show_in_menu defaults to true if absent (backward compat with static fallback)
    entries.filter((e) => e.sport_id === sportId && (e.show_in_menu ?? true));
  const groupedFor = (sportId: string) => {
    const list = entriesFor(sportId);
    const map = new Map<string, NavEntry[]>();
    for (const e of list) {
      const key = e.group_label ?? "Övrigt";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return Array.from(map.entries());
  };

  return (
    <>
      <nav className="border-b border-border/40 bg-card/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="w-full max-w-[1600px] mx-auto px-6 md:px-10">
          {/* 3-col grid keeps the menu group dead-centered regardless of how wide
              the logo or right-side controls become */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center h-16 md:h-20 gap-4">
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
              {sports.map((sport) => {
                const isOpen = openMenu === sport.slug;
                const sportEntries = entriesFor(sport.id);
                if (!sportEntries.length) return null;
                return (
                  <div
                    key={sport.id}
                    className="relative"
                    onMouseEnter={() => setOpenMenu(sport.slug)}
                    onMouseLeave={() => setOpenMenu(null)}
                  >
                    <button className="flex items-center gap-1 text-sm tracking-wide font-medium text-foreground/80 hover:text-primary transition-colors py-2">
                      {sport.label}
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                    {isOpen && sport.menu_style === "grouped" && (
                      <div
                        className="absolute top-full left-0 bg-card border border-border shadow-xl z-50 p-6 gap-6 grid"
                        style={{
                          // Size to actual league count so 3-league sports don't render an empty column
                          // and 5+ league sports don't get clipped. Cap at viewport width minus margin.
                          width: `min(${Math.max(groupedFor(sport.id).length, 1) * 190}px, calc(100vw - 3rem))`,
                          gridTemplateColumns: `repeat(${Math.max(groupedFor(sport.id).length, 1)}, minmax(0, 1fr))`,
                        }}
                      >
                        {groupedFor(sport.id).map(([groupLabel, items]) => (
                          <div key={groupLabel}>
                            <Link
                              to={`/services/sportresor#${slug(groupLabel)}`}
                              onClick={() => setOpenMenu(null)}
                              className="block text-[11px] tracking-[0.2em] uppercase text-primary font-semibold mb-3 hover:underline"
                            >
                              {groupLabel}
                            </Link>
                            <ul className="space-y-1.5">
                              {items.map((entry) => (
                                <li key={entry.id}>
                                  <Link
                                    to={`/services/sportresor/${sport.slug}/${entry.slug}`}
                                    onClick={() => setOpenMenu(null)}
                                    className="text-sm text-foreground/80 hover:text-primary transition-colors"
                                  >
                                    {entry.name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                    {isOpen && sport.menu_style === "list" && (
                      <div className="absolute top-full left-0 bg-card border border-border shadow-xl z-50 min-w-[260px] py-2">
                        {sportEntries.map((entry) => (
                          <Link
                            key={entry.id}
                            to={`/services/sportresor/${sport.slug}/${entry.slug}`}
                            onClick={() => setOpenMenu(null)}
                            className="flex items-center justify-between gap-6 px-5 py-2.5 hover:bg-accent transition-colors group"
                          >
                            <span className="text-sm font-medium text-foreground group-hover:text-primary tracking-wide">
                              {entry.name.replace(/s Grand Prix$/i, "").replace(/ Grand Prix$/i, "")}
                            </span>
                            {entry.short_date && (
                              <span className="text-xs text-muted-foreground">{entry.short_date}</span>
                            )}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {topMenu.map((item) => (
                <Link
                  key={item.id}
                  to={item.href}
                  className="text-sm tracking-wide font-medium text-foreground/80 hover:text-primary transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3 justify-end flex-shrink-0">
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
                      <Link to="/mitt-kaisen/dashboard">Mitt Kaisen</Link>
                    </DropdownMenuItem>
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
            {sports.map((sport) => {
              const sportEntries = entriesFor(sport.id);
              if (!sportEntries.length) return null;
              const isOpen = mobileSubmenu === sport.slug;
              return (
                <div key={sport.id}>
                  <button
                    className="w-full flex items-center justify-between py-3 px-2 text-sm font-medium tracking-wide text-foreground"
                    onClick={() => setMobileSubmenu(isOpen ? null : sport.slug)}
                  >
                    {sport.label}
                    <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  {isOpen && sport.menu_style === "grouped" && (
                    <div className="pl-4 pb-2 space-y-3">
                      {groupedFor(sport.id).map(([groupLabel, items]) => (
                        <div key={groupLabel}>
                          <p className="text-[10px] tracking-[0.2em] uppercase text-primary font-semibold py-1">{groupLabel}</p>
                          {items.map((entry) => (
                            <Link
                              key={entry.id}
                              to={`/services/sportresor/${sport.slug}/${entry.slug}`}
                              className="block py-1.5 px-2 text-sm text-foreground/80"
                              onClick={() => setMobileOpen(false)}
                            >
                              {entry.name}
                            </Link>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                  {isOpen && sport.menu_style === "list" && (
                    <div className="pl-4 pb-2">
                      {sportEntries.map((entry) => (
                        <Link
                          key={entry.id}
                          to={`/services/sportresor/${sport.slug}/${entry.slug}`}
                          className="flex items-center justify-between py-2 px-2 text-sm"
                          onClick={() => setMobileOpen(false)}
                        >
                          <span className="text-foreground/80">{entry.name}</span>
                          {entry.short_date && (
                            <span className="text-xs text-muted-foreground">{entry.short_date}</span>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {topMenu.map((item) => (
              <Link
                key={item.id}
                to={item.href}
                className="block text-sm font-medium tracking-wide py-3 px-2 text-foreground/80 hover:text-primary transition-colors border-t border-border/40"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}

            <div className="pt-4 space-y-3 border-t border-border/40">
              {user ? (
                <>
                  <Link to="/mitt-kaisen/dashboard" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" className="w-full rounded-none">Mitt Kaisen</Button>
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
