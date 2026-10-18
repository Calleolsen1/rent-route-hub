import { MessageSquare } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useInquiryDialog } from "@/components/InquiryDialog";

const excludedPrefixes = ["/admin", "/mitt-kaisen", "/checkout", "/order", "/quote"];

// Gruppresor ska inte lova något svarstidsspann i formuläret som öppnas av fältknappen.
const noSvarstidRoutes = ["/group-travel"];

export default function MobileInquiryBar() {
  const { pathname } = useLocation();
  const { open } = useInquiryDialog();

  if (pathname === "/" || excludedPrefixes.some((p) => pathname.startsWith(p))) return null;

  const utanSvarstid = noSvarstidRoutes.some((p) => pathname.startsWith(p));

  return (
    <button
      onClick={() =>
        open({
          type: "contact",
          eyebrow: "Prisförfrågan",
          heading: "Din förfrågan",
          intro: utanSvarstid
            ? "Berätta vad du är ute efter."
            : "Berätta vad du är ute efter - vi återkommer inom 24h.",
        })
      }
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-primary text-primary-foreground h-14 flex items-center justify-center gap-2 text-sm font-semibold tracking-wide shadow-[0_-6px_20px_rgba(0,0,0,0.45)] border-t-2 border-white/50 pb-[env(safe-area-inset-bottom)] active:bg-primary/90 transition-colors"
      aria-label="Skicka en förfrågan"
    >
      <MessageSquare className="h-4 w-4" />
      Skicka en förfrågan
    </button>
  );
}
