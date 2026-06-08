import { supabase } from "@/integrations/supabase/client";

/**
 * Opens an e-ticket for the user. The `file_url` column in `ticket_deliveries`
 * can hold either:
 *   - A full https:// URL (xs2event download endpoint, set by payments-webhook)
 *   - A Supabase Storage path (manual ticket upload via admin)
 *
 * Returns the resolved URL the caller can hand to window.open / <a href>.
 * Throws if the storage path can't be signed.
 */
export async function resolveTicketUrl(fileRef: string): Promise<string> {
  if (/^https?:\/\//i.test(fileRef)) return fileRef;

  const { data, error } = await supabase.storage
    .from("ticket-files")
    .createSignedUrl(fileRef, 300);
  if (error || !data?.signedUrl) {
    throw error ?? new Error("Kunde inte hämta biljettlänken");
  }
  return data.signedUrl;
}
