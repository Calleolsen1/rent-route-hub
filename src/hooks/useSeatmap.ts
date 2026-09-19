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
): { url: string | null; note: string | null } {
  const [state, setState] = useState<{ url: string | null; note: string | null }>({
    url: null,
    note: null,
  });

  useEffect(() => {
    let cancelled = false;
    if (!sport || !matchKey) { setState({ url: null, note: null }); return; }
    (async () => {
      try {
        const { data } = await (supabase as any)
          .from("team_venue_photos")
          .select("seatmap_url, seatmap_note")
          .eq("sport", sport)
          .eq("match_key", matchKey)
          .maybeSingle();
        if (!cancelled) {
          setState({
            url: (data?.seatmap_url as string) ?? null,
            note: (data?.seatmap_note as string) ?? null,
          });
        }
      } catch {
        if (!cancelled) setState({ url: null, note: null });
      }
    })();
    return () => { cancelled = true; };
  }, [sport, matchKey]);

  return state;
}
