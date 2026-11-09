import { useEffect, useState } from "react";
import { ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import InquiryForm from "@/components/InquiryForm";
import TicketList from "@/components/tickets/TicketList";
import BookingCard from "@/components/tickets/BookingCard";
import CheckoutBar, { type Extras } from "@/components/tickets/CheckoutBar";
import HotelStep from "@/components/trip/HotelStep";
import FlightStep from "@/components/trip/FlightStep";
import { goToStep } from "@/components/trip/TripStep";
import { useEventTickets } from "@/hooks/useEventTickets";
import { useEventHotels } from "@/hooks/useEventHotels";

type Props = {
  raceName: string;
  /** "4–6 juni 2027" */
  when: string | null;
  venue: string | null;
  /** Race day (ISO date) - the hotel stay defaults to the day before. */
  raceDay: string | null;
};

/**
 * The match page's three steps (Biljetter → Hotell → Flyg + booking card) for
 * an F1 race the ticket supplier doesn't list. Tickets are the generic tiers
 * (Tribunplats / General admission / VIP & Paddock) - no exact seating - and
 * everything ends in a request that names the race and weekend, so KAISEN
 * sources the tickets by hand. Never buyable.
 */
export default function RaceTripFlow({ raceName, when, venue, raceDay }: Props) {
  const t = useEventTickets(undefined, "formula1");
  const hotels = useEventHotels(undefined, raceDay ? `${raceDay}T12:00:00Z` : null);
  const [extras, setExtras] = useState<Extras>({ hotel: null, flight: null });
  const [flightFrom, setFlightFrom] = useState<string | null>(null);
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [enquiry, setEnquiry] = useState<{ parts: string[]; selection: string[] }>({ parts: ["biljett"], selection: [] });

  const { clear: clearHotels, selected: pickedHotels } = hotels;
  useEffect(() => {
    if (!extras.hotel && pickedHotels.length) clearHotels();
  }, [extras.hotel, pickedHotels.length, clearHotels]);

  const openEnquiry = () => {
    const parts = ["biljett", ...(extras.hotel ? ["hotell"] : []), ...(extras.flight ? ["flyg"] : [])];
    const selection = [
      ...t.lines.map(({ g, n }) => `${n} × ${g.name}`),
      ...(extras.hotel ? [hotels.selectionLine] : []),
      ...(extras.flight ? [`Flyg: ${flightFrom ? `från ${flightFrom}` : "avreseort ej vald"}`] : []),
    ];
    setEnquiry({ parts, selection });
    setInquiryOpen(true);
  };

  return (
    <>
      <div className="grid lg:grid-cols-3 gap-8 lg:gap-10">
        <div className="lg:col-span-2 space-y-10 min-w-0">
          <TicketList t={t} sport="formula1" />
          {t.count > 0 && extras.hotel === null && (
            <Button
              variant="outline"
              onClick={() => goToStep("hotell")}
              className="-mt-6 w-full rounded-lg h-12 border-primary text-primary hover:bg-primary hover:text-primary-foreground font-display uppercase font-semibold tracking-wide text-base"
            >
              Fortsätt till hotell
              <ArrowDown className="ml-2 h-4 w-4" />
            </Button>
          )}
          <HotelStep
            h={hotels}
            on={extras.hotel}
            onToggle={(on) => {
              setExtras((e) => ({ ...e, hotel: on }));
              if (!on && extras.flight === null) setTimeout(() => goToStep("flyg"), 150);
            }}
            onPick={(hotel) => hotel && setExtras((e) => ({ ...e, hotel: true }))}
          />
          <FlightStep
            on={extras.flight}
            onToggle={(on) => setExtras((e) => ({ ...e, flight: on }))}
            from={flightFrom}
            onFrom={setFlightFrom}
          />
        </div>
        <aside className="lg:self-start">
          <BookingCard
            t={t}
            headline={raceName}
            when={when ?? ""}
            venue={venue}
            hotels={hotels}
            extras={extras}
            onExtras={setExtras}
            flightFrom={extras.flight ? flightFrom : null}
            onEnquire={openEnquiry}
          />
        </aside>
      </div>

      <Dialog open={inquiryOpen} onOpenChange={setInquiryOpen}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
          <InquiryForm
            key={`${enquiry.parts.join(",")}|${enquiry.selection.join("|")}`}
            type="contact"
            eyebrow="Prisförfrågan"
            heading={`Begär pris - ${raceName}`}
            intro={`${when ?? ""}${venue ? ` · ${venue}` : ""}. Skriv gärna om ni vill sitta ihop eller har andra önskemål - vi återkommer med pris och tillgänglighet.`}
            presetTopic={[raceName, when].filter(Boolean).join(" · ")}
            showDates={false}
            defaultTripParts={enquiry.parts}
            selection={enquiry.selection}
            compact
          />
        </DialogContent>
      </Dialog>

      <CheckoutBar t={t} extras={extras} onEnquire={openEnquiry} />
    </>
  );
}
