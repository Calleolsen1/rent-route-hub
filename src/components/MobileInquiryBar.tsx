import { MessageSquare } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useInquiryDialog } from "@/components/InquiryDialog";

const excludedPrefixes = ["/admin", "/mitt-kaisen", "/checkout", "/order", "/quote"];

export default function MobileInquiryBar() {
  const { pathname } = useLocation();
  const { open } = useInquiryDialog();

  if (pathname === "/" || excludedPrefixes.some((p) => pathname.startsWith(p))) return null;

  return (
    <button
      onClick={() =>
        open({
          type: "contact",
          eyebrow: "Prisförfrågan",
          heading: "Din förfrågan",
          intro: "Berätta vad du är ute efter - vi återkommer inom 24h.",
        })
      }
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-primary text-primary-foreground h-14 flex items-center justify-center gap-2 text-sm font-medium tracking-wide shadow-lg shadow-navy/30 pb-[env(safe-area-inset-bottom)] active:bg-primary/90 transition-colors"
      aria-label="Skicka en förfrågan"
    >
      <MessageSquare className="h-4 w-4" />
      Skicka en förfrågan
    </button>
  );
}
