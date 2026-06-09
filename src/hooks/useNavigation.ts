import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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
};

type Cache = {
  topMenu?: TopMenuItem[];
  sports?: NavSport[];
  entries?: NavEntry[];
  fetchedAt?: number;
};

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

/** Invalidate the cache — call after admin mutations so reads are fresh. */
export function invalidateNavigation() {
  cache = {};
  inFlight = null;
  fetchAll();
}

/**
 * Refetch on window focus — gives near-real-time sync without Supabase
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

export function useTopMenu(): TopMenuItem[] {
  return useNavCache((c) => c.topMenu, []);
}

export function useSports(): NavSport[] {
  return useNavCache((c) => c.sports, []);
}

export function useEntries(): NavEntry[] {
  return useNavCache((c) => c.entries, []);
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
