import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEntries, useSports } from "@/hooks/useNavigation";
import { MapPin, Search, Trophy, Calendar, Flag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatEventDate } from "@/lib/formatSek";

type EventHit = {
  id: string;
  sport: "soccer" | "formula1";
  home_team: string | null;
  away_team: string | null;
  race_name: string | null;
  tournament_name: string | null;
  starts_at: string;
};

type Suggestion =
  | {
      kind: "event";
      key: string;
      label: string;
      sublabel: string;
      href: string;
    }
  | {
      kind: "team" | "race";
      key: string;
      label: string;
      sublabel: string;
      href: string;
    }
  | {
      kind: "league";
      key: string;
      label: string;
      sublabel: string;
      href: string;
    };

const KIND_ICONS = {
  event: Calendar,
  team: Trophy,
  race: Flag,
  league: MapPin,
} as const;

const KIND_LABELS = {
  event: "Match",
  team: "Lag",
  race: "Race",
  league: "Liga",
} as const;

/**
 * Hero-search typeahead. Suggests three buckets keyed off what the user types:
 *   1. Upcoming events (specific games from public.events)
 *   2. Teams / races (from nav_menu_entries - every editable landing page)
 *   3. Leagues (distinct group_label values across nav_menu_entries)
 *
 * Clicking a suggestion navigates straight to that page. Pressing Enter without
 * picking falls back to /search?q=… so the existing search-results page still
 * handles general queries.
 */
