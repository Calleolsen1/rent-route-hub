import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Play } from "lucide-react";
import { toast } from "sonner";
import { getStripeEnvironment } from "@/lib/stripe";

type ConfigStatus = {
  xs2_api_key: boolean;
  xs2_base_url: boolean;
  xs2_payment_method: boolean;
  xs2_auth_header_custom: boolean;
  xs2_auth_scheme_custom: boolean;
  stripe_sandbox: boolean;
  stripe_live: boolean;
  payments_sandbox_webhook: boolean;
  payments_live_webhook: boolean;
  lovable_api_key: boolean;
  resend_api_key: boolean;
  site_url: string | null;
  mock_mode_active: boolean;
};

type Counts = {
  events_xs2: number;
  events_manual: number;
  events_featured: number;
  events_seeded: number;
  ticket_categories: number;
  orders_total: number;
  orders_paid_or_fulfilled: number;
  quotes_sent: number;
  refunds_total: number;
  home_slides_active: number;
};

type SyncLogRow = {
  resource_type: string;
  started_at: string;
  finished_at: string | null;
  status: string;
  records_fetched: number;
  records_upserted: number;
  error_message: string | null;
};

type EndpointTest = {
  key: string;
  label: string;
  result: "ok" | "fail" | "pending" | null;
  message: string | null;
};

