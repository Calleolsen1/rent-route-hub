import { useEffect, useMemo, useRef, useState } from "react";
import { normColor } from "@/lib/planColor";
import { analysePlan, type PlanAnalysis } from "@/lib/planAnalysis";

// A supplier seating plan that lights up where a ticket category is.
//
// Travel Connection paints each plan in the colours of the categories sold
// at that venue (Emirates: Cannon Club blocks yellow, Block 66 green), and
// every category carries its colour. So "where is this ticket?" is answered
// by the pixels themselves: no hand-drawn stadium maps, nothing to maintain.
// How pixels are matched to categories: src/lib/planAnalysis.ts.

export type PlanArea = {
  /** Category colour as the supplier gives it, e.g. "#FFD663". */
  color: string;
  /** Shown when hovering that area on the map. */
  labels: string[];
};

/** Pixels are analysed at this width; plenty for stand-sized areas. */
const WORK_WIDTH = 1400;
/** How dark everything outside the highlighted area becomes. */
const DIM = 0.3;
/** Areas below this share of the plan also get a ring, or they're easy to miss. */
const RING_BELOW_SHARE = 0.01;

export default function StadiumPlan({
  src,
  areas,
  active,
  onHover,
  onPick,
  onAreasFound,
  alt,
}: {
  src: string;
  areas: PlanArea[];
  /** Category colour to light up, or null for the plain plan. */
  active: string | null;
  /** The category colour under the pointer (first one, if several share an area). */
  onHover?: (color: string | null) => void;
  onPick?: (color: string) => void;
  /** Which category colours have an area on this plan (others can't be shown). */
  onAreasFound?: (colors: Set<string>) => void;
  alt: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  // Width / height, so the plan can be capped by height without distorting.
  const [aspect, setAspect] = useState(1.4);
  const [tip, setTip] = useState<{ x: number; y: number; labels: string[] } | null>(null);
  const analysis = useRef<{ plan: PlanAnalysis; pixels: ImageData } | null>(null);

  const colors = useMemo(() => [...new Set(areas.map((a) => normColor(a.color)))], [areas]);
  const colorsKey = colors.join(",");

  // Load the plan and work out every category's area once.
  useEffect(() => {
    setReady(false);
    setFailed(false);
    analysis.current = null;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const scale = Math.min(1, WORK_WIDTH / img.naturalWidth);
      const w = Math.round(img.naturalWidth * scale);
      const h = Math.round(img.naturalHeight * scale);
      canvas.width = w;
      canvas.height = h;
      setAspect(w / h);
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return setFailed(true);
      ctx.drawImage(img, 0, 0, w, h);
      try {
        const pixels = ctx.getImageData(0, 0, w, h);
        const plan = analysePlan(pixels.data, w, h, colors);
        analysis.current = { plan, pixels };
        onAreasFound?.(new Set(plan.regionOf.keys()));
      } catch {
        // No CORS on the image: show it plainly, without highlighting.
        onAreasFound?.(new Set());
      }
      setReady(true);
    };
    img.onerror = () => setFailed(true);
    img.src = src;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, colorsKey]);

  // Draw: the plain plan, or everything outside the active area darkened.
  useEffect(() => {
    const a = analysis.current;
    const canvas = canvasRef.current;
    if (!ready || !a || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { plan, pixels } = a;
    const k = active ? plan.regionOf.get(normColor(active)) ?? -1 : -1;
    if (k < 0) {
      ctx.putImageData(pixels, 0, 0);
      return;
    }
    const out = ctx.createImageData(plan.w, plan.h);
    const srcData = pixels.data;
    const dst = out.data;
    for (let i = 0, p = 0; p < plan.index.length; i += 4, p++) {
      const f = plan.index[p] === k ? 1 : DIM;
      dst[i] = srcData[i] * f;
      dst[i + 1] = srcData[i + 1] * f;
      dst[i + 2] = srcData[i + 2] * f;
      dst[i + 3] = 255;
    }
    ctx.putImageData(out, 0, 0);

    // Small areas (a single block) get a ring so the eye finds them at once.
    const region = plan.regions[k];
    if (region.share < RING_BELOW_SHARE) {
      const { x0, x1, y0, y1 } = region.box;
      ctx.lineWidth = Math.max(3, plan.w * 0.004);
      ctx.strokeStyle = normColor(active!);
      ctx.beginPath();
      ctx.arc((x0 + x1) / 2, (y0 + y1) / 2, Math.max(x1 - x0, y1 - y0) / 2 + plan.w * 0.02, 0, Math.PI * 2);
      ctx.stroke();
    }
  }, [active, ready]);

  /** Category colours whose area is under the pointer. */
  const colorsAt = (e: React.MouseEvent<HTMLCanvasElement>): string[] => {
    const a = analysis.current;
    const canvas = canvasRef.current;
    if (!a || !canvas) return [];
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * a.plan.w);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * a.plan.h);
    if (x < 0 || y < 0 || x >= a.plan.w || y >= a.plan.h) return [];
    const k = a.plan.index[y * a.plan.w + x];
    if (k < 0) return [];
    return [...a.plan.regionOf.entries()].filter(([, r]) => r === k).map(([c]) => c);
  };

  if (failed) return null;

  return (
    // Width follows the height cap (36vh on phones, 44vh on desktop) so the
    // canvas keeps its proportions and mouse positions map 1:1 to pixels.
    <div
      className="relative mx-auto w-full max-w-[var(--plan-max-sm)] lg:max-w-[var(--plan-max-lg)]"
      style={{
        ["--plan-max-sm" as string]: `calc(36vh * ${aspect})`,
        ["--plan-max-lg" as string]: `calc(44vh * ${aspect})`,
      }}
    >
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={alt}
        className={`block w-full h-auto ${ready ? "" : "opacity-0"} ${analysis.current ? "cursor-crosshair" : ""}`}
        onMouseMove={(e) => {
          const here = colorsAt(e);
          onHover?.(here[0] ?? null);
          const labels = areas.filter((a) => here.includes(normColor(a.color))).flatMap((a) => a.labels);
          const rect = e.currentTarget.getBoundingClientRect();
          setTip(labels.length ? { x: e.clientX - rect.left, y: e.clientY - rect.top, labels } : null);
        }}
        onMouseLeave={() => {
          onHover?.(null);
          setTip(null);
        }}
        onClick={(e) => {
          const here = colorsAt(e);
          if (here[0]) onPick?.(here[0]);
        }}
      />
      {!ready && <div className="absolute inset-0 animate-pulse rounded-lg bg-muted" />}
      {tip && (
        <div
          className="pointer-events-none absolute z-10 max-w-[16rem] -translate-x-1/2 -translate-y-full rounded-md bg-foreground px-2.5 py-1.5 text-xs text-background shadow-lg"
          style={{ left: tip.x, top: tip.y - 10 }}
        >
          {tip.labels.map((l, i) => (
            <p key={i}>{l}</p>
          ))}
        </div>
      )}
    </div>
  );
}
