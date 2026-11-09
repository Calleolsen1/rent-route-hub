import { ChevronDown } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

interface FAQAccordionProps {
  faqs: FAQ[];
  className?: string;
}

export function FAQAccordion({ faqs, className }: FAQAccordionProps) {
  if (!faqs || faqs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No FAQs available at the moment.
      </div>
    );
  }

  return (
    <Accordion type="single" collapsible className={className}>
      <div className="space-y-3">
        {faqs.map((faq) => (
          <AccordionItem 
            key={faq.id} 
            value={faq.id}
            className="sb-card px-5 py-1 data-[state=open]:border-primary/50 transition-colors"
          >
            <AccordionTrigger className="py-4 text-left hover:no-underline hover:text-primary">
              <span className="font-display text-lg md:text-xl uppercase font-semibold leading-snug text-foreground pr-4">
                {faq.question}
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-4 pt-0">
              <p className="text-[15px] text-foreground/80 leading-relaxed">
                {faq.answer}
              </p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </div>
    </Accordion>
  );
}
