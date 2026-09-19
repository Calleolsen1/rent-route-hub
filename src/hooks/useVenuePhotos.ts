import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Stadium/circuit photos keyed by lowercased venue label.
 *
 * Admin uploads under "Arenabilder" are keyed by the supplier's event name
 * (e.g. "Italian Grand Prix") while the menu entries use Swedish names
 * ("Italiens Grand Prix"), so the venue label ("Monza") is the reliable join.
 */
export function useVenuePhotos(): Record<string, string> {
  const [photos, setPhotos] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await (supabase as any)
          .from("team_venue_photos")
          .select("match_key, venue_label, image_url");
        if (cancelled || !data) return;
        const map: Record<string, string> = {};
        for (const r of data as {
          match_key: string;
          venue_label: string | null;
          image_url: string | null;
        }[]) {
          if (!r.image_url) continue;
          if (r.venue_label) map[r.venue_label.trim().toLowerCase()] = r.image_url;
          if (r.match_key) map[r.match_key.trim().toLowerCase()] = r.image_url;
        }
        setPhotos(map);
      } catch {
        // Cards simply fall back to their configured hero image.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return photos;
}

export function venuePhotoFor(
  photos: Record<string, string>,
  ...keys: (string | null | undefined)[]
): string | undefined {
  for (const k of keys) {
    if (!k) continue;
    const hit = photos[k.trim().toLowerCase()];
    if (hit) return hit;
  }
  return undefined;
}
