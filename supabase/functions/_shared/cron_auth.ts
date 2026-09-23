// Who may run a sync: a signed-in admin, or the nightly pg_cron job.
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
