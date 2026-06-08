import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save } from "lucide-react";

type SettingRow = {
  setting_key: string;
  setting_value: string;
  description: string | null;
};

export default function AdminMarkupDefaults() {
  const [pct, setPct] = useState("15");
  const [fixed, setFixed] = useState("0");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("platform_settings")
      .select("setting_key, setting_value, description")
      .in("setting_key", ["default_markup_pct", "default_markup_fixed_sek"]);
    const rows = (data as SettingRow[]) ?? [];
    const pctRow = rows.find((r) => r.setting_key === "default_markup_pct");
    const fixedRow = rows.find((r) => r.setting_key === "default_markup_fixed_sek");
    if (pctRow) setPct(pctRow.setting_value);
    if (fixedRow) setFixed(fixedRow.setting_value);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    const pctNum = Number(pct);
    const fixedNum = Number(fixed);
    if (!Number.isFinite(pctNum) || pctNum < 0 || pctNum > 100) {
      toast.error("Procentsats måste vara 0-100");
      return;
    }
    if (!Number.isFinite(fixedNum) || fixedNum < 0) {
      toast.error("Fast påslag kan inte vara negativt");
      return;
    }
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from("platform_settings")
        .upsert(
          [
            {
              setting_key: "default_markup_pct",
              setting_value: String(pctNum),
              setting_type: "decimal",
              description:
                "Platsens standardprocentsats för påslag (gäller nya kategorier)",
            },
            {
              setting_key: "default_markup_fixed_sek",
              setting_value: String(fixedNum),
              setting_type: "decimal",
              description: "Platsens fasta påslag i SEK (gäller nya kategorier)",
            },
          ],
          { onConflict: "setting_key" },
        );
      if (error) throw error;
      toast.success("Sparat. Nya kategorier får dessa värden från och med nu.");
    } catch (e: any) {
      toast.error(e.message ?? "Kunde inte spara");
    } finally {
      setSaving(false);
    }
  };

  const applyToAll = async () => {
    if (
      !confirm(
        "Detta överskriver påslagsvärden på ALLA befintliga kategorier — även de du tidigare anpassat manuellt. Är du säker?",
      )
    ) {
      return;
    }
    setApplying(true);
    try {
      const { error, count } = await (supabase as any)
        .from("ticket_categories")
        .update({
          markup_pct: Number(pct),
          markup_fixed_sek: Number(fixed),
        })
        .gte("created_at", "1900-01-01") // matches every row
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      toast.success(`Uppdaterade ${count ?? "—"} kategorier`);
    } catch (e: any) {
      toast.error(e.message ?? "Kunde inte uppdatera");
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-muted-foreground text-sm">Laddar...</div>;
  }

  return (
    <div className="p-8 max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-display mb-2">Påslag — standardvärden</h1>
        <p className="text-muted-foreground text-sm">
          Bestämmer vilket påslag som tillämpas när nya biljettkategorier skapas (t.ex. när en kund öppnar ett xs2-event som inte synkats än). Per-kategori-värden i Biljetter har företräde över dessa.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="default-pct" className="text-xs uppercase tracking-wider">
              Standard procentpåslag
            </Label>
            <div className="relative mt-1">
              <Input
                id="default-pct"
                type="number"
                min={0}
                max={100}
                step="0.1"
                value={pct}
                onChange={(e) => setPct(e.target.value)}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                %
              </span>
            </div>
          </div>
          <div>
            <Label htmlFor="default-fixed" className="text-xs uppercase tracking-wider">
              Standard fast påslag
            </Label>
            <div className="relative mt-1">
              <Input
                id="default-fixed"
                type="number"
                min={0}
                step="1"
                value={fixed}
                onChange={(e) => setFixed(e.target.value)}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                SEK
              </span>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground bg-muted/40 rounded p-3">
          Formel: <code>slutpris = (xs2-pris × (1 + procentpåslag/100)) + fast påslag</code>. Avrundas till hela SEK.
        </p>

        <div className="flex gap-2">
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="h-3 w-3 animate-spin mr-2" />}
            <Save className="h-3 w-3 mr-2" /> Spara
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
        <h2 className="font-display text-lg mb-1">Tillämpa på alla befintliga kategorier</h2>
        <p className="text-sm text-amber-900 mb-4">
          Skriver över <strong>alla</strong> nuvarande påslagsvärden — även anpassade. Använd bara om du verkligen vill nollställa till nya standardvärden.
        </p>
        <Button variant="outline" onClick={applyToAll} disabled={applying}>
          {applying && <Loader2 className="h-3 w-3 animate-spin mr-2" />}
          Tillämpa på alla
        </Button>
      </div>
    </div>
  );
}
