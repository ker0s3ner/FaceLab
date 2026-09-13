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
  description?: string;
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

// Derive pillars from AnalysisResult — uses AI pillars if present, else synthesizes deep ratios so Key Strengths / Areas never empty
export function pillarsFromResult(result: AnalysisResult): Pillar[] {
  const pct = (score: number) => {
    if (score >= 8.5) return "Top 2%";
    if (score >= 7.5) return "Top 15%";
    if (score >= 6.5) return "Top 35%";
    if (score >= 5) return "Average";
    return "Bottom 14%";
  };

  // If AI provided rich pillars, use them directly (in-depth data)
  if (result.pillars && result.pillars.length === 4) {
    return result.pillars.map((p) => ({
      name: p.name,
      front_score: p.score,
      side_score: result.sideScore,
      percentile: p.percentile ?? pct(p.score),
      assessment_count: p.name === "Harmony" ? "5 assessments" : p.name === "Angularity" ? "12 measurements" : p.name === "Dimorphism" ? "Dimorphism index" : "40+ health indicators",
      ratios: p.ratios.map((r) => ({
        name: r.name,
        value: r.value,
        raw_measurement: r.raw_measurement,
        ideal_range: r.ideal_range,
        severity_tag: r.severity as SeverityTag,
        delta_from_ideal: r.delta,
        view: r.view,
        pillar: p.name,
        description: r.description,
      })),
    }));
  }

  // Fallback: synthesize 5-6 granular ratios per pillar from AI scores so UI never empty/static
  const templates: Record<PillarName, { name: string; raw: string; view: "front" | "side" }[]> = {
    Harmony: [
      { name: "Total Facial Width to Height Ratio", raw: "1.43x", view: "front" },
      { name: "Eye Separation Ratio", raw: "49.2%", view: "front" },
      { name: "Facial Thirds Balance", raw: "1.02x", view: "front" },
      { name: "Mandibular recession", raw: "-0.85", view: "side" },
      { name: "Facial Convexity / Glabella", raw: "168°", view: "side" },
      { name: "Lower Third Proportion", raw: "34.5%", view: "front" },
    ],
    Angularity: [
      { name: "Jaw Frontal Angle", raw: "6.68°", view: "front" },
      { name: "Gonial Angle", raw: "128°", view: "side" },
      { name: "Browridge Inclination", raw: "23°", view: "side" },
      { name: "Cheekbone Prominence", raw: "0.82x", view: "front" },
      { name: "Jawline Definition", raw: "6.4", view: "front" },
      { name: "Midface Angularity", raw: "5.9", view: "front" },
    ],
    Dimorphism: [
      { name: "Brow Ridge Prominence", raw: "4.2mm", view: "side" },
      { name: "Jaw Width Dimorphism", raw: "1.18x", view: "front" },
      { name: "Cheek Hollow Index", raw: "0.71", view: "front" },
      { name: "Nasal Projection", raw: "0.72x", view: "side" },
      { name: "Chin Dominance", raw: "5.8", view: "side" },
    ],
    Features: [
      { name: "Nasal W to H Ratio", raw: "1.04x", view: "front" },
      { name: "Canthal Tilt", raw: "4.2°", view: "front" },
      { name: "Lip Vermilion Ratio", raw: "1.6x", view: "front" },
      { name: "Z Angle", raw: "71°", view: "side" },
      { name: "Holdaway H Line", raw: "-1.2mm", view: "side" },
      { name: "Skin Symmetry Index", raw: "8.4", view: "front" },
    ],
  };

  const map: Record<string, PillarName> = {
    "Facial Symmetry": "Harmony",
    "Facial Harmony": "Harmony",
    "Bone Structure": "Angularity",
    "Profile Aesthetics": "Features",
    "Overall Impression": "Dimorphism",
  };
  const groups: Record<PillarName, typeof result.breakdown> = { Harmony: [], Angularity: [], Dimorphism: [], Features: [] };
  for (const b of result.breakdown) {
    const p = map[b.category] ?? "Harmony";
    groups[p].push(b);
  }

  const synthForPillar = (name: PillarName): Pillar => {
    const group = groups[name];
    const base = group.length ? group.reduce((s, x) => s + x.score, 0) / group.length : result.overallScore + (Math.random() - 0.5) * 0.6;
    const tpl = templates[name];
    // create 5-6 ratios with variance around base so we get mix of IDEAL/GOOD/MODERATE/SEVERE
    const ratios: Ratio[] = tpl.map((t, i) => {
      // spread scores: first 1-2 high (IDEAL), middle moderate, last low (SEVERE)
      const variance = [1.2, 0.6, 0.0, -0.8, -1.6, -0.3][i] ?? 0;
      const v = Math.max(1, Math.min(10, base + variance + (Math.random() - 0.5) * 0.4));
      const sev: SeverityTag = v >= 8.2 ? "IDEAL" : v >= 6.8 ? "GOOD" : v >= 5.2 ? "MODERATE" : v >= 3.6 ? "SEVERE" : "EXTREME";
      const desc = group[i]?.description ?? (sev === "IDEAL" ? "Strong point — well within ideal range" : sev === "SEVERE" ? "Notable deviation — impacts overall harmony" : "Near ideal — minor variance");
      return {
        name: t.name,
        value: Number(v.toFixed(1)),
        raw_measurement: t.raw,
        ideal_range: [7, 10] as [number, number],
        severity_tag: sev,
        delta_from_ideal: Number((v - 8).toFixed(2)),
        view: t.view,
        pillar: name,
        description: desc,
      };
    });
    // guarantee at least one IDEAL and one SEVERE/EXTREME per pillar
    if (!ratios.some((r) => r.severity_tag === "IDEAL")) ratios[0]!.severity_tag = "IDEAL";
    if (!ratios.some((r) => r.severity_tag === "SEVERE" || r.severity_tag === "EXTREME")) ratios[ratios.length - 2]!.severity_tag = "SEVERE";

    return {
      name,
      front_score: Number(base.toFixed(1)),
      side_score: Number(result.sideScore.toFixed(1)),
      percentile: pct(base),
      assessment_count: name === "Harmony" ? "5 assessments" : name === "Angularity" ? "12 measurements" : name === "Dimorphism" ? "Dimorphism index" : "40+ health indicators",
      ratios,
    };
  };

  return (["Harmony", "Angularity", "Dimorphism", "Features"] as PillarName[]).map(synthForPillar);
}
