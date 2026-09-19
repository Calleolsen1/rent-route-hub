import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Trophy, Calendar, Search, X } from "lucide-react";

export type SportFilterValues = {
  sport?: "soccer" | "formula1";
  tournament?: string; // legacy, kept for compatibility but no longer surfaced in UI
  query?: string;
  dateFrom?: string;
  dateTo?: string;
  sort: "soonest" | "latest";
};

export const emptyFilters: SportFilterValues = { sort: "soonest" };

const SPORT_LABELS: Record<"all" | "soccer" | "formula1", string> = {
  all: "Alla sporter",
  soccer: "Fotboll",
  formula1: "Formel 1",
};

const formatDateRange = (from?: string, to?: string): string => {
  if (!from && !to) return "Alla datum";
  const fmt = (iso: string) => new Date(iso).toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
  if (from && to) return `${fmt(from)} - ${fmt(to)}`;
  if (from) return `Från ${fmt(from)}`;
  return `Till ${fmt(to!)}`;
};

/**
 * Three-segment unified search bar - sport / dates / free-text - modeled after
 * the StubHub-style horizontal control. Replaces the older filter-grid layout
 * that felt over-engineered relative to a small sport-ticket catalog.
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
  const update = (patch: Partial<SportFilterValues>) => onChange({ ...value, ...patch });
  const sportLabel = SPORT_LABELS[value.sport ?? "all"];
  const dateLabel = formatDateRange(value.dateFrom, value.dateTo);

  return (
    <div
      className={`bg-card border border-border rounded-full shadow-sm flex items-stretch divide-x divide-border overflow-hidden ${className ?? ""}`}
    >
      <SportTrigger value={value.sport} onChange={(v) => update({ sport: v })} label={sportLabel} />
      <DateTrigger
        from={value.dateFrom}
        to={value.dateTo}
        label={dateLabel}
        onChange={(from, to) => update({ dateFrom: from, dateTo: to })}
      />
      <div className="flex-1 flex items-center px-5 py-3 gap-3 min-w-0">
        <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Sök</div>
          <input
            value={value.query ?? ""}
            onChange={(e) => update({ query: e.target.value || undefined })}
            placeholder="Lag, race, arena..."
            className="w-full bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground/60"
          />
        </div>
        {value.query && (
          <button
            onClick={() => update({ query: undefined })}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Rensa sökning"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

function SportTrigger({
  value,
  label,
  onChange,
}: {
  value: SportFilterValues["sport"];
  label: string;
  onChange: (v: SportFilterValues["sport"]) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center px-5 py-3 gap-3 hover:bg-muted/30 transition-colors text-left">
          <Trophy className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Sport</div>
            <div className="text-sm truncate">{label}</div>
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-1">
        {(["all", "soccer", "formula1"] as const).map((k) => (
          <button
            key={k}
            onClick={() => {
              onChange(k === "all" ? undefined : k);
              setOpen(false);
            }}
            className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-muted ${
              (value ?? "all") === k ? "bg-muted font-medium" : ""
            }`}
          >
            {SPORT_LABELS[k]}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

function DateTrigger({
  from,
  to,
  label,
  onChange,
}: {
  from?: string;
  to?: string;
  label: string;
  onChange: (from: string | undefined, to: string | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center px-5 py-3 gap-3 hover:bg-muted/30 transition-colors text-left">
          <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Datum</div>
            <div className="text-sm truncate">{label}</div>
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-4 space-y-3">
        <div>
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Från</label>
          <Input
            type="date"
            value={from?.slice(0, 10) ?? ""}
            onChange={(e) =>
              onChange(
                e.target.value ? new Date(e.target.value).toISOString() : undefined,
                to,
              )
            }
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Till</label>
          <Input
            type="date"
            value={to?.slice(0, 10) ?? ""}
            onChange={(e) =>
              onChange(
                from,
                e.target.value ? new Date(`${e.target.value}T23:59:59Z`).toISOString() : undefined,
              )
            }
            className="mt-1"
          />
        </div>
        {(from || to) && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => {
              onChange(undefined, undefined);
              setOpen(false);
            }}
          >
            Rensa
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}
