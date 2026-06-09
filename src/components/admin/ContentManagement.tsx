import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FAQManagement from "./FAQManagement";
import TestimonialsManager from "./TestimonialsManager";
import WhyUsCardsManager from "./WhyUsCardsManager";
import PageTextsManager from "./PageTextsManager";

/**
 * Admin content hub — tabbed editor for everything that ships marketing copy
 * to the public site. Each tab is a focused CRUD interface so non-technical
 * operators can update content without touching code.
 */
export default function ContentManagement() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-display mb-1">Innehåll</h1>
        <p className="text-muted-foreground text-sm">
          Redigera publika texter, citat, vanliga frågor och övrig marknadsföringskopia.
        </p>
      </div>

      <Tabs defaultValue="faqs" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="faqs">Vanliga frågor</TabsTrigger>
          <TabsTrigger value="testimonials">Citat</TabsTrigger>
          <TabsTrigger value="whyus">Vad gör oss annorlunda</TabsTrigger>
          <TabsTrigger value="texts">Sidtexter</TabsTrigger>
        </TabsList>

        <TabsContent value="faqs" className="mt-6">
          <FAQManagement />
        </TabsContent>
        <TabsContent value="testimonials" className="mt-6">
          <TestimonialsManager />
        </TabsContent>
        <TabsContent value="whyus" className="mt-6">
          <WhyUsCardsManager />
        </TabsContent>
        <TabsContent value="texts" className="mt-6">
          <PageTextsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
