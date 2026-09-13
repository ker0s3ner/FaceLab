import { useEffect, useRef, useState } from "react";
import type { Analysis, FaceIQState, PlanAction } from "./types";
import { pillarsFromResult } from "./types";
import type { AnalysisResult } from "@/lib/analyze.functions";
import {
  deleteAnalysis as cloudDelete,
  clearAnalyses as cloudClear,
  fetchCloud,
  mergeSnapshots,
  pushAnalysis as cloudPush,
  pushUserState as cloudPushState,
  type CloudStatus,
} from "./cloud";
import { severityForScore } from "./flaws";

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
        // persist migrated (guarded — quota errors must never crash render)
        setTimeout(() => {
          try {
            localStorage.setItem(KEY, JSON.stringify(next));
          } catch {}
        }, 0);
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
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>("local");
  const cloudTried = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loaded = load();
      if (cancelled) return;
      setState(loaded);
      setHydrated(true);
      // Cross-device: merge cloud snapshot once (signed-in + migration run).
      if (cloudTried.current) return;
      cloudTried.current = true;
      setCloudStatus("syncing");
      const cloud = await fetchCloud();
      if (cancelled) return;
      if (!cloud) {
        setCloudStatus("local");
        return;
      }
      if (cloud.tablesMissing) {
        setCloudStatus("local");
        return;
      }
      setState((prev) => mergeSnapshots(prev, cloud.snapshot));
      setCloudStatus("synced");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (err) {
      // QuotaExceededError from large photo data URLs would blank-screen the
      // dashboard (error thrown inside passive effect). Fall back to a slim
      // snapshot without full-res photos so the app stays alive.
      try {
        const slim = {
          ...state,
          analyses: state.analyses.map((a) => ({
            ...a,
            front_photo: a.front_photo.length > 200_000 ? "" : a.front_photo,
            side_photo: a.side_photo.length > 200_000 ? "" : a.side_photo,
            landmarkPoints: undefined,
          })),
        };
        localStorage.setItem(KEY, JSON.stringify(slim));
      } catch {
        // storage unavailable (private mode etc.) — keep in-memory state only
      }
    }
  }, [state, hydrated]);

  // Debounced cloud backup of plan/gender/ethnicity (analyses push individually)
  const stateRef = useRef(state);
  stateRef.current = state;
  useEffect(() => {
    if (!hydrated || cloudStatus === "local") return;
    const t = setTimeout(() => {
      const s = stateRef.current;
      cloudPushState({ gender: s.gender, ethnicity: s.ethnicity, planActions: s.planActions }).then((ok) => {
        if (!ok) setCloudStatus("error");
      });
    }, 1200);
    return () => clearTimeout(t);
  }, [hydrated, cloudStatus, state.gender, state.ethnicity, state.planActions]);

  const addAnalysis = (
    front: string,
    side: string,
    result: AnalysisResult,
    extra?: {
      measurements?: { front: { name: string; raw: string; value: number }[]; side: { name: string; raw: string; value: number }[] };
      points?: { front: { x: number; y: number }[]; side: { x: number; y: number }[] };
      keys?: { front: Record<string, { x: number; y: number }>; side: Record<string, { x: number; y: number }> };
    },
  ) => {
    const id = `cm${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const analysis: Analysis = {
      id,
      created_at: new Date().toISOString(),
      label: "Today",
      front_photo: front,
      side_photo: side,
      pillars: pillarsFromResult(result, extra?.measurements),
      overall_score: result.overallScore,
      legacy_result: result,
      measurements: extra?.measurements,
      landmarkPoints: extra?.points,
      keyPoints: extra?.keys,
    };
    setState((s) => ({ ...s, analyses: [...s.analyses, analysis], selectedId: id }));
    // Cross-device backup (fire-and-forget; local stays source of truth)
    cloudPush(analysis).then((ok) => {
      if (ok) setCloudStatus("synced");
    });
    return id;
  };

  const select = (id: string) => setState((s) => ({ ...s, selectedId: id }));
  const removeAnalysis = (id: string) => {
    setState((s) => {
      const next = s.analyses.filter((a) => a.id !== id);
      return { ...s, analyses: next, selectedId: s.selectedId === id ? (next[next.length - 1]?.id ?? null) : s.selectedId };
    });
    cloudDelete(id);
  };
  const clearAll = () => {
    setState((s) => ({ ...s, analyses: [], selectedId: null }));
    cloudClear();
  };

  const addPlanAction = (treatment: string) => setState((s) => ({ ...s, planActions: [...s.planActions, { treatment, order_index: s.planActions.length, status: "pending" as const }] }));
  const reorderPlan = (from: number, to: number) => setState((s) => {
    const arr = [...s.planActions];
    const [moved] = arr.splice(from, 1);
    if (!moved) return s;
    arr.splice(to, 0, moved);
    return { ...s, planActions: arr.map((a, i) => ({ ...a, order_index: i })) };
  });
  const removePlanAction = (idx: number) => setState((s) => ({ ...s, planActions: s.planActions.filter((_, i) => i !== idx).map((a, i) => ({ ...a, order_index: i })) }));

  /** Manual ratio override from the detail modal (Edit tab). Persists + backs up. */
  const overrideRatio = (analysisId: string, ratioName: string, value: number) => {
    const v = Math.max(1, Math.min(10, Number(value.toFixed(1))));
    let updated: Analysis | null = null;
    setState((s) => ({
      ...s,
      analyses: s.analyses.map((a) => {
        if (a.id !== analysisId) return a;
        const next: Analysis = {
          ...a,
          pillars: a.pillars.map((p) => ({
            ...p,
            ratios: p.ratios.map((r) =>
              r.name === ratioName
                ? { ...r, value: v, severity_tag: severityForScore(v), delta_from_ideal: Number((v - 8).toFixed(2)) }
                : r,
            ),
          })),
        };
        updated = next;
        return next;
      }),
    }));
    if (updated) cloudPush(updated as Analysis).then((ok) => ok && setCloudStatus("synced"));
  };

  return { state, setState, addAnalysis, select, removeAnalysis, clearAll, addPlanAction, reorderPlan, removePlanAction, overrideRatio, cloudStatus };
}

export function mockRatiosForAnalysis(analysis: Analysis): typeof analysis.pillars {
  return analysis.pillars;
}
