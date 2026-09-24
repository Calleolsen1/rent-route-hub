// Work that should finish, but not while a visitor waits for the page.
//
// Supabase's edge runtime keeps the function alive after the response for
// promises handed to EdgeRuntime.waitUntil. Outside that runtime (local
// scripts) the promise simply runs detached. Failures are logged, never
// thrown: nothing here may break the response that was already sent.

declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void } | undefined;

export function background(label: string, work: Promise<unknown>): void {
  const safe = work.catch((e) => console.warn(`[background] ${label}:`, (e as Error)?.message ?? e));
  try {
    if (typeof EdgeRuntime !== "undefined") EdgeRuntime.waitUntil(safe);
  } catch {
    /* not in the edge runtime — the promise still runs */
  }
}
