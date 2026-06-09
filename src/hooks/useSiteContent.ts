import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Batch-fetches multiple site_content rows by key. Returns a lookup function
 * that falls back to the provided default if the key isn't in DB yet (so
 * pages render the right copy even before the seed migration runs).
 *
 * Example:
 *   const get = useSiteContent(["contact_hero_title", "contact_intro"]);
 *   const title = get("contact_hero_title", "Planera Er Resa");
 *
 * Array-valued keys use getArray which always returns a string[]:
 *   const items = getArray("group_activities", FALLBACK_ITEMS);
 */
export function useSiteContent(keys: string[]) {
  const [values, setValues] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (!keys.length) return;
    (async () => {
      const { data } = await (supabase as any)
        .from("site_content")
        .select("key, value")
        .in("key", keys);
      const next: Record<string, unknown> = {};
      for (const row of (data ?? []) as Array<{ key: string; value: unknown }>) {
        next[row.key] = row.value;
      }
      setValues(next);
    })();
    // keys is treated as stable per render-tree; caller should pass an inline array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keys.join("|")]);

  const get = (key: string, fallback: string): string => {
    const v = values[key];
    return typeof v === "string" && v.length ? v : fallback;
  };

  const getArray = (key: string, fallback: string[]): string[] => {
    const v = values[key];
    if (Array.isArray(v) && v.every((x) => typeof x === "string") && v.length) {
      return v as string[];
    }
    return fallback;
  };

  return { get, getArray };
}
