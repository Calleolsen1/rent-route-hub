import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EXTRA_CRESTS } from "@/data/extraCrests";

/**
 * Club crests keyed by canonical team name, populated by football-sync from
 * football-data.org. One read per page covers every card in a listing.
 * EXTRA_CRESTS covers clubs football-data can't supply; synced rows win.
 */
export function useTeamCrests(): Record<string, string> {
  const [crests, setCrests] = useState<Record<string, string>>(EXTRA_CRESTS);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await (supabase as any)
          .from("team_crests")
          .select("team_name, crest_url");
        if (cancelled || !data) return;
        const map: Record<string, string> = { ...EXTRA_CRESTS };
        for (const r of data as { team_name: string; crest_url: string }[]) {
          if (r.crest_url) map[r.team_name] = r.crest_url;
        }
        setCrests(map);
      } catch {
        // No crests just means cards fall back to the typographic plate.
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return crests;
}
