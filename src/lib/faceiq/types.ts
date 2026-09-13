import type { AnalysisResult } from "@/lib/analyze.functions";

// Core entities per spec §1.1

export type PillarName = "Harmony" | "Angularity" | "Dimorphism" | "Features";

export type SeverityTag = "IDEAL" | "GOOD" | "MODERATE" | "SEVERE" | "EXTREME";
export type InvasivenessTag = "NON-INVASIVE" | "MINIMALLY INVASIVE" | "SURGICAL";
export type TreatmentCategory = "surgical" | "non-surgical";

export interface Ratio {
  name: string;
  value: number;
  raw_measurement: string; // e.g. "1.43x", "49.17%", "71.0°"
  ideal_range: [number, number];
  severity_tag: SeverityTag;
  delta_from_ideal: number;
  view: "front" | "side";
  pillar: PillarName;
}

export interface Pillar {
  name: PillarName;
  front_score: number;
  side_score: number;
  percentile: string; // e.g. "Bottom 14%", "Top 1.7%"
  ratios: Ratio[];
  assessment_count: string; // e.g. "5 assessments"
}

export interface Analysis {
  id: string; // CUID-like
  created_at: string; // ISO
  label: string; // e.g. "Today", "3mo"
  front_photo: string; // data URL
  side_photo: string; // data URL
  pillars: Pillar[];
  overall_score: number; // 0-10
  // legacy bridge to AnalysisResult for migration
  legacy_result?: AnalysisResult;
}

export interface Treatment {
  name: string;
  category: TreatmentCategory;
  invasiveness_tag: InvasivenessTag;
  price_range: [number, number]; // USD
  timeline_text: string;
  score_delta: number; // e.g. +0.53
  addresses: string[];
  // for simulate
  simulation_params?: string[];
}

export interface PlanAction {
  treatment: string; // fk -> Treatment.name
  order_index: number;
  status: "pending" | "done";
  harmony_delta?: number;
  features_delta?: number;
}

export interface SimulationMovement {
  region: string;
  parameter: string;
  value_mm: number;
  editable: boolean;
}

export interface SimulationSession {
  base_photo: string;
  active_movements: SimulationMovement[];
  before_score: number;
  after_score: number;
  ratios_moved: { ratio_name: string; before: string; after: string; tag: string }[];
}

export type FaceIQState = {
  analyses: Analysis[];
  selectedId: string | null;
  planActions: PlanAction[];
  gender: string;
  ethnicity: string;
};

// Helpers

export function severityColor(tag: SeverityTag): string {
  switch (tag) {
    case "IDEAL":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
    case "GOOD":
      return "bg-lime-100 text-lime-700 dark:bg-lime-950 dark:text-lime-300 border-lime-200";
    case "MODERATE":
      return "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200";
    case "SEVERE":
      return "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300 border-orange-200";
    case "EXTREME":
      return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border-red-200";
  }
}

export function invasivenessColor(tag: InvasivenessTag): string {
  switch (tag) {
    case "NON-INVASIVE":
      return "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300";
    case "MINIMALLY INVASIVE":
      return "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300";
    case "SURGICAL":
      return "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300";
  }
}

// Derive pillars from legacy AnalysisResult
export function pillarsFromResult(result: AnalysisResult): Pillar[] {
  // Map categories to pillars heuristically
  const map: Record<string, PillarName> = {
    "Facial Symmetry": "Harmony",
    "Facial Harmony": "Harmony",
    "Bone Structure": "Angularity",
    "Profile Aesthetics": "Features",
    "Overall Impression": "Dimorphism",
  };
  const groups: Record<PillarName, typeof result.breakdown> = {
    Harmony: [],
    Angularity: [],
    Dimorphism: [],
    Features: [],
  };
  for (const b of result.breakdown) {
    const p = map[b.category] ?? "Harmony";
    groups[p].push(b);
  }
  const pct = (score: number) => {
    if (score >= 8.5) return "Top 2%";
    if (score >= 7.5) return "Top 15%";
    if (score >= 6.5) return "Top 35%";
    if (score >= 5) return "Average";
    return "Bottom 14%";
  };
  const mk = (name: PillarName, scores: typeof result.breakdown): Pillar => {
    const avg = scores.length ? scores.reduce((s, x) => s + x.score, 0) / scores.length : result.overallScore;
    return {
      name,
      front_score: name === "Features" ? result.sideScore : result.frontScore,
      side_score: result.sideScore,
      percentile: pct(avg),
      assessment_count: name === "Harmony" ? "5 assessments" : name === "Angularity" ? "12 measurements" : name === "Dimorphism" ? "—" : "40+ health indicators",
      ratios: scores.map((b) => ({
        name: b.category,
        value: b.score,
        raw_measurement: `${b.score.toFixed(1)}`,
        ideal_range: [7, 10] as [number, number],
        severity_tag: (b.score >= 8 ? "IDEAL" : b.score >= 6.5 ? "GOOD" : b.score >= 5 ? "MODERATE" : b.score >= 3.5 ? "SEVERE" : "EXTREME") as SeverityTag,
        delta_from_ideal: b.score - 8,
        view: "front" as const,
        pillar: name,
      })),
    };
  };
  return (["Harmony", "Angularity", "Dimorphism", "Features"] as PillarName[]).map((n) => mk(n, groups[n]));
}
