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
        const { data } = await (supabase as any)
          .from("team_venue_photos")
          .select("sport, match_key, image_url");
        if (cancelled || !data) return;
        const map: Record<string, string> = { ...BUILT_IN };
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
