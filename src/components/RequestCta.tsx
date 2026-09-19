import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInquiryDialog } from "@/components/InquiryDialog";
import type { InquiryType } from "@/components/InquiryForm";

type Props = {
  /** Förfrågningstyp som popupen öppnas med. */
  type?: InquiryType;
  presetTopic?: string;
  defaultDestination?: string;
};

/**
 * Liten rund knapp nära sidfoten som öppnar förfrågnings-popupen.
 * Ersätter den tidigare stora mörkblå CTA-rutan.
 */
const RequestCta = ({
  type = "contact",
  presetTopic,
  defaultDestination,
}: Props) => {
  const { open } = useInquiryDialog();

  return (
    <section className="container mx-auto px-4 py-10 md:py-14 text-center">
      <Button
        size="lg"
        className="rounded-full bg-primary hover:bg-primary/90 px-10 tracking-wider text-sm h-11"
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
        Skicka förfrågan <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </section>
  );
};

export default RequestCta;
