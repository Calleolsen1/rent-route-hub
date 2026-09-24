// Copy Travel Connection seating plans into our own storage.
//
// The match page reads the plan's pixels to light up the area a ticket
// category covers (see src/components/StadiumPlan.tsx). Browsers only allow
// that for images served with CORS headers, which Supabase Storage sends
// (also on signed URLs from our private bucket) and the supplier's storage
// doesn't — hence the copy. Each plan is
// copied once and again only when the supplier's URL changes.

import type { TravelConnectionClient } from "./travelconnection.ts";

// deno-lint-ignore no-explicit-any
type Db = any;

export const PLAN_BUCKET = "venue-plans";

/** Plans copied per run, so one sync can't spend minutes on images. */
const MAX_COPIES_PER_RUN = 40;

/**
 * The sandbox API hands out plan URLs on a storage bucket that refuses every
 * download (AccessDenied), while the identical file is public on the
 * production bucket. Used only when the sandbox URL fails, so production —
 * whose URLs work — never takes this path.
 */
function sandboxFallback(url: string): string | null {
  return url.includes("//tw-api-sandbox-1.")
    ? url.replace("//tw-api-sandbox-1.", "//tw-api-prod.")
    : null;
}

async function download(url: string): Promise<{ bytes: Uint8Array; type: string }> {
  for (const u of [url, sandboxFallback(url)].filter(Boolean) as string[]) {
    const res = await fetch(u, { signal: AbortSignal.timeout(20_000) });
    const type = res.headers.get("content-type") ?? "";
    if (res.ok && type.startsWith("image/")) {
      return { bytes: new Uint8Array(await res.arrayBuffer()), type };
    }
    await res.body?.cancel();
  }
  throw new Error("plan image could not be downloaded");
}

export interface VenueSyncResult {
  venues: number;
  copied: number;
  failed: number;
}

/**
 * Refresh tc_venues for the venues we sell and copy any new or changed plan.
 * `venueIds` = venues of linked, in-scope products; other venues are skipped.
 */
export async function syncVenuePlans(
  db: Db,
  tc: TravelConnectionClient,
  venueIds: Set<number>,
): Promise<VenueSyncResult> {
  const result: VenueSyncResult = { venues: 0, copied: 0, failed: 0 };
  if (!venueIds.size) return result;

  const venues = (await tc.listVenues()).filter((v) => venueIds.has(v.id));
  result.venues = venues.length;

  const { data: existing } = await db
    .from("tc_venues")
    .select("tc_venue_id, source_url, plan_path")
    .in("tc_venue_id", venues.map((v) => v.id));
  const known = new Map<number, { source_url: string | null; plan_path: string | null }>(
    (existing ?? []).map((r: { tc_venue_id: number; source_url: string | null; plan_path: string | null }) => [r.tc_venue_id, r]),
  );

  const now = new Date().toISOString();
  await db.from("tc_venues").upsert(
    venues.map((v) => ({ tc_venue_id: v.id, name: v.name, city: v.city, updated_at: now })),
    { onConflict: "tc_venue_id" },
  );

  const toCopy = venues.filter((v) => {
    const url = v.images?.seating;
    if (!url) return false;
    const k = known.get(v.id);
    return !k?.plan_path || k.source_url !== url;
  }).slice(0, MAX_COPIES_PER_RUN);

  for (const v of toCopy) {
    const url = v.images!.seating!;
    try {
      const { bytes, type } = await download(url);
      const ext = type.includes("png") ? "png" : type.includes("webp") ? "webp" : "jpg";
      const path = `${v.id}.${ext}`;
      const { error } = await db.storage.from(PLAN_BUCKET).upload(path, bytes, {
        contentType: type,
        upsert: true,
        cacheControl: "86400",
      });
      if (error) throw new Error(error.message);
      await db.from("tc_venues").update({
        source_url: url,
        plan_path: path,
        plan_error: null,
        copied_at: new Date().toISOString(),
      }).eq("tc_venue_id", v.id);
      result.copied++;
    } catch (e) {
      await db.from("tc_venues").update({ source_url: url, plan_error: (e as Error).message }).eq("tc_venue_id", v.id);
      result.failed++;
    }
  }
  return result;
}

// Signed plan URLs, reused per warm instance so a browser can cache the
// image between page views instead of getting a new URL (and a new
// download) every time.
const SIGNED_TTL_S = 7 * 24 * 3600;
const signedCache = new Map<string, { url: string; until: number }>();

/**
 * Time-limited URL for a venue's copied plan (the bucket is private). Null
 * if signing fails — the page then simply shows no plan.
 */
export async function planSignedUrl(db: Db, path: string): Promise<string | null> {
  const hit = signedCache.get(path);
  // Hand out a cached URL only while it has at least a day left.
  if (hit && hit.until - 86_400_000 > Date.now()) return hit.url;
  const { data, error } = await db.storage.from(PLAN_BUCKET).createSignedUrl(path, SIGNED_TTL_S);
  if (error || !data?.signedUrl) {
    console.warn("[tc_venues] sign failed", path, error?.message);
    return null;
  }
  signedCache.set(path, { url: data.signedUrl, until: Date.now() + SIGNED_TTL_S * 1000 });
  return data.signedUrl;
}
