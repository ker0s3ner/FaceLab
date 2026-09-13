import { useEffect, useState } from "react";
import type { Analysis, FaceIQState, PlanAction } from "./types";
import { pillarsFromResult } from "./types";
import type { AnalysisResult } from "@/lib/analyze.functions";

const KEY = "faceiq_state_v2";
const LEGACY_KEY = "faceiq_scans";

function load(): FaceIQState {
  if (typeof window === "undefined") return { analyses: [], selectedId: null, planActions: [], gender: "Male", ethnicity: "White / Caucasian" };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as FaceIQState;
      // Migrate old shallow pillars (1-2 ratios) to deep AI-driven ratios so Key Strengths/Areas not empty
      let migrated = false;
      const analyses = (Array.isArray(parsed.analyses) ? parsed.analyses : [])
        .map((a) => {
          const valid =
            Array.isArray(a?.pillars) &&
            a.pillars.length > 0 &&
            a.pillars.every((p) => p && Array.isArray(p.ratios) && p.ratios.length >= 4);
          if (valid) return a;
          if (a?.legacy_result) {
            migrated = true;
            return { ...a, pillars: pillarsFromResult(a.legacy_result) };
          }
          migrated = true;
          return null;
        })
        .filter((a): a is Analysis => a !== null);
      if (migrated) {
        const next = { ...parsed, analyses };
        // persist migrated
        setTimeout(() => localStorage.setItem(KEY, JSON.stringify(next)), 0);
        return next;
      }
      return parsed;
    }
    // migrate legacy faceiq_scans
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const arr = JSON.parse(legacy) as { id: string; createdAt: string; frontImage: string; sideImage: string; result: AnalysisResult }[];
      const analyses: Analysis[] = arr.map((s, i) => ({
        id: s.id,
        created_at: s.createdAt,
        label: i === arr.length - 1 ? "Today" : `${arr.length - 1 - i}mo`,
        front_photo: s.frontImage,
        side_photo: s.sideImage,
        pillars: pillarsFromResult(s.result),
        overall_score: s.result.overallScore,
        legacy_result: s.result,
      }));
      return { analyses, selectedId: analyses[analyses.length - 1]?.id ?? null, planActions: [], gender: "Male", ethnicity: "White / Caucasian" };
    }
  } catch {}
  return { analyses: [], selectedId: null, planActions: [], gender: "Male", ethnicity: "White / Caucasian" };
}

export function useFaceIQStore() {
  const [state, setState] = useState<FaceIQState>(() => {
    // SSR-safe: initialize empty, hydrate from localStorage in effect to avoid hydration mismatch (blank screen)
    if (typeof window === "undefined") return { analyses: [], selectedId: null, planActions: [], gender: "Male", ethnicity: "White / Caucasian" };
    return { analyses: [], selectedId: null, planActions: [], gender: "Male", ethnicity: "White / Caucasian" };
  });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const loaded = load();
    setState(loaded);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const addAnalysis = (front: string, side: string, result: AnalysisResult) => {
    const id = `cm${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const analysis: Analysis = {
      id,
      created_at: new Date().toISOString(),
      label: "Today",
      front_photo: front,
      side_photo: side,
      pillars: pillarsFromResult(result),
      overall_score: result.overallScore,
      legacy_result: result,
    };
    setState((s) => ({ ...s, analyses: [...s.analyses, analysis], selectedId: id }));
    return id;
  };

  const select = (id: string) => setState((s) => ({ ...s, selectedId: id }));
  const removeAnalysis = (id: string) => setState((s) => {
    const next = s.analyses.filter((a) => a.id !== id);
    return { ...s, analyses: next, selectedId: s.selectedId === id ? (next[next.length - 1]?.id ?? null) : s.selectedId };
  });
  const clearAll = () => setState((s) => ({ ...s, analyses: [], selectedId: null }));

  const addPlanAction = (treatment: string) => setState((s) => ({ ...s, planActions: [...s.planActions, { treatment, order_index: s.planActions.length, status: "pending" as const }] }));
  const reorderPlan = (from: number, to: number) => setState((s) => {
    const arr = [...s.planActions];
    const [moved] = arr.splice(from, 1);
    if (!moved) return s;
    arr.splice(to, 0, moved);
    return { ...s, planActions: arr.map((a, i) => ({ ...a, order_index: i })) };
  });
  const removePlanAction = (idx: number) => setState((s) => ({ ...s, planActions: s.planActions.filter((_, i) => i !== idx).map((a, i) => ({ ...a, order_index: i })) }));

  return { state, setState, addAnalysis, select, removeAnalysis, clearAll, addPlanAction, reorderPlan, removePlanAction };
}

export function mockRatiosForAnalysis(analysis: Analysis): typeof analysis.pillars {
  return analysis.pillars;
}
