// Find where each ticket category is on a supplier seating plan.
//
// Travel Connection paints its plans in roughly — not exactly — the colours
// of the categories sold there. Measured on real plans (2026-09-24):
//   Emirates  Block 66 is hue 120°, the category says #B5D6A5 (hue 100°)
//   Emirates  Cannon Club is (216,184,104), the category says #FFD663
//   Anfield   all four listed categories within a hair of their colours
// So a fixed tolerance around the category colour is fragile. Instead:
//
//   1. Find the plan's own solid colours: saturated pixels whose 3×3
//      neighbourhood is uniform. Line edges and anti-aliasing are gradients
//      and drop out — which matters, because the soft edge of a white pitch
//      line on dark grass is exactly the pale green of Block 66.
//   2. Pair each category with the nearest of those plan colours, weighing
//      hue, saturation and brightness; too far means "not on this plan"
//      (Anfield's pink Premier Club has no area and correctly gets none).
//   3. Take the pixels close to that plan colour, then drop anything thinner
//      than 3px (erode + dilate), leaving the stand areas themselves.

export interface PlanRegion {
  /** Share of the plan's pixels in this region. */
  share: number;
  /** Where most of it is (2nd–98th percentile), in analysis pixels. */
  box: { x0: number; y0: number; x1: number; y1: number };
}

export interface PlanAnalysis {
  w: number;
  h: number;
  /** Region id per pixel, -1 = none. */
  index: Int16Array;
  regions: PlanRegion[];
  /** Category colour (normalised "#RRGGBB") -> region id, only if on the plan. */
  regionOf: Map<string, number>;
}

const MIN_SATURATION = 0.12; // below this a pixel is grey/white/black
const SOLID_SPREAD = 16; // max per-channel spread in a 3×3 block of "solid" fill
const MIN_BIN_SHARE = 0.0001; // a plan colour must cover at least this share
const MAX_PAIR_DISTANCE = 0.6; // hue/60 + Δsat + Δval; beyond = not on plan
const MATCH_HUE = 10;
const MATCH_SAT = 0.12;
const MATCH_VAL = 0.15;
const MIN_REGION_SHARE = 0.0002; // what survives cleanup must be at least this

