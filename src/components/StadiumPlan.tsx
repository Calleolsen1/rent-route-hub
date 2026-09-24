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
 * The plan itself is never dimmed or faded — it must stay fully legible.
 * A highlighted area gets a bold outline drawn just outside its edge instead,
 * so block numbers inside it stay untouched too.
 */
const OUTLINE_RGB: [number, number, number] = [11, 37, 69]; // brand navy
/** Outline thickness as a share of the analysed width (~2px on screen). */
const OUTLINE_SHARE = 1 / 170;
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

/** Binary dilation with a (2r+1)² square, as two sliding-window passes. */
function dilate(mask: Uint8Array, w: number, h: number, r: number): Uint8Array {
  const tmp = new Uint8Array(mask.length);
  for (let y = 0; y < h; y++) {
    let count = 0;
    const row = y * w;
    for (let x = -r; x < w; x++) {
      const add = x + r;
      if (add < w && mask[row + add]) count++;
      const drop = x - r - 1;
      if (drop >= 0 && mask[row + drop]) count--;
      if (x >= 0) tmp[row + x] = count > 0 ? 1 : 0;
    }
  }
  const out = new Uint8Array(mask.length);
  for (let x = 0; x < w; x++) {
    let count = 0;
    for (let y = -r; y < h; y++) {
      const add = y + r;
      if (add < h && tmp[add * w + x]) count++;
      const drop = y - r - 1;
      if (drop >= 0 && tmp[drop * w + x]) count--;
      if (y >= 0) out[y * w + x] = count > 0 ? 1 : 0;
    }
  }
  return out;
}

function invert(mask: Uint8Array): Uint8Array {
  const out = new Uint8Array(mask.length);
  for (let i = 0; i < mask.length; i++) out[i] = mask[i] ? 0 : 1;
  return out;
}

/**
 * Pixels to paint as the outline of region k: a band just OUTSIDE the area.
 *
 * The area has holes (block numbers) and seams (the thin lines between
 * blocks B67, B68, …). Outlining those would scribble over the plan, so the
 * area is first closed (dilate then erode) to bridge seams, then only pixels
 * reachable from the image border count as outside.
 */
function outlineMask(index: Int16Array, k: number, w: number, h: number): Uint8Array {
  const region = new Uint8Array(index.length);
  for (let p = 0; p < index.length; p++) if (index[p] === k) region[p] = 1;
  const close = Math.max(2, Math.round(w / 280)); // ~5px at 1400: wider than a seam
  const closed = invert(dilate(invert(dilate(region, w, h, close)), w, h, close));

  // Flood-fill the outside from the border, through pixels not in the shape.
  const outside = new Uint8Array(index.length);
  const queue = new Int32Array(index.length);
  let head = 0;
  let tail = 0;
  const seed = (p: number) => {
    if (!closed[p] && !outside[p]) {
      outside[p] = 1;
      queue[tail++] = p;
    }
  };
  for (let x = 0; x < w; x++) {
    seed(x);
    seed((h - 1) * w + x);
  }
  for (let y = 0; y < h; y++) {
    seed(y * w);
    seed(y * w + w - 1);
  }
  while (head < tail) {
    const p = queue[head++];
    const x = p % w;
    if (x > 0) seed(p - 1);
    if (x < w - 1) seed(p + 1);
    if (p >= w) seed(p - w);
    if (p < index.length - w) seed(p + w);
  }

  const band = dilate(closed, w, h, Math.max(3, Math.round(w * OUTLINE_SHARE)));
  const ring = new Uint8Array(index.length);
  for (let p = 0; p < ring.length; p++) if (band[p] && outside[p]) ring[p] = 1;
  return ring;
}

/**
 * The dark info box over the plan. Centred on its anchor, but pulled inwards
 * near the edges so it never gets squeezed into a narrow column.
 */
