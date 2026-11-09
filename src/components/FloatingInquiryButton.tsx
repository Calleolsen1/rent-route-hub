import { MessageSquare } from "lucide-react";
import { useInquiryDialog, type InquiryDialogOptions } from "@/components/InquiryDialog";

interface Props {
  label?: string;
  inquiry: InquiryDialogOptions;
}

export default function FloatingInquiryButton({ label = "Skicka förfrågan", inquiry }: Props) {
  const { open } = useInquiryDialog();

  return (
    <button
      onClick={() => open(inquiry)}
      className="hidden md:flex fixed bottom-6 right-6 z-40 bg-primary hover:bg-navy-deep text-primary-foreground rounded-lg shadow-lg shadow-navy/20 px-5 py-3 items-center gap-2 font-display uppercase font-semibold tracking-wide text-base transition-all md:bottom-8 md:right-8"
      aria-label={label}
    >
      <MessageSquare className="h-4 w-4" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
