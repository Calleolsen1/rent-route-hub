import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X, Filter } from "lucide-react";

export type SportFilterValues = {
  sport?: "soccer" | "formula1";
  tournament?: string;
  query?: string;
  dateFrom?: string;
  dateTo?: string;
  sort: "soonest" | "latest";
};

export const emptyFilters: SportFilterValues = { sort: "soonest" };

/**
 * Filter row above an UpcomingEventsList. Dynamically populates the
 * tournament dropdown from DISTINCT tournament_name values that exist in the
 * events table, so it stays in sync with whatever's been synced from xs2.
 */
export function SportFilters({
  value,
  onChange,
  className,
}: {
  value: SportFilterValues;
  onChange: (v: SportFilterValues) => void;
  className?: string;
}) {
  const [tournaments, setTournaments] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("events")
        .select("tournament_name")
        .eq("status", "upcoming");
      const unique = Array.from(
        new Set(((data ?? []) as { tournament_name: string }[]).map((r) => r.tournament_name)),
      ).filter(Boolean).sort();
      setTournaments(unique);
    })();
  }, []);

  const update = (patch: Partial<SportFilterValues>) => onChange({ ...value, ...patch });
  const hasActive =
    value.sport != null ||
    !!value.tournament ||
    !!value.query ||
    !!value.dateFrom ||
    !!value.dateTo ||
    value.sort !== "soonest";

  return (
    <div className={`bg-card border border-border rounded-xl p-4 md:p-5 ${className ?? ""}`}>
      <div className="flex items-center gap-2 mb-3">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Filtrera</p>
        {hasActive && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-7 text-xs"
            onClick={() => onChange(emptyFilters)}
          >
            <X className="h-3 w-3 mr-1" /> Nollställ
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <div>
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Sport</Label>
          <Select
            value={value.sport ?? "all"}
            onValueChange={(v) => update({ sport: v === "all" ? undefined : (v as "soccer" | "formula1") })}
          >
            <SelectTrigger className="h-9 mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alla sporter</SelectItem>
              <SelectItem value="soccer">Fotboll</SelectItem>
              <SelectItem value="formula1">Formel 1</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Turnering</Label>
          <Select
            value={value.tournament ?? "all"}
            onValueChange={(v) => update({ tournament: v === "all" ? undefined : v })}
          >
            <SelectTrigger className="h-9 mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alla turneringar</SelectItem>
              {tournaments.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Datum från</Label>
          <Input
            type="date"
            value={value.dateFrom?.slice(0, 10) ?? ""}
            onChange={(e) => update({ dateFrom: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
            className="h-9 mt-1"
          />
        </div>

        <div>
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Datum till</Label>
          <Input
            type="date"
            value={value.dateTo?.slice(0, 10) ?? ""}
            onChange={(e) => update({ dateTo: e.target.value ? new Date(`${e.target.value}T23:59:59Z`).toISOString() : undefined })}
            className="h-9 mt-1"
          />
        </div>

        <div>
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Sortera</Label>
          <Select value={value.sort} onValueChange={(v) => update({ sort: v as "soonest" | "latest" })}>
            <SelectTrigger className="h-9 mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="soonest">Närmast i tid</SelectItem>
              <SelectItem value="latest">Längre fram</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-3">
        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Sök</Label>
        <Input
          placeholder="t.ex. Liverpool, Anfield, Monaco..."
          value={value.query ?? ""}
          onChange={(e) => update({ query: e.target.value || undefined })}
          className="h-9 mt-1"
        />
      </div>
    </div>
  );
}
