// Approximate treatment preview: region-based 2D warp on a canvas.
// Honest preview only — NOT a surgical prediction. Displacement uses smooth
// falloff so edits blend instead of tearing.

export interface WarpSpec {
  /** Normalized anatomical anchor in the source image. */
  anchor: { x: number; y: number };
  /** Local influence radius as a fraction of detected face height. */
  radius: number;
  /** displacement in units of detected face height */
  dx: number;
  dy: number;
}

/** Map millimetre controls to a local, landmark-anchored image-space preview. */
export function specForTreatment(treatment: string, advMM: number, vertMM: number, mix: number, keys: Record<string, { x: number; y: number }>): WarpSpec | null {
  const k = mix / 100;
  const n = treatment.toLowerCase();
  const anchorName = /nose|rhino|nasal/.test(n) ? "noseTip" : /brow|eye|cantho|forehead/.test(n) ? "glabella" : /cheek|midface/.test(n) ? "cheekL" : "chin";
  const anchor = keys[anchorName];
  const top = keys.foreheadTop;
  const chin = keys.chin;
  if (!anchor || !top || !chin) return null;
  // A profile faces toward the nose. Advancing the chin follows that direction.
  const nose = keys.noseTip;
  const direction = nose && nose.x < chin.x ? -1 : 1;
  const displacement = (mm: number) => (mm / 170) * Math.abs(chin.y - top.y) * k;
  return {
    anchor,
    radius: /nose|rhino|nasal/.test(n) ? 0.13 : 0.24,
    dx: displacement(advMM) * direction * (/nose|rhino|nasal/.test(n) ? 0.35 : 1),
    dy: displacement(vertMM),
  };
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
  spec: WarpSpec | null,
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
    if (!spec || (Math.abs(spec.dx) < 0.0001 && Math.abs(spec.dy) < 0.0001)) return true;

    const srcData = ctx.getImageData(0, 0, W, H);
    const out = ctx.createImageData(W, H);
    const cx = spec.anchor.x * W;
    const cy = spec.anchor.y * H;
    const radius = Math.max(1, spec.radius * Math.abs((spec.anchor.y - 0.08) * H));

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
      for (let x = 0; x < W; x++) {
        const f = gauss(Math.hypot(x - cx, y - cy) / radius);
        const sx = x - spec.dx * W * f;
        const sy = y - spec.dy * H * f;
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
