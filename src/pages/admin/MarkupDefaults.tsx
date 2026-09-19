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
  const [eurRate, setEurRate] = useState("11.5");
  const [compareAtPct, setCompareAtPct] = useState("0");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("platform_settings")
      .select("setting_key, setting_value, description")
      .in("setting_key", ["default_markup_pct", "default_markup_fixed_sek", "eur_to_sek_rate", "compare_at_default_pct"]);
    const rows = (data as SettingRow[]) ?? [];
    const pctRow = rows.find((r) => r.setting_key === "default_markup_pct");
    const fixedRow = rows.find((r) => r.setting_key === "default_markup_fixed_sek");
    const rateRow = rows.find((r) => r.setting_key === "eur_to_sek_rate");
    const compareRow = rows.find((r) => r.setting_key === "compare_at_default_pct");
    if (pctRow) setPct(pctRow.setting_value);
    if (fixedRow) setFixed(fixedRow.setting_value);
    if (rateRow) setEurRate(rateRow.setting_value);
    if (compareRow) setCompareAtPct(compareRow.setting_value);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    const pctNum = Number(pct);
    const fixedNum = Number(fixed);
    const rateNum = Number(eurRate);
    if (!Number.isFinite(pctNum) || pctNum < 0 || pctNum > 100) {
      toast.error("Procentsats måste vara 0-100");
      return;
    }
    if (!Number.isFinite(fixedNum) || fixedNum < 0) {
      toast.error("Fast påslag kan inte vara negativt");
      return;
    }
    if (!Number.isFinite(rateNum) || rateNum <= 0 || rateNum > 50) {
      toast.error("EUR-kursen ska vara mellan 0 och 50");
      return;
    }
    const compareNum = Number(compareAtPct);
    if (!Number.isFinite(compareNum) || compareNum < 0 || compareNum > 200) {
      toast.error("Jämförelsepris-påslag ska vara mellan 0 och 200");
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
            {
              setting_key: "eur_to_sek_rate",
              setting_value: String(rateNum),
              setting_type: "decimal",
              description:
                "Växelkurs EUR → SEK för xs2event-biljetter. Påverkar nya prisberäkningar omedelbart.",
            },
            {
              setting_key: "compare_at_default_pct",
              setting_value: String(compareNum),
              setting_type: "decimal",
              description:
                "Procent över aktuellt pris som visas som överstruket jämförelsepris på event utan eget compare_at. 0 = av.",
            },
          ],
          { onConflict: "setting_key" },
        );
      if (error) throw error;
      toast.success("Sparat. Nya prisberäkningar använder dessa värden.");
    } catch (e: any) {
      toast.error(e.message ?? "Kunde inte spara");
    } finally {
      setSaving(false);
    }
  };

  const applyToAll = async () => {
    if (
      !confirm(
        "Detta överskriver påslagsvärden på ALLA befintliga kategorier - även de du tidigare anpassat manuellt. Är du säker?",
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
      toast.success(`Uppdaterade ${count ?? "-"} kategorier`);
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
        <h1 className="text-3xl font-display mb-2">Prisinställningar</h1>
        <p className="text-muted-foreground text-sm">
          Påslag som tillämpas på nya biljettkategorier, plus EUR→SEK-kursen som används när xs2-priser konverteras. Per-kategori-värden i Biljetter har företräde över standardpåslag.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div>
          <h2 className="font-display text-lg">Växelkurs EUR → SEK</h2>
          <p className="text-xs text-muted-foreground mt-1">
            xs2event prissätter alla biljetter i euro. Den här kursen styr vad svenska kunder betalar i SEK. Uppdatera manuellt - påverkar nya prisberäkningar omedelbart, inte redan reserverade ordrar.
          </p>
        </div>
        <div className="max-w-[200px]">
          <Label htmlFor="eur-rate" className="text-xs uppercase tracking-wider">
            1 EUR =
          </Label>
          <div className="relative mt-1">
            <Input
              id="eur-rate"
              type="number"
              min={0}
              max={50}
              step="0.01"
              value={eurRate}
              onChange={(e) => setEurRate(e.target.value)}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              SEK
            </span>
          </div>
        </div>
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

      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div>
          <h2 className="font-display text-lg">Jämförelsepris (rabatt-streck)</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Visar ett överstruket högre pris bredvid det riktiga priset, t.ex. <span className="line-through">3&nbsp;600&nbsp;kr</span>&nbsp;<strong>3&nbsp;000&nbsp;kr&nbsp;-17%</strong>. Används bara när eventet saknar ett eget compare_at-värde (sätts då automatiskt från xs2event-biljettens face value, eller manuellt per event i Biljetter).
          </p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          ⚠️ <strong>Prisinformationslagen + Marknadsföringslagen</strong> kräver att överstrukna priser ska vara verkliga tidigare priser inom 30 dagar. Att visa ett uppskruvat jämförelsepris utan att priset faktiskt varit högre kan leda till sanktionsavgift från Konsumentverket. Använd endast om du har historik på högre prissättning, eller låt xs2-face-värdet (box office-pris) styra automatiskt.
        </div>
        <div className="max-w-[200px]">
          <Label htmlFor="compare-pct" className="text-xs uppercase tracking-wider">
            Standard-påslag på jämförelsepris
          </Label>
          <div className="relative mt-1">
            <Input
              id="compare-pct"
              type="number"
              min={0}
              max={200}
              step="1"
              value={compareAtPct}
              onChange={(e) => setCompareAtPct(e.target.value)}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">0 = ingen syntetisk rabatt</p>
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
        <h2 className="font-display text-lg mb-1">Tillämpa på alla befintliga kategorier</h2>
        <p className="text-sm text-amber-900 mb-4">
          Skriver över <strong>alla</strong> nuvarande påslagsvärden - även anpassade. Använd bara om du verkligen vill nollställa till nya standardvärden.
        </p>
        <Button variant="outline" onClick={applyToAll} disabled={applying}>
          {applying && <Loader2 className="h-3 w-3 animate-spin mr-2" />}
          Tillämpa på alla
        </Button>
      </div>
    </div>
  );
}
