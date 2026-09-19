import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInquiryDialog } from "@/components/InquiryDialog";
import type { InquiryType } from "@/components/InquiryForm";

type Props = {
  /** Förfrågningstyp som popupen öppnas med. */
  type?: InquiryType;
  presetTopic?: string;
  defaultDestination?: string;
  heading?: string;
  sub?: string;
};

/**
 * Sektion som alltid ligger nära sidfoten: "Hittar du inte det du letar efter?"
 * med en knapp som öppnar förfrågnings-popupen.
 */
const RequestCta = ({
  type = "contact",
  presetTopic,
  defaultDestination,
  heading = "Hittar du inte det du letar efter?",
  sub = "Vi kan säkert fixa det ändå - berätta vad du drömmer om så sätter vi ihop resan åt dig.",
}: Props) => {
  const { open } = useInquiryDialog();

  return (
    <section className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-10 md:py-14 text-center">
        <p className="text-xs uppercase tracking-[0.25em] text-primary-foreground/70 mb-3">
          Personlig service
        </p>
        <h2 className="font-serif text-3xl md:text-4xl mb-4">{heading}</h2>
        <p className="text-primary-foreground/80 max-w-xl mx-auto mb-8">{sub}</p>
        <Button
          size="lg"
          variant="secondary"
          className="gap-2"
          onClick={() =>
            open({
              type,
              presetTopic,
              defaultDestination,
              heading: "Skicka en förfrågan",
              intro: "Berätta vad du letar efter så återkommer vi med ett förslag.",
              showTripParts: true,
            })
          }
        >
          Skicka förfrågan <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </section>
  );
};

export default RequestCta;
