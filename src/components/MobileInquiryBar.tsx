import { MessageSquare } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useInquiryDialog } from "@/components/InquiryDialog";
import { Button } from "@/components/ui/button";

const excludedPrefixes = ["/admin", "/mitt-kaisen", "/checkout", "/order", "/quote"];

// Gruppresor ska inte lova något svarstidsspann i formuläret som öppnas av fältknappen.
const noSvarstidRoutes = ["/group-travel"];

export default function MobileInquiryBar() {
  const { pathname } = useLocation();
  const { open } = useInquiryDialog();

  if (pathname === "/" || excludedPrefixes.some((p) => pathname.startsWith(p))) return null;

  const utanSvarstid = noSvarstidRoutes.some((p) => pathname.startsWith(p));

  return (
    <Button
      onClick={() => {
        if (pathname === "/contact") {
          document.getElementById("contact-inquiry")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
          return;
        }
        open({
          type: "contact",
          eyebrow: "Prisförfrågan",
          heading: "Din förfrågan",
          intro: utanSvarstid
            ? "Berätta vad du är ute efter."
            : "Berätta vad du är ute efter - vi återkommer inom 24h.",
        });
      }}
      className="md:hidden fixed bottom-0 inset-x-0 z-40 rounded-none bg-primary text-primary-foreground min-h-14 h-auto pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] flex items-center justify-center gap-2 text-sm font-semibold shadow-lg border-t border-primary-foreground/50 active:bg-primary/90 transition-colors"
      aria-label="Skicka en förfrågan"
    >
      <MessageSquare className="h-4 w-4" />
      Skicka en förfrågan
    </Button>
  );
}