function hsv(r: number, g: number, b: number): [number, number, number] {
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  let h = 0;
  if (d > 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return [h, max === 0 ? 0 : d / max, max / 255];
}

const hueDiff = (a: number, b: number) => {
  const d = Math.abs(a - b);
  return Math.min(d, 360 - d);
};

function hexToHsv(hex: string): [number, number, number] | null {
  const m = hex.trim().match(/^#?([0-9a-f]{6})$/i);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return hsv((n >> 16) & 255, (n >> 8) & 255, n & 255);
}

/** RGBA pixels (as from getImageData) + the category colours to look for. */
export function analysePlan(data: Uint8ClampedArray, w: number, h: number, colors: string[]): PlanAnalysis {
  const n = w * h;
  const H = new Float32Array(n);
  const S = new Float32Array(n);
  const V = new Float32Array(n);
  for (let p = 0, i = 0; p < n; p++, i += 4) {
    const [ph, ps, pv] = hsv(data[i], data[i + 1], data[i + 2]);
    H[p] = ph;
    S[p] = ps;
    V[p] = pv;
  }

  // 1. Histogram of solid, saturated colours: 5° hue × 0.05 sat × 0.05 val bins.
  const bins = new Uint32Array(72 * 20 * 20);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const p = y * w + x;
      if (S[p] < MIN_SATURATION) continue;
      let solid = true;
      for (let c = 0; c < 3 && solid; c++) {
        let lo = 255;
        let hi = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const v = data[((y + dy) * w + (x + dx)) * 4 + c];
            if (v < lo) lo = v;
            if (v > hi) hi = v;
          }
        }
        if (hi - lo > SOLID_SPREAD) solid = false;
      }
      if (!solid) continue;
      const hb = Math.min(71, Math.floor(H[p] / 5));
      const sb = Math.min(19, Math.floor(S[p] * 20));
      const vb = Math.min(19, Math.floor(V[p] * 20));
      bins[hb * 400 + sb * 20 + vb]++;
    }
  }
  const planColors: [number, number, number][] = [];
  for (let b = 0; b < bins.length; b++) {
    if (bins[b] >= n * MIN_BIN_SHARE) {
      planColors.push([Math.floor(b / 400) * 5 + 2.5, (Math.floor(b / 20) % 20) / 20 + 0.025, (b % 20) / 20 + 0.025]);
    }
  }

  // 2. Pair each category colour with the nearest plan colour.
  const centers: [number, number, number][] = [];
  const centerOf = new Map<string, number>();
  for (const color of colors) {
    const t = hexToHsv(color);
    if (!t) continue;
    let best = -1;
    let bestD = Infinity;
    planColors.forEach((c, i) => {
      const d = hueDiff(c[0], t[0]) / 60 + Math.abs(c[1] - t[1]) + Math.abs(c[2] - t[2]);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    if (best < 0 || bestD > MAX_PAIR_DISTANCE) continue;
    const c = planColors[best];
    let id = centers.findIndex((x) => x === c);
    if (id < 0) id = centers.push(c) - 1;
    centerOf.set(color, id);
  }

  // 3. Pixels near each paired plan colour…
  const raw = new Int16Array(n).fill(-1);
  for (let p = 0; p < n; p++) {
    if (S[p] < MIN_SATURATION) continue;
    for (let k = 0; k < centers.length; k++) {
      const [ch, cs, cv] = centers[k];
      if (hueDiff(H[p], ch) <= MATCH_HUE && Math.abs(S[p] - cs) <= MATCH_SAT && Math.abs(V[p] - cv) <= MATCH_VAL) {
        raw[p] = k;
        break;
      }
    }
  }
  // …minus anything thinner than 3px: erode (all 8 neighbours agree), then
  // grow back only into pixels that matched in the first place.
  const eroded = new Int16Array(n).fill(-1);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const p = y * w + x;
      const k = raw[p];
      if (k < 0) continue;
      let all = true;
      for (let dy = -1; dy <= 1 && all; dy++) for (let dx = -1; dx <= 1 && all; dx++) if (raw[p + dy * w + dx] !== k) all = false;
      if (all) eroded[p] = k;
    }
  }
  const index = new Int16Array(n).fill(-1);
  const xs: number[][] = centers.map(() => []);
  const ys: number[][] = centers.map(() => []);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const p = y * w + x;
      const k = raw[p];
      if (k < 0) continue;
      let near = false;
      for (let dy = -1; dy <= 1 && !near; dy++) for (let dx = -1; dx <= 1 && !near; dx++) if (eroded[p + dy * w + dx] === k) near = true;
      if (near) {
        index[p] = k;
        xs[k].push(x);
        ys[k].push(y);
      }
    }
  }

  const pick = (v: number[], q: number) => v[Math.min(v.length - 1, Math.floor(v.length * q))];
  const regions: PlanRegion[] = centers.map((_, k) => {
    xs[k].sort((a, b) => a - b);
    ys[k].sort((a, b) => a - b);
    return {
      share: xs[k].length / n,
      box: xs[k].length
        ? { x0: pick(xs[k], 0.02), x1: pick(xs[k], 0.98), y0: pick(ys[k], 0.02), y1: pick(ys[k], 0.98) }
        : { x0: 0, x1: 0, y0: 0, y1: 0 },
    };
  });

  const regionOf = new Map<string, number>();
  for (const [color, k] of centerOf) {
    if (regions[k].share >= MIN_REGION_SHARE) regionOf.set(color, k);
  }
  // Regions nobody can use (too small after cleanup) are cleared from the index.
  const used = new Set(regionOf.values());
  for (let p = 0; p < n; p++) if (index[p] >= 0 && !used.has(index[p])) index[p] = -1;

  return { w, h, index, regions, regionOf };
}