export function SearchTypeahead({
  placeholder = "Sök destination, lag, race eller resetyp...",
}: { placeholder?: string }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [eventHits, setEventHits] = useState<EventHit[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const entries = useEntries();
  const sports = useSports();
  const sportById = useMemo(
    () => new Map(sports.map((s) => [s.id, s])),
    [sports],
  );

  // Debounced event search against the synced events table
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setEventHits([]);
      return;
    }
    const handle = setTimeout(async () => {
      const { data } = await (supabase as any)
        .from("events")
        .select("id, sport, home_team, away_team, race_name, tournament_name, starts_at")
        .eq("status", "upcoming")
        .gte("starts_at", new Date().toISOString())
        .or(
          `home_team.ilike.%${q}%,away_team.ilike.%${q}%,race_name.ilike.%${q}%,tournament_name.ilike.%${q}%,venue_name.ilike.%${q}%,city.ilike.%${q}%`,
        )
        .order("starts_at", { ascending: true })
        .limit(5);
      setEventHits((data ?? []) as EventHit[]);
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  // Suggestions derived from the navigation hook (nav_menu_entries + their groups)
  const suggestions: Suggestion[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const out: Suggestion[] = [];

    // Pre-compute: names of race-style landing pages, normalized for fuzzy
    // matching. Used below to suppress duplicate event rows for F1 - the
    // landing page already covers the same scheduled race, so showing both
    // a "MATCH Monaco Grand Prix" and a "RACE Monacos Grand Prix" is just
    // two doors to the same room.
    const normalizeRace = (name: string) =>
      name
        .toLowerCase()
        .replace(/\s*grand\s*prix\s*$/i, "")
        .replace(/s$/, "")
        .trim();
    const racePageNames = new Set<string>();
    for (const entry of entries) {
      if (entry.is_active === false) continue;
      const sport = sportById.get(entry.sport_id);
      if (sport?.entry_kind !== "race") continue;
      racePageNames.add(normalizeRace(entry.name));
    }

    // 1. Specific upcoming games (from `events`)
    for (const e of eventHits) {
      const sportSlug = e.sport === "soccer" ? "fotboll" : e.sport === "formula1" ? "f1" : e.sport;
      // Suppress F1 events that are already represented by a race landing page
      if (e.race_name && racePageNames.has(normalizeRace(e.race_name))) continue;
      const headline = e.sport === "soccer"
        ? `${e.home_team ?? ""} vs ${e.away_team ?? ""}`.trim()
        : e.race_name ?? "Event";
      out.push({
        kind: "event",
        key: `event-${e.id}`,
        label: headline,
        sublabel: `${e.tournament_name ?? sportSlug} · ${formatEventDate(e.starts_at)}`,
        href: `/sport/event/${e.id}`,
      });
    }

    // 2. Teams / races (nav_menu_entries) - match name, group_label, city, venue
    const seenSlugs = new Set<string>();
    for (const entry of entries) {
      if (entry.is_active === false) continue;
      const sport = sportById.get(entry.sport_id);
      if (!sport) continue;
      const haystack = [entry.name, entry.group_label, entry.city, entry.venue]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) continue;
      const key = `${sport.slug}/${entry.slug}`;
      if (seenSlugs.has(key)) continue;
      seenSlugs.add(key);
      out.push({
        kind: entry.sport_id && sport.entry_kind === "race" ? "race" : "team",
        key: `entry-${entry.id}`,
        label: entry.name,
        sublabel: [entry.group_label, sport.label, entry.city ?? entry.venue]
          .filter(Boolean)
          .join(" · "),
        href: `/services/sportresor/${sport.slug}/${entry.slug}`,
      });
      if (out.length > 12) break;
    }

    // 3. Leagues (distinct group_label values)
    const leagueLabels = new Map<string, string>(); // label -> first sport slug
    for (const entry of entries) {
      if (!entry.group_label) continue;
      if (entry.is_active === false) continue;
      const sport = sportById.get(entry.sport_id);
      if (!sport) continue;
      if (!entry.group_label.toLowerCase().includes(q)) continue;
      if (!leagueLabels.has(entry.group_label)) {
        leagueLabels.set(entry.group_label, sport.slug);
      }
    }
    for (const [label, sportSlug] of leagueLabels) {
      out.push({
        kind: "league",
        key: `league-${label}`,
        label,
        sublabel: `Liga · ${sportSlug === "fotboll" ? "Fotboll" : "F1"}`,
        href: `/services/sportresor#${label.toLowerCase().replace(/\s+/g, "-")}`,
      });
    }

    return out.slice(0, 12);
  }, [query, eventHits, entries, sportById]);

  // Close on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Reset highlight when results change
  useEffect(() => {
    setActiveIdx(0);
  }, [suggestions.length]);

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (open && suggestions[activeIdx]) {
      navigate(suggestions[activeIdx].href);
      setOpen(false);
      return;
    }
    const q = query.trim();
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || !suggestions.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <form
        onSubmit={submit}
        className="flex items-stretch bg-card border border-border rounded-full shadow-sm p-1.5 md:p-2"
      >
        <div className="relative flex items-center flex-1 min-w-0 pl-3 sm:pl-4 md:pl-5">
          <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0" strokeWidth={2} />
          <Input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKey}
            placeholder={placeholder}
            className="h-11 md:h-12 border-0 bg-transparent pl-2 sm:pl-3 text-base focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none placeholder:text-muted-foreground truncate"
            autoComplete="off"
          />
        </div>
        <Button
          type="submit"
          size="lg"
          aria-label="Sök"
          className="h-11 md:h-12 rounded-full bg-primary hover:bg-primary/90 px-4 sm:px-7 text-sm font-medium flex-shrink-0"
        >
          <span className="hidden sm:inline">Sök</span>
          <Search className="sm:ml-2 h-4 w-4" />
        </Button>
      </form>

      {open && query.trim().length >= 2 && (
        <div className="absolute left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-xl z-50 overflow-hidden max-h-[60vh] overflow-y-auto">
          {suggestions.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Inga träffar för "<strong>{query.trim()}</strong>". Tryck Enter för att söka ändå.
            </div>
          ) : (
            <ul role="listbox">
              {suggestions.map((s, idx) => {
                const Icon = KIND_ICONS[s.kind];
                const active = idx === activeIdx;
                return (
                  <li key={s.key} role="option" aria-selected={active}>
                    <button
                      type="button"
                      onMouseEnter={() => setActiveIdx(idx)}
                      onClick={() => {
                        navigate(s.href);
                        setOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${active ? "bg-accent" : "hover:bg-accent/60"}`}
                    >
                      <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{s.label}</div>
                        <div className="text-xs text-muted-foreground truncate">{s.sublabel}</div>
                      </div>
                      <span className="text-[10px] tracking-wider uppercase text-muted-foreground bg-muted px-2 py-0.5 rounded-full flex-shrink-0">
                        {KIND_LABELS[s.kind]}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
