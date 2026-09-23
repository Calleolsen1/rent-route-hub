import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, X } from "lucide-react";
import { formatSek } from "@/lib/formatSek";

// Markup for supplier tickets, in one place.
//
// Most specific wins: category (set in the ticket view) → match (ticket
// view) → league (here) → standard (here). The example line shows what a
// customer pays for a typical ticket so the effect of a change is obvious.

// markup_rules / fx_rates aren't in the generated types until Lovable
// regenerates them after the migration runs.
const db = supabase as unknown as SupabaseClient;

const ROUNDING_STEPS = [1, 10, 50, 100];

type Rule = { id: string; league: string; markup_pct: number; markup_fixed_sek: number };

function customerPrice(baseSek: number, pct: number, fixed: number, step: number) {
  return Math.ceil(Math.round(baseSek * (1 + pct / 100) + fixed) / step) * step;
}

export default function MarkupRulesPanel({ leagues }: { leagues: string[] }) {
  const [loading, setLoading] = useState(true);
  const [pct, setPct] = useState("15");
  const [fixed, setFixed] = useState("0");
  const [rounding, setRounding] = useState(1);
  const [rules, setRules] = useState<Rule[]>([]);
  const [eurRate, setEurRate] = useState<number | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  const load = async () => {
    const [{ data: settings }, { data: r }, { data: fx }] = await Promise.all([
      db
        .from("platform_settings")
        .select("setting_key, setting_value")
        .in("setting_key", ["default_markup_pct", "default_markup_fixed_sek", "price_rounding_sek"]),
      db.from("markup_rules").select("id, league, markup_pct, markup_fixed_sek").eq("scope", "league"),
      db.from("fx_rates").select("rate_to_sek").eq("currency", "EUR").maybeSingle(),
    ]);
    const get = (k: string) => (settings ?? []).find((s: { setting_key: string }) => s.setting_key === k)?.setting_value;
    setPct(get("default_markup_pct") ?? "15");
    setFixed(get("default_markup_fixed_sek") ?? "0");
    setRounding(Number(get("price_rounding_sek") ?? 1) || 1);
    setRules((r as Rule[]) ?? []);
    setEurRate(fx?.rate_to_sek ? Number(fx.rate_to_sek) : null);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const saveSetting = async (key: string, value: string, label: string) => {
    const n = Number(value.replace(",", "."));
    if (!Number.isFinite(n) || n < 0) {
      toast.error("Ange ett tal, 0 eller mer");
      return;
    }
    setSaving(key);
    const { error } = await db
      .from("platform_settings")
      .upsert({ setting_key: key, setting_value: String(n), setting_type: "decimal", description: label }, { onConflict: "setting_key" });
    setSaving(null);
    if (error) toast.error(error.message);
    else toast.success("Sparat - gäller direkt för nya prisberäkningar");
  };

  const saveLeague = async (league: string, p: string, f: string) => {
    const pn = Number(p.replace(",", "."));
    const fn = Number((f || "0").replace(",", "."));
    if (p.trim() === "") return clearLeague(league);
    if (!Number.isFinite(pn) || !Number.isFinite(fn) || pn < 0 || fn < 0) {
      toast.error("Ange ett tal, 0 eller mer");
      return;
    }
    setSaving(league);
    const { error } = await db
      .from("markup_rules")
      .upsert({ scope: "league", league, markup_pct: pn, markup_fixed_sek: fn, updated_at: new Date().toISOString() }, { onConflict: "league" });
    setSaving(null);
    if (error) toast.error(error.message);
    else {
      toast.success(`${league}: ${pn}%${fn ? ` + ${fn} kr` : ""}`);
      load();
    }
  };

  const clearLeague = async (league: string) => {
    setSaving(league);
    const { error } = await db.from("markup_rules").delete().eq("scope", "league").eq("league", league);
    setSaving(null);
    if (error) toast.error(error.message);
    else {
      toast.success(`${league} använder standardpåslaget`);
      load();
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground py-6">Laddar...</p>;

  const stdPct = Number(pct) || 0;
  const stdFixed = Number(fixed) || 0;
  const exampleBase = eurRate ? 100 * eurRate : null;

  return (
    <div className="space-y-6 mt-3">
      <section className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div>
          <h3 className="font-display text-lg">Standardpåslag</h3>
          <p className="text-xs text-muted-foreground">
            Gäller alla biljetter som inte har eget påslag för liga, match eller kategori.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs">
            <span className="block text-muted-foreground mb-1">Procent</span>
            <div className="flex items-center gap-1">
              <Input
                value={pct}
                onChange={(e) => setPct(e.target.value)}
                onBlur={() => saveSetting("default_markup_pct", pct, "Platsens standardprocentsats för påslag")}
                inputMode="decimal"
                className="w-20"
              />
              <span>%</span>
            </div>
          </label>
          <label className="text-xs">
            <span className="block text-muted-foreground mb-1">Plus fast belopp</span>
            <div className="flex items-center gap-1">
              <Input
                value={fixed}
                onChange={(e) => setFixed(e.target.value)}
                onBlur={() => saveSetting("default_markup_fixed_sek", fixed, "Platsens standardpåslag i kronor per biljett")}
                inputMode="decimal"
                className="w-24"
              />
              <span>kr/biljett</span>
            </div>
          </label>
          <div className="text-xs">
            <span className="block text-muted-foreground mb-1">Avrunda kundpris uppåt till</span>
            <div className="flex gap-1">
              {ROUNDING_STEPS.map((step) => (
                <Button
                  key={step}
                  type="button"
                  size="sm"
                  variant={rounding === step ? "default" : "outline"}
                  onClick={() => {
                    setRounding(step);
                    saveSetting("price_rounding_sek", String(step), "Kundpriser avrundas uppåt till närmaste steg i kronor (1 = ingen avrundning).");
                  }}
                >
                  {step === 1 ? "Ingen" : `${step} kr`}
                </Button>
              ))}
            </div>
          </div>
          {saving?.startsWith("default_") || saving === "price_rounding_sek" ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mb-2" />
          ) : null}
        </div>
        {exampleBase && (
          <p className="text-xs text-muted-foreground">
            Exempel: en biljett för 100 EUR kostar oss {formatSek(exampleBase)} → kunden betalar{" "}
            <strong className="text-foreground">{formatSek(customerPrice(exampleBase, stdPct, stdFixed, rounding))}</strong>.
          </p>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-5 space-y-3">
        <div>
          <h3 className="font-display text-lg">Per liga</h3>
          <p className="text-xs text-muted-foreground">
            Lämna tomt för att använda standardpåslaget. Enskilda matcher och kategorier ändras under
            Kopplade → Biljetter.
          </p>
        </div>
        {leagues.length === 0 && <p className="text-sm text-muted-foreground">Inga kopplade matcher ännu.</p>}
        <div className="divide-y divide-border">
          {leagues.map((league) => (
            <LeagueRow
              key={league}
              league={league}
              rule={rules.find((r) => r.league === league)}
              standard={{ pct: stdPct, fixed: stdFixed }}
              exampleBase={exampleBase}
              rounding={rounding}
              busy={saving === league}
              onSave={saveLeague}
              onClear={clearLeague}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function LeagueRow({
  league,
  rule,
  standard,
  exampleBase,
  rounding,
  busy,
  onSave,
  onClear,
}: {
  league: string;
  rule: Rule | undefined;
  standard: { pct: number; fixed: number };
  exampleBase: number | null;
  rounding: number;
  busy: boolean;
  onSave: (league: string, pct: string, fixed: string) => void;
  onClear: (league: string) => void;
}) {
  const [p, setP] = useState(rule ? String(rule.markup_pct) : "");
  const [f, setF] = useState(rule && Number(rule.markup_fixed_sek) ? String(rule.markup_fixed_sek) : "");

  useEffect(() => {
    setP(rule ? String(rule.markup_pct) : "");
    setF(rule && Number(rule.markup_fixed_sek) ? String(rule.markup_fixed_sek) : "");
  }, [rule]);

  const commit = () => {
    const unchanged =
      (rule ? String(rule.markup_pct) : "") === p &&
      (rule && Number(rule.markup_fixed_sek) ? String(rule.markup_fixed_sek) : "") === f;
    if (!unchanged) onSave(league, p, f);
  };

  const effPct = p.trim() === "" ? standard.pct : Number(p.replace(",", ".")) || 0;
  const effFixed = p.trim() === "" ? standard.fixed : Number((f || "0").replace(",", ".")) || 0;

  return (
    <div className="flex flex-wrap items-center gap-3 py-2.5">
      <p className="text-sm font-medium flex-1 min-w-[10rem]">{league}</p>
      <div className="flex items-center gap-1 text-xs">
        <Input
          value={p}
          placeholder={String(standard.pct)}
          onChange={(e) => setP(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
          inputMode="decimal"
          className="w-20 h-8"
        />
        <span>%</span>
        <span className="text-muted-foreground ml-1">+</span>
        <Input
          value={f}
          placeholder={String(standard.fixed)}
          onChange={(e) => setF(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
          inputMode="decimal"
          className="w-20 h-8"
          disabled={p.trim() === ""}
        />
        <span>kr</span>
      </div>
      <p className="text-xs text-muted-foreground w-40 text-right">
        {exampleBase
          ? `100 EUR → ${formatSek(customerPrice(exampleBase, effPct, effFixed, rounding))}`
          : ""}
        {!rule && <span className="block">standard</span>}
      </p>
      <div className="w-8">
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : rule ? (
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onClear(league)} title="Använd standardpåslaget">
            <X className="h-3 w-3" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
