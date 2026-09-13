import { useEffect, useMemo, useState } from "react";
import { RatioOverlay } from "./ratio-overlay";
import { severityColor, type PillarName, type Ratio } from "@/lib/faceiq/types";
import {
  contributorsFor,
  parseIdeal,
  parseNumbers,
  scoreCurveFn,
} from "@/lib/faceiq/flaws";

export interface RatioModalContext {
  ratios: Ratio[];
  index: number;
  pillar: string;
  photoSrc: string;
  keys: Record<string, { x: number; y: number }>;
  history: { label: string; value: number }[];
}

/**
 * Full-screen ratio detail modal: pagination, photo with overlay,
 * gradient range slider, Overview|Simulate|Celebrities|Edit tabs,
 * about, contributes-to, interactive scoring curve.
 */
export function RatioModal({
  ctx,
  onNavigate,
  onClose,
  onOverride,
}: {
  ctx: RatioModalContext;
  onNavigate: (index: number) => void;
  onClose: () => void;
  onOverride?: (ratioName: string, value: number) => void;
}) {
  const ratio = ctx.ratios[ctx.index]!;
  const [tab, setTab] = useState<"Overview" | "Simulate" | "Celebrities" | "Edit">("Overview");
  const [overlayOn, setOverlayOn] = useState(true);
  const [simRaw, setSimRaw] = useState<number | null>(null);
  const [editVal, setEditVal] = useState(ratio.value);

  useEffect(() => {
    setTab("Overview");
    setSimRaw(null);
    setEditVal(ratio.value);
  }, [ctx.index, ratio.value]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const rawNum = parseNumbers(ratio.raw_measurement)[0] ?? ratio.value;
  const ideal = parseIdeal(ratio.ideal_label, ratio.raw_measurement);
  const lo = Math.min(rawNum, ideal.min);
  const hi = Math.max(rawNum, ideal.max);
  const pad = Math.max((hi - lo) * 0.6, hi === lo ? Math.abs(hi) * 0.1 + 0.5 : 0.5);
  const min = lo - pad;
  const max = hi + pad;
  const pos = (v: number) => ((Math.max(min, Math.min(max, v)) - min) / (max - min)) * 100;
  const curve = useMemo(() => scoreCurveFn(ideal.min, ideal.max), [ideal.min, ideal.max]);
  const simScore = simRaw !== null ? curve(simRaw) : null;

  const contributors = contributorsFor(ratio.name);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-6" onClick={onClose}>
      <div
        className="max-h-[92vh] w-full max-w-5xl overflow-auto rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="sticky top-0 z-10 flex items-center gap-3 border-b bg-white/95 px-4 py-3 dark:bg-zinc-900/95 dark:border-zinc-800 backdrop-blur">
          <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs tabular-nums dark:bg-zinc-800">
            {ctx.index + 1}/{ctx.ratios.length}
          </span>
          <h3 className="min-w-0 flex-1 truncate text-base font-semibold">{ratio.name}</h3>
          <button
            onClick={() => onNavigate((ctx.index - 1 + ctx.ratios.length) % ctx.ratios.length)}
            className="rounded-full border px-3 py-1 text-sm dark:border-zinc-700"
          >
            ‹
          </button>
          <button
            onClick={() => onNavigate((ctx.index + 1) % ctx.ratios.length)}
            className="rounded-full border px-3 py-1 text-sm dark:border-zinc-700"
          >
            ›
          </button>
          <button onClick={onClose} className="rounded-full border px-3 py-1 text-sm dark:border-zinc-700">
            ✕
          </button>
        </div>

        <div className="grid gap-0 lg:grid-cols-2">
          {/* left: photo with overlay */}
          <div className="relative bg-zinc-100 dark:bg-zinc-950">
            <img src={ctx.photoSrc} alt={ratio.name} className="aspect-[3/4] w-full object-cover" />
            {overlayOn && (
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full pointer-events-none">
                <RatioOverlay
                  ratioName={ratio.name}
                  pillar={ratio.pillar as PillarName}
                  view={ratio.view}
                  raw={ratio.raw_measurement}
                  keys={ctx.keys}
                />
              </svg>
            )}
            <button
              onClick={() => setOverlayOn((v) => !v)}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-sm shadow dark:bg-zinc-800"
              title={overlayOn ? "Hide overlay" : "Show overlay"}
            >
              {overlayOn ? "👁" : "🚫"}
            </button>
            <span className="absolute bottom-3 left-3 rounded bg-black/60 px-2 py-0.5 text-[10px] uppercase tracking-widest text-white">
              {ratio.view} · {ratio.pillar}
            </span>
          </div>

          {/* right panel */}
          <div className="p-4 sm:p-6">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[11px] tracking-widest uppercase text-zinc-400">Score</p>
                <p className="brand-display text-4xl tabular-nums">
                  {ratio.value.toFixed(1)}
                  <span className="text-lg text-zinc-400">/10</span>
                </p>
              </div>
              <span className={`rounded border px-2.5 py-1 text-xs ${severityColor(ratio.severity_tag)}`}>
                {ratio.severity_tag}
              </span>
            </div>

            {/* gradient range slider */}
            <div className="mt-4">
              <div className="relative h-2.5 rounded-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-500">
                <div
                  className="absolute inset-y-[-3px] rounded border-2 border-emerald-600/70 bg-emerald-400/10"
                  style={{ left: `${pos(ideal.min)}%`, width: `${Math.max(2, pos(ideal.max) - pos(ideal.min))}%` }}
                  title={`Ideal ${ratio.ideal_label}`}
                />
                <div
                  className="absolute top-1/2 h-4 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-900 ring-2 ring-white dark:bg-white dark:ring-zinc-900"
                  style={{ left: `${pos(rawNum)}%` }}
                />
              </div>
              <div className="mt-1 flex justify-between text-[10px] tabular-nums text-zinc-400">
                <span>{fmtTick(min, ratio.raw_measurement)}</span>
                <span className="text-emerald-600 font-medium">ideal {ratio.ideal_label}</span>
                <span>{fmtTick(max, ratio.raw_measurement)}</span>
              </div>
            </div>

            {/* sub-tabs */}
            <div className="mt-4 flex gap-1.5 border-b pb-2 dark:border-zinc-800">
              {(["Overview", "Simulate", "Celebrities", "Edit"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${tab === t ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"}`}
                >
                  {t}
                </button>
              ))}
            </div>

            {tab === "Overview" && (
              <div className="mt-4 space-y-4">
                <div>
                  <h4 className="text-sm font-semibold">About this ratio</h4>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                    {ratio.description ?? "Anatomical measurement contributing to the pillar score."} Ideal sits at{" "}
                    {ratio.ideal_label}; your measured value is {ratio.raw_measurement}. Deviation lowers the score
                    non-linearly — small misses cost little, large misses cost a lot.
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold">Contributes to</h4>
                  {contributors.length ? (
                    <ul className="mt-2 space-y-1.5">
                      {contributors.map((c) => (
                        <li
                          key={c.name}
                          className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm dark:border-zinc-800"
                        >
                          <span className={`rounded px-2 py-0.5 text-[11px] ${c.kind === "flaw" ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"}`}>
                            {c.kind === "flaw" ? "Flaw" : "Strength"}
                          </span>
                          <span className="flex-1">{c.name}</span>
                          <span className="text-xs text-zinc-400">{c.pillar}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1 text-xs text-zinc-400">Standalone assessment within {ratio.pillar}.</p>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-semibold">Scoring curve</h4>
                  <ScoreCurveChart curve={curve} min={min} max={max} you={rawNum} idealMin={ideal.min} idealMax={ideal.max} />
                </div>
              </div>
            )}

            {tab === "Simulate" && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold">What-if simulator</h4>
                <p className="mt-1 text-xs text-zinc-500">Drag to preview how moving this measurement changes its score.</p>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={(max - min) / 100}
                  value={simRaw ?? rawNum}
                  onChange={(e) => setSimRaw(Number(e.target.value))}
                  className="mt-4 w-full accent-zinc-900"
                />
                <div className="mt-2 flex justify-between text-xs tabular-nums">
                  <span>Now: {ratio.value.toFixed(1)}/10 ({ratio.raw_measurement})</span>
                  <span className="font-medium text-emerald-600">
                    {simScore !== null ? `→ ${simScore.toFixed(1)}/10 (${(simScore - ratio.value) >= 0 ? "+" : ""}${(simScore - ratio.value).toFixed(2)})` : ""}
                  </span>
                </div>
              </div>
            )}

            {tab === "Celebrities" && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold">Reference comparison</h4>
                <p className="mt-1 text-xs text-zinc-500">
                  No celebrity reference dataset is connected yet — showing your population context and scan history for this ratio instead.
                </p>
                <ul className="mt-3 space-y-1.5">
                  {ctx.history.map((h, i) => (
                    <li key={i} className="flex justify-between rounded-lg border px-3 py-2 text-sm dark:border-zinc-800">
                      <span>{h.label}</span>
                      <span className="tabular-nums font-medium">{h.value.toFixed(1)}</span>
                    </li>
                  ))}
                  {ctx.history.length <= 1 && (
                    <li className="text-xs text-zinc-400">Scan again over time to compare this ratio across your history.</li>
                  )}
                </ul>
              </div>
            )}

            {tab === "Edit" && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold">Manual override</h4>
                <p className="mt-1 text-xs text-zinc-500">Correct the score if the AI misread your photo. Saved to this analysis.</p>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={0.1}
                  value={editVal}
                  onChange={(e) => setEditVal(Number(e.target.value))}
                  className="mt-4 w-full accent-zinc-900"
                />
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs tabular-nums">Override: {editVal.toFixed(1)}/10</span>
                  <button
                    onClick={() => {
                      onOverride?.(ratio.name, editVal);
                      onClose();
                    }}
                    className="rounded-full bg-zinc-900 px-4 py-2 text-xs font-medium text-white dark:bg-white dark:text-zinc-900"
                  >
                    Save override
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function fmtTick(v: number, raw: string): string {
  if (raw.includes("%")) return `${v.toFixed(1)}%`;
  if (raw.includes("°")) return `${v.toFixed(0)}°`;
  if (raw.includes("mm")) return `${v.toFixed(1)}mm`;
  if (raw.includes("x")) return `${v.toFixed(2)}x`;
  return v.toFixed(1);
}

function ScoreCurveChart({
  curve,
  min,
  max,
  you,
  idealMin,
  idealMax,
}: {
  curve: (x: number) => number;
  min: number;
  max: number;
  you: number;
  idealMin: number;
  idealMax: number;
}) {
  const W = 300;
  const H = 120;
  const PAD = 8;
  const X = (v: number) => PAD + ((Math.max(min, Math.min(max, v)) - min) / (max - min)) * (W - PAD * 2);
  const Y = (s: number) => H - PAD - (Math.max(0, Math.min(10, s)) / 10) * (H - PAD * 2 - 14);
  const N = 60;
  const d =
    `M ${X(min).toFixed(1)} ${Y(curve(min)).toFixed(1)} ` +
    Array.from({ length: N }, (_, i) => {
      const v = min + ((i + 1) / N) * (max - min);
      return `L ${X(v).toFixed(1)} ${Y(curve(v)).toFixed(1)}`;
    }).join(" ");
  const [hv, setHv] = useState<number | null>(null);
  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
    const fx = (e.clientX - rect.left) / rect.width;
    setHv(min + fx * (max - min));
  };
  return (
    <div className="mt-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-32 w-full cursor-crosshair" onMouseMove={onMove} onMouseLeave={() => setHv(null)}>
        <rect x={X(idealMin)} y={PAD} width={Math.max(2, X(idealMax) - X(idealMin))} height={H - PAD * 2 - 14} fill="#10b981" opacity={0.12} rx={2} />
        <path d={d} fill="none" stroke="#71717a" strokeWidth={1.5} />
        <line x1={X(you)} y1={Y(curve(you))} x2={X(you)} y2={H - PAD} stroke="#18181b" strokeWidth={1.5} strokeDasharray="3 2" />
        <circle cx={X(you)} cy={Y(curve(you))} r={4} fill="#18181b" stroke="#fff" strokeWidth={1.5} />
        {hv !== null && (
          <g>
            <line x1={X(hv)} y1={Y(curve(hv))} x2={X(hv)} y2={H - PAD} stroke="#10b981" strokeWidth={1} strokeDasharray="2 2" />
            <circle cx={X(hv)} cy={Y(curve(hv))} r={3} fill="#10b981" stroke="#fff" />
            <text x={Math.min(W - 40, Math.max(40, X(hv)))} y={12} fontSize={9} textAnchor="middle" fill="#18181b" fontWeight="bold">
              {hv.toFixed(2)} → {curve(hv).toFixed(1)}
            </text>
          </g>
        )}
      </svg>
      <div className="mt-1 flex items-center justify-between text-[10px] text-zinc-400">
        <span className="flex items-center gap-1"><span className="inline-block h-2 w-4 rounded bg-emerald-400/40" /> Ideal</span>
        <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-zinc-900 dark:bg-white" /> You ({you.toFixed(2)})</span>
        <span className="tabular-nums">score 0–10 vs raw value</span>
      </div>
    </div>
  );
}
