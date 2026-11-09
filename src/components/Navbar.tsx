import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User, LogOut, Menu, X, ChevronDown, Globe } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { AuthDialog } from "@/components/AuthDialog";
import brandLogo from "@/assets/kaisen-brand-logo-white.png.asset.json";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { slugify as slug } from "@/data/sports";
import { CUP_SLUGS, CUP_GROUP_LABEL, cupHref } from "@/data/cups";
import { useSports, useEntries, useTopMenu, sortByRaceDate, type NavSport, type NavEntry } from "@/hooks/useNavigation";

const Navbar = () => {
  const { user, signOut } = useAuth();
  const { isAdmin, isHost } = useUserRole();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileSubmenu, setMobileSubmenu] = useState<string | null>(null);
  const [mobileFootballGroup, setMobileFootballGroup] = useState<string | null>(null);
  const sports = useSports();
  const entries = useEntries();
  const topMenu = useTopMenu();

  // Lock background scrolling while the mobile menu is open
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const entriesFor = (sportId: string) => {
    // show_in_menu defaults to true if absent (backward compat with static fallback)
    const list = entries.filter((e) => e.sport_id === sportId && (e.show_in_menu ?? true));
    // Races follow the calendar, not the admin sort order (same as the race pages).
    const sport = sports.find((s) => s.id === sportId);
    return sport?.entry_kind === "race" ? sortByRaceDate(list) : list;
  };
  const groupedFor = (sportId: string) => {
    const list = entriesFor(sportId);
    const map = new Map<string, NavEntry[]>();
    for (const e of list) {
      const key = e.group_label ?? "Övrigt";
      if (!map.has(key)) map.set(key, []);
      map.get(key)?.push(e);
    }
    return Array.from(map.entries());
  };

  return (
    <>
      <nav className="bg-navy-deep text-white sticky top-0 z-50 shadow-[0_1px_0_rgba(255,255,255,0.06)]" onKeyDown={(event) => { if (event.key === "Escape") { setOpenMenu(null); setMobileOpen(false); } }}>
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-10">
          {/* 3-col grid keeps the menu group dead-centered regardless of how wide
              the logo or right-side controls become */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center h-16 md:h-[72px] gap-4">
            {/* Logo */}
            <Link
              to="/"
              className="col-start-2 row-start-1 justify-self-center flex items-center gap-3 flex-shrink-0 xl:col-start-1 xl:justify-self-start"
            >
              <img src={brandLogo.url} alt="KAISEN TRAVEL GROUP" width={238} height={90} className="block w-[130px] md:w-[150px] h-auto object-contain" />
            </Link>

            {/* Desktop nav */}
            <div className="hidden xl:flex h-full items-center gap-x-7 2xl:gap-x-9">
              {sports.map((sport) => {
                const isOpen = openMenu === sport.slug;
                const sportEntries = entriesFor(sport.id);
                if (!sportEntries.length) return null;
                return (
                  <div
                    key={sport.id}
                    className={`flex h-full items-center ${sport.menu_style === "grouped" ? "static" : "relative"}`}
                    onMouseEnter={() => setOpenMenu(sport.slug)}
                    onMouseLeave={() => setOpenMenu(null)}
                  >
                    <Link
                      to={`/services/sportresor/${sport.slug}`}
                      onFocus={() => setOpenMenu(sport.slug)}
                      aria-expanded={isOpen}
                      className={`flex items-center gap-1 whitespace-nowrap font-display uppercase font-semibold text-[16px] tracking-wide transition-colors py-2 ${isOpen ? "text-white" : "text-white/85 hover:text-white"}`}
                    >
                      {sport.label}
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                    </Link>
                    {isOpen && sport.menu_style === "grouped" && (
                      <div
                        aria-label={`${sport.label} – ligor och cuper`}
                        className="absolute top-full left-0 right-0 mx-auto max-h-[calc(100dvh-6rem)] overflow-y-auto overscroll-contain bg-card text-foreground border-t border-border shadow-2xl rounded-b-lg z-50 px-6 md:px-10 py-7"
                      >
                        <div className="mx-auto max-w-[1440px] flex gap-x-8 overflow-x-auto pb-1">
                          {groupedFor(sport.id).map(([groupLabel, items]) => (
                            <div key={groupLabel} className="flex-1 min-w-[10rem] max-w-[15rem]">
                              {groupLabel === CUP_GROUP_LABEL ? (
                                <span className="flex min-h-9 items-center border-b-2 border-primary pb-2 mb-2 font-display text-[15px] uppercase italic font-bold text-primary whitespace-nowrap">
                                  {groupLabel}
                                </span>
                              ) : (
                                <Link
                                  to={`/services/sportresor/${sport.slug}/liga/${slug(groupLabel)}`}
                                  onClick={() => setOpenMenu(null)}
                                  className="flex min-h-9 items-center border-b-2 border-primary pb-2 mb-2 font-display text-[15px] uppercase italic font-bold text-primary hover:text-navy-deep whitespace-nowrap"
                                >
                                  {groupLabel}
                                </Link>
                              )}
                              <ul className="space-y-0.5">
                                {items.map((entry) => (
                                  <li key={entry.id}>
                                    <Link
                                      to={CUP_SLUGS.has(entry.slug) ? cupHref(sport.slug, entry.slug) : `/services/sportresor/${sport.slug}/${entry.slug}`}
                                      onClick={() => setOpenMenu(null)}
                                      className="flex min-h-10 items-center rounded-md px-2 py-2 text-sm leading-5 text-foreground/85 hover:bg-cream hover:text-primary focus-visible:bg-cream focus-visible:outline-none transition-colors whitespace-nowrap"
                                    >
                                      {entry.name}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {isOpen && sport.menu_style === "list" && (
                      <div className="absolute top-full left-0 bg-card text-foreground border border-border shadow-2xl rounded-b-lg z-50 min-w-[320px] max-h-[calc(100dvh-6rem)] overflow-y-auto overscroll-contain py-2">
                        {sportEntries.map((entry) => (
                          <Link
                            key={entry.id}
                            to={`/services/sportresor/${sport.slug}/${entry.slug}`}
                            onClick={() => setOpenMenu(null)}
                            className="flex items-center justify-between gap-6 px-5 py-2.5 hover:bg-cream transition-colors group"
                          >
                            <span className="font-display text-[15px] uppercase font-semibold text-foreground group-hover:text-primary">
                              {entry.name}
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
                  className="whitespace-nowrap font-display uppercase font-semibold text-[16px] tracking-wide text-white/85 hover:text-white transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Right side */}
            <div className="col-start-1 row-start-1 justify-self-start flex items-center gap-3 flex-shrink-0 xl:col-start-3 xl:justify-self-end">
              {/* Language - Swedish only */}
              <span className="hidden xl:flex items-center gap-1 text-sm text-white/70 py-2" aria-label="Språk: svenska">
                <Globe className="h-4 w-4" />
                <span className="text-xs uppercase tracking-wider">SV</span>
              </span>

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="hidden xl:flex items-center gap-2 text-white hover:bg-white/10 hover:text-white font-display uppercase font-semibold text-[15px] tracking-wide">
                      <User className="h-4 w-4" />
                      <span>Mitt konto</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Mitt konto</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/mitt-kaisen/dashboard">Mitt KAISEN</Link>
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
                  className="hidden xl:flex h-9 border-white/60 bg-transparent text-white hover:bg-white hover:text-primary rounded-lg px-4 font-display uppercase font-semibold text-[15px] tracking-wide"
                  onClick={() => setAuthDialogOpen(true)}
                >
                  Logga in
                </Button>
              )}

              <Link to="/contact" className="hidden xl:block">
                <Button
                  size="sm"
                  className="h-9 rounded-lg px-4 font-display uppercase font-semibold text-[15px] tracking-wide bg-white text-primary hover:bg-white/85"
                >
                  Planera din resa
                </Button>
              </Link>

              {/* Mobile menu toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="xl:hidden -ml-2 h-12 w-12 rounded-md text-white hover:bg-white/10 hover:text-white active:bg-white/15"
                onClick={() => { setMobileOpen(!mobileOpen); setMobileFootballGroup(null); }}
                aria-label="Växla meny"
                aria-expanded={mobileOpen}
              >
                {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="xl:hidden border-t border-white/10 bg-card text-foreground px-4 py-4 space-y-1 max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain">
            {sports.map((sport) => {
              const sportEntries = entriesFor(sport.id);
              if (!sportEntries.length) return null;
              const isOpen = mobileSubmenu === sport.slug;
              return (
                <div key={sport.id}>
                  <div className="w-full flex items-center justify-between border-b border-border font-display uppercase font-semibold text-lg tracking-wide text-foreground">
                    <Link
                      to={`/services/sportresor/${sport.slug}`}
                      onClick={() => setMobileOpen(false)}
                      className="flex-1 text-left py-4 px-2"
                    >
                      {sport.label}
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Visa ${sport.label}`}
                      aria-expanded={isOpen}
                      className="h-11 w-11 -mr-1 rounded-md active:bg-accent"
                      onClick={() => { setMobileSubmenu(isOpen ? null : sport.slug); setMobileFootballGroup(null); }}
                    >
                      <ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </Button>
                  </div>
                  {isOpen && sport.slug === "fotboll" && (
                    <div className="px-2 py-2 bg-accent/30 mb-2">
                      {groupedFor(sport.id).map(([groupLabel, items]) => {
                        const expanded = mobileFootballGroup === groupLabel;
                        return (
                          <div key={groupLabel} className="border-b border-border/40 last:border-b-0">
                            <Button
                              variant="ghost"
                              aria-expanded={expanded}
                              aria-controls={`mobile-football-${slug(groupLabel)}`}
                              className="w-full h-auto min-h-12 justify-between gap-3 rounded-sm px-3 py-3 text-left text-sm font-semibold text-primary whitespace-normal"
                              onClick={() => setMobileFootballGroup(expanded ? null : groupLabel)}
                            >
                              <span>{groupLabel}</span>
                              <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`} />
                            </Button>
                            {expanded && (
                              <div id={`mobile-football-${slug(groupLabel)}`} className="pl-3 pb-2">
                                {groupLabel !== CUP_GROUP_LABEL && (
                                  <Link
                                    to={`/services/sportresor/${sport.slug}/liga/${slug(groupLabel)}`}
                                    onClick={() => setMobileOpen(false)}
                                    className="flex min-h-11 items-center px-3 py-2 text-sm font-medium text-primary hover:bg-accent"
                                  >
                                    Se alla matcher
                                  </Link>
                                )}
                                {items.map((entry) => (
                                  <Link
                                    key={entry.id}
                                    to={CUP_SLUGS.has(entry.slug) ? cupHref(sport.slug, entry.slug) : `/services/sportresor/${sport.slug}/${entry.slug}`}
                                    onClick={() => setMobileOpen(false)}
                                    className="flex min-h-11 items-center rounded-sm px-3 py-2 text-sm leading-5 text-foreground/80 hover:bg-accent hover:text-primary break-words"
                                  >
                                    {entry.name}
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {isOpen && sport.slug !== "fotboll" && sport.menu_style === "grouped" && (
                    <div className="px-3 py-3 bg-accent/30 mb-2">
                      <div className="flex gap-x-3 overflow-x-auto pb-1">
                        {groupedFor(sport.id).map(([groupLabel, items]) => (
                          <div key={groupLabel} className="w-[9.5rem] flex-shrink-0 sm:w-40">
                            {groupLabel === CUP_GROUP_LABEL ? (
                              <span className="flex min-h-9 items-center border-b border-border text-xs tracking-normal uppercase text-primary font-semibold px-2 pb-2 mb-1 whitespace-nowrap">
                                {groupLabel}
                              </span>
                            ) : (
                              <Link
                                to={`/services/sportresor/${sport.slug}/liga/${slug(groupLabel)}`}
                                onClick={() => setMobileOpen(false)}
                                className="flex min-h-9 items-center border-b border-border text-xs tracking-normal uppercase text-primary font-semibold px-2 pb-2 mb-1 whitespace-nowrap"
                              >
                                {groupLabel}
                              </Link>
                            )}
                            <div className="space-y-0.5">
                              {items.map((entry) => (
                                <Link
                                  key={entry.id}
                                  to={CUP_SLUGS.has(entry.slug) ? cupHref(sport.slug, entry.slug) : `/services/sportresor/${sport.slug}/${entry.slug}`}
                                  className="flex min-h-11 items-center rounded-sm py-2 px-2 text-sm leading-5 text-foreground/80 hover:bg-accent hover:text-primary focus-visible:bg-accent focus-visible:outline-none transition-colors whitespace-nowrap"
                                  onClick={() => setMobileOpen(false)}
                                >
                                  {entry.name}
                                </Link>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {isOpen && sport.menu_style === "list" && (
                    <div className="pl-3 py-1 bg-accent/30 rounded-lg mb-2">
                      {sportEntries.map((entry) => (
                        <Link
                          key={entry.id}
                          to={`/services/sportresor/${sport.slug}/${entry.slug}`}
                          className="flex items-center justify-between gap-3 py-3 px-2 text-sm"
                          onClick={() => setMobileOpen(false)}
                        >
                          <span className="text-foreground/80">{entry.name}</span>
                          {entry.short_date && (
                            <span className="text-xs text-muted-foreground flex-shrink-0">{entry.short_date}</span>
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
                className="block font-display uppercase font-semibold text-lg tracking-wide py-4 px-2 text-foreground border-b border-border"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}

            <div className="pt-4 pb-2 space-y-3">
              <Link to="/contact" onClick={() => setMobileOpen(false)} className="block">
                <Button className="w-full h-12 rounded-lg bg-primary font-display uppercase font-semibold text-base tracking-wide">Planera din resa</Button>
              </Link>
              {user ? (
                <>
                  <Link to="/mitt-kaisen/dashboard" onClick={() => setMobileOpen(false)} className="block">
                    <Button variant="outline" className="w-full h-12 rounded-lg font-display uppercase font-semibold text-base tracking-wide">Mitt KAISEN</Button>
                  </Link>
                  <Button variant="ghost" className="w-full h-12 rounded-lg" onClick={signOut}>
                    <LogOut className="h-4 w-4 mr-2" /> Logga ut
                  </Button>
                </>
              ) : (
                <Button variant="outline" className="w-full h-12 rounded-lg border-primary text-primary font-display uppercase font-semibold text-base tracking-wide" onClick={() => { setAuthDialogOpen(true); setMobileOpen(false); }}>
                  Logga in
                </Button>
              )}
            </div>
          </div>
        )}
      </nav>

      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
    </>
  );
};

export default Navbar;
