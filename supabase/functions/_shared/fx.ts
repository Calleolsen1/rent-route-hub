// Live exchange rates to SEK for supplier prices (EUR and GBP).
//
// Source: the European Central Bank's daily reference rates via Frankfurter
// (free, keyless), with open.er-api.com as a fallback. Rates are cached in
// public.fx_rates for CACHE_HOURS so a busy event page doesn't call out on
// every view — ECB publishes once a working day anyway.
//
// If both sources are down, the last cached rate is used however old it is,
// and only when there has never been one does it fall back to the
// admin-editable eur_to_sek_rate setting. A stale rate prices slightly off;
// no rate at all would take every ticket off sale.

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

type Admin = SupabaseClient<any, "public", any>;

const CACHE_HOURS = 6;

export interface FxRate {
  currency: string;
  rateToSek: number;
  rateDate: string | null;
  source: string;
  fetchedAt: string;
  /** True when a fresh fetch failed and an older cached rate was used. */
  stale: boolean;
}

async function fetchFrankfurter(currency: string): Promise<{ rate: number; date: string | null } | null> {
  const res = await fetch(`https://api.frankfurter.dev/v1/latest?base=${currency}&symbols=SEK`, {
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) return null;
  const body = await res.json();
  const rate = Number(body?.rates?.SEK);
  return rate > 0 ? { rate, date: body.date ?? null } : null;
}

async function fetchErApi(currency: string): Promise<{ rate: number; date: string | null } | null> {
  const res = await fetch(`https://open.er-api.com/v6/latest/${currency}`, {
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) return null;
  const body = await res.json();
  const rate = Number(body?.rates?.SEK);
  if (body?.result !== "success" || !(rate > 0)) return null;
  const date = body.time_last_update_unix
    ? new Date(body.time_last_update_unix * 1000).toISOString().slice(0, 10)
    : null;
  return { rate, date };
}

/** Rate to convert one unit of `currency` into SEK. */
export async function rateToSek(admin: Admin, currency: string): Promise<FxRate> {
  const cur = currency.toUpperCase();
  if (cur === "SEK") {
    return { currency: cur, rateToSek: 1, rateDate: null, source: "identity", fetchedAt: new Date().toISOString(), stale: false };
  }

  const { data: cached } = await admin
    .from("fx_rates")
    .select("currency, rate_to_sek, rate_date, source, fetched_at")
    .eq("currency", cur)
    .maybeSingle();

  const fresh = cached &&
    Date.now() - new Date(cached.fetched_at).getTime() < CACHE_HOURS * 3_600_000;
  if (fresh) {
    return {
      currency: cur,
      rateToSek: Number(cached.rate_to_sek),
      rateDate: cached.rate_date,
      source: cached.source,
      fetchedAt: cached.fetched_at,
      stale: false,
    };
  }

  for (const [source, fetcher] of [["ecb-frankfurter", fetchFrankfurter], ["open-er-api", fetchErApi]] as const) {
    try {
      const got = await fetcher(cur);
      if (!got) continue;
      const row = {
        currency: cur,
        rate_to_sek: got.rate,
        rate_date: got.date,
        source,
        fetched_at: new Date().toISOString(),
      };
      await admin.from("fx_rates").upsert(row, { onConflict: "currency" });
      return { currency: cur, rateToSek: got.rate, rateDate: got.date, source, fetchedAt: row.fetched_at, stale: false };
    } catch (e) {
      console.warn(`[fx] ${source} ${cur} failed:`, (e as Error).message);
    }
  }

  if (cached) {
    return {
      currency: cur,
      rateToSek: Number(cached.rate_to_sek),
      rateDate: cached.rate_date,
      source: cached.source,
      fetchedAt: cached.fetched_at,
      stale: true,
    };
  }

  // Last resort: the manual EUR rate from /admin/markup-defaults. There is no
  // manual GBP rate, so GBP refuses to price rather than guess.
  const { data: eurRaw } = await admin.rpc("get_platform_decimal", {
    p_key: "eur_to_sek_rate",
    p_default: 11.5,
  });
  const eur = Number(eurRaw ?? 11.5);
  if (cur === "EUR") {
    return { currency: cur, rateToSek: eur, rateDate: null, source: "manual-setting", fetchedAt: new Date().toISOString(), stale: true };
  }
  throw new Error(`Ingen växelkurs för ${cur} kunde hämtas`);
}
