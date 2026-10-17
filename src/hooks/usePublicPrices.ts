import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Whether ticket prices may be shown to the public.
 *
 * Backed by the `public_prices_enabled` platform setting so KAISEN can switch
 * selling on without a redeploy. Prices are still calculated and stored while
 * this is off — only the public surfaces hide them, and the event page offers
 * an enquiry instead of checkout.
 *
 * Defaults to FALSE while loading: showing a price and then hiding it is worse
 * than a brief "Pris på förfrågan", and a failed lookup must never leak a
 * price the business hasn't approved.
 */
export function usePublicPricesEnabled(): { enabled: boolean; loading: boolean } {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await (supabase as any).rpc("get_platform_bool", {
          p_key: "public_prices_enabled",
          p_default: false,
        });
        if (!cancelled) setEnabled(data === true);
      } catch {
        if (!cancelled) setEnabled(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { enabled, loading };
}
