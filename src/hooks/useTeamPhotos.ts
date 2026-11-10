import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { STADIUM_PHOTOS } from "@/data/stadiumPhotos";

/** Built-in stadium photos as the base layer; admin uploads override them. */
const BUILT_IN: Record<string, string> = Object.fromEntries(
  Object.entries(STADIUM_PHOTOS).map(([team, p]) => [`soccer|${team}`, p.url]),
);

/**
 * Stadium photos keyed `"<sport>|<home team or race name>"`.
 *
 * Fetched once per page rather than per card: the table holds at most one row
 * per home team (~81 today), so a single read covers every event in a listing.
 */
export function useTeamPhotos(): Record<string, string> {
  const [photos, setPhotos] = useState<Record<string, string>>(BUILT_IN);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- tables not in generated types
        const db = supabase as any;
        const [{ data }, { data: f1 }] = await Promise.all([
          db.from("team_venue_photos").select("sport, match_key, image_url"),
          db.from("nav_sports").select("id").eq("slug", "f1").maybeSingle(),
        ]);
        if (cancelled || !data) return;
        const map: Record<string, string> = { ...BUILT_IN };
        // F1 races: the race page's hero photo (F1 menu entry) unless an admin
        // uploaded one, so race cards show the circuit, not the generic shot.
        if (f1?.id) {
          const { data: races } = await db.from("nav_menu_entries")
            .select("name, hero_image_url").eq("sport_id", f1.id).not("hero_image_url", "is", null);
          for (const r of (races ?? []) as { name: string; hero_image_url: string }[]) map[`formula1|${r.name}`] = r.hero_image_url;
        }
        if (cancelled) return;
        // image_url is nullable — a team may have only a seating chart.
        for (const r of data as { sport: string; match_key: string; image_url: string | null }[]) {
          if (r.image_url) map[`${r.sport}|${r.match_key}`] = r.image_url;
        }
        setPhotos(map);
      } catch {
        // A failed lookup just means every card falls back to its generated
        // plate — worth no user-visible error.
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return photos;
}
