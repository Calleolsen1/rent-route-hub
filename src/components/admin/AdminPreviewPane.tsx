import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Monitor, Smartphone, Tablet, RefreshCw, ExternalLink, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Shopify-style live preview. Renders the public site in an iframe next to the
 * admin editor and auto-refreshes whenever a content table changes, so admins
 * see their edits land in real time.
 */

const PREVIEW_ROUTES = [
  { value: "/", label: "Startsida" },
  { value: "/about", label: "Om oss" },
  { value: "/services", label: "Tjänster" },
  { value: "/services/sportresor", label: "Sportresor" },
  { value: "/group-travel", label: "Gruppresor" },
  { value: "/contact", label: "Kontakt" },
  { value: "/faq", label: "FAQ" },
  { value: "/help-center", label: "Hjälpcenter" },
];

/** Tables whose changes should re-render the preview. */
const WATCHED_TABLES = [
  "site_content",
  "home_slides",
  "team_members",
  "testimonials",
  "why_us_cards",
  "faqs",
  "events",
];

const DEVICES = {
  desktop: { icon: Monitor, width: "100%", label: "Desktop" },
  tablet: { icon: Tablet, width: "768px", label: "Surfplatta" },
  mobile: { icon: Smartphone, width: "390px", label: "Mobil" },
} as const;

type Device = keyof typeof DEVICES;

type Props = {
  /** Route the preview opens on. */
  initialRoute?: string;
  onClose?: () => void;
};

export default function AdminPreviewPane({ initialRoute = "/", onClose }: Props) {
  const [route, setRoute] = useState(initialRoute);
  const [device, setDevice] = useState<Device>("desktop");
  const [nonce, setNonce] = useState(0);
  const [justUpdated, setJustUpdated] = useState(false);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    setRoute(initialRoute);
  }, [initialRoute]);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  // Realtime: any content change bumps the iframe (debounced so a burst of
  // row updates results in one reload).
  useEffect(() => {
    const channel = supabase.channel("admin-live-preview");
    for (const table of WATCHED_TABLES) {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => {
          if (debounceRef.current) window.clearTimeout(debounceRef.current);
          debounceRef.current = window.setTimeout(() => {
            setNonce((n) => n + 1);
            setJustUpdated(true);
            window.setTimeout(() => setJustUpdated(false), 1600);
          }, 400);
        },
      );
    }
    channel.subscribe();
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      supabase.removeChannel(channel);
    };
  }, []);

  const src = `${route}${route.includes("?") ? "&" : "?"}preview=1&v=${nonce}`;

  return (
    <div className="flex h-full flex-col bg-muted/40">
      <div className="flex items-center gap-2 border-b border-border bg-card px-3 py-2">
        <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground hidden lg:inline">
          Live
        </span>

        <Select value={route} onValueChange={setRoute}>
          <SelectTrigger className="h-8 w-[180px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PREVIEW_ROUTES.map((r) => (
              <SelectItem key={r.value} value={r.value} className="text-xs">
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-1">
          {(Object.keys(DEVICES) as Device[]).map((d) => {
            const Icon = DEVICES[d].icon;
            return (
              <button
                key={d}
                onClick={() => setDevice(d)}
                title={DEVICES[d].label}
                className={cn(
                  "rounded-md p-1.5 transition-colors",
                  device === d
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent",
                )}
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={refresh} title="Uppdatera">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild title="Öppna i ny flik">
            <a href={route} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
          {onClose && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose} title="Stäng">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="relative flex-1 overflow-auto p-3">
        {justUpdated && (
          <div className="pointer-events-none absolute left-1/2 top-5 z-10 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground shadow-lg">
            Uppdaterad
          </div>
        )}
        <div
          className="mx-auto h-full overflow-hidden rounded-lg border border-border bg-background shadow-sm transition-all"
          style={{ width: DEVICES[device].width, maxWidth: "100%" }}
        >
          <iframe
            key={nonce}
            src={src}
            title="Förhandsvisning"
            className="h-full w-full"
          />
        </div>
      </div>
    </div>
  );
}
