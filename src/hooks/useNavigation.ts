import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TEAMS as STATIC_TEAMS, RACES as STATIC_RACES } from "@/data/sports";
import { CUPS, CUP_GROUP_LABEL } from "@/data/cups";

export type TopMenuItem = {
  id: string;
  label: string;
  href: string;
  sort_order: number;
  is_active: boolean;
};

export type NavSport = {
  id: string;
  slug: string;
  label: string;
  sport_filter: string | null;
  menu_style: "grouped" | "list";
  entry_kind: "team" | "race";
  sort_order: number;
  is_active: boolean;
};

export type NavEntry = {
  id: string;
  sport_id: string;
  slug: string;
  name: string;
  group_label: string | null;
  city: string | null;
  venue: string | null;
  date_text: string | null;
  short_date: string | null;
  tagline: string | null;
  description: string | null;
  hero_image_url: string | null;
  features_json: string[] | null;
  sort_order: number;
  is_active: boolean;
  show_in_menu: boolean;
};

type Cache = {
  topMenu?: TopMenuItem[];
  sports?: NavSport[];
  entries?: NavEntry[];
  fetchedAt?: number;
};

/**
 * Static fallback rendered on first paint and whenever the DB returns empty.
 * Pre-migration this is what visitors see; post-migration the DB rows take
 * over and these constants only run if a fetch fails outright.
 *
 * IDs are stable string literals (not UUIDs) so React keys are deterministic.
 */
const STATIC_TOP_MENU: TopMenuItem[] = [
  { id: "static-group", label: "Grupp & Konferens", href: "/group-travel", sort_order: 10, is_active: true },
  { id: "static-train", label: "Träningsläger", href: "/services/traningslager", sort_order: 20, is_active: true },
  { id: "static-about", label: "Om oss", href: "/about", sort_order: 30, is_active: true },
  { id: "static-contact", label: "Kontakt", href: "/contact", sort_order: 40, is_active: true },
];

const STATIC_SPORTS: NavSport[] = [
  { id: "static-fotboll", slug: "fotboll", label: "Fotboll", sport_filter: "soccer", menu_style: "grouped", entry_kind: "team", sort_order: 10, is_active: true },
  { id: "static-f1", slug: "f1", label: "F1", sport_filter: "formula1", menu_style: "list", entry_kind: "race", sort_order: 20, is_active: true },
];

const STATIC_ENTRIES: NavEntry[] = [
  ...Object.values(STATIC_TEAMS).map((t, i) => ({
    id: `static-team-${t.slug}`,
    sport_id: "static-fotboll",
    slug: t.slug,
    name: t.name,
    group_label: t.league,
    city: t.city,
    venue: t.stadium,
    date_text: null,
    short_date: null,
    tagline: t.tagline,
    description: t.description,
    hero_image_url: null,
    features_json: null,
    sort_order: (i + 1) * 10,
    is_active: true,
    show_in_menu: true,
  })),
  ...Object.values(STATIC_RACES).map((r, i) => ({
    id: `static-race-${r.slug}`,
    sport_id: "static-f1",
    slug: r.slug,
    name: r.name,
    group_label: null,
    city: r.city,
    venue: r.circuit,
    date_text: r.date,
    short_date: r.shortDate,
    tagline: r.tagline,
    description: r.description,
    hero_image_url: null,
    features_json: null,
    sort_order: (i + 1) * 10,
    is_active: true,
    show_in_menu: true,
  })),
  // Cups get their own "Cuper" group in the menu, mirroring the DB rows.
  ...CUPS.map((c, i) => ({
    id: `static-cup-${c.slug}`,
    sport_id: "static-fotboll",
    slug: c.slug,
    name: c.name,
    group_label: CUP_GROUP_LABEL,
    city: null,
    venue: null,
    date_text: null,
    short_date: null,
    tagline: null,
    description: c.description,
    hero_image_url: null,
    features_json: null,
    sort_order: 900 + (i + 1) * 10,
    is_active: true,
    show_in_menu: true,
  })),
];

let cache: Cache = {};
let inFlight: Promise<void> | null = null;
const subscribers = new Set<() => void>();

function notify() {
  for (const cb of subscribers) cb();
}

async function fetchAll(): Promise<void> {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    try {
      const [tm, sports, entries] = await Promise.all([
        (supabase as any).from("nav_top_menu_items").select("*").eq("is_active", true).order("sort_order"),
        (supabase as any).from("nav_sports").select("*").eq("is_active", true).order("sort_order"),
        (supabase as any).from("nav_menu_entries").select("*").eq("is_active", true).order("sort_order"),
      ]);
      cache = {
        topMenu: Array.isArray(tm.data) ? (tm.data as TopMenuItem[]) : [],
        sports: Array.isArray(sports.data) ? (sports.data as NavSport[]) : [],
        entries: Array.isArray(entries.data) ? (entries.data as NavEntry[]) : [],
        fetchedAt: Date.now(),
      };
      notify();
    } catch (e) {
      console.warn("[useNavigation] DB fetch failed", e);
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

/** Invalidate the cache - call after admin mutations so reads are fresh. */
export function invalidateNavigation() {
  cache = {};
  inFlight = null;
  fetchAll();
}

/**
 * Refetch on window focus - gives near-real-time sync without Supabase
 * Realtime overhead. Bound once at module load so all subscribers benefit.
 */
if (typeof window !== "undefined") {
  let lastFocus = 0;
  window.addEventListener("focus", () => {
    // Throttle to once per 5 seconds to avoid storms when tab-cycling
    const now = Date.now();
    if (now - lastFocus < 5000) return;
    lastFocus = now;
    invalidateNavigation();
  });
}

function useNavCache<T>(pick: (c: Cache) => T | undefined, fallback: T): T {
  const [value, setValue] = useState<T>(pick(cache) ?? fallback);
  useEffect(() => {
    if (cache.fetchedAt === undefined) {
      fetchAll();
    }
    const update = () => setValue(pick(cache) ?? fallback);
    subscribers.add(update);
    update();
    return () => {
      subscribers.delete(update);
    };
    // pick + fallback are stable from caller perspective
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return value;
}

// When DB returns empty (pre-migration / fetch failure) fall back to the
// static constants so the navbar is never blank. As soon as the DB has rows,
// they take precedence.
export function useTopMenu(): TopMenuItem[] {
  const v = useNavCache((c) => c.topMenu, STATIC_TOP_MENU);
  return v.length ? v : STATIC_TOP_MENU;
}

export function useSports(): NavSport[] {
  const v = useNavCache((c) => c.sports, STATIC_SPORTS);
  return v.length ? v : STATIC_SPORTS;
}

export function useEntries(): NavEntry[] {
  const v = useNavCache((c) => c.entries, STATIC_ENTRIES);
  return v.length ? v : STATIC_ENTRIES;
}

export function useSport(slug?: string): NavSport | undefined {
  const sports = useSports();
  return slug ? sports.find((s) => s.slug === slug) : undefined;
}

export function useEntriesForSport(sportSlug?: string): NavEntry[] {
  const sports = useSports();
  const entries = useEntries();
  const sport = sportSlug ? sports.find((s) => s.slug === sportSlug) : undefined;
  if (!sport) return [];
  return entries.filter((e) => e.sport_id === sport.id);
}

export function useEntry(sportSlug?: string, entrySlug?: string): NavEntry | undefined {
  const items = useEntriesForSport(sportSlug);
  return entrySlug ? items.find((e) => e.slug === entrySlug) : undefined;
}
