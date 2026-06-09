import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  TEAMS as STATIC_TEAMS,
  RACES as STATIC_RACES,
  FOOTBALL_LEAGUES as STATIC_LEAGUES,
  F1_RACES_NAV as STATIC_F1_NAV,
  type LeagueInfo,
} from "@/data/sports";

export type TopMenuItem = {
  id: string;
  label: string;
  href: string;
  sort_order: number;
  is_active: boolean;
};

export type NavTeam = {
  slug: string;
  name: string;
  league: string;
  city: string | null;
  stadium: string | null;
  tagline: string | null;
  description: string | null;
  hero_image_url: string | null;
  is_active: boolean;
  sort_order: number;
};

export type NavRace = {
  slug: string;
  name: string;
  circuit: string | null;
  city: string | null;
  date_text: string | null;
  short_date: string | null;
  tagline: string | null;
  description: string | null;
  hero_image_url: string | null;
  is_active: boolean;
  sort_order: number;
};

const STATIC_TOP_MENU: TopMenuItem[] = [
  { id: "s-group", label: "Grupp & Konferens", href: "/group-travel", sort_order: 10, is_active: true },
  { id: "s-train", label: "Träningsläger", href: "/services/traningslager", sort_order: 20, is_active: true },
  { id: "s-about", label: "Om oss", href: "/about", sort_order: 30, is_active: true },
  { id: "s-contact", label: "Kontakt", href: "/contact", sort_order: 40, is_active: true },
];

const STATIC_NAV_TEAMS: NavTeam[] = Object.values(STATIC_TEAMS).map((t, i) => ({
  slug: t.slug,
  name: t.name,
  league: t.league,
  city: t.city,
  stadium: t.stadium,
  tagline: t.tagline,
  description: t.description,
  hero_image_url: null,
  is_active: true,
  sort_order: (i + 1) * 10,
}));

const STATIC_NAV_RACES: NavRace[] = Object.values(STATIC_RACES).map((r, i) => ({
  slug: r.slug,
  name: r.name,
  circuit: r.circuit,
  city: r.city,
  date_text: r.date,
  short_date: r.shortDate,
  tagline: r.tagline,
  description: r.description,
  hero_image_url: null,
  is_active: true,
  sort_order: (i + 1) * 10,
}));

let cache: {
  topMenu?: TopMenuItem[];
  teams?: NavTeam[];
  races?: NavRace[];
} = {};
let inFlight: Promise<void> | null = null;

async function fetchAll(): Promise<void> {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    try {
      const [tm, teams, races] = await Promise.all([
        (supabase as any).from("nav_top_menu_items").select("*").eq("is_active", true).order("sort_order"),
        (supabase as any).from("nav_teams").select("*").eq("is_active", true).order("sort_order"),
        (supabase as any).from("nav_races").select("*").eq("is_active", true).order("sort_order"),
      ]);
      if (Array.isArray(tm.data)) cache.topMenu = tm.data as TopMenuItem[];
      if (Array.isArray(teams.data)) cache.teams = teams.data as NavTeam[];
      if (Array.isArray(races.data)) cache.races = races.data as NavRace[];
    } catch (e) {
      console.warn("[useNavigation] DB fetch failed, falling back to static", e);
    }
  })();
  return inFlight;
}

/** Invalidate the cache — call after admin mutations so the next read is fresh. */
export function invalidateNavigation() {
  cache = {};
  inFlight = null;
}

export function useTopMenu(): TopMenuItem[] {
  const [items, setItems] = useState<TopMenuItem[]>(cache.topMenu ?? STATIC_TOP_MENU);
  useEffect(() => {
    fetchAll().then(() => {
      if (cache.topMenu) setItems(cache.topMenu);
    });
  }, []);
  return items;
}

export function useTeams(): NavTeam[] {
  const [items, setItems] = useState<NavTeam[]>(cache.teams ?? STATIC_NAV_TEAMS);
  useEffect(() => {
    fetchAll().then(() => {
      if (cache.teams) setItems(cache.teams);
    });
  }, []);
  return items;
}

export function useRaces(): NavRace[] {
  const [items, setItems] = useState<NavRace[]>(cache.races ?? STATIC_NAV_RACES);
  useEffect(() => {
    fetchAll().then(() => {
      if (cache.races) setItems(cache.races);
    });
  }, []);
  return items;
}

/**
 * Group teams into LeagueInfo[] for the navbar mega-menu and Sportresor page.
 * Preserves DB sort_order within each league; league order follows the order
 * in which leagues first appear in the sorted team list.
 */
export function useFootballLeagues(): LeagueInfo[] {
  const teams = useTeams();
  if (!teams.length) return STATIC_LEAGUES;
  const byLeague = new Map<string, string[]>();
  for (const t of teams) {
    if (!byLeague.has(t.league)) byLeague.set(t.league, []);
    byLeague.get(t.league)!.push(t.name);
  }
  return Array.from(byLeague.entries()).map(([league, list]) => ({ league, teams: list }));
}

export function useF1Nav(): Array<{ slug: string; label: string; date: string }> {
  const races = useRaces();
  if (!races.length) return STATIC_F1_NAV;
  return races.map((r) => ({
    slug: r.slug,
    label: r.name.replace(/s Grand Prix$/i, "").replace(/ Grand Prix$/i, ""),
    date: r.short_date ?? "",
  }));
}

export function useTeam(slug?: string): NavTeam | undefined {
  const teams = useTeams();
  return slug ? teams.find((t) => t.slug === slug) : undefined;
}

export function useRace(slug?: string): NavRace | undefined {
  const races = useRaces();
  return slug ? races.find((r) => r.slug === slug) : undefined;
}
