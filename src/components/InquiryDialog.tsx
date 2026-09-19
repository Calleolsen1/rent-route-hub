import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import InquiryForm, { type InquiryType } from "@/components/InquiryForm";

export type InquiryDialogOptions = {
  type: InquiryType;
  presetTopic?: string;
  defaultDestination?: string;
  eyebrow?: string;
  heading?: string;
  intro?: string;
  /** Show the Hotell / Biljett / Flyg picker. */
  showTripParts?: boolean;
  /** Parts ticked on open, e.g. ["biljett"]. */
  defaultTripParts?: readonly string[];
};

type InquiryDialogContextValue = {
  open: (opts: InquiryDialogOptions) => void;
};

const InquiryDialogContext = createContext<InquiryDialogContextValue | null>(null);

export function useInquiryDialog() {
  const ctx = useContext(InquiryDialogContext);
  if (!ctx) throw new Error("useInquiryDialog måste användas inuti InquiryDialogProvider");
  return ctx;
}

export function InquiryDialogProvider({ children }: { children: ReactNode }) {
  const [opts, setOpts] = useState<InquiryDialogOptions | null>(null);

  const open = useCallback((o: InquiryDialogOptions) => setOpts(o), []);
  const close = useCallback(() => setOpts(null), []);

  return (
    <InquiryDialogContext.Provider value={{ open }}>
      {children}
      <Dialog open={opts !== null} onOpenChange={(v) => { if (!v) close(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
          {opts && (
            <InquiryForm
              key={`${opts.type}-${opts.defaultDestination ?? ""}-${opts.presetTopic ?? ""}`}
              type={opts.type}
              presetTopic={opts.presetTopic}
              defaultDestination={opts.defaultDestination}
              eyebrow={opts.eyebrow}
              heading={opts.heading}
              intro={opts.intro}
              showTripParts={opts.showTripParts}
              defaultTripParts={opts.defaultTripParts}
            />
          )}
        </DialogContent>
      </Dialog>
    </InquiryDialogContext.Provider>
  );
}
