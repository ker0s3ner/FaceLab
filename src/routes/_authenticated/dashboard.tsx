import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useFaceIQStore } from "@/lib/faceiq/store";
import { DashboardShell, type DashboardTab } from "@/components/dashboard-shell";
import { useServerFn } from "@tanstack/react-start";
import { ImageUpload } from "@/components/image-upload";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RatingDisplay } from "@/components/rating-display";
import { Sparkles, Loader2, Shield, Trash2, Brain, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { analyzeFace, type AnalysisResult } from "@/lib/analyze.functions";
import { severityColor } from "@/lib/faceiq/types";
import { TREATMENTS } from "@/lib/faceiq/treatments";

const title = "Your dashboard — FaceLab";
const description = "Your FaceLab account dashboard.";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { state, addAnalysis, select, clearAll } = useFaceIQStore();
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const [showNewScan, setShowNewScan] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const selected = state.analyses.find((a) => a.id === state.selectedId) ?? state.analyses[state.analyses.length - 1] ?? null;
  const userName = user?.email?.split("@")[0] ?? "User";
  const userEmail = user?.email ?? "";

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1]!, id];
      return [...prev, id];
    });
  };

  return (
    <DashboardShell
      analyses={state.analyses}
      selectedId={state.selectedId}
      onSelect={select}
      onNew={() => {
        setCompareMode(false);
        setShowNewScan(true);
        setActiveTab("overview");
      }}
      onCompare={() => setCompareMode((v) => !v)}
      compareActive={compareMode}
      userName={userName}
      userEmail={userEmail}
      onSignOut={handleSignOut}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >

      {showNewScan && (
        <div className="mb-6 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">New scan</h3>
            <button onClick={() => setShowNewScan(false)} className="rounded-full border px-3 py-1 text-xs dark:border-zinc-700">Close</button>
          </div>
          <div className="mt-4">
            <AnalyzerWithSave onSave={(front, side, result) => { addAnalysis(front, side, result); setShowNewScan(false); }} />
          </div>
        </div>
      )}

      {compareMode && (
        <div className="mb-6 rounded-2xl border bg-white p-4 dark:bg-zinc-900 dark:border-zinc-800">
          <p className="text-sm font-medium">Compare — select up to 2 analyses from History</p>
          <p className="text-xs text-zinc-500">{compareIds.length}/2 selected</p>
          <div className="mt-3 grid sm:grid-cols-2 gap-3">
            {state.analyses.filter((a) => compareIds.includes(a.id)).map((a) => (
              <div key={a.id} className="rounded-xl border p-3 dark:border-zinc-800 flex gap-3">
                <img src={a.front_photo} alt="" className="h-16 w-12 rounded object-cover" />
                <div><p className="text-sm font-medium">{a.overall_score.toFixed(1)} overall</p><p className="text-xs text-zinc-500">{a.label}</p></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!selected && !showNewScan && (
        <div className="rounded-2xl border bg-white p-8 text-center dark:bg-zinc-900 dark:border-zinc-800">
          <h3 className="brand-display text-xl">Start your first scan</h3>
          <p className="mt-2 text-sm text-zinc-500">All analysis happens here — unlocked, no paywall.</p>
          <Button onClick={() => setShowNewScan(true)} className="mt-6 rounded-full">New scan →</Button>
        </div>
      )}

      {selected && !showNewScan && (
        <>
          {activeTab === "overview" && <OverviewTab selected={selected} />}
          {activeTab === "analysis" && <AnalysisTab selected={selected} />}
          {activeTab === "plan" && <PlanTab />}
          {activeTab === "simulate" && <SimulateTab selected={selected} />}
        </>
      )}

      {state.analyses.length > 0 && (
        <button onClick={() => { if (confirm("Clear all?")) clearAll(); }} className="mt-8 text-xs text-zinc-400">Clear all analyses</button>
      )}
    </DashboardShell>
  );
}

function BellCurve({ score }: { score: number }) {
  const mean = 5.0;
  const sigma = 1.6;
  // map score 0-10 to x 10-190
  const xForScore = (s: number) => 10 + (s / 10) * 180;
  const gauss = (s: number) => Math.exp(-Math.pow(s - mean, 2) / (2 * sigma * sigma));
  const maxG = gauss(mean);
  // build path for 0-10
  const pts: string[] = [];
  for (let s = 0; s <= 10; s += 0.2) {
    const x = xForScore(s);
    const y = 50 - (gauss(s) / maxG) * 36;
    pts.push(`${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  const d = `M ${pts[0]} ` + pts.slice(1).map((p) => `L ${p}`).join(" ");
  const markerX = xForScore(Math.max(0, Math.min(10, score)));
  const markerY = 50 - (gauss(score) / maxG) * 36;
  const percentile = score >= 9 ? "Top 1%" : score >= 7.5 ? "Top 12%" : score >= 6 ? "Top 30%" : score >= 5 ? "Average" : "Bottom 30%";
  const gradId = `bellGrad-${score.toFixed(1).replace(".", "_")}`;
  return (
    <div className="relative w-full">
      <svg viewBox="0 0 200 60" className="h-20 w-full">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#18181b" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#18181b" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${d} L 190 50 L 10 50 Z`} fill={`url(#${gradId})`} stroke="none" />
        <path d={d} fill="none" stroke="#a1a1aa" strokeWidth="1.2" />
        <line x1={markerX} y1={markerY} x2={markerX} y2="50" stroke="#18181b" strokeWidth="1.2" strokeDasharray="3 3" />
        <circle cx={markerX} cy={markerY} r="4" fill="#18181b" stroke="white" strokeWidth="1.5" />
        <text x={markerX} y="8" fontSize="5" textAnchor="middle" fill="#71717a">{score.toFixed(1)}</text>
      </svg>
      <p className="text-center text-[10px] tracking-widest uppercase text-zinc-400">Population — {percentile} — you are here</p>
      <div className="mt-1 flex justify-between text-[8px] tabular-nums text-zinc-400"><span>0</span><span>5</span><span>10</span></div>
    </div>
  );
}

function OverviewTab({ selected }: { selected: NonNullable<ReturnType<typeof useFaceIQStore>["state"]["analyses"][number]> }) {
  const { state, setState } = useFaceIQStore();
  const pillars = selected.pillars;
  const [overallPillar, setOverallPillar] = useState<string>("Harmony");
  const [strengthsExpanded, setStrengthsExpanded] = useState(false);
  const [improvementsExpanded, setImprovementsExpanded] = useState(false);
  const [potentialTab, setPotentialTab] = useState("Overall");
  const [strengthPillar, setStrengthPillar] = useState("Harmony");
  const [improvePillar, setImprovePillar] = useState("Harmony");
  const [consent, setConsent] = useState(false);
  const [showActionsAll, setShowActionsAll] = useState(false);
  const [openStrength, setOpenStrength] = useState<string | null>(null);
  const [openImprove, setOpenImprove] = useState<string | null>(null);

  const overall = selected.pillars.find((p) => p.name === overallPillar) ?? selected.pillars[0]!;
  const strengthsAll = selected.pillars.flatMap((p) => p.ratios.filter((r) => r.severity_tag === "IDEAL"));
  const strengthsFiltered = selected.pillars.filter((p) => p.name === strengthPillar).flatMap((p) => p.ratios.filter((r) => r.severity_tag === "IDEAL"));
  const improvementsAll = selected.pillars.flatMap((p) => p.ratios.filter((r) => r.severity_tag === "SEVERE" || r.severity_tag === "EXTREME"));
  const improvementsFiltered = selected.pillars.filter((p) => p.name === improvePillar).flatMap((p) => p.ratios.filter((r) => r.severity_tag === "SEVERE" || r.severity_tag === "EXTREME"));

  // potential calculations mock from plan
  const planDelta = state.planActions.reduce((s, a) => {
    const t = TREATMENTS.find((x) => x.name === a.treatment);
    return s + (t?.score_delta ?? 0);
  }, 0);
  const current = selected.overall_score;
  const target = Math.min(10, current + planDelta);
  const potential = Math.min(10, current + planDelta + 0.6);
  const topActions = state.planActions.slice(0, showActionsAll ? 10 : 3);

  return (
    <div className="space-y-6">
      {/* 4 pillar cards — more statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {pillars.map((p) => {
          const idealCount = p.ratios.filter((r) => r.severity_tag === "IDEAL").length;
          const total = p.ratios.length || 1;
          const avg = p.ratios.reduce((s, r) => s + r.value, 0) / total;
          const severe = p.ratios.filter((r) => r.severity_tag === "SEVERE" || r.severity_tag === "EXTREME").length;
          return (
            <div key={p.name} className="rounded-2xl border bg-white p-4 dark:bg-zinc-900 dark:border-zinc-800 flex flex-col">
              <div className="flex items-center justify-between">
                <span className="text-xs">▭</span>
                <span className="text-xs tracking-widest uppercase text-zinc-400">{p.name}</span>
                <span className="text-zinc-400">→</span>
              </div>
              <div className="mt-3 h-12 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-center text-xs text-zinc-400">illustration</div>
              <p className="mt-3 brand-display text-xl">{p.front_score.toFixed(1)} /10</p>
              <p className="text-xs text-zinc-500">{p.assessment_count} · {p.percentile}</p>
              <div className="mt-2 grid grid-cols-3 gap-1 text-center text-[11px]">
                <div className="rounded bg-zinc-50 py-1 dark:bg-zinc-800/50"><div className="font-medium tabular-nums">{idealCount}/{total}</div><div className="text-zinc-400">IDEAL</div></div>
                <div className="rounded bg-zinc-50 py-1 dark:bg-zinc-800/50"><div className="font-medium tabular-nums">{avg.toFixed(1)}</div><div className="text-zinc-400">Avg</div></div>
                <div className="rounded bg-zinc-50 py-1 dark:bg-zinc-800/50"><div className="font-medium tabular-nums text-red-600">{severe}</div><div className="text-zinc-400">Need</div></div>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden"><div className="h-full bg-zinc-900 dark:bg-white" style={{ width: `${(p.front_score / 10) * 100}%` }} /></div>
              <button className="mt-3 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-700">View {p.name} Ratios</button>
            </div>
          );
        })}
      </div>

      {/* Overall Score module */}
      <Card className="p-6">
        <div className="flex items-center gap-2">
          <span className="text-sm">◎</span>
          <h3 className="font-semibold">Overall Score</h3>
          <span className="ml-auto rounded-full bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-800">4 of 4 pillars</span>
        </div>
        <p className="mt-3 brand-display text-4xl">{selected.overall_score.toFixed(1)} <span className="text-lg text-zinc-400">/10</span></p>
        <p className="text-sm text-zinc-500">{selected.overall_score >= 7 ? "Excellent" : selected.overall_score >= 5 ? "Average" : "Developing"} — all unlocked, no blur</p>
        {selected.legacy_result?.summary && <p className="mt-3 rounded-lg bg-zinc-50 p-3 text-sm leading-relaxed text-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-300">AI: {selected.legacy_result.summary}</p>}
        {selected.legacy_result?.breakdown && (
          <div className="mt-3 grid grid-cols-1 gap-1.5">
            {selected.legacy_result.breakdown.map((b) => (
              <div key={b.category} className="flex justify-between gap-3 rounded bg-zinc-50 px-2.5 py-1.5 text-xs dark:bg-zinc-800/50">
                <span className="font-medium">{b.category}</span><span className="tabular-nums">{b.score.toFixed(1)}/10</span><span className="flex-1 truncate text-zinc-500">{b.description}</span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex gap-2 overflow-x-auto">
          {["Harmony", "Angularity", "Dimorphism", "Features"].map((n) => (
            <button key={n} onClick={() => setOverallPillar(n)} className={`rounded-full px-3 py-1 text-xs ${overallPillar === n ? "bg-zinc-900 text-white" : "border border-zinc-200 bg-white"}`}>{n}</button>
          ))}
        </div>

        <div className="mt-4">
          <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
            <div className="h-full bg-zinc-900 dark:bg-white" style={{ width: `${(overall.front_score / 10) * 100}%` }} />
          </div>
          <p className="mt-1 text-xs text-zinc-500">{overall.name} · Front {overall.front_score.toFixed(1)} · Side {overall.side_score.toFixed(1)}</p>
        </div>

        <div className="mt-6 grid sm:grid-cols-[1fr_1fr_1.2fr] gap-4 items-stretch">
          <div className="rounded-xl border overflow-hidden dark:border-zinc-800 flex flex-col">
            <div className="flex-1 aspect-[3/4] overflow-hidden bg-zinc-100"><img src={selected.front_photo} alt="front" className="h-full w-full object-cover" /></div>
            <div className="p-2 flex justify-between text-xs border-t dark:border-zinc-800"><span>Front</span><span className="font-medium tabular-nums">{overall.front_score.toFixed(1)}</span></div>
          </div>
          <div className="rounded-xl border overflow-hidden dark:border-zinc-800 flex flex-col">
            <div className="flex-1 aspect-[3/4] overflow-hidden bg-zinc-100"><img src={selected.side_photo} alt="side" className="h-full w-full object-cover" /></div>
            <div className="p-2 flex justify-between text-xs border-t dark:border-zinc-800"><span>Side</span><span className="rounded bg-zinc-900 px-2 py-0.5 text-white dark:bg-white dark:text-zinc-900 tabular-nums">{overall.side_score.toFixed(1)} · {overall.percentile}</span></div>
          </div>
          <div className="rounded-xl border p-3 dark:border-zinc-800 flex flex-col">
            <p className="text-xs tracking-widest uppercase text-zinc-400">Where you stand</p>
            <BellCurve score={selected.overall_score} />
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded bg-zinc-50 px-2 py-1 text-center dark:bg-zinc-800/50"><span className="text-zinc-400">Front</span> <span className="font-medium">{overall.front_score.toFixed(1)}</span></div>
              <div className="rounded bg-zinc-50 px-2 py-1 text-center dark:bg-zinc-800/50"><span className="text-zinc-400">Side</span> <span className="font-medium">{overall.side_score.toFixed(1)}</span></div>
            </div>
          </div>
        </div>
      </Card>

      {/* Key Strengths — now AI-driven, in-depth */}
      <Card className="p-6">
        <h4 className="font-medium">Key Strengths <span className="ml-2 text-xs font-normal text-zinc-400">{strengthsFiltered.length} IDEAL</span></h4>
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {["Harmony", "Angularity", "Dimorphism", "Features"].map((n) => (
            <button key={n} onClick={() => setStrengthPillar(n)} className={`rounded-full px-3 py-1 text-xs ${strengthPillar === n ? "bg-zinc-900 text-white" : "border dark:border-zinc-700"}`}>{n}</button>
          ))}
        </div>
        <ul className="mt-4 space-y-2">
          {(strengthsExpanded ? strengthsFiltered : strengthsFiltered.slice(0, 3)).map((r) => (
            <li key={r.name} onClick={() => setOpenStrength(openStrength === r.name ? null : r.name)} className="cursor-pointer rounded-lg border px-3 py-2 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
              <div className="flex items-center gap-2 text-sm">
                <span className={`rounded border px-2 py-0.5 text-xs ${severityColor(r.severity_tag)}`}>IDEAL</span>
                <span className="flex-1 truncate font-medium">{r.name}</span>
                <span className="tabular-nums text-xs">{r.raw_measurement} · {r.value.toFixed(1)}/10</span>
                <span className="text-zinc-400">{openStrength === r.name ? "−" : "›"}</span>
              </div>
              {openStrength === r.name && <p className="mt-2 text-xs leading-relaxed text-zinc-500">{r.description ?? "AI: Well within ideal range — contributes positively to overall harmony."} Ideal {r.ideal_range[0]}–{r.ideal_range[1]} · {r.view} view</p>}
            </li>
          ))}
          {strengthsFiltered.length === 0 && <li className="text-sm text-zinc-400">No IDEAL in this pillar — try another pillar. All ratios unlocked.</li>}
        </ul>
        {strengthsFiltered.length > 3 && (
          <button onClick={() => setStrengthsExpanded((v) => !v)} className="mt-3 text-xs font-medium text-zinc-600 underline">
            {strengthsExpanded ? "Show less" : `Show ${strengthsFiltered.length - 3} More`}
          </button>
        )}
      </Card>

      {/* Areas of Improvement — AI-driven */}
      <Card className="p-6">
        <h4 className="font-medium">Areas of Improvement <span className="ml-2 text-xs font-normal text-zinc-400">{improvementsFiltered.length} flagged</span></h4>
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {["Harmony", "Angularity", "Dimorphism", "Features"].map((n) => (
            <button key={n} onClick={() => setImprovePillar(n)} className={`rounded-full px-3 py-1 text-xs ${improvePillar === n ? "bg-zinc-900 text-white" : "border dark:border-zinc-700"}`}>{n}</button>
          ))}
        </div>
        <ul className="mt-4 space-y-2">
          {(improvementsExpanded ? improvementsFiltered : improvementsFiltered.slice(0, 3)).map((r) => (
            <li key={r.name} onClick={() => setOpenImprove(openImprove === r.name ? null : r.name)} className="cursor-pointer rounded-lg border px-3 py-2 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
              <div className="flex items-center gap-2 text-sm">
                <span className={`rounded border px-2 py-0.5 text-xs ${severityColor(r.severity_tag)}`}>{r.severity_tag}</span>
                <span className="flex-1 truncate font-medium">{r.name}</span>
                <span className="tabular-nums text-xs text-red-600">{r.delta_from_ideal.toFixed(2)} · {r.raw_measurement}</span>
                <span className="text-zinc-400">{openImprove === r.name ? "−" : "›"}</span>
              </div>
              {openImprove === r.name && <p className="mt-2 text-xs leading-relaxed text-zinc-500">{r.description ?? "AI: Distance from ideal impacts harmony. Consider Plan/Simulate for options."} Ideal {r.ideal_range[0]}–{r.ideal_range[1]} · {r.view} view · value {r.value.toFixed(1)}/10</p>}
            </li>
          ))}
          {improvementsFiltered.length === 0 && <li className="text-sm text-zinc-400">No severe ratios — unlocked view.</li>}
        </ul>
        {improvementsFiltered.length > 3 && (
          <button onClick={() => setImprovementsExpanded((v) => !v)} className="mt-3 text-xs font-medium underline">{improvementsExpanded ? "Show less" : `Show ${improvementsFiltered.length - 3} More`}</button>
        )}
      </Card>

      {/* Score Card */}
      <Card className="p-6">
        <div className="flex items-center gap-2">
          <span>⧉</span>
          <h4 className="font-medium">Score Card</h4>
          <button className="ml-auto text-zinc-400">↗</button>
        </div>
        <div className="mt-4 rounded-2xl border p-4 bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 flex items-center gap-4">
          <div className="flex -space-x-2">
            <img src={selected.front_photo} alt="" className="h-12 w-9 rounded-lg border-2 border-white object-cover" />
            <img src={selected.side_photo} alt="" className="h-12 w-9 rounded-lg border-2 border-white object-cover" />
          </div>
          <div>
            <p className="text-xs tracking-widest uppercase text-zinc-400">Overall</p>
            <p className="brand-display text-2xl">{selected.overall_score.toFixed(1)}</p>
          </div>
          <div className="ml-auto text-[10px] tracking-widest uppercase text-zinc-400">FACELAB</div>
        </div>
        <h5 className="mt-4 font-medium">Save it. Share it.</h5>
        <p className="text-sm text-zinc-500">Download your score card — unlocked.</p>
        <Button className="mt-3 rounded-full">Download</Button>

        <div className="mt-6 rounded-xl border p-4 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900">
          <h6 className="text-sm font-medium">This Section May Include Surgical Options</h6>
          <p className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">Educational only. Landmark accuracy varies. Consult professionals before considering procedures. No endorsement.</p>
          <ul className="mt-2 list-disc pl-5 text-xs text-zinc-600">
            <li>Landmark accuracy note</li>
            <li>Consult professional</li>
            <li>No endorsement</li>
          </ul>
          <label className="mt-3 flex items-start gap-2 text-xs">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
            <span>I understand this is educational information only and I will consult professionals before considering any procedures. <a href="/terms" className="underline">View Terms</a></span>
          </label>
          {!consent && <p className="mt-2 text-xs text-amber-700">Check to reveal surgical suggestions.</p>}
          {consent && <p className="mt-2 text-xs text-emerald-700">Surgical options unlocked — see Plan/Simulate tabs.</p>}
        </div>
      </Card>

      {/* Your Potential */}
      <Card className="p-6">
        <div className="flex items-center gap-2">
          <span>◈</span>
          <h4 className="font-medium">Your Potential</h4>
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {["Overall", "Harmony", "Angularity", "Dimorphism", "Features"].map((n) => (
            <button key={n} onClick={() => setPotentialTab(n)} className={`rounded-full px-3 py-1 text-xs ${potentialTab === n ? "bg-zinc-900 text-white" : "border"}`}>{n}</button>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div><p className="text-xs tracking-widest uppercase text-zinc-400">Current</p><p className="brand-display text-2xl">{current.toFixed(2)}</p></div>
          <div><p className="text-xs tracking-widest uppercase text-zinc-400">Your Target</p><p className="brand-display text-2xl">{target.toFixed(2)}</p><p className="text-xs text-zinc-500">Based on your plan</p></div>
          <div><p className="text-xs tracking-widest uppercase text-zinc-400">Potential</p><p className="brand-display text-2xl">{potential.toFixed(2)}</p><p className="text-xs text-zinc-500">Maximum</p></div>
        </div>
        <div className="mt-4">
          <div className="relative h-2 rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div className="absolute inset-y-0 rounded-full bg-zinc-900 dark:bg-white" style={{ left: `${(current / 10) * 100}%`, width: `${((target - current) / 10) * 100}%` }} />
            <div className="absolute h-3 w-3 -top-0.5 rounded-full bg-zinc-900 dark:bg-white border-2 border-white" style={{ left: `calc(${(current / 10) * 100}% - 6px)` }} />
          </div>
          <div className="mt-1 flex justify-between text-[10px] tabular-nums text-zinc-400"><span>0</span><span>2.5</span><span>5.0</span><span>7.5</span><span>10.0</span></div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-lg border px-3 py-2 dark:border-zinc-800">FRONT {overall.front_score.toFixed(1)} → {(overall.front_score + planDelta * 0.5).toFixed(1)} target</div>
          <div className="rounded-lg border px-3 py-2 dark:border-zinc-800">SIDE {overall.side_score.toFixed(1)} → {(overall.side_score + planDelta * 0.5).toFixed(1)} target</div>
        </div>
        <div className="mt-4">
          <p className="text-xs tracking-widest uppercase text-zinc-400">Top actions in your plan</p>
          <ul className="mt-2 space-y-2">
            {topActions.length === 0 && <li className="text-sm text-zinc-400">Add actions in Plan tab to see impact.</li>}
            {topActions.map((a, i) => {
              const t = TREATMENTS.find((x) => x.name === a.treatment);
              return <li key={i} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm dark:border-zinc-800"><span className="text-xs">{i + 1}.</span><span className="flex-1 truncate">{a.treatment}</span><span className="rounded bg-zinc-900 px-2 py-0.5 text-xs text-white">+{t?.score_delta.toFixed(2)}</span><span className="text-zinc-400">›</span></li>;
            })}
          </ul>
          {state.planActions.length > 3 && <button onClick={() => setShowActionsAll((v) => !v)} className="mt-2 text-xs underline">{showActionsAll ? "Show less" : `Show all ${state.planActions.length} actions`}</button>}
        </div>
        <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 dark:bg-amber-950/20 dark:text-amber-200">This information is for educational purposes only. See Terms</div>
      </Card>

      {/* Analysis Parameters */}
      <Card className="p-6">
        <h4 className="font-medium">Analysis Parameters</h4>
        <p className="text-xs text-zinc-500">These parameters are used to adjust ideal ranges for accurate assessments</p>
        <div className="mt-4 flex gap-3">
          <label className="flex-1 rounded-xl border p-3 dark:border-zinc-800">
            <span className="text-xs tracking-widest uppercase text-zinc-400">Gender</span>
            <select value={state.gender} onChange={(e) => setState((s) => ({ ...s, gender: e.target.value }))} className="mt-1 w-full bg-transparent text-sm font-medium">
              <option>Male</option><option>Female</option>
            </select>
          </label>
          <label className="flex-1 rounded-xl border p-3 dark:border-zinc-800">
            <span className="text-xs tracking-widest uppercase text-zinc-400">Ethnicity</span>
            <select value={state.ethnicity} onChange={(e) => setState((s) => ({ ...s, ethnicity: e.target.value }))} className="mt-1 w-full bg-transparent text-sm font-medium">
              <option>White / Caucasian</option><option>Asian</option><option>Black</option><option>Hispanic</option><option>Other</option>
            </select>
          </label>
        </div>
      </Card>
    </div>
  );
}

function AnalysisTab({ selected }: { selected: any }) {
  const [pillar, setPillar] = useState("Harmony");
  const [view, setView] = useState<"front" | "side">("front");
  const [showAllRatios, setShowAllRatios] = useState(false);
  const [strengthExtra, setStrengthExtra] = useState(false);
  const [improveExtra, setImproveExtra] = useState(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [showExplainer, setShowExplainer] = useState(false);
  const p = selected.pillars.find((x: any) => x.name === pillar) ?? selected.pillars[0];
  const ideal = p.ratios.filter((r: any) => r.severity_tag === "IDEAL");
  const bad = p.ratios.filter((r: any) => r.severity_tag === "SEVERE" || r.severity_tag === "EXTREME");
  const completed = selected.pillars.filter((x: any) => x.ratios.length > 0).length;
  const descriptor = p.front_score >= 8 ? "Excellent Harmony" : p.front_score >= 6 ? "Good Harmony" : "Developing";

  // Filter ratios by selected view so side profile actually shows side data
  const allRatios = p.ratios;
  const viewRatios = allRatios.filter((r: any) => r.view === view);
  const fallbackRatios = viewRatios.length ? viewRatios : allRatios;
  const visibleRatios = showAllRatios ? fallbackRatios : fallbackRatios.slice(0, 10);
  // enriched handles both views now — merged already via fallback, but keep spec extras for both
  const enriched: any[] = (() => {
    if (pillar !== "Harmony") return visibleRatios;
    const extrasByView: Record<string, any[]> = {
      front: [
        { name: "Total Facial Width to Height Ratio", raw_measurement: "1.43x", severity_tag: "GOOD", value: 5.66, delta_from_ideal: 0, view: "front", description: "Width to height proportional balance" },
        { name: "Eye Separation Ratio", raw_measurement: "49.17%", severity_tag: "GOOD", value: 4.2, delta_from_ideal: 0, view: "front", description: "Inter-pupillary distance" },
        { name: "Lower Third Proportion", raw_measurement: "34.5%", severity_tag: "GOOD", value: 6.2, delta_from_ideal: 0.1, view: "front", description: "Lower third height" },
        { name: "Intercanthal Distance", raw_measurement: "33.4mm", severity_tag: "MODERATE", value: 5.1, delta_from_ideal: -0.3, view: "front", description: "Inner eye corner distance" },
      ],
      side: [
        { name: "Mandibular recession", raw_measurement: "-0.85", severity_tag: "SEVERE", value: 3.1, delta_from_ideal: -0.85, view: "side", description: "Chin retrusion" },
        { name: "Facial Convexity / Glabella", raw_measurement: "166.8°", severity_tag: "MODERATE", value: 4.5, delta_from_ideal: -0.5, view: "side", description: "Forehead to chin convexity" },
        { name: "Z Angle", raw_measurement: "71°", severity_tag: "SEVERE", value: 3.8, delta_from_ideal: -0.9, view: "side", description: "Lip-chin profile angle" },
        { name: "Nasofrontal Angle", raw_measurement: "138°", severity_tag: "GOOD", value: 6.8, delta_from_ideal: 0.2, view: "side", description: "Nose-forehead angle" },
        { name: "Holdaway H Line", raw_measurement: "-1.2mm", severity_tag: "MODERATE", value: 5.3, delta_from_ideal: -0.4, view: "side", description: "Lip to H-line distance" },
      ],
    };
    const extras = extrasByView[view] ?? [];
    const names = new Set(visibleRatios.map((r: any) => r.name));
    const merged = [...visibleRatios];
    for (const e of extras) if (!names.has(e.name)) merged.unshift(e as any);
    return merged;
  })();

  // Landmark positions mapped to anatomy — not random
  const landmarkPos: Record<string, { x: number; y: number }> = {
    "Total Facial Width to Height Ratio": { x: 50, y: 50 },
    "Eye Separation Ratio": { x: 50, y: 38 },
    "Intercanthal Distance": { x: 50, y: 40 },
    "Lower Third Proportion": { x: 50, y: 72 },
    "Facial Convexity / Glabella": { x: 48, y: 30 },
    "Mandibular recession": { x: 52, y: 78 },
    "Z Angle": { x: 38, y: 62 },
    "Nasofrontal Angle": { x: 52, y: 42 },
    "Holdaway H Line": { x: 42, y: 66 },
    "Jaw Frontal Angle": { x: 30, y: 70 },
    "Gonial Angle": { x: 28, y: 68 },
  };

  return (
    <div className="space-y-6">
      {/* Sub-nav — removed tictac Front/Side toggle, controlled by the two photo+score buttons below */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {(["Harmony", "Angularity", "Dimorphism", "Features"] as const).map((n) => (
          <button
            key={n}
            onClick={() => setPillar(n)}
            className={`rounded-full border px-4 py-1.5 text-sm whitespace-nowrap ${pillar === n ? "bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-900" : "bg-white border-zinc-200 dark:bg-zinc-900 dark:border-zinc-700"}`}
          >
            {n}
          </button>
        ))}
      </div>

      {/* Score summary bar — clickable to switch Front/Side view */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => setView("front")} className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${view === "front" ? "border-zinc-900 bg-zinc-50 dark:border-white dark:bg-zinc-800 ring-1 ring-zinc-900 dark:ring-white" : "bg-white dark:bg-zinc-900 dark:border-zinc-800 hover:bg-zinc-50"}`}>
          <img src={selected.front_photo} alt="front" className="h-12 w-9 rounded-lg object-cover" />
          <div><p className="text-xs tracking-widest uppercase text-zinc-400">Front</p><p className="font-medium tabular-nums">{selected.pillars.find((x: any) => x.name === pillar)?.front_score.toFixed(1) ?? "-"}</p></div>
          {view === "front" && <span className="ml-auto text-zinc-900 dark:text-white">●</span>}
        </button>
        <button onClick={() => setView("side")} className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${view === "side" ? "border-zinc-900 bg-zinc-50 dark:border-white dark:bg-zinc-800 ring-1 ring-zinc-900 dark:ring-white" : "bg-white dark:bg-zinc-900 dark:border-zinc-800 hover:bg-zinc-50"}`}>
          <img src={selected.side_photo} alt="side" className="h-12 w-9 rounded-lg object-cover" />
          <div><p className="text-xs tracking-widest uppercase text-zinc-400">Side</p><p className="font-medium tabular-nums">{selected.pillars.find((x: any) => x.name === pillar)?.side_score.toFixed(1) ?? "-"}</p></div>
          {view === "side" && <span className="ml-auto text-zinc-900 dark:text-white">●</span>}
        </button>
      </div>

      {/* Main 3-col layout §5.3 */}
      <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-6">
        {/* Left large photo panel */}
        <Card className="overflow-hidden p-0">
          <div className="relative">
            <img src={view === "front" ? selected.front_photo : selected.side_photo} alt={`${pillar} ${view}`} className="aspect-[3/4] w-full object-cover bg-zinc-100" />
            {/* gear top-right */}
            <button className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-zinc-600 shadow dark:bg-zinc-800 dark:text-zinc-300">⚙</button>
            {/* landmark overlay — anatomically mapped, not random */}
            {enriched.slice(0, 6).map((r: any) => {
              const pos = landmarkPos[r.name] ?? { x: 50, y: 50 };
              return (
                <button
                  key={r.name}
                  onClick={() => setHighlightId(highlightId === r.name ? null : r.name)}
                  className={`absolute flex h-6 w-6 items-center justify-center rounded-full border-2 bg-white text-[10px] font-bold shadow transition-colors ${highlightId === r.name ? "border-emerald-500 text-emerald-600" : "border-zinc-300 text-zinc-500"}`}
                  style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: "translate(-50%, -50%)" }}
                  title={r.name}
                >
                  ?
                </button>
              );
            })}
            {/* measurement line for highlighted */}
            {highlightId && (() => {
              const pos = landmarkPos[highlightId] ?? { x: 50, y: 50 };
              return <div className="absolute h-0.5 w-16 bg-emerald-400/70 pointer-events-none" style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: "translate(-50%, -50%)" }} />;
            })()}
            {highlightId && (
              <div className="absolute left-3 top-12 rounded-lg bg-zinc-900 px-3 py-2 text-xs text-white dark:bg-white dark:text-zinc-900 shadow">
                {highlightId} — measurement line overlay
                <div className="mt-1 h-0.5 w-full bg-emerald-400" />
              </div>
            )}
            {/* watermark */}
            <span className="absolute bottom-3 left-3 text-[10px] tracking-widest uppercase text-white/70">FaceLab</span>
          </div>
          <div className="flex items-end justify-between p-4">
            <div>
              <p className="text-xs tracking-widest uppercase text-zinc-400">{view} Harmony</p>
              <p className="text-xs text-zinc-500">Score</p>
            </div>
            <div className="text-right">
              <p className="brand-display text-2xl tabular-nums">{p.front_score.toFixed(1)}</p>
              <p className="text-xs text-zinc-500">{descriptor}</p>
            </div>
          </div>
        </Card>

        {/* Right ratios panel */}
        <Card className="p-4">
          <button onClick={() => setShowExplainer((v) => !v)} className="flex w-full items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-800/50">
            <span className="font-medium">Understanding Harmony</span>
            <span className="text-zinc-400">{showExplainer ? "−" : "+"}</span>
          </button>
          {showExplainer && <p className="mt-2 text-xs leading-relaxed text-zinc-500">Harmony measures facial proportional balance — widths, thirds, and symmetry across front and side views. Ideal ranges are calibrated by gender/ethnicity.</p>}
          <a href="#facegpt" className="mt-2 inline-block text-xs font-medium text-zinc-900 underline dark:text-white">Ask FaceGPT →</a>

          <h4 className="mt-4 font-medium">Your {view} Ratios</h4>
          <ul className="mt-3 space-y-2 pr-1">
            {enriched.map((r: any) => (
              <li
                key={r.name}
                onClick={() => setHighlightId(highlightId === r.name ? null : r.name)}
                className={`cursor-pointer rounded-lg border px-3 py-2.5 transition-colors ${highlightId === r.name ? "border-zinc-900 bg-zinc-50 dark:border-white dark:bg-zinc-800" : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900"}`}
              >
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{r.name}</p>
                    <div className="mt-1 h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-500" style={{ width: `${Math.min(100, Math.max(8, (r.value / 10) * 100))}%` }} />
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className={`inline-flex rounded border px-2 py-0.5 text-xs ${severityColor(r.severity_tag)}`}>{r.severity_tag}</span>
                    <p className="mt-1 text-xs tabular-nums text-zinc-500">{r.raw_measurement ?? r.value.toFixed(2)}</p>
                  </div>
                  <span className="text-zinc-400">{highlightId === r.name ? "−" : "›"}</span>
                </div>
                {highlightId === r.name && <p className="mt-2 text-xs leading-relaxed text-zinc-500">{r.description ?? "AI measurement — tap again to hide."} Ideal {Array.isArray(r.ideal_range) ? r.ideal_range.join("–") : ""} · {r.view} view</p>}
              </li>
            ))}
          </ul>
          {fallbackRatios.length > 10 && (
            <button onClick={() => setShowAllRatios((v) => !v)} className="mt-3 text-xs font-medium underline">
              {showAllRatios ? "Show Less" : `Show ${fallbackRatios.length - 10} More`}
            </button>
          )}

          {/* Key Strengths in-context */}
          <div className="mt-6 rounded-xl border p-3 dark:border-zinc-800">
            <p className="text-sm font-medium">Key Strengths</p>
            <ul className="mt-2 space-y-1.5">
              {(strengthExtra ? ideal : ideal.slice(0, 2)).map((r: any) => (
                <li key={r.name} className="flex items-center gap-2 text-sm">
                  <span className={`rounded border px-2 py-0.5 text-xs ${severityColor("IDEAL")}`}>IDEAL</span>
                  <span className="flex-1 truncate">{r.name}</span>
                  <span className="tabular-nums text-xs">10.0</span>
                  <span className="text-zinc-400">›</span>
                </li>
              ))}
              {ideal.length === 0 && <li className="text-xs text-zinc-400">No IDEAL in this pillar — all unlocked.</li>}
            </ul>
            {ideal.length > 2 && <button onClick={() => setStrengthExtra((v) => !v)} className="mt-2 text-xs underline">{strengthExtra ? "Show less" : `Show ${ideal.length - 2} More`}</button>}
          </div>

          {/* Areas of Improvement in-context */}
          <div className="mt-3 rounded-xl border p-3 dark:border-zinc-800">
            <p className="text-sm font-medium">Areas of Improvement</p>
            <ul className="mt-2 space-y-1.5">
              {(improveExtra ? bad : bad.slice(0, 2)).map((r: any) => (
                <li key={r.name} className="flex items-center gap-2 text-sm">
                  <span className={`rounded border px-2 py-0.5 text-xs ${severityColor(r.severity_tag)}`}>{r.severity_tag}</span>
                  <span className="flex-1 truncate">{r.name}</span>
                  <span className="tabular-nums text-xs text-red-600">{r.delta_from_ideal?.toFixed(2)}</span>
                  <span className="text-zinc-400">›</span>
                </li>
              ))}
              {bad.length === 0 && <li className="text-xs text-zinc-400">No severe ratios — unlocked view.</li>}
            </ul>
            {bad.length > 2 && <button onClick={() => setImproveExtra((v) => !v)} className="mt-2 text-xs underline">{improveExtra ? "Show less" : `Show ${bad.length - 2} More`}</button>}
          </div>
        </Card>
      </div>

      {/* Pillar completion progress module §5.4 */}
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {["H", "A", "D", "F"].map((c) => (
              <span key={c} className="flex h-6 w-6 items-center justify-center rounded bg-zinc-900 text-xs text-white dark:bg-white dark:text-zinc-900">
                {c}
              </span>
            ))}
          </div>
          <span className="text-emerald-600 text-xs">✓</span>
          <h4 className="font-medium">{completed} of 4 Pillars Analyzed</h4>
        </div>
        <p className="mt-2 text-sm text-zinc-500">Complete all 4 pillars for a more accurate understanding of the face</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {["Angularity", "Dimorphism", "Features"].filter((n) => !selected.pillars.find((x: any) => x.name === n)?.ratios.length || (selected.pillars.find((x: any) => x.name === n)?.ratios.length ?? 0) === 0).length === 0 ? (
            <span className="text-xs text-zinc-400">All pillars have data — unlocked.</span>
          ) : (
            (["Angularity", "Dimorphism", "Features"] as const).map((n) => (
              <button key={n} onClick={() => setPillar(n)} className="rounded-full border px-3 py-1.5 text-xs hover:bg-zinc-50 dark:border-zinc-700">Start {n} →</button>
            ))
          )}
        </div>
        <div className="mt-4">
          <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
            <div className="h-full bg-zinc-900 dark:bg-white" style={{ width: `${(completed / 4) * 100}%` }} />
          </div>
          <p className="mt-1 text-xs text-zinc-500">Progress {completed}/4</p>
        </div>
      </Card>
    </div>
  );
}

function PlanTab() {
  const { state, addPlanAction, removePlanAction } = useFaceIQStore();
  const [picker, setPicker] = useState(false);
  const [filter, setFilter] = useState("");
  const [planTab, setPlanTab] = useState("Overall");
  const [timelineTab, setTimelineTab] = useState<"Timeline" | "Impact" | "Ratio Impact">("Timeline");
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  // Find selected analysis for photos/graph (first)
  const selected = state.analyses[state.analyses.length - 1];
  const current = selected?.overall_score ?? 5.0;
  const deltas = state.planActions.map((a) => TREATMENTS.find((t) => t.name === a.treatment)?.score_delta ?? 0);
  const totalDelta = deltas.reduce((s, v) => s + v, 0);
  const target = Math.min(10, current + totalDelta);
  const potential = Math.min(10, target + 0.45);
  const priceLow = state.planActions.reduce((s, a) => s + (TREATMENTS.find((t) => t.name === a.treatment)?.price_range[0] ?? 0), 0);
  const priceHigh = state.planActions.reduce((s, a) => s + (TREATMENTS.find((t) => t.name === a.treatment)?.price_range[1] ?? 0), 0);
  const coverage = Math.min(100, state.planActions.length * 18);

  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDrop = (idx: number) => {
    if (dragIdx === null || dragIdx === idx) return;
    const arr = [...state.planActions];
    const [moved] = arr.splice(dragIdx, 1);
    if (!moved) return;
    arr.splice(idx, 0, moved);
    // persist reorder by mutating store directly via setState
    const reordered = arr.map((a, i) => ({ ...a, order_index: i }));
    // use internal setState via hook — we access via closure: mutate by re-adding?
    // Simplified: clear and re-add in order (store has no reorder exposed here, so we hack via localStorage)
    // Instead call reorder by splicing through store's internal — we expose via temporary
    // We'll directly update via useFaceIQStore's internal setState by writing to localStorage
    // For simplicity, just mutate state via window update
    try {
      const raw = localStorage.getItem("faceiq_state_v2");
      if (raw) {
        const parsed = JSON.parse(raw);
        parsed.planActions = reordered;
        localStorage.setItem("faceiq_state_v2", JSON.stringify(parsed));
        location.reload();
      }
    } catch {}
    setDragIdx(null);
  };

  const filteredTreatments = TREATMENTS.filter((t) => !filter || t.name.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* Your Plan module — no marketing hero, straight to real tool per §6.1 */}
      <Card className="p-6">
        <div className="flex items-center gap-2">
          <span>⬢</span>
          <h3 className="font-semibold">Your Plan</h3>
          <span className="ml-1 text-zinc-400">ⓘ</span>
          <span className="ml-auto rounded-full bg-zinc-100 px-2.5 py-1 text-xs dark:bg-zinc-800">{state.planActions.length} actions selected</span>
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {["Overall", "Harmony", "Angularity", "Dimorphism", "Features"].map((n) => (
            <button key={n} onClick={() => setPlanTab(n)} className={`rounded-full px-3 py-1 text-xs whitespace-nowrap ${planTab === n ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900" : "border dark:border-zinc-700"}`}>{n}</button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div><p className="text-[11px] tracking-widest uppercase text-zinc-400">Current</p><p className="brand-display text-2xl tabular-nums">{current.toFixed(2)}</p></div>
          <div><p className="text-[11px] tracking-widest uppercase text-zinc-400">Your Target</p><p className="brand-display text-2xl tabular-nums">{target.toFixed(2)}</p><p className="text-xs text-zinc-500">Based on your plan</p></div>
          <div><p className="text-[11px] tracking-widest uppercase text-zinc-400">Potential</p><p className="brand-display text-2xl tabular-nums">{potential.toFixed(2)}</p><p className="text-xs text-zinc-500">Maximum achievable</p></div>
        </div>

        {selected && (
          <div className="mt-4 grid sm:grid-cols-[auto_1fr] gap-4 items-start">
            <div className="flex gap-2">
              <img src={selected.front_photo} alt="front" className="h-20 w-16 rounded-lg object-cover" />
              <img src={selected.side_photo} alt="side" className="h-20 w-16 rounded-lg object-cover" />
            </div>
            <div className="rounded-xl border p-3 dark:border-zinc-800">
              <div className="flex gap-2 text-[10px] tracking-widest uppercase text-zinc-400">
                <button className="rounded bg-zinc-900 px-2 py-1 text-white dark:bg-white dark:text-zinc-900">Population</button>
                <button className="px-2 py-1">Timeline</button>
                <button className="px-2 py-1">Impact</button>
              </div>
              <div className="mt-3 relative h-16">
                <svg viewBox="0 0 300 60" className="h-full w-full">
                  <path d="M10 45 C 60 45, 80 10, 150 10 S 240 45, 290 45" fill="none" stroke="#e4e4e7" strokeWidth="1.5" />
                  <circle cx={140 + (target - 5) * 12} cy="12" r="3" fill="#18181b" />
                  <text x={140 + (target - 5) * 12} y="8" fontSize="6" textAnchor="middle" fill="#71717a">{target.toFixed(2)} · Top 0.018%</text>
                </svg>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2 text-xs text-zinc-500">
          <span className="rounded-full bg-zinc-100 px-2.5 py-1 dark:bg-zinc-800">{state.planActions.length} actions</span>
          <span className="rounded-full bg-zinc-100 px-2.5 py-1 dark:bg-zinc-800">${priceLow ? `${(priceLow / 1000).toFixed(1)}k` : "—"}–${priceHigh ? `${(priceHigh / 1000).toFixed(1)}k` : "—"}</span>
          <span className="rounded-full bg-zinc-100 px-2.5 py-1 dark:bg-zinc-800">{coverage}% coverage</span>
        </div>
      </Card>

      {/* Your Timeline §6.3 */}
      <Card className="p-6">
        <h4 className="font-medium">Your Timeline</h4>
        <p className="text-xs text-zinc-500">Manage and track your improvement journey</p>
        <div className="mt-3 flex gap-2">
          {(["Timeline", "Impact", "Ratio Impact"] as const).map((t) => (
            <button key={t} onClick={() => setTimelineTab(t)} className={`rounded-full px-3 py-1 text-xs ${timelineTab === t ? "bg-zinc-900 text-white" : "border"}`}>{t}</button>
          ))}
        </div>
        <p className="mt-3 text-xs text-zinc-500">Drag the grip icon to reorder your actions</p>
        <Button onClick={() => setPicker((v) => !v)} variant="outline" className="mt-3 rounded-full">+ Add Actions</Button>

        {picker && (
          <div className="mt-4 rounded-xl border dark:border-zinc-800 overflow-hidden">
            <div className="p-3 border-b dark:border-zinc-800">
              <input placeholder="Search 36 treatments..." value={filter} onChange={(e) => setFilter(e.target.value)} className="w-full rounded-full border px-3 py-2 text-sm dark:bg-zinc-900 dark:border-zinc-700" />
              <p className="mt-2 text-xs text-zinc-400">{filteredTreatments.length} treatments</p>
            </div>
            <div className="max-h-64 overflow-auto p-2 space-y-1">
              {filteredTreatments.map((t) => (
                <button key={t.name} onClick={() => { addPlanAction(t.name); setPicker(false); setFilter(""); }} className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800">
                  <span>{t.name}</span><span className="text-xs text-zinc-500">{t.category} · +{t.score_delta}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 space-y-3">
          {state.planActions.map((a, idx) => {
            const t = TREATMENTS.find((x) => x.name === a.treatment)!;
            const hDelta = (t.score_delta * 0.6).toFixed(2);
            const fDelta = (t.score_delta * 0.4).toFixed(2);
            return (
              <div
                key={`${a.treatment}-${idx}`}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(idx)}
                className="rounded-xl border p-4 dark:border-zinc-800 bg-white dark:bg-zinc-900"
              >
                <div className="flex items-start gap-3">
                  <span className="cursor-grab text-zinc-400 mt-1">≡</span>
                  <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-xs text-white dark:bg-white dark:text-zinc-900">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium">{a.treatment}</p>
                      <span className={`rounded px-2 py-0.5 text-[11px] ${t.invasiveness_tag === "SURGICAL" ? "bg-orange-100 text-orange-700" : t.invasiveness_tag === "MINIMALLY INVASIVE" ? "bg-teal-100 text-teal-700" : "bg-sky-100 text-sky-700"}`}>{t.invasiveness_tag}</span>
                      <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-800">H+{hDelta}</span>
                      <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-800">F+{fDelta}</span>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-zinc-500">Addresses {t.addresses.join(", ")}. {t.timeline_text}. Clinically detailed — educational only.</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-500">
                      <span>${t.price_range[0].toLocaleString()}–${t.price_range[1].toLocaleString()}</span>
                      <span>·</span>
                      <span>{t.timeline_text}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="rounded p-1 text-zinc-400 hover:text-zinc-900">ⓘ</button>
                    <button onClick={() => removePlanAction(idx)} className="rounded p-1 text-zinc-400 hover:text-red-600">🗑</button>
                  </div>
                </div>
              </div>
            );
          })}
          {state.planActions.length === 0 && <p className="text-sm text-zinc-400">No actions yet — add from catalog above. All 36 unlocked.</p>}
        </div>

        {/* floating FaceGPT Plan Mode pill */}
        <div className="sticky bottom-4 mt-6 flex justify-end">
          <span className="rounded-full bg-zinc-900 px-4 py-2 text-xs font-medium text-white shadow-lg dark:bg-white dark:text-zinc-900">FaceGPT Plan Mode</span>
        </div>
      </Card>

      {/* 4-icon explainer §6.4 keep */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { title: "Projected score", desc: "See target before you act" },
          { title: "Real costs", desc: "Price ranges per treatment" },
          { title: "In order", desc: "Drag to sequence" },
          { title: "Tracked", desc: "Coverage % updates live" },
        ].map((f) => (
          <div key={f.title} className="rounded-xl border bg-white p-4 dark:bg-zinc-900 dark:border-zinc-800">
            <p className="text-sm font-medium">{f.title}</p>
            <p className="text-xs text-zinc-500">{f.desc}</p>
          </div>
        ))}
      </div>

      <Card className="p-4 bg-amber-50 border-amber-200 dark:bg-amber-950/20"><p className="text-xs text-amber-800 dark:text-amber-200">This information is for educational purposes only. See Terms</p></Card>
    </div>
  );
}

const SIM_REGIONS: { name: string; params: { name: string; desc: string; default: number }[] }[] = [
  { name: "Forehead/Hairline", params: [{ name: "Height", desc: "Raise/lower hairline", default: 0 }] },
  { name: "Brows", params: [{ name: "Brow Height", desc: "Raise/lower brows", default: 0 }, { name: "Brow Asymmetry", desc: "Left vs right height", default: 0 }, { name: "Arch Height", desc: "Arch curvature", default: 0 }, { name: "Inter-brow Spacing", desc: "Distance between brows", default: 0 }, { name: "Brow Tilt", desc: "Brow angle", default: 0 }, { name: "Brow Tilt Asymmetry", desc: "Tilt asymmetry", default: 0 }] },
  { name: "Orbits (Brows + Eyes)", params: [{ name: "Orbit Width", desc: "Eye socket width", default: 0 }] },
  { name: "Eyes (Eyelids)", params: [{ name: "Canthal Tilt", desc: "Outer corner height", default: 0 }] },
  { name: "Nose", params: [{ name: "Projection", desc: "Nose forward", default: 0 }, { name: "Dorsal Height", desc: "Bridge height", default: 0 }] },
  { name: "Midface/Cheeks", params: [{ name: "Cheek Projection", desc: "Forward projection", default: 0 }] },
  { name: "Maxilla (Upper Jaw)", params: [{ name: "Advancement", desc: "Forward movement", default: 0 }] },
  { name: "Jaw (Whole Mandible)", params: [{ name: "Gonial Angle", desc: "Jaw angle", default: 0 }] },
  { name: "BSSO Segment", params: [{ name: "Advancement", desc: "BSSO forward", default: 0 }] },
  { name: "Chin", params: [{ name: "Advancement", desc: "Chin forward", default: 8 }, { name: "Vertical", desc: "Chin height", default: 1 }] },
];

type Movement = { id: string; region: string; param: string; value: number };

function SimulateTab({ selected }: { selected: any }) {
  const [choice, setChoice] = useState("Genioplasty");
  const [sliderPos, setSliderPos] = useState(50);
  const [playPos, setPlayPos] = useState(0);
  const [movements, setMovements] = useState<Movement[]>([
    { id: "1", region: "Chin", param: "Advancement", value: 8.0 },
    { id: "2", region: "Chin", param: "Vertical", value: 1.0 },
  ]);
  const [expandedRegion, setExpandedRegion] = useState<string | null>("Chin");
  const [linesOn, setLinesOn] = useState(true);
  const [ratioFilter, setRatioFilter] = useState<"Lowest" | "Highest" | "Improved" | "Declined">("Improved");

  const t = TREATMENTS.find((x) => x.name === choice) ?? TREATMENTS[1]!;
  const afterScore = Math.min(10, selected.overall_score + t.score_delta + movements.reduce((s, m) => s + m.value * 0.02, 0) * 0.1);
  const sideAfter = Math.min(10, (selected.pillars.find((x: any) => x.name === "Features")?.side_score ?? 5) + t.score_delta * 0.6);

  const ratiosMoved = [
    { name: "Nasal W to H ratio", before: "1.02x", after: "1.06x", tag: "Ideal" },
    { name: "Browridge Inclination Angle", before: "23°", after: "28°", tag: "Ideal" },
    { name: "Holdaway H Line", before: "-1.76mm", after: "0.2mm", tag: "Ideal" },
    { name: "Lower Lip E-Line Position", before: "5.9mm", after: "4.0mm", tag: "Ideal" },
    { name: "Z Angle", before: "71.0°", after: "79.2°", tag: "Ideal" },
    { name: "Facial Convexity / Glabella", before: "166.8°", after: "171.9°", tag: "Ideal" },
  ];

  const surgical = TREATMENTS.filter((x) => x.category === "surgical");
  const nonsurgical = TREATMENTS.filter((x) => x.category === "non-surgical");

  const ratioTable = [
    { name: "Total Facial Width to Height Ratio", raw: "1.32x", score: 7.2 },
    { name: "Lower Third Proportion", raw: "12.58%", score: 6.8 },
    { name: "Middle Third", raw: "34.50%", score: 6.5 },
    { name: "Nasal Projection", raw: "0.72x", score: 5.9 },
    { name: "Deviation of IAA & JFA", raw: "3.89°", score: 4.2 },
  ].sort((a, b) => {
    if (ratioFilter === "Lowest") return a.score - b.score;
    if (ratioFilter === "Highest") return b.score - a.score;
    if (ratioFilter === "Improved") return b.score - a.score;
    return a.score - b.score;
  });

  const addMovement = (region: string, param: string, val: number) => {
    setMovements((m) => [...m, { id: Math.random().toString(36).slice(2, 6), region, param, value: val }]);
  };

  return (
    <div className="space-y-6">
      {/* Treatment picker §7.2 */}
      <div className="flex gap-2">
        <button onClick={() => setChoice("Genioplasty")} className={`rounded-full px-4 py-2 text-sm ${choice === "Genioplasty" ? "bg-zinc-900 text-white" : "border bg-white"}`}>Genioplasty (Profile)</button>
        <button onClick={() => setChoice("Cheek Filler")} className={`rounded-full px-4 py-2 text-sm ${choice === "Cheek Filler" ? "bg-zinc-900 text-white" : "border bg-white"}`}>Eye spacing (Front)</button>
      </div>

      {/* Before/After viewer §7.3 */}
      <Card className="p-0 overflow-hidden">
        <div className="grid lg:grid-cols-[1.7fr_0.9fr] gap-0">
          <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100">
            <img src={selected.front_photo} alt="before" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderPos}%` }}>
              <img src={selected.front_photo} alt="after" className="h-full w-full object-cover brightness-110 contrast-110" style={{ width: `${(100 / sliderPos) * 100}%`, maxWidth: "none" }} />
            </div>
            <span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-1 text-xs text-white">BEFORE</span>
            <span className="absolute right-2 top-2 rounded bg-black/70 px-2 py-1 text-xs text-white">AFTER</span>
            <div className="absolute inset-y-0 w-0.5 bg-white shadow" style={{ left: `${sliderPos}%` }}>
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow">↔</div>
            </div>
            <input type="range" min={5} max={95} value={sliderPos} onChange={(e) => setSliderPos(Number(e.target.value))} className="absolute inset-x-0 bottom-3 mx-auto w-[90%] accent-zinc-900" />
          </div>
          <div className="p-4 space-y-4 border-l dark:border-zinc-800">
            <div>
              <p className="text-[11px] tracking-widest uppercase text-zinc-400">Treatment</p>
              <p className="font-medium">{t.name}</p>
              <p className="text-xs text-zinc-500">{t.invasiveness_tag}</p>
            </div>
            <div className="space-y-2">
              {movements.slice(0, 2).map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm dark:border-zinc-800">
                  <span>{m.param}</span>
                  <span className="tabular-nums font-medium">{m.value > 0 ? "+" : ""}{m.value.toFixed(1)}mm</span>
                </div>
              ))}
            </div>
            <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/50">
              <p className="text-xs tracking-widest uppercase text-zinc-400">Harmony Score</p>
              <p className="brand-display text-2xl">{selected.overall_score.toFixed(2)} → {afterScore.toFixed(2)} <span className="text-emerald-600 text-base">+{(afterScore - selected.overall_score).toFixed(2)}</span></p>
              <p className="text-xs text-zinc-500">Side {sideAfter.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-xs tracking-widest uppercase text-zinc-400">Ratios Moved</p>
              <ul className="mt-2 space-y-1 text-xs">
                {ratiosMoved.slice(0, 4).map((r) => (
                  <li key={r.name} className="flex justify-between gap-2"><span className="truncate">{r.name}</span><span className="tabular-nums">{r.before} → {r.after}</span><span className="rounded bg-emerald-100 px-1.5 py-0.5 text-emerald-700">{r.tag}</span></li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Card>

      {/* Full catalog browser §7.4 */}
      <Card className="p-4">
        <h4 className="font-medium">Browse treatments</h4>
        <div className="mt-4 space-y-4">
          <div>
            <p className="text-xs tracking-widest uppercase text-zinc-400">Surgical 25</p>
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {surgical.map((x) => (
                <button key={x.name} onClick={() => setChoice(x.name)} className={`rounded-lg border px-3 py-2 text-left text-xs ${choice === x.name ? "bg-zinc-900 text-white border-zinc-900" : "bg-white hover:bg-zinc-50 dark:bg-zinc-900"}`}>{x.name}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs tracking-widest uppercase text-zinc-400">Non-Surgical 11</p>
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {nonsurgical.map((x) => (
                <button key={x.name} onClick={() => setChoice(x.name)} className={`rounded-lg border px-3 py-2 text-left text-xs ${choice === x.name ? "bg-zinc-900 text-white border-zinc-900" : "bg-white hover:bg-zinc-50 dark:bg-zinc-900"}`}>{x.name}</button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Advanced power user panel §7.5 */}
      <div className="grid lg:grid-cols-[380px_1fr] gap-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Active Movements <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-800">{movements.length}</span></h4>
            <button onClick={() => setMovements([])} className="text-xs underline">Clear All</button>
          </div>
          <ul className="mt-3 space-y-2">
            {movements.map((m) => (
              <li key={m.id} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm dark:border-zinc-800">
                <span className="flex-1 truncate">{m.region} · {m.param}</span>
                <span className="tabular-nums font-medium">{m.value > 0 ? "+" : ""}{m.value.toFixed(1)}mm</span>
                <button className="text-zinc-400">✎</button>
                <button onClick={() => setMovements((prev) => prev.filter((x) => x.id !== m.id))} className="text-zinc-400 hover:text-red-600">×</button>
              </li>
            ))}
            {movements.length === 0 && <li className="text-xs text-zinc-400">No movements — add from below.</li>}
          </ul>

          <div className="mt-6">
            <p className="text-xs tracking-widest uppercase text-zinc-400">Add Another</p>
            <button onClick={() => addMovement("Chin", "Advancement", 5)} className="mt-2 w-full rounded-full border px-3 py-2 text-sm dark:border-zinc-700">+ Add Treatment</button>
            <p className="mt-1 text-xs text-zinc-500">Apply an optimized procedure preset</p>

            <div className="mt-4 space-y-2">
              {SIM_REGIONS.map((reg) => (
                <div key={reg.name} className="rounded-lg border dark:border-zinc-800">
                  <button onClick={() => setExpandedRegion(expandedRegion === reg.name ? null : reg.name)} className="flex w-full items-center justify-between px-3 py-2 text-left text-sm">
                    <span>{reg.name}</span><span className="text-zinc-400">{expandedRegion === reg.name ? "−" : "+"}</span>
                  </button>
                  {expandedRegion === reg.name && (
                    <div className="border-t p-3 space-y-3 dark:border-zinc-800">
                      {reg.params.map((p) => (
                        <div key={p.name}>
                          <div className="flex justify-between text-xs"><span className="font-medium">{p.name}</span><span className="text-zinc-500">{p.desc}</span></div>
                          <div className="mt-1 flex items-center gap-2">
                            <input type="range" min={-10} max={10} step={0.5} defaultValue={p.default} onChange={(e) => {
                              const v = Number(e.target.value);
                              setMovements((prev) => {
                                const existing = prev.find((m) => m.region === reg.name && m.param === p.name);
                                if (existing) return prev.map((m) => m.region === reg.name && m.param === p.name ? { ...m, value: v } : m);
                                return [...prev, { id: Math.random().toString(36).slice(2, 6), region: reg.name, param: p.name, value: v }];
                              });
                            }} className="flex-1 accent-zinc-900" />
                            <span className="w-12 text-right text-xs tabular-nums">{p.default}mm</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs tracking-widest uppercase text-zinc-400">Front + Profile</p>
              <p className="font-medium tabular-nums">{selected.overall_score.toFixed(2)} → {afterScore.toFixed(2)} <span className="text-emerald-600">+{(afterScore - selected.overall_score).toFixed(2)}</span></p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setLinesOn((v) => !v)} className={`rounded-full border px-3 py-1 text-xs ${linesOn ? "bg-zinc-900 text-white border-zinc-900" : "bg-white"}`}>Lines {linesOn ? "On" : "Off"}</button>
              <button className="rounded-full border px-3 py-1 text-xs">⬇</button>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="relative">
              <img src={selected.front_photo} alt="front" className="aspect-[3/4] w-full rounded-xl object-cover" />
              {linesOn && <div className="absolute inset-0 rounded-xl border-2 border-emerald-400/50 pointer-events-none" />}
            </div>
            <div className="relative">
              <img src={selected.side_photo} alt="side" className="aspect-[3/4] w-full rounded-xl object-cover" />
              {linesOn && <div className="absolute inset-0 rounded-xl border-2 border-emerald-400/50 pointer-events-none" />}
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs">▶</span>
            <input type="range" min={0} max={100} value={playPos} onChange={(e) => setPlayPos(Number(e.target.value))} className="flex-1 accent-zinc-900" />
            <span className="text-xs tabular-nums">{playPos}%</span>
          </div>
          <div className="mt-4">
            <div className="flex gap-2">
              {(["Lowest", "Highest", "Improved", "Declined"] as const).map((f) => (
                <button key={f} onClick={() => setRatioFilter(f)} className={`rounded-full px-3 py-1 text-xs ${ratioFilter === f ? "bg-zinc-900 text-white" : "border"}`}>{f}</button>
              ))}
            </div>
            <ul className="mt-3 space-y-2">
              {ratioTable.map((r) => (
                <li key={r.name} className="flex items-center gap-3 rounded-lg border px-3 py-2 text-sm dark:border-zinc-800">
                  <span className="flex-1 truncate">{r.name}</span>
                  <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-800">{r.raw}</span>
                  <div className="w-16 h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden"><div className="h-full bg-zinc-900 dark:bg-white" style={{ width: `${(r.score / 10) * 100}%` }} /></div>
                  <span className="w-8 text-right tabular-nums text-xs">{r.score.toFixed(1)}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>

      {/* 4-icon explainer §7.6 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { title: "36 treatments", desc: "Surgical + non-surgical" },
          { title: "Front and side", desc: "Both views scored" },
          { title: "Scored", desc: "Live harmony delta" },
          { title: "Millimetre control", desc: "0.5mm sliders" },
        ].map((f) => (
          <div key={f.title} className="rounded-xl border bg-white p-4 dark:bg-zinc-900 dark:border-zinc-800">
            <p className="text-sm font-medium">{f.title}</p><p className="text-xs text-zinc-500">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function FaceGPTTab({ selected }: { selected: any }) {
  const { state, addPlanAction } = useFaceIQStore();
  const [mode, setMode] = useState<"general" | "plan">("general");
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<
    { role: "user" | "assistant"; text: string; morph: { label: string; delta: string; before: number; after: number } | undefined }[]
  >([{ role: "assistant", text: `Hi! I'm FaceGPT 1.5 — conversational AI that answers any question about your face — and creates complex morphs in seconds with simple language. I see your overall ${selected.overall_score.toFixed(1)}/10 across 4 pillars. Ask anything or say "make my jaw more defined" to simulate.`, morph: undefined }]);

  const handleMorph = (q: string): { label: string; delta: string; before: number; after: number } | null => {
    const lower = q.toLowerCase();
    if (lower.includes("jaw")) return { label: "Jaw Advancement +6mm", delta: "+0.42", before: selected.overall_score, after: Math.min(10, selected.overall_score + 0.42) };
    if (lower.includes("chin")) return { label: "Genioplasty Chin +8mm", delta: "+0.53", before: selected.overall_score, after: Math.min(10, selected.overall_score + 0.53) };
    if (lower.includes("nose") || lower.includes("rhino")) return { label: "Rhinoplasty preset", delta: "+0.38", before: selected.overall_score, after: Math.min(10, selected.overall_score + 0.38) };
    if (lower.includes("cheek")) return { label: "Cheek Filler preset", delta: "+0.24", before: selected.overall_score, after: Math.min(10, selected.overall_score + 0.24) };
    if (lower.includes("brow")) return { label: "Brow Height +2mm", delta: "+0.18", before: selected.overall_score, after: Math.min(10, selected.overall_score + 0.18) };
    return null;
  };

  const send = () => {
    if (!input.trim()) return;
    const q = input;
    setInput("");
    const morph = handleMorph(q);
    const planMatch = q.toLowerCase().match(/add (.*) to (my )?plan/);
    let reply = "";
    if (planMatch && mode === "plan") {
      const name = planMatch[1]?.trim() ?? "";
      const found = TREATMENTS.find((t) => t.name.toLowerCase().includes(name.toLowerCase().slice(0, 6)));
      if (found) {
        addPlanAction(found.name);
        reply = `Added ${found.name} (${found.invasiveness_tag}, +${found.score_delta.toFixed(2)}) to your plan. It's now ${state.planActions.length + 1} actions. See Plan tab to reorder.`;
      } else {
        reply = `I couldn't find "${name}" in the 36-treatment catalog. Try "add genioplasty to my plan" or "add jaw fillers".`;
      }
    } else if (morph) {
      reply = `Applied ${morph.label} — simulated from ${morph.before.toFixed(1)} → ${morph.after.toFixed(1)} (${morph.delta}). This is a 2D preview; real morph needs 3DMM fitting. Adjust further in Simulate tab.`;
    } else if (mode === "plan") {
      reply = `Plan Mode: Based on your ${selected.overall_score.toFixed(1)} (Harmony ${selected.pillars.find((x: any) => x.name === "Harmony")?.front_score.toFixed(1)}), "${q}" — I'd rank non-surgical fillers first for quick wins, then consider surgical options like Genioplasty (+0.53) if you want profile change. Say "add [treatment] to my plan".`;
    } else {
      const pillarSummary = selected.pillars.map((p: any) => `${p.name} ${p.front_score.toFixed(1)}`).join(", ");
      reply = `Based on your analysis (${pillarSummary}, overall ${selected.overall_score.toFixed(1)}): "${q}" — educational only. Your strengths are in ${selected.pillars.find((p: any) => p.ratios.some((r: any) => r.severity_tag === "IDEAL"))?.name ?? "Harmony"}; focus on midface/jaw per your ratios. Try "make my jaw more defined" for a live morph.`;
    }
    setMsgs((m) => [...m, { role: "user", text: q, morph: undefined }, { role: "assistant", text: reply, morph: morph ?? undefined }]);
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">FaceGPT 1.5</h3>
          <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-xs text-white dark:bg-white dark:text-zinc-900">Simulate v1.0</span>
          <div className="ml-auto flex rounded-full border overflow-hidden dark:border-zinc-700">
            <button onClick={() => setMode("general")} className={`px-3 py-1 text-xs ${mode === "general" ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900" : "bg-white dark:bg-zinc-900"}`}>Q&A</button>
            <button onClick={() => setMode("plan")} className={`px-3 py-1 text-xs ${mode === "plan" ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900" : "bg-white dark:bg-zinc-900"}`}>Plan Mode</button>
          </div>
        </div>
        <p className="mt-2 text-xs text-zinc-500">Context-aware of your current analysis (scores, ratios, plan). {mode === "plan" ? "Scoped to editing your action plan." : 'Create morphs with plain language — e.g. "make my jaw more defined".'} Conversational AI that creates complex morphs in seconds.</p>
        <div className="mt-3 rounded-lg border bg-zinc-50 p-2 text-xs dark:bg-zinc-800/50 dark:border-zinc-700">
          <span className="font-medium">Context:</span> {selected.overall_score.toFixed(1)} overall · {selected.pillars.map((p: any) => `${p.name.slice(0, 2)} ${p.front_score.toFixed(1)}`).join(" · ")} · {state.planActions.length} plan actions
        </div>
      </Card>

      <Card className="p-4 sm:p-6">
        <div className="space-y-3 max-h-[50vh] overflow-auto pr-1">
          {msgs.map((m, i) => (
            <div key={i} className={`space-y-2 ${m.role === "user" ? "ml-8" : "mr-8"}`}>
              <div className={`rounded-xl px-3 py-2 text-sm ${m.role === "user" ? "bg-zinc-900 text-white" : "bg-zinc-100 dark:bg-zinc-800"}`}>{m.text}</div>
              {m.morph && (
                <div className="rounded-xl border overflow-hidden dark:border-zinc-700">
                  <div className="grid grid-cols-2 gap-0">
                    <div className="relative"><img src={selected.front_photo} alt="before" className="aspect-[3/4] w-full object-cover" /><span className="absolute left-2 top-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white">BEFORE {m.morph.before.toFixed(1)}</span></div>
                    <div className="relative"><img src={selected.front_photo} alt="after" className="aspect-[3/4] w-full object-cover brightness-110" /><span className="absolute left-2 top-2 rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] text-white">AFTER {m.morph.after.toFixed(1)}</span></div>
                  </div>
                  <div className="p-2 flex items-center justify-between text-xs"><span>{m.morph.label}</span><span className="font-medium text-emerald-600">{m.morph.delta}</span></div>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder={mode === "plan" ? 'Try "add genioplasty to my plan"...' : 'Ask anything, e.g. "make my jaw more defined"...'} className="flex-1 rounded-full border px-4 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
          <Button onClick={send} className="rounded-full">Send</Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {['"make my jaw more defined"', '"add genioplasty to my plan"', '"what\'s my weakest pillar?"'].map((s) => (
            <button key={s} onClick={() => setInput(s.replace(/"/g, ""))} className="rounded-full border px-2.5 py-1 text-xs hover:bg-zinc-50 dark:border-zinc-700">{s}</button>
          ))}
        </div>
      </Card>
    </div>
  );
}

function AnalyzerWithSave({ onSave }: { onSave: (front: string, side: string, result: AnalysisResult) => void }) {
  const runAnalysis = useServerFn(analyzeFace);
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [sideImage, setSideImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canAnalyze = Boolean(frontImage && sideImage) && !isAnalyzing;
  const analyzePhotos = async () => {
    if (!frontImage || !sideImage) return;
    setIsAnalyzing(true); setError(null); setResult(null);
    try {
      const data = await runAnalysis({ data: { frontImage, sideImage } });
      setResult(data);
      // auto-save for user request: automatically save photos
      onSave(frontImage, sideImage, data);
    } catch (err) { setError(err instanceof Error ? err.message : "Failed"); } finally { setIsAnalyzing(false); }
  };
  const reset = () => { setFrontImage(null); setSideImage(null); setResult(null); setError(null); };
  const handleSave = () => { if (!frontImage || !sideImage || !result) return; onSave(frontImage, sideImage, result); reset(); };
  return (
    <div className="mx-auto w-full">
      <AnimatePresence mode="wait">
        {!result ? (
          <motion.div key="upload" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <Card className="overflow-hidden border shadow-sm p-0">
              <div className="border-b bg-muted/30 px-6 py-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10"><Brain className="h-5 w-5 text-primary" /></div>
                <div><h2 className="font-semibold">Upload Your Photos</h2><p className="text-sm text-muted-foreground">Front and side profile</p></div>
              </div>
              <div className="p-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <ImageUpload label="Front" description="Face forward" image={frontImage} onImageChange={setFrontImage} icon="front" />
                  <ImageUpload label="Side" description="Turn 90°" image={sideImage} onImageChange={setSideImage} icon="side" />
                </div>
                {error && <div className="mt-4 rounded-lg bg-destructive/10 p-4 text-center text-sm text-destructive">{error}</div>}
                <div className="mt-6 flex flex-col gap-4">
                  <Button size="lg" onClick={analyzePhotos} disabled={!canAnalyze} className="w-full gap-2 text-base">
                    {isAnalyzing ? <><Loader2 className="h-5 w-5 animate-spin" /> Analyzing...</> : <><Sparkles className="h-5 w-5" /> Analyze My Face</>}
                  </Button>
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground"><Shield className="h-3.5 w-3.5" /> Photos deleted after <Trash2 className="h-3.5 w-3.5" /></div>
                </div>
              </div>
            </Card>
          </motion.div>
        ) : (
          <motion.div key="results" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="overflow-hidden border shadow-sm p-0">
              <div className="border-b bg-muted/30 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10"><Sparkles className="h-5 w-5 text-accent" /></div><div><h2 className="font-semibold">Your Results</h2><p className="text-sm text-muted-foreground">AI analysis</p></div></div>
                <Button variant="outline" size="sm" onClick={reset}>New</Button>
              </div>
              <div className="p-6">
                <div className="grid gap-8 lg:grid-cols-2">
                  <div className="space-y-6"><RatingDisplay rating={result.overallScore} label="Overall Score" breakdown={result.breakdown} /><Button onClick={handleSave} className="w-full gap-2"><Save className="h-4 w-4" /> Save to dashboard</Button></div>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative aspect-[3/4] overflow-hidden rounded-xl"><img src={frontImage!} alt="Front" className="h-full w-full object-cover" /><div className="absolute bottom-2 left-2 rounded-full bg-foreground/80 px-2.5 py-1 text-xs text-background">Front: {result.frontScore.toFixed(1)}</div></div>
                      <div className="relative aspect-[3/4] overflow-hidden rounded-xl"><img src={sideImage!} alt="Side" className="h-full w-full object-cover" /><div className="absolute bottom-2 left-2 rounded-full bg-foreground/80 px-2.5 py-1 text-xs text-background">Side: {result.sideScore.toFixed(1)}</div></div>
                    </div>
                    <div className="rounded-xl bg-muted/50 p-4"><h3 className="mb-2 font-medium">AI Summary</h3><p className="text-sm leading-relaxed text-muted-foreground">{result.summary}</p></div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
