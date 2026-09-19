import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { ImageUploader } from "@/components/admin/ImageUploader";

type Slide = {
  id: string;
  image_url: string;
  eyebrow: string | null;
  title: string;
  italic: string | null;
  description: string | null;
  cta_label: string | null;
  cta_to: string | null;
  is_active: boolean;
  sort_order: number;
};

export default function AdminBanners() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("home_slides")
      .select("*")
      .order("sort_order", { ascending: true });
    setSlides((data as Slide[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const patch = async (id: string, p: Partial<Slide>) => {
    setSlides((prev) => prev.map((s) => (s.id === id ? { ...s, ...p } : s)));
    const { error } = await (supabase as any).from("home_slides").update(p).eq("id", id);
    if (error) toast.error(error.message ?? "Kunde inte spara");
  };

  const addSlide = async () => {
    const nextOrder = slides.length === 0 ? 0 : Math.max(...slides.map((s) => s.sort_order)) + 1;
    const { data, error } = await (supabase as any)
      .from("home_slides")
      .insert({
        image_url: "asset:kaisen-hero",
        title: "Ny slide",
        is_active: false,
        sort_order: nextOrder,
      })
      .select("*")
      .single();
    if (error || !data) {
      toast.error(error?.message ?? "Kunde inte skapa slide");
      return;
    }
    setSlides((prev) => [...prev, data as Slide]);
    toast.success("Slide skapad — kom ihåg att aktivera när den är klar");
  };

  const removeSlide = async (id: string) => {
    if (!confirm("Ta bort slide?")) return;
    const { error } = await (supabase as any).from("home_slides").delete().eq("id", id);
    if (error) {
      toast.error(error.message ?? "Kunde inte ta bort");
      return;
    }
    setSlides((prev) => prev.filter((s) => s.id !== id));
  };

  const moveSlide = async (id: string, dir: -1 | 1) => {
    const idx = slides.findIndex((s) => s.id === id);
    const otherIdx = idx + dir;
    if (idx < 0 || otherIdx < 0 || otherIdx >= slides.length) return;
    const a = slides[idx];
    const b = slides[otherIdx];
    // Swap sort_order locally
    const newSlides = [...slides];
    newSlides[idx] = { ...a, sort_order: b.sort_order };
    newSlides[otherIdx] = { ...b, sort_order: a.sort_order };
    newSlides.sort((x, y) => x.sort_order - y.sort_order);
    setSlides(newSlides);
    // Persist both
    await Promise.all([
      (supabase as any).from("home_slides").update({ sort_order: b.sort_order }).eq("id", a.id),
      (supabase as any).from("home_slides").update({ sort_order: a.sort_order }).eq("id", b.id),
    ]);
  };

  return (
    <div className="p-8 max-w-5xl space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display mb-2">Hero-banners</h1>
          <p className="text-muted-foreground text-sm">
            Kontrollera vad som visas i hjälte-karusellen på startsidan. Avaktivera en slide för att dölja den utan att radera.
          </p>
        </div>
        <Button onClick={addSlide} className="flex-shrink-0">
          <Plus className="h-4 w-4 mr-2" /> Ny slide
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Laddar...</p>
      ) : slides.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Inga slides. Klicka "Ny slide" för att börja.
        </p>
      ) : (
        <div className="space-y-4">
          {slides.map((slide, i) => (
            <div key={slide.id} className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-muted-foreground">#{i + 1}</span>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                    <Switch
                      checked={slide.is_active}
                      onCheckedChange={(v) => patch(slide.id, { is_active: v })}
                    />
                    {slide.is_active ? "Aktiv" : "Inaktiv"}
                  </label>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => moveSlide(slide.id, -1)}
                    disabled={i === 0}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => moveSlide(slide.id, 1)}
                    disabled={i === slides.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => removeSlide(slide.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <ImageUploader
                value={slide.image_url}
                prefix="home-slides"
                onUploaded={(url) => patch(slide.id, { image_url: url })}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs uppercase tracking-wider">Eyebrow</Label>
                  <Input
                    value={slide.eyebrow ?? ""}
                    placeholder="Liten text ovanför rubriken"
                    onChange={(e) =>
                      setSlides((prev) =>
                        prev.map((s) => (s.id === slide.id ? { ...s, eyebrow: e.target.value } : s)),
                      )
                    }
                    onBlur={(e) => patch(slide.id, { eyebrow: e.target.value || null })}

                  />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider">Titel</Label>
                  <Input
                    value={slide.title}
                    onChange={(e) =>
                      setSlides((prev) =>
                        prev.map((s) => (s.id === slide.id ? { ...s, title: e.target.value } : s)),
                      )
                    }
                    onBlur={(e) => patch(slide.id, { title: e.target.value })}

                  />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider">Kursiv del</Label>
                  <Input
                    value={slide.italic ?? ""}
                    placeholder="Italic rad under titeln"
                    onChange={(e) =>
                      setSlides((prev) =>
                        prev.map((s) => (s.id === slide.id ? { ...s, italic: e.target.value } : s)),
                      )
                    }
                    onBlur={(e) => patch(slide.id, { italic: e.target.value || null })}

                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs uppercase tracking-wider">Beskrivning</Label>
                  <Textarea
                    rows={2}
                    value={slide.description ?? ""}
                    onChange={(e) =>
                      setSlides((prev) =>
                        prev.map((s) =>
                          s.id === slide.id ? { ...s, description: e.target.value } : s,
                        ),
                      )
                    }
                    onBlur={(e) => patch(slide.id, { description: e.target.value || null })}

                  />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider">CTA-text</Label>
                  <Input
                    value={slide.cta_label ?? ""}
                    placeholder="t.ex. Planera din resa"
                    onChange={(e) =>
                      setSlides((prev) =>
                        prev.map((s) =>
                          s.id === slide.id ? { ...s, cta_label: e.target.value } : s,
                        ),
                      )
                    }
                    onBlur={(e) => patch(slide.id, { cta_label: e.target.value || null })}

                  />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider">CTA-länk</Label>
                  <Input
                    value={slide.cta_to ?? ""}
                    placeholder="/contact"
                    onChange={(e) =>
                      setSlides((prev) =>
                        prev.map((s) => (s.id === slide.id ? { ...s, cta_to: e.target.value } : s)),
                      )
                    }
                    onBlur={(e) => patch(slide.id, { cta_to: e.target.value || null })}

                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
