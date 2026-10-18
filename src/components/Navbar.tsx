import { useEffect, useState } from "react";
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
import { CUP_SLUGS, CUP_GROUP_LABEL, cupHref } from "@/data/cups";
import { useSports, useEntries, useTopMenu, type NavSport, type NavEntry } from "@/hooks/useNavigation";

const Navbar = () => {
  const { user, signOut } = useAuth();
  const { isAdmin, isHost } = useUserRole();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileSubmenu, setMobileSubmenu] = useState<string | null>(null);
  const [mobileGroup, setMobileGroup] = useState<string | null>(null);
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

  const entriesFor = (sportId: string) =>
    // show_in_menu defaults to true if absent (backward compat with static fallback)
    entries.filter((e) => e.sport_id === sportId && (e.show_in_menu ?? true));
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
      <nav className="border-b border-border/40 bg-card/95 backdrop-blur-sm sticky top-0 z-50" onKeyDown={(event) => { if (event.key === "Escape") { setOpenMenu(null); setMobileOpen(false); } }}>
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-10">
          {/* 3-col grid keeps the menu group dead-centered regardless of how wide
              the logo or right-side controls become */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center h-16 md:h-20 gap-4">
            {/* Logo */}
            <Link
              to="/"
              className="col-start-2 row-start-1 justify-self-center flex items-center gap-3 flex-shrink-0 xl:col-start-1 xl:justify-self-start"
            >
              <div className="flex flex-col leading-none">
                <span className="font-display text-xl md:text-2xl font-semibold tracking-wide text-foreground">
                  KAISEN
                </span>
                <span className="text-[9px] md:text-[10px] tracking-[0.25em] text-primary font-sans font-medium uppercase">
                  TRAVEL GROUP
                </span>
              </div>
            </Link>

            {/* Desktop nav */}
            <div className="hidden xl:flex h-full items-center gap-4">
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
                      className="flex items-center gap-1 whitespace-nowrap text-sm tracking-wide font-medium text-foreground/80 hover:text-primary transition-colors py-2"
                    >
                      {sport.label}
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                    </Link>
                    {isOpen && sport.menu_style === "grouped" && (
                      <div
                        aria-label={`${sport.label} – ligor och cuper`}
                        className="absolute top-full left-6 right-6 mx-auto max-w-[1440px] max-h-[calc(100dvh-6rem)] overflow-y-auto overscroll-contain bg-card border border-border shadow-xl z-50 p-6"
                      >
                        <div className="flex gap-x-6 overflow-x-auto pb-1">
                          {groupedFor(sport.id).map(([groupLabel, items]) => (
                            <div key={groupLabel} className="flex-1 min-w-[10rem] max-w-[15rem]">
                              {groupLabel === CUP_GROUP_LABEL ? (
                                <span className="flex min-h-9 items-center border-b border-border pb-2 mb-2 text-xs tracking-normal uppercase text-primary font-semibold whitespace-nowrap">
                                  {groupLabel}
                                </span>
                              ) : (
                                <Link
                                  to={`/services/sportresor/${sport.slug}/liga/${slug(groupLabel)}`}
                                  onClick={() => setOpenMenu(null)}
                                  className="flex min-h-9 items-center border-b border-border pb-2 mb-2 text-xs tracking-normal uppercase text-primary font-semibold hover:underline underline-offset-4 whitespace-nowrap"
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
                                      className="flex min-h-10 items-center rounded-sm px-2 py-2 text-sm leading-5 text-foreground/80 hover:bg-accent hover:text-primary focus-visible:bg-accent focus-visible:outline-none transition-colors whitespace-nowrap"
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
                      <div className="absolute top-full left-0 bg-card border border-border shadow-xl z-50 min-w-[300px] max-h-[calc(100dvh-6rem)] overflow-y-auto overscroll-contain py-2">
                        {sportEntries.map((entry) => (
                          <Link
                            key={entry.id}
                            to={`/services/sportresor/${sport.slug}/${entry.slug}`}
                            onClick={() => setOpenMenu(null)}
                            className="flex items-center justify-between gap-6 px-5 py-2.5 hover:bg-accent transition-colors group"
                          >
                            <span className="text-sm font-medium text-foreground group-hover:text-primary tracking-wide">
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
                  className="whitespace-nowrap text-sm tracking-wide font-medium text-foreground/80 hover:text-primary transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Right side */}
            <div className="col-start-1 row-start-1 justify-self-start flex items-center gap-3 flex-shrink-0 xl:col-start-3 xl:justify-self-end">
              {/* Language - Swedish only */}
              <span className="hidden xl:flex items-center gap-1 text-sm text-foreground/70 py-2" aria-label="Språk: svenska">
                <Globe className="h-4 w-4" />
                <span className="text-xs uppercase tracking-wider">SV</span>
              </span>

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="hidden xl:flex items-center gap-2">
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
                  className="hidden xl:flex border-primary text-primary hover:bg-primary hover:text-primary-foreground rounded-none px-4 tracking-wider text-xs"
                  onClick={() => setAuthDialogOpen(true)}
                >
                  Logga in
                </Button>
              )}

              <Link to="/contact" className="hidden xl:block">
                <Button
                  size="sm"
                  className="rounded-none px-4 tracking-wider text-xs bg-primary hover:bg-primary/90"
                >
                  Planera din resa
                </Button>
              </Link>

              {/* Mobile menu toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="xl:hidden -ml-2 h-12 w-12 rounded-md active:bg-accent"
                onClick={() => setMobileOpen(!mobileOpen)}
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
          <div className="xl:hidden border-t bg-card px-4 py-4 space-y-1 max-h-[calc(100dvh-5rem)] overflow-y-auto overscroll-contain">
            {sports.map((sport) => {
              const sportEntries = entriesFor(sport.id);
              if (!sportEntries.length) return null;
              const isOpen = mobileSubmenu === sport.slug;
              return (
                <div key={sport.id}>
                  <div className="w-full flex items-center justify-between border-b border-border/40 text-base font-medium tracking-wide text-foreground">
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
                      onClick={() => setMobileSubmenu(isOpen ? null : sport.slug)}
                    >
                      <ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </Button>
                  </div>
                  {isOpen && sport.menu_style === "grouped" && (
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
                className="block text-base font-medium tracking-wide py-4 px-2 text-foreground/80 border-b border-border/40"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}

            <div className="pt-4 pb-2 space-y-3">
              <Link to="/contact" onClick={() => setMobileOpen(false)} className="block">
                <Button className="w-full h-12 rounded-full bg-primary text-base">Planera din resa</Button>
              </Link>
              {user ? (
                <>
                  <Link to="/mitt-kaisen/dashboard" onClick={() => setMobileOpen(false)} className="block">
                    <Button variant="outline" className="w-full h-12 rounded-full">Mitt KAISEN</Button>
                  </Link>
                  <Button variant="ghost" className="w-full h-12 rounded-full" onClick={signOut}>
                    <LogOut className="h-4 w-4 mr-2" /> Logga ut
                  </Button>
                </>
              ) : (
                <Button variant="outline" className="w-full h-12 rounded-full border-primary text-primary text-base" onClick={() => { setAuthDialogOpen(true); setMobileOpen(false); }}>
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
