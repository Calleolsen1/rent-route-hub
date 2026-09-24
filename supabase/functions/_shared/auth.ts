// Who is calling an edge function.
//
// callerIdentity / callerIsAdmin: for public endpoints that behave a little
// differently for signed-in customers and admins.
//
// requireAdminOrCron: who may run a sync — a signed-in admin, or the nightly
// pg_cron job.
//
// The cron job can't sign in as a user, and Supabase doesn't hand the
// service-role key to pg_cron (the old xs2 cron needed it copied into Vault
// by hand, which never happened). Instead the job sends a random secret that
// the scheduling migration generated and stored in public.cron_secrets. That
// table has RLS on and no policies, so only the service role — i.e. these
// functions — can read it back to compare. Nothing to configure by hand.
//
// The job still passes the gateway's verify_jwt with the public anon key; the
// secret is what actually authorises it.

import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

type Admin = SupabaseClient<any, "public", any>;

export type Caller = { kind: "admin"; userId: string } | { kind: "cron" };

/** Constant-time string compare, so the secret can't be guessed by timing. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export interface CallerIdentity {
  userId: string;
  email: string | null;
  isAdmin: boolean;
}

/**
 * The signed-in user behind a request, or null. Never throws. The browser
 * client sends the anon key as a bearer token when nobody is signed in;
 * getUser() simply finds no user for it.
 */
/** Role claim of a Supabase JWT, read without verifying (only used to skip work). */
function jwtRole(auth: string): string | null {
  try {
    const payload = auth.replace(/^Bearer\s+/i, "").split(".")[1];
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof json.role === "string" ? json.role : null;
  } catch {
    return null;
  }
}

export async function callerIdentity(req: Request): Promise<CallerIdentity | null> {
  const auth = req.headers.get("Authorization");
  if (!auth) return null;
  // Anonymous visitors send the public anon key: no user to look up, so
  // skip the round trip to the auth server. Any other token is verified.
  if (jwtRole(auth) === "anon") return null;
  try {
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } },
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return null;
    const { data } = await userClient.rpc("has_role", { _user_id: user.id, _role: "admin" });
    return { userId: user.id, email: user.email ?? null, isAdmin: data === true };
  } catch {
    return null;
  }
}

/** Unlocks admin extras on public endpoints (supplier cost, checkout preview). */
export async function callerIsAdmin(req: Request): Promise<boolean> {
  return (await callerIdentity(req))?.isAdmin ?? false;
}

export async function requireAdminOrCron(req: Request, admin: Admin): Promise<Caller> {
  const cronSecret = req.headers.get("x-cron-secret");
  if (cronSecret) {
    const { data } = await admin
      .from("cron_secrets")
      .select("secret")
      .eq("name", "nightly_sync")
      .maybeSingle();
    if (data?.secret && safeEqual(cronSecret, data.secret)) return { kind: "cron" };
    throw new Error("Invalid cron secret");
  }

  const auth = req.headers.get("Authorization");
  if (!auth) throw new Error("Missing Authorization header");
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: auth } } },
  );
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) throw new Error("Unauthenticated");
  const { data: isAdmin, error } = await userClient.rpc("has_role", {
    _user_id: user.id,
    _role: "admin",
  });
  if (error || !isAdmin) throw new Error("Admin role required");
  return { kind: "admin", userId: user.id };
}
