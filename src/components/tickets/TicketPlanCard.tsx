import { useState } from "react";
import { Maximize2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import StadiumPlan from "@/components/StadiumPlan";
import type { EventTickets } from "@/hooks/useEventTickets";

// The supplier's official seating plan, in the right-hand column next to the
// ticket list. Compact by design so the booking card fits under it; the
// enlarge button opens the same interactive plan full size.

export default function TicketPlanCard({
  t,
  venueName,
  photoUrl,
}: {
  t: EventTickets;
  venueName?: string | null;
  /** Uploaded stadium photo, shown in the plan's place when there is no plan. */
  photoUrl?: string | null;
}) {
  const [big, setBig] = useState(false);
  if (!t.hasPlan || !t.planUrl) {
    if (t.loading || !photoUrl) return null;
    return (
      <div className="rounded-2xl border border-border bg-card p-3 shadow-sm">
        <p className="px-1 pb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-foreground/70 font-sans">Arenan</p>
        <img
          src={photoUrl}
          alt={venueName ?? "Arenan"}
          loading="lazy"
          className="w-full aspect-[4/3] object-cover rounded-xl"
        />
        {venueName && <p className="mt-1.5 text-[11px] text-muted-foreground text-center">{venueName}</p>}
      </div>
    );
  }
  const alt = `Läktarkarta ${venueName ?? ""}`.trim();
  const interactive = !!t.onPlanColors && t.onPlanColors.size > 0;

  return (
    <div id="arenakarta" className="rounded-2xl border border-border bg-card p-3 shadow-sm scroll-mt-24">
      <div className="flex items-center justify-between px-1 pb-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-foreground/70 font-sans">Arenan</p>
        <button
          type="button"
          onClick={() => setBig(true)}
          className="text-xs text-primary hover:underline inline-flex items-center gap-1"
        >
          <Maximize2 className="h-3 w-3" /> Förstora
        </button>
      </div>
      <StadiumPlan
        src={t.planUrl}
        areas={t.areas}
        active={t.activeColor}
        activeLabels={t.activeLabels}
        onHover={t.setHoverColor}
        onPick={t.pickFromPlan}
        onAreasFound={t.setOnPlanColors}
        alt={alt}
        maxHeight="30vh"
      />
      <p className="mt-1.5 text-[11px] text-muted-foreground text-center">
        Officiell läktarkarta{venueName ? ` · ${venueName}` : ""}
        {interactive && (
          <>
            <span className="hidden lg:inline"> · klicka på ett färgat område</span>
            <span className="lg:hidden"> · tryck på ett färgat område</span>
          </>
        )}
      </p>

      <Dialog open={big} onOpenChange={setBig}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>{alt}</DialogTitle>
          </DialogHeader>
          {big && (
            <StadiumPlan
              src={t.planUrl}
              areas={t.areas}
              active={t.activeColor}
              activeLabels={t.activeLabels}
              onHover={t.setHoverColor}
              onPick={t.pickFromPlan}
              alt={alt}
              maxHeight="72vh"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
