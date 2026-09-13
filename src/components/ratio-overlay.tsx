import { regionBoxFor } from "@/lib/faceiq/types";
import {
  angleDefFor,
  curveDefFor,
  estimatedKeys,
  lineDefFor,
  overlayKindFor,
  rulerDefFor,
} from "@/lib/faceiq/flaws";
import type { PillarName } from "@/lib/faceiq/types";

type Pt = { x: number; y: number };

const STROKE = "#10b981";

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministic pseudo-random in [0,1) */
function rand(seed: number, i: number): number {
  let h = (seed ^ Math.imul(i + 1, 2654435761)) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 2246822519);
  h ^= h >>> 13;
  return ((h >>> 0) % 10000) / 10000;
}

function Pill({ x, y, text }: { x: number; y: number; text: string }) {
  const w = Math.max(10, text.length * 2.1 + 5);
  const cx = Math.min(94, Math.max(6, x));
  return (
    <g pointerEvents="none">
      <rect x={cx - w / 2} y={y - 3.4} width={w} height={5.4} rx={2.7} fill="#18181b" opacity={0.88} />
      <text x={cx} y={y + 0.6} fontSize={3.4} textAnchor="middle" fill="#fff" fontWeight="bold">
        {text}
      </text>
    </g>
  );
}

function Ticks({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  // cap marks perpendicular to the segment, length 3 units
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = (-dy / len) * 1.6;
  const ny = (dx / len) * 1.6;
  return (
    <g stroke={STROKE} strokeWidth={0.7}>
      <line x1={x1 - nx} y1={y1 - ny} x2={x1 + nx} y2={y1 + ny} />
      <line x1={x2 - nx} y1={y2 - ny} x2={x2 + nx} y2={y2 + ny} />
    </g>
  );
}

/**
 * Real-time overlay for the active ratio. Only the selected ratio renders.
 * Falls back to region boxes / nothing when landmark keys are unavailable.
 */
export function RatioOverlay({
  ratioName,
  pillar,
  view,
  raw,
  keys,
}: {
  ratioName: string;
  pillar: PillarName;
  view: "front" | "side";
  raw: string;
  keys: Record<string, Pt>;
}) {
  const kind = overlayKindFor(ratioName, pillar);
  // Real detected keys win; estimated anatomy fills gaps (esp. side profiles
  // where mesh detection often fails) so overlays always draw true-to-type.
  const merged: Record<string, Pt> = { ...estimatedKeys(view), ...keys };
  const K = (n: string): Pt | null => {
    const p = merged[n];
    return p ? { x: p.x * 100, y: p.y * 100 } : null;
  };

  if (kind === "line") {
    const def = lineDefFor(ratioName);
    const a = def ? K(def.a) : null;
    const b = def ? K(def.b) : null;
    if (!a || !b) return <BoxFallback name={ratioName} view={view} raw={raw} />;
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    return (
      <g pointerEvents="none">
        <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={STROKE} strokeWidth={0.8} />
        <Ticks x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
        <circle cx={a.x} cy={a.y} r={1.1} fill={STROKE} />
        <circle cx={b.x} cy={b.y} r={1.1} fill={STROKE} />
        <Pill x={mx} y={my} text={raw} />
      </g>
    );
  }

  if (kind === "curve") {
    const seq = curveDefFor(ratioName) ?? ["cheekR", "gonionR", "chin", "gonionL", "cheekL"];
    const pts = seq.map(K).filter((p): p is Pt => !!p);
    if (pts.length < 2) return <BoxFallback name={ratioName} view={view} raw={raw} />;
    const d = `M ${pts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" L ")}`;
    const mid = pts[Math.floor(pts.length / 2)]!;
    return (
      <g pointerEvents="none">
        <path d={d} fill="none" stroke={STROKE} strokeWidth={0.9} strokeLinejoin="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={1} fill="#fff" stroke={STROKE} strokeWidth={0.7} />
        ))}
        <Pill x={mid.x} y={mid.y - 4} text={raw} />
      </g>
    );
  }

  if (kind === "angle") {
    const def = angleDefFor(ratioName);
    const v = def ? K(def.vertex) : null;
    const r1 = def ? K(def.r1) : null;
    const r2 = def ? K(def.r2) : null;
    if (!v || !r1 || !r2) return <BoxFallback name={ratioName} view={view} raw={raw} />;
    const ray = (t: Pt) => {
      const dx = t.x - v.x;
      const dy = t.y - v.y;
      const len = Math.hypot(dx, dy) || 1;
      const L = 14;
      return { x: v.x + (dx / len) * L, y: v.y + (dy / len) * L };
    };
    const e1 = ray(r1);
    const e2 = ray(r2);
    return (
      <g pointerEvents="none">
        <line x1={v.x} y1={v.y} x2={e1.x} y2={e1.y} stroke={STROKE} strokeWidth={0.8} />
        <line x1={v.x} y1={v.y} x2={e2.x} y2={e2.y} stroke={STROKE} strokeWidth={0.8} />
        <circle cx={v.x} cy={v.y} r={1.4} fill={STROKE} stroke="#fff" strokeWidth={0.6} />
        <Pill x={v.x} y={v.y - 5} text={raw} />
      </g>
    );
  }

  if (kind === "ruler") {
    const seq = rulerDefFor(ratioName);
    const pts = seq.map(K).filter((p): p is Pt => !!p);
    if (pts.length < 2) return <BoxFallback name={ratioName} view={view} raw={raw} />;
    const xs = pts.map((p) => p.x);
    const x = xs.reduce((a, b) => a + b, 0) / xs.length;
    const top = pts[0]!;
    const bottom = pts[pts.length - 1]!;
    const total = Math.max(1e-6, bottom.y - top.y);
    return (
      <g pointerEvents="none">
        <line x1={x} y1={top.y} x2={x} y2={bottom.y} stroke={STROKE} strokeWidth={0.8} />
        {pts.map((p, i) => (
          <g key={i}>
            <line x1={x - 2.4} y1={p.y} x2={x + 2.4} y2={p.y} stroke={STROKE} strokeWidth={0.8} />
            <circle cx={x} cy={p.y} r={1} fill="#fff" stroke={STROKE} strokeWidth={0.6} />
          </g>
        ))}
        {pts.slice(0, -1).map((p, i) => {
          const ny = pts[i + 1]!.y;
          const pct = (((ny - p.y) / total) * 100).toFixed(1);
          return (
            <text key={i} x={x + 3.4} y={(p.y + ny) / 2 + 1} fontSize={2.8} fill={STROKE} fontWeight="bold">
              {pct}%
            </text>
          );
        })}
        <Pill x={x} y={(top.y + bottom.y) / 2} text={raw} />
      </g>
    );
  }

  // region
  const box = regionBoxFor(ratioName, view);
  if (!box) return null;
  const seed = hashStr(ratioName);
  const dots = Array.from({ length: 12 }, (_, i) => ({
    x: box.x + rand(seed, i * 2) * box.w,
    y: box.y + rand(seed, i * 2 + 1) * box.h,
  }));
  return (
    <g pointerEvents="none">
      <rect x={box.x} y={box.y} width={box.w} height={box.h} rx={2} fill={STROKE} opacity={0.16} />
      <rect x={box.x} y={box.y} width={box.w} height={box.h} rx={2} fill="none" stroke={STROKE} strokeWidth={0.7} strokeDasharray="2 1.4" />
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={0.7} fill={STROKE} opacity={0.8} />
      ))}
      <Pill x={box.x + box.w / 2} y={box.y + box.h / 2} text={raw} />
    </g>
  );
}

function BoxFallback({ name, view, raw }: { name: string; view: "front" | "side"; raw: string }) {
  const box = regionBoxFor(name, view);
  if (!box) return null;
  return (
    <g pointerEvents="none">
      <rect x={box.x} y={box.y} width={box.w} height={box.h} rx={2} fill={STROKE} opacity={0.12} />
      <rect x={box.x} y={box.y} width={box.w} height={box.h} rx={2} fill="none" stroke={STROKE} strokeWidth={0.7} strokeDasharray="2 1.4" />
      <Pill x={box.x + box.w / 2} y={box.y + box.h / 2} text={raw} />
    </g>
  );
}
