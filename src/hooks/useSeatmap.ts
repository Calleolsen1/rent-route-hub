import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Seating chart for a fixture's home team, if one has been uploaded.
 *
 * No schedule API ships these — football-data.org and Jolpica both return
 * fixtures only — so they come from the admin upload keyed by home team, the
 * same row that holds the stadium photo.
 */
export function useSeatmap(
  sport: string | null,
  matchKey: string | null,
): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!sport || !matchKey) { setUrl(null); return; }
    (async () => {
      try {
        const { data } = await (supabase as any)
          .from("team_venue_photos")
          .select("seatmap_url")
          .eq("sport", sport)
          .eq("match_key", matchKey)
          .maybeSingle();
        if (!cancelled) setUrl((data?.seatmap_url as string) ?? null);
      } catch {
        if (!cancelled) setUrl(null);
      }
    })();
    return () => { cancelled = true; };
  }, [sport, matchKey]);

  return url;
}
