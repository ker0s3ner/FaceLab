import { useState } from "react";
import { severityColor } from "@/lib/faceiq/types";
import type { FlawState } from "@/lib/faceiq/flaws";

const EASE = "cubic-bezier(0.4, 0, 0.2, 1)";

function worstSeverity(items: FlawState["contributing"]): "IDEAL" | "GOOD" | "MODERATE" | "SEVERE" | "EXTREME" {
  const order = ["IDEAL", "GOOD", "MODERATE", "SEVERE", "EXTREME"] as const;
  let worst = 0;
  for (const r of items) {
    const i = order.indexOf(r.severity_tag);
    if (i > worst) worst = i;
  }
  return order[worst]!;
}

/**
 * Accordion list of flaws/strengths (ratio → flaw → pillar hierarchy).
 * Collapsed: chip + name + impact/value + chevron, colored left-edge accent.
 * Expanded: IMPACT/ROLLING, explanation, tinted why-paragraph, contributing sub-cards.
 */
export function FlawAccordion({
  items,
  onOpenRatio,
  emptyText,
  defaultOpenId,
}: {
  items: FlawState[];
  onOpenRatio: (ratioName: string) => void;
  emptyText: string;
  defaultOpenId?: string;
}) {
  const [openId, setOpenId] = useState<string | null>(defaultOpenId ?? null);

  if (!items.length) return <p className="text-sm text-zinc-400">{emptyText}</p>;

  return (
    <ul className="space-y-2">
      {items.map((f) => {
        const open = openId === f.def.id;
        const sev = f.kind === "flaw" ? worstSeverity(f.contributing) : "IDEAL";
        const accent = f.kind === "flaw" ? "border-l-red-500" : "border-l-emerald-500";
        return (
          <li
            key={f.def.id}
            className={`overflow-hidden rounded-lg border border-l-4 bg-white dark:bg-zinc-900 dark:border-zinc-800 ${accent}`}
          >
            <button
              onClick={() => setOpenId(open ? null : f.def.id)}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors duration-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
              style={{ transitionTimingFunction: EASE }}
            >
              <span className={`shrink-0 rounded border px-2 py-0.5 text-xs ${severityColor(sev)}`}>
                {f.kind === "flaw" ? sev : "IDEAL"}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{f.def.name}</span>
              <span className={`shrink-0 text-xs tabular-nums font-medium ${f.kind === "flaw" ? "text-red-600" : "text-emerald-600"}`}>
                {f.kind === "flaw" ? `${f.impact.toFixed(2)} pts` : `${f.contributing.length} ideal`}
              </span>
              <span
                className="shrink-0 text-xs text-zinc-400 transition-transform duration-300"
                style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transitionTimingFunction: EASE }}
              >
                ▼
              </span>
            </button>

            <div
              className={`grid transition-[grid-template-rows] duration-300 ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
              style={{ transitionTimingFunction: EASE }}
            >
              <div className="overflow-hidden">
              <div className="border-t px-3 py-3 dark:border-zinc-800">
                <h5 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{f.def.name}</h5>
                {f.kind === "flaw" && (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800/60">
                      <p className="text-[10px] tracking-widest uppercase text-zinc-400">Impact</p>
                      <p className="text-sm font-semibold tabular-nums text-red-600">{f.impact.toFixed(2)} pts</p>
                    </div>
                    <div className="rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800/60">
                      <p className="text-[10px] tracking-widest uppercase text-zinc-400">Rolling</p>
                      <p className="text-sm font-semibold tabular-nums text-zinc-700 dark:text-zinc-300">
                        {f.rolling > 0 ? `+${f.rolling.toFixed(2)}` : f.rolling.toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}
                <p className="mt-3 text-sm font-medium leading-relaxed text-zinc-800 dark:text-zinc-200">{f.def.what}</p>
                <p
                  className={`mt-2 rounded-lg px-3 py-2 text-xs leading-relaxed ${
                    f.kind === "flaw"
                      ? "bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-200"
                      : "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200"
                  }`}
                >
                  {f.def.why}
                </p>
                <div className="mt-3">
                  <p className="flex items-center gap-2 text-[11px] tracking-widest uppercase text-zinc-400">
                    {f.kind === "flaw" ? "Affected ratios" : "Contributing ratios"}
                    <span className="rounded-full bg-zinc-900 px-1.5 py-0.5 text-[10px] text-white dark:bg-white dark:text-zinc-900">
                      {f.contributing.length}
                    </span>
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {f.contributing.map((r) => (
                      <li key={r.name}>
                        <button
                          onClick={() => onOpenRatio(r.name)}
                          className="flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors duration-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/60"
                          style={{ transitionTimingFunction: EASE }}
                        >
                          <span className="min-w-0 flex-1 truncate">{r.name}</span>
                          <span className="shrink-0 text-xs tabular-nums text-zinc-500">{r.value.toFixed(1)}</span>
                          <span className="shrink-0 text-xs text-zinc-400">›</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