function InfoBox({ fx, fy, labels, below }: { fx: number; fy: number; labels: string[]; below?: boolean }) {
  const shift = fx < 0.3 ? "-12%" : fx > 0.7 ? "-88%" : "-50%";
  return (
    <div
      className="pointer-events-none absolute z-10 w-max max-w-[min(18rem,90%)] rounded-md bg-foreground px-2.5 py-1.5 text-xs leading-snug text-background shadow-lg"
      style={{
        left: `${fx * 100}%`,
        top: `${fy * 100}%`,
        transform: `translate(${shift}, ${below ? "10px" : "calc(-100% - 10px)"})`,
      }}
    >
      {labels.map((l, i) => (
        <p key={i}>{l}</p>
      ))}
    </div>
  );
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
  activeLabels,
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
  /**
   * Text for the info box when the area is lit from outside the plan (a
   * ticket hovered in the list). Shown above the area; the pointer's own box
   * takes over while the mouse is on the plan.
   */
  activeLabels?: string[] | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  // Width / height, so the plan can be capped by height without distorting.
  const [aspect, setAspect] = useState(1.4);
  // Pointer info box, in fractions of the canvas (0–1).
  const [tip, setTip] = useState<{ fx: number; fy: number; labels: string[] } | null>(null);
  const analysis = useRef<{ plan: PlanAnalysis; pixels: ImageData } | null>(null);
  // Outline pixels per region, computed on first highlight.
  const outlines = useRef(new Map<number, Uint8Array>());

  const colors = useMemo(() => [...new Set(areas.map((a) => normColor(a.color)))], [areas]);
  const colorsKey = colors.join(",");

  // Load the plan and work out every category's area once.
  useEffect(() => {
    setReady(false);
    setFailed(false);
    analysis.current = null;
    outlines.current = new Map();
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

  // Draw: the plain plan, or the plan with the active area outlined.
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
    // Start from the untouched plan and paint the area's outline on top.
    let ring = outlines.current.get(k);
    if (!ring) {
      ring = outlineMask(plan.index, k, plan.w, plan.h);
      outlines.current.set(k, ring);
    }
    const out = new ImageData(new Uint8ClampedArray(pixels.data), plan.w, plan.h);
    const dst = out.data;
    for (let p = 0; p < ring.length; p++) {
      if (!ring[p]) continue;
      const i = p * 4;
      dst[i] = OUTLINE_RGB[0];
      dst[i + 1] = OUTLINE_RGB[1];
      dst[i + 2] = OUTLINE_RGB[2];
    }
    ctx.putImageData(out, 0, 0);

    // Small areas (a single block) get a ring so the eye finds them at once.
    const region = plan.regions[k];
    if (region.share < RING_BELOW_SHARE) {
      const { x0, x1, y0, y1 } = region.box;
      ctx.lineWidth = Math.max(3, Math.round(plan.w * OUTLINE_SHARE));
      ctx.strokeStyle = `rgb(${OUTLINE_RGB.join(",")})`;
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

  // Lit from the list: anchor the box at the top centre of the area (or
  // under it, when the area is at the very top of the plan).
  let listTip: { fx: number; fy: number; labels: string[]; below?: boolean } | null = null;
  const a = analysis.current;
  const litRegion = a && active ? a.plan.regionOf.get(normColor(active)) : undefined;
  if (!tip && activeLabels?.length && a && litRegion !== undefined) {
    const { x0, x1, y0, y1 } = a.plan.regions[litRegion].box;
    const top = y0 / a.plan.h;
    listTip = top < 0.18
      ? { fx: (x0 + x1) / 2 / a.plan.w, fy: y1 / a.plan.h, labels: activeLabels, below: true }
      : { fx: (x0 + x1) / 2 / a.plan.w, fy: top, labels: activeLabels };
  }
  const shownTip = tip ?? listTip;

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
          setTip(
            labels.length
              ? { fx: (e.clientX - rect.left) / rect.width, fy: (e.clientY - rect.top) / rect.height, labels }
              : null,
          );
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
      {shownTip && <InfoBox {...shownTip} />}
    </div>
  );
}
