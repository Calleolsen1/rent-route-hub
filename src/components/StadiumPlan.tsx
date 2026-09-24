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
/**
 * Everything outside the highlighted area fades this far towards a light
 * grey, so the lit stand stays in colour and the plan still reads as a plan.
 */
const FADE = 0.72;
const FADE_TO = 236;
/** Only single-block areas get a ring (Block 66 ≈ 0.0007); stands don't. */
const RING_BELOW_SHARE = 0.0025;
/** Near-white margin around the stadium that is cropped away. */
const PAPER = 235;

/** Bounding box of the drawing (anything not near-white), plus a small margin. */
function contentBox(data: Uint8ClampedArray, w: number, h: number) {
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y += 2) {
    for (let x = 0; x < w; x += 2) {
      const i = (y * w + x) * 4;
      if (data[i] < PAPER || data[i + 1] < PAPER || data[i + 2] < PAPER) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) return { x: 0, y: 0, w, h };
  const m = Math.round(Math.max(w, h) * 0.015);
  const x = Math.max(0, x0 - m);
  const y = Math.max(0, y0 - m);
  return { x, y, w: Math.min(w, x1 + m) - x, h: Math.min(h, y1 + m) - y };
}

export default function StadiumPlan({
  src,
  areas,
  active,
  onHover,
  onPick,
  onAreasFound,
  alt,
  maxHeight = "44vh",
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
  /** Tallest the plan may be (any CSS length); its width follows. */
  maxHeight?: string;
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
      const fw = Math.round(img.naturalWidth * scale);
      const fh = Math.round(img.naturalHeight * scale);
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return setFailed(true);
      // Draw once at full size to find the stadium, then keep only that:
      // supplier plans carry wide white margins (Emirates: a third of the
      // width), which made the stadium itself small in its frame.
      canvas.width = fw;
      canvas.height = fh;
      ctx.drawImage(img, 0, 0, fw, fh);
      let crop = { x: 0, y: 0, w: fw, h: fh };
      try {
        crop = contentBox(ctx.getImageData(0, 0, fw, fh).data, fw, fh);
      } catch {
        /* no CORS: keep the whole image */
      }
      const w = crop.w;
      const h = crop.h;
      canvas.width = w;
      canvas.height = h;
      setAspect(w / h);
      ctx.drawImage(img, crop.x / scale, crop.y / scale, w / scale, h / scale, 0, 0, w, h);
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

  // Draw: the plain plan, or everything outside the active area faded.
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
    const keep = 1 - FADE;
    const toward = FADE_TO * FADE;
    for (let i = 0, p = 0; p < plan.index.length; i += 4, p++) {
      if (plan.index[p] === k) {
        dst[i] = srcData[i];
        dst[i + 1] = srcData[i + 1];
        dst[i + 2] = srcData[i + 2];
      } else {
        dst[i] = srcData[i] * keep + toward;
        dst[i + 1] = srcData[i + 1] * keep + toward;
        dst[i + 2] = srcData[i + 2] * keep + toward;
      }
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
    // Width follows the height cap so the canvas keeps its proportions and
    // mouse positions map 1:1 to pixels.
    <div className="relative mx-auto w-full" style={{ maxWidth: `calc(${maxHeight} * ${aspect})` }}>
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
