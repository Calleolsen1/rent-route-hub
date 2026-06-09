// Per-IP rate limiter backed by the `rate_limits` table + RPC.
//
// Usage at the top of any public edge function:
//
//   const rl = await checkRateLimit(req, "submit-inquiry", { max: 5, windowSec: 600 });
//   if (!rl.allowed) return rl.response;
//
// If `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` is missing the limiter
// fails open — better to serve traffic than block on a misconfigured project.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/**
 * Best-effort IP extraction. Supabase Edge sits behind Cloudflare /
 * Deno Deploy proxies which forward via `x-forwarded-for`. Falls back to a
 * coarse bucket so missing headers still distribute load.
 */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  // Cloudflare-specific header (Lovable's edge)
  const cf = req.headers.get("cf-connecting-ip");
  if (cf) return cf.trim();
  return "unknown";
}

export type RateLimitResult = {
  allowed: true;
} | {
  allowed: false;
  response: Response;
};

export async function checkRateLimit(
  req: Request,
  endpoint: string,
  opts: { max: number; windowSec: number; identifier?: string } = {
    max: 30,
    windowSec: 60,
  },
): Promise<RateLimitResult> {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) {
    console.warn("[rate_limit] missing supabase env — failing open");
    return { allowed: true };
  }

  const id = opts.identifier ?? clientIp(req);
  const key = `${endpoint}:${id}`;

  try {
    const client = createClient(url, serviceKey);
    const { data, error } = await client.rpc("consume_rate_limit", {
      p_key: key,
      p_max: opts.max,
      p_window_sec: opts.windowSec,
    });
    if (error) {
      console.warn("[rate_limit] rpc failed — failing open", error);
      return { allowed: true };
    }
    if (data === true) return { allowed: true };

    return {
      allowed: false,
      response: new Response(
        JSON.stringify({
          error: "För många försök, försök igen om en stund",
          retry_after_seconds: opts.windowSec,
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": String(opts.windowSec),
          },
        },
      ),
    };
  } catch (e) {
    console.warn("[rate_limit] threw — failing open", e);
    return { allowed: true };
  }
}
