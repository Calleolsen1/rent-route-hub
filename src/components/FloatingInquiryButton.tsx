import { MessageSquare } from "lucide-react";

interface Props {
  label?: string;
  targetId?: string;
}

export default function FloatingInquiryButton({ label = "Skicka förfrågan", targetId = "forfragan" }: Props) {
  const handleClick = () => {
    const el = document.getElementById(targetId);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-40 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg shadow-navy/20 px-5 py-3 flex items-center gap-2 text-sm tracking-wider font-sans transition-all hover:scale-105 md:bottom-8 md:right-8"
      aria-label={label}
    >
      <MessageSquare className="h-4 w-4" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
