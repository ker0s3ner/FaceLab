// Approximate treatment preview: region-based 2D warp on a canvas.
// Honest preview only — NOT a surgical prediction. Displacement uses smooth
// falloff so edits blend instead of tearing.

export interface WarpSpec {
  /** vertical band (fractions of image height) the warp applies to */
  y0: number;
  y1: number;
  /** horizontal push in px at band center (+ = outward from midline) */
  dx: number;
  /** vertical push in px at band center (+ = down) */
  dy: number;
  /** feather width as fraction of height */
  feather: number;
}

/** Map a treatment + mm sliders to a warp spec (image fractions + px @~320px wide). */
export function specForTreatment(treatment: string, advMM: number, vertMM: number, mix: number): WarpSpec {
  const k = mix / 100;
  const n = treatment.toLowerCase();
  const px = (mm: number) => mm * 1.6 * k;
  // defaults: lower-face outward
  let spec: WarpSpec = { y0: 0.6, y1: 0.88, dx: px(advMM) * 0.7, dy: px(vertMM), feather: 0.12 };
  if (/genioplasty|chin|jaw advancement|bsso|bimax|trimax|jaw implant/.test(n)) {
    spec = { y0: 0.6, y1: 0.88, dx: px(advMM) * 0.8, dy: px(vertMM), feather: 0.12 };
  } else if (/jawline filler|jaw reduction|masseter|kybella|submental|neck lift/.test(n)) {
    const inward = /reduction|masseter|kybella|submental/.test(n) ? -0.5 : 0.8;
    spec = { y0: 0.58, y1: 0.88, dx: px(advMM) * inward, dy: px(vertMM) * 0.4, feather: 0.14 };
  } else if (/rhinoplasty|nasal|nose|nostril/.test(n)) {
    spec = { y0: 0.36, y1: 0.56, dx: -px(advMM) * 0.35, dy: px(vertMM) * 0.3, feather: 0.08 };
  } else if (/cheek|midface|thread lift|lefort|sarpe/.test(n)) {
    spec = { y0: 0.42, y1: 0.62, dx: px(advMM) * 0.5, dy: 0, feather: 0.1 };
  } else if (/brow|forehead|cantho|eyelid|tear trough|eye/.test(n)) {
    spec = { y0: 0.26, y1: 0.4, dx: 0, dy: -px(vertMM || advMM * 0.4), feather: 0.07 };
  } else if (/lip|commissuro|mouth/.test(n)) {
    spec = { y0: 0.58, y1: 0.68, dx: px(advMM) * 0.3, dy: 0, feather: 0.05 };
  } else if (/temple|hair|ear|otoplasty/.test(n)) {
    spec = { y0: 0.05, y1: 0.3, dx: px(advMM) * 0.2, dy: 0, feather: 0.08 };
  }
  return spec;
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function gauss(x: number): number {
  return Math.exp(-x * x * 3);
}

/** Render warped preview into `canvas`. Returns false when nothing to draw. */
export async function renderWarp(
  canvas: HTMLCanvasElement,
  src: string,
  spec: WarpSpec,
): Promise<boolean> {
  try {
    const img = await loadImg(src);
    const W = 320;
    const H = Math.round((320 * img.naturalHeight) / Math.max(1, img.naturalWidth));
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return false;
    ctx.drawImage(img, 0, 0, W, H);
    if (Math.abs(spec.dx) < 0.2 && Math.abs(spec.dy) < 0.2) return true;

    const srcData = ctx.getImageData(0, 0, W, H);
    const out = ctx.createImageData(W, H);
    const yc = ((spec.y0 + spec.y1) / 2) * H;
    const half = Math.max(1, ((spec.y1 - spec.y0) / 2) * H);
    const feather = Math.max(1, spec.feather * H);

    const sample = (x: number, y: number, c: number): number => {
      const xi = Math.max(0, Math.min(W - 1, x));
      const yi = Math.max(0, Math.min(H - 1, y));
      const x0 = Math.floor(xi);
      const y0 = Math.floor(yi);
      const x1 = Math.min(W - 1, x0 + 1);
      const y1 = Math.min(H - 1, y0 + 1);
      const fx = xi - x0;
      const fy = yi - y0;
      const i00 = (y0 * W + x0) * 4 + c;
      const i10 = (y0 * W + x1) * 4 + c;
      const i01 = (y1 * W + x0) * 4 + c;
      const i11 = (y1 * W + x1) * 4 + c;
      const d = srcData.data;
      return (
        d[i00]! * (1 - fx) * (1 - fy) +
        d[i10]! * fx * (1 - fy) +
        d[i01]! * (1 - fx) * fy +
        d[i11]! * fx * fy
      );
    };

    const dst = out.data;
    for (let y = 0; y < H; y++) {
      const band = Math.min(1, Math.max(0, 1 - Math.max(0, Math.abs(y - yc) - half) / feather));
      const f = gauss((y - yc) / (half + feather)) * 0.4 + band * 0.6;
      if (f < 0.01) {
        for (let x = 0; x < W; x++) {
          const i = (y * W + x) * 4;
          dst[i] = srcData.data[i]!;
          dst[i + 1] = srcData.data[i + 1]!;
          dst[i + 2] = srcData.data[i + 2]!;
          dst[i + 3] = 255;
        }
        continue;
      }
      for (let x = 0; x < W; x++) {
        const side = x < W / 2 ? -1 : 1;
        const sx = x - side * spec.dx * f;
        const sy = y - spec.dy * f;
        const i = (y * W + x) * 4;
        dst[i] = sample(sx, sy, 0);
        dst[i + 1] = sample(sx, sy, 1);
        dst[i + 2] = sample(sx, sy, 2);
        dst[i + 3] = 255;
      }
    }
    ctx.putImageData(out, 0, 0);
    return true;
  } catch {
    return false;
  }
}
