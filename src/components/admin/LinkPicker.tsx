import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { slugify } from "@/data/sports";

type Option = { label: string; value: string; group: string };

const STATIC_OPTIONS: Option[] = [
  { label: "Startsida", value: "/", group: "Sidor" },
  { label: "Alla resor", value: "/resor", group: "Sidor" },
  { label: "Tjänster", value: "/tjanster", group: "Sidor" },
  { label: "Sportresor", value: "/services/sportresor", group: "Sidor" },
  { label: "Fotboll", value: "/services/sportresor/fotboll", group: "Sidor" },
  { label: "Formel 1", value: "/services/sportresor/formel-1", group: "Sidor" },
  { label: "Träningsläger", value: "/services/traningslager", group: "Sidor" },
  { label: "Grupp & konferens", value: "/services/konferens", group: "Sidor" },
  { label: "Affärsresor", value: "/services/affarsresor", group: "Sidor" },
  { label: "VIP-service", value: "/services/vip-service", group: "Sidor" },
  { label: "Kontakt / förfrågan", value: "/contact", group: "Sidor" },
  { label: "Om oss", value: "/about", group: "Sidor" },
];

export function LinkPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [dynamic, setDynamic] = useState<Option[]>([]);
  const [manual, setManual] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => setDraft(value), [value]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [entriesRes, eventsRes] = await Promise.all([
        (supabase as any)
          .from("nav_menu_entries")
          .select("name, slug, city, is_active, nav_sports(slug, label, is_active)")
          .eq("is_active", true)
          .order("sort_order", { ascending: true }),
        (supabase as any)
          .from("events")
          .select("id, home_team, away_team, race_name, tournament_name, starts_at, status")
          .eq("status", "upcoming")
          .gte("starts_at", new Date().toISOString())
          .order("starts_at", { ascending: true })
          .limit(200),
      ]);

      if (cancelled) return;

      const entryOptions: Option[] = ((entriesRes.data as any[]) ?? [])
        .filter((e) => e.nav_sports?.slug)
        .map((e) => ({
          label: `${e.name}${e.city ? ` - ${e.city}` : ""}`,
          value: `/services/sportresor/${e.nav_sports.slug}/${e.slug}`,
          group: e.nav_sports.label ?? "Sportsidor",
        }));

      const eventOptions: Option[] = ((eventsRes.data as any[]) ?? []).map((ev) => {
        const name =
          ev.race_name ??
          (ev.home_team ? `${ev.home_team}${ev.away_team ? ` - ${ev.away_team}` : ""}` : ev.tournament_name);
        const date = ev.starts_at
          ? new Date(ev.starts_at).toLocaleDateString("sv-SE", { day: "numeric", month: "short" })
          : "";
        return {
          label: `${name}${date ? ` (${date})` : ""}`,
          value: `/sport/event/${ev.id}`,
          group: "Evenemang",
        };
      });

      setDynamic([...entryOptions, ...eventOptions]);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const options = useMemo(() => [...STATIC_OPTIONS, ...dynamic], [dynamic]);
  const groups = useMemo(() => {
    const map = new Map<string, Option[]>();
    options.forEach((o) => {
      const list = map.get(o.group) ?? [];
      list.push(o);
      map.set(o.group, list);
    });
    return Array.from(map.entries());
  }, [options]);

  const selected = options.find((o) => o.value === value);

  if (manual) {
    return (
      <div className="flex gap-2">
        <Input
          value={draft}
          placeholder="/services/traningslager"
          onChange={(e) => setDraft(e.target.value)}
          onBlur={(e) => onChange(e.target.value || "/contact")}
        />
        <Button type="button" variant="ghost" size="sm" onClick={() => setManual(false)}>
          Välj i lista
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            className="w-full justify-between font-normal"
          >
            <span className="truncate">{selected?.label ?? value ?? "Välj sida"}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[420px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Sök lag, lopp, resa eller sida..." />
            <CommandList className="max-h-72">
              <CommandEmpty>Inget hittades</CommandEmpty>
              {groups.map(([group, items]) => (
                <CommandGroup key={group} heading={group}>
                  {items.map((o) => (
                    <CommandItem
                      key={o.value}
                      value={`${o.label} ${o.value}`}
                      onSelect={() => {
                        onChange(o.value);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={`mr-2 h-4 w-4 ${o.value === value ? "opacity-100" : "opacity-0"}`}
                      />
                      <span className="truncate">{o.label}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <Button type="button" variant="ghost" size="sm" onClick={() => setManual(true)}>
        Egen länk
      </Button>
    </div>
  );
}
