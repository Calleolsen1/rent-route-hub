import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Upload, Trash2, Check } from "lucide-react";
import { toast } from "sonner";

/**
 * One stadium photo per home team (and per F1 race), reused across every
 * fixture that team hosts.
 *
 * Sorted by fixture count, not alphabetically: 30 photos cover ~68% of the
 * catalogue, so the ordering is the point — it tells you which photo is worth
 * taking next. Anything without a photo still renders a generated card, so
 * this is an upgrade path rather than a blocker.
 */

const BUCKET = "email-assets";

type CoverageRow = {
  sport: string;
  match_key: string;
  event_count: number;
  sample_venue: string | null;
  image_url: string | null;
  seatmap_url: string | null;
};

/** Which image slot an upload targets. */
type Slot = "image_url" | "seatmap_url";

export default function AdminStadiumPhotos() {
  const [rows, setRows] = useState<CoverageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("home_team_photo_coverage")
      .select("sport, match_key, event_count, sample_venue, image_url, seatmap_url")
      .order("event_count", { ascending: false });
    setRows((data as CoverageRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const upload = async (row: CoverageRow, file: File, slot: Slot) => {
    const key = `${row.sport}|${row.match_key}|${slot}`;
    setBusy(key);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const folder = slot === "seatmap_url" ? "seatmaps" : "stadiums";
      const path = `${folder}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: false, cacheControl: "31536000" });
      if (upErr) throw upErr;

      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const { error } = await (supabase as any)
        .from("team_venue_photos")
        .upsert(
          {
            sport: row.sport,
            match_key: row.match_key,
            // Preserve the other slot: the unique key is (sport, match_key),
            // so an upsert that omitted it would blank the sibling image.
            image_url: slot === "image_url" ? urlData.publicUrl : row.image_url,
            seatmap_url: slot === "seatmap_url" ? urlData.publicUrl : row.seatmap_url,
            venue_label: row.sample_venue,
          },
          { onConflict: "sport,match_key" },
        );
      if (error) throw error;

      toast.success(
        slot === "seatmap_url"
          ? `${row.match_key}: läktarkarta uppladdad`
          : `${row.match_key}: bilden gäller nu ${row.event_count} matcher`,
      );
      await load();
    } catch (e) {
      toast.error((e as Error).message ?? "Uppladdningen misslyckades");
    } finally {
      setBusy(null);
    }
  };

  const remove = async (row: CoverageRow) => {
    if (!confirm(`Ta bort bilden för ${row.match_key}? Matcherna visar då ett genererat kort i stället.`)) return;
    setBusy(`${row.sport}|${row.match_key}`);
    try {
      const { error } = await (supabase as any)
        .from("team_venue_photos")
        .delete()
        .eq("sport", row.sport)
        .eq("match_key", row.match_key);
      if (error) throw error;
      await load();
    } catch (e) {
      toast.error((e as Error).message ?? "Kunde inte ta bort");
    } finally {
      setBusy(null);
    }
  };

  if (loading) return <div className="p-8 text-muted-foreground text-sm">Laddar...</div>;

  const shown = rows.filter((r) =>
    !filter.trim() || r.match_key.toLowerCase().includes(filter.trim().toLowerCase()),
  );
  const withPhoto = rows.filter((r) => r.image_url).length;
  const totalEvents = rows.reduce((a, r) => a + r.event_count, 0);
  const coveredEvents = rows.filter((r) => r.image_url).reduce((a, r) => a + r.event_count, 0);

  return (
    <div className="p-8 max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-display mb-2">Arenabilder</h1>
        <p className="text-muted-foreground text-sm">
          En arenabild per hemmalag - den visas automatiskt på alla matcher laget spelar
          hemma. Lag utan bild visar klubbmärkena i stället, så inget saknar bild.
          Läktarkartan visas på matchsidan som referens när kunden ska beskriva var de
          vill sitta.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-sm font-medium">
            {withPhoto} av {rows.length} lag har bild
          </span>
          <span className="text-sm text-muted-foreground">
            {coveredEvents} av {totalEvents} matcher ({totalEvents ? Math.round((coveredEvents / totalEvents) * 100) : 0}%)
          </span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${totalEvents ? (coveredEvents / totalEvents) * 100 : 0}%` }}
          />
        </div>
      </div>

      <Input
        placeholder="Sök lag eller race..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="max-w-sm"
      />

      <div className="space-y-2">
        {shown.map((r) => {
          const key = `${r.sport}|${r.match_key}`;
          return (
            <div key={key} className="flex items-center gap-4 rounded-lg border border-border bg-card p-3">
              <div className="h-14 w-24 rounded-md overflow-hidden bg-muted flex-shrink-0">
                {r.image_url ? (
                  <img src={r.image_url} alt={r.match_key} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">
                    Ingen bild
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {r.match_key}
                  {r.image_url && <Check className="inline h-3.5 w-3.5 ml-1.5 text-green-600" />}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {r.seatmap_url ? "Karta ✓ · " : ""}
                  {r.event_count} {r.event_count === 1 ? "match" : "matcher"}
                  {r.sample_venue ? ` · ${r.sample_venue}` : ""}
                  {r.sport === "formula1" ? " · F1" : ""}
                </p>
              </div>

              {(["image_url", "seatmap_url"] as Slot[]).map((slot) => {
                const slotKey = `${key}|${slot}`;
                const has = slot === "image_url" ? r.image_url : r.seatmap_url;
                return (
                  <div key={slot} className="flex-shrink-0">
                    <input
                      ref={(el) => { inputs.current[slotKey] = el; }}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) upload(r, f, slot);
                        e.target.value = "";
                      }}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy === slotKey}
                      onClick={() => inputs.current[slotKey]?.click()}
                    >
                      {busy === slotKey
                        ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                        : <Upload className="h-3 w-3 mr-1.5" />}
                      {slot === "seatmap_url"
                        ? (has ? "Byt karta" : "Läktarkarta")
                        : (has ? "Byt bild" : "Arenabild")}
                    </Button>
                  </div>
                );
              })}
              {r.image_url && (
                <Button size="icon" variant="ghost" disabled={busy === key} onClick={() => remove(r)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          );
        })}
        {!shown.length && (
          <p className="text-sm text-muted-foreground py-8 text-center">Inga lag matchade sökningen.</p>
        )}
      </div>
    </div>
  );
}