export default function AdminDiagnostics() {
  const [config, setConfig] = useState<ConfigStatus | null>(null);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [lastSync, setLastSync] = useState<SyncLogRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<string | null>(null);
  const [tests, setTests] = useState<Record<string, EndpointTest>>({
    "xs2-get-tickets": { key: "xs2-get-tickets", label: "xs2-get-event-tickets (seed event)", result: null, message: null },
    "admin-check-config": { key: "admin-check-config", label: "admin-check-config", result: null, message: null },
  });

  const loadAll = async () => {
    setLoading(true);

    const cfg = await supabase.functions
      .invoke("admin-check-config", { body: {} })
      .then(({ data, error }) => {
        if (error) return null;
        return data as ConfigStatus;
      })
      .catch(() => null);
    setConfig(cfg);

    const [
      { count: xs2Count },
      { count: manualCount },
      { count: featuredCount },
      { count: seededCount },
      { count: catCount },
      { count: ordersCount },
      { count: ordersPaidCount },
      { count: quotesSentCount },
      { count: refundsCount },
      { count: slidesCount },
    ] = await Promise.all([
      (supabase as any).from("events").select("*", { count: "exact", head: true }).eq("source", "xs2event"),
      (supabase as any).from("events").select("*", { count: "exact", head: true }).neq("source", "xs2event"),
      (supabase as any).from("events").select("*", { count: "exact", head: true }).eq("is_featured", true),
      (supabase as any).from("events").select("*", { count: "exact", head: true }).like("external_event_id", "evt_demo_%"),
      (supabase as any).from("ticket_categories").select("*", { count: "exact", head: true }),
      (supabase as any).from("orders").select("*", { count: "exact", head: true }),
      (supabase as any).from("orders").select("*", { count: "exact", head: true }).in("status", ["paid", "fulfilled"]),
      (supabase as any).from("quotes").select("*", { count: "exact", head: true }).eq("status", "sent"),
      (supabase as any).from("refunds").select("*", { count: "exact", head: true }),
      (supabase as any).from("home_slides").select("*", { count: "exact", head: true }).eq("is_active", true),
    ]);
    setCounts({
      events_xs2: xs2Count ?? 0,
      events_manual: manualCount ?? 0,
      events_featured: featuredCount ?? 0,
      events_seeded: seededCount ?? 0,
      ticket_categories: catCount ?? 0,
      orders_total: ordersCount ?? 0,
      orders_paid_or_fulfilled: ordersPaidCount ?? 0,
      quotes_sent: quotesSentCount ?? 0,
      refunds_total: refundsCount ?? 0,
      home_slides_active: slidesCount ?? 0,
    });

    const { data: log } = await (supabase as any)
      .from("xs2_sync_log")
      .select("resource_type, started_at, finished_at, status, records_fetched, records_upserted, error_message")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setLastSync((log as SyncLogRow) ?? null);

    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const runTest = async (key: string) => {
    setRunning(key);
    setTests((p) => ({ ...p, [key]: { ...p[key], result: "pending", message: "Kör..." } }));
    try {
      if (key === "admin-check-config") {
        const { data, error } = await supabase.functions.invoke("admin-check-config", { body: {} });
        if (error) throw error;
        setTests((p) => ({
          ...p,
          [key]: { ...p[key], result: "ok", message: `mock_mode_active=${(data as any).mock_mode_active}` },
        }));
      } else if (key === "xs2-get-tickets") {
        // Find any xs2 event to test against
        const { data: ev } = await (supabase as any)
          .from("events")
          .select("id, external_event_id")
          .eq("source", "xs2event")
          .limit(1)
          .maybeSingle();
        if (!ev) {
          setTests((p) => ({
            ...p,
            [key]: { ...p[key], result: "fail", message: "Inga xs2-events i databasen - kör seed först" },
          }));
          return;
        }
        const { data, error } = await supabase.functions.invoke("xs2-get-event-tickets", {
          body: { event_id: ev.id },
        });
        if (error) throw error;
        const groups = (data as any).groups ?? [];
        setTests((p) => ({
          ...p,
          [key]: {
            ...p[key],
            result: groups.length > 0 ? "ok" : "fail",
            message: groups.length > 0 ? `${groups.length} grupper, ${ev.external_event_id}` : "Inga grupper returnerade",
          },
        }));
      }
    } catch (e: any) {
      setTests((p) => ({
        ...p,
        [key]: { ...p[key], result: "fail", message: e.message ?? "Misslyckades" },
      }));
      toast.error(e.message ?? "Test misslyckades");
    } finally {
      setRunning(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground text-sm">
        <Loader2 className="h-5 w-5 animate-spin inline-block mr-2" /> Laddar diagnostik...
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl space-y-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-display mb-2">Diagnostik</h1>
          <p className="text-muted-foreground text-sm">
            Visar konfiguration, seed-data och senaste synk. Använd inför första testkörningen för att verifiera att allt är på plats.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadAll}>
          <RefreshCw className="h-3 w-3 mr-2" /> Uppdatera
        </Button>
      </div>

      {/* Mock-mode banner */}
      {config?.mock_mode_active && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-700 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-900">
            <p className="font-semibold mb-1">🟡 Mock-läge aktivt</p>
            <p className="text-xs leading-relaxed">
              <code className="bg-amber-100 px-1 rounded">XS2_API_KEY</code> är inte satt - xs2event-funktionerna returnerar fixturer från <code className="bg-amber-100 px-1 rounded">_shared/xs2event.ts</code>. Sätt nyckeln när xs2 har levererat den och funktionerna går automatiskt live.
            </p>
          </div>
        </div>
      )}

      {/* Secrets checklist */}
      <Section title="Hemligheter (secrets)">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <SecretCheck label="XS2_API_KEY" ok={config?.xs2_api_key} required hint="Mock-läge utan denna" />
          <SecretCheck label="XS2_BASE_URL" ok={config?.xs2_base_url} required hint="t.ex. https://api.xs2event.com" />
          <SecretCheck label="XS2_PAYMENT_METHOD" ok={config?.xs2_payment_method} hint="Default 'invoice'" />
          <SecretCheck label="XS2_AUTH_HEADER" ok={config?.xs2_auth_header_custom} hint="Default 'X-Api-Key'" />
          <SecretCheck label="XS2_AUTH_SCHEME" ok={config?.xs2_auth_scheme_custom} hint="Default '' (empty, raw key)" />
          <SecretCheck label="STRIPE_SANDBOX_API_KEY" ok={config?.stripe_sandbox} required />
          <SecretCheck label="STRIPE_LIVE_API_KEY" ok={config?.stripe_live} hint="Krävs för live-betalningar" />
          <SecretCheck label="PAYMENTS_SANDBOX_WEBHOOK_SECRET" ok={config?.payments_sandbox_webhook} required />
          <SecretCheck label="PAYMENTS_LIVE_WEBHOOK_SECRET" ok={config?.payments_live_webhook} />
          <SecretCheck label="LOVABLE_API_KEY" ok={config?.lovable_api_key} required hint="För Stripe-proxy via Lovable" />
          <SecretCheck label="RESEND_API_KEY" ok={config?.resend_api_key} required hint="För all e-post" />
          <SecretCheck label="SITE_URL" ok={!!config?.site_url} value={config?.site_url} hint={config?.site_url ?? "Default: https://rent-route-hub.lovable.app"} />
        </div>
      </Section>

      {/* DB counts */}
      <Section title="Databas">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Count label="Events (xs2event)" value={counts?.events_xs2} />
          <Count label="Events (manuella)" value={counts?.events_manual} />
          <Count label="Featured" value={counts?.events_featured} />
          <Count label="Seed-events" value={counts?.events_seeded} hint="evt_demo_*" />
          <Count label="Ticket categories" value={counts?.ticket_categories} />
          <Count label="Hero-slides aktiva" value={counts?.home_slides_active} />
          <Count label="Orders totalt" value={counts?.orders_total} />
          <Count label="Orders betalda/lev." value={counts?.orders_paid_or_fulfilled} />
          <Count label="Offerter skickade" value={counts?.quotes_sent} />
          <Count label="Återbetalningar" value={counts?.refunds_total} />
        </div>
        {(counts?.events_seeded ?? 0) === 0 && (counts?.events_xs2 ?? 0) === 0 && (
          <p className="text-xs text-amber-700 mt-3">
            ⚠️ Inga xs2-events i databasen. Kör <strong>Synka allt</strong> på{" "}
            <code className="bg-muted px-1 rounded">/admin/tickets</code> för att hämta evenemang från xs2event.
          </p>
        )}
      </Section>

      {/* Last sync */}
      <Section title="Senaste xs2-synk">
        {lastSync ? (
          <div className="rounded-lg border border-border p-4 text-sm space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant={lastSync.status === "success" ? "default" : lastSync.status === "running" ? "outline" : "destructive"}>
                {lastSync.status}
              </Badge>
              <span className="font-mono uppercase tracking-wider text-xs">{lastSync.resource_type}</span>
              <span className="text-xs text-muted-foreground ml-auto">
                {new Date(lastSync.started_at).toLocaleString("sv-SE")}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              {lastSync.records_upserted} av {lastSync.records_fetched} upserterade
            </div>
            {lastSync.error_message && (
              <p className="text-xs text-destructive mt-1 font-mono">{lastSync.error_message}</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Inga synk-körningar registrerade.</p>
        )}
      </Section>

      {/* Endpoint tests */}
      <Section title="Endpoint-tester">
        <div className="space-y-2">
          {Object.values(tests).map((t) => (
            <div
              key={t.key}
              className="rounded-lg border border-border p-3 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                {t.result === "ok" ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                ) : t.result === "fail" ? (
                  <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                ) : t.result === "pending" ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground flex-shrink-0" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/40 flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium">{t.label}</p>
                  {t.message && (
                    <p className="text-xs text-muted-foreground truncate">{t.message}</p>
                  )}
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={running === t.key}
                onClick={() => runTest(t.key)}
              >
                <Play className="h-3 w-3 mr-1.5" /> Kör
              </Button>
            </div>
          ))}
        </div>
      </Section>

      {/* Stripe env indicator */}
      <Section title="Stripe-miljö">
        <p className="text-sm">
          Klienten kör mot:{" "}
          <Badge variant={getStripeEnvironment() === "sandbox" ? "outline" : "default"}>
            {getStripeEnvironment()}
          </Badge>
        </p>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-display text-xl mb-3">{title}</h2>
      <div>{children}</div>
    </div>
  );
}

function SecretCheck({
  label,
  ok,
  required,
  hint,
  value,
}: {
  label: string;
  ok: boolean | undefined;
  required?: boolean;
  hint?: string;
  value?: string | null;
}) {
  return (
    <div className="flex items-start gap-2 text-sm border border-border rounded-md p-2">
      {ok ? (
        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
      ) : required ? (
        <XCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
      ) : (
        <span className="h-4 w-4 flex-shrink-0 mt-0.5 flex items-center justify-center">
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <code className="text-xs font-mono">{label}</code>
          {required && !ok && <Badge variant="destructive" className="text-[9px] px-1 py-0">krävs</Badge>}
        </div>
        {hint && <p className="text-[10px] text-muted-foreground truncate">{hint}</p>}
        {value && <p className="text-[10px] font-mono text-muted-foreground truncate">{value}</p>}
      </div>
    </div>
  );
}

function Count({ label, value, hint }: { label: string; value: number | undefined; hint?: string }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="font-display text-2xl">{value ?? "-"}</p>
      {hint && <p className="text-[10px] text-muted-foreground font-mono">{hint}</p>}
    </div>
  );
}
