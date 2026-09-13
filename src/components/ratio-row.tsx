import { parseIdeal, parseNumbers } from "@/lib/faceiq/flaws";
import type { Ratio } from "@/lib/faceiq/types";

const EASE = "cubic-bezier(0.4, 0, 0.2, 1)";

// Signature gradient: scoring curve bad→ideal→bad (dusty rose ends, sage middle).
// Static — only the handle moves.
const HEAT_GRADIENT =
  "linear-gradient(90deg, #e5a3a3 0%, #f0d3c2 28%, #b7d8bc 50%, #f0d3c2 72%, #e5a3a3 100%)";

function scoreColor(sev: Ratio["severity_tag"]): string {
  if (sev === "IDEAL" || sev === "GOOD") return "text-teal-700 dark:text-teal-300";
  if (sev === "SEVERE" || sev === "EXTREME") return "text-rose-600 dark:text-rose-400";
  return "text-zinc-600 dark:text-zinc-300";
}

/**
 * Signature ratio row: name + sage raw pill | static heat-gradient bar with
 * sliding handle | bold teal score + chevron. Generous padding, inset dividers
 * come from the parent list (divide-y + px).
 */
export function RatioRow({
  r,
  active,
  onToggle,
  onOpen,
}: {
  r: Ratio;
  active: boolean;
  onToggle: () => void;
  onOpen: () => void;
}) {
  const rawNum = parseNumbers(r.raw_measurement)[0] ?? r.value;
  const ideal = parseIdeal(r.ideal_label, r.raw_measurement);
  const lo = Math.min(rawNum, ideal.min);
  const hi = Math.max(rawNum, ideal.max);
  const pad = Math.max((hi - lo) * 0.5, hi === lo ? Math.abs(hi) * 0.1 + 0.5 : 0.5);
  const min = lo - pad;
  const max = hi + pad;
  const pct = ((Math.max(min, Math.min(max, rawNum)) - min) / (max - min)) * 100;

  return (
    <li>
      <div
        onClick={onToggle}
        className={`flex cursor-pointer items-center justify-between gap-3 py-5 transition-colors duration-200 sm:gap-4 ${
          active ? "bg-zinc-50/70 dark:bg-zinc-800/40" : "hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30"
        }`}
        style={{ transitionTimingFunction: EASE }}
        title="Click to highlight on photo · chevron opens full detail"
      >
        {/* left: name + raw pill */}
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="truncate text-[16px] font-medium text-zinc-800 dark:text-zinc-100">{r.name}</span>
          <span className="shrink-0 rounded-full bg-[#e4efe4] px-2 py-0.5 text-[12px] tabular-nums text-[#4d7c5f] dark:bg-emerald-950/60 dark:text-emerald-300">
            {r.raw_measurement}
          </span>
        </div>

        {/* center: static heat-gradient bar + sliding handle */}
        <div
          className="relative h-2 w-24 shrink-0 rounded-full sm:w-40"
          style={{ background: HEAT_GRADIENT, boxShadow: "0 0 8px rgba(181, 216, 189, 0.55)" }}
          title={`Ideal ${r.ideal_label}`}
        >
          <div
            className="absolute top-1/2 h-[18px] w-[10px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-md ring-1 ring-black/10 transition-[left] duration-300"
            style={{ left: `${pct}%`, transitionTimingFunction: EASE }}
          />
        </div>

        {/* right: score + chevron */}
        <div className="flex shrink-0 items-center gap-2">
          <span className={`text-[21px] font-bold tabular-nums ${scoreColor(r.severity_tag)}`}>
            {r.value.toFixed(1)}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
            className="text-lg leading-none text-zinc-300 transition-colors duration-200 hover:text-zinc-600 dark:text-zinc-600 dark:hover:text-zinc-300"
            style={{ transitionTimingFunction: EASE }}
            title="Open full detail"
          >
            ›
          </button>
        </div>
      </div>

      {/* expanded detail (animated, grid-rows trick — no height:auto snap) */}
      <div
        className={`grid transition-[grid-template-rows] duration-300 ${
          active ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
        style={{ transitionTimingFunction: EASE }}
      >
        <div className="overflow-hidden">
          <p className="px-1 pb-5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            {r.description ?? "AI measurement."} Ideal {r.ideal_label} · {r.view} view
            {r.measured ? " · ● measured from your photo" : ""}
          </p>
        </div>
      </div>
    </li>
  );
}
