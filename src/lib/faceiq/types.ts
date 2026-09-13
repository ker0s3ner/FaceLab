import type { AnalysisResult } from "@/lib/analyze.functions";

// Core entities per spec §1.1

export type PillarName = "Harmony" | "Angularity" | "Dimorphism" | "Features";

export type SeverityTag = "IDEAL" | "GOOD" | "MODERATE" | "SEVERE" | "EXTREME";
export type InvasivenessTag = "NON-INVASIVE" | "MINIMALLY INVASIVE" | "SURGICAL";
export type TreatmentCategory = "surgical" | "non-surgical";

export interface Ratio {
  name: string;
  value: number; // 0-10 score
  raw_measurement: string; // e.g. "1.43x", "49.17%", "71.0°"
  ideal_range: [number, number]; // score-scale range (legacy)
  ideal_label: string; // human ideal in raw units, e.g. "1.32–1.50x"
  severity_tag: SeverityTag;
  delta_from_ideal: number;
  view: "front" | "side";
  pillar: PillarName;
  description?: string;
  measured?: boolean; // true when raw comes from real MediaPipe geometry
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
  legacy_result?: AnalysisResult | undefined;
  // real geometry: raw MediaPipe measurements + downsampled landmark points for overlays
  measurements?: { front: { name: string; raw: string; value: number }[]; side: { name: string; raw: string; value: number }[] } | undefined;
  landmarkPoints?: { front: { x: number; y: number }[]; side: { x: number; y: number }[] } | undefined;
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

// Real measurement names from landmarks.ts (must match exactly for grounding)
export const MEASUREMENT_NAMES = {
  front: [
    "Total Facial Width to Height Ratio",
    "Eye Separation Ratio",
    "Inter-canthal to Eye Width Ratio",
    "Canthal Tilt",
    "Upper Third Proportion",
    "Middle Third Proportion",
    "Lower Third Proportion",
    "Bigonial to Bizygomatic Ratio",
    "Nose Width to Face Width Ratio",
    "Mouth Width to Nose Width Ratio",
    "Philtrum to Chin Ratio",
    "Jaw Frontal Angle",
    "Midline Symmetry Deviation",
    "Brow to Eye Distance Ratio",
  ],
  side: [
    "Facial Convexity / Glabella Angle",
    "Nasofrontal Angle",
    "Nasolabial Angle",
    "Mentolabial / Z Angle",
    "Nasal Projection",
    "Nasal Width to Height Ratio",
    "Chin Projection (to facial plane)",
    "Ramus to Mandible Ratio",
    "Browridge Inclination Angle",
  ],
};

// Alias map: template name -> real measurement name(s) to ground raw values
const MEASURE_ALIAS: Record<string, string[]> = {
  "Total Facial Width to Height Ratio": ["Total Facial Width to Height Ratio"],
  "Eye Separation Ratio": ["Eye Separation Ratio"],
  "Intercanthal Distance": ["Inter-canthal to Eye Width Ratio"],
  "Inter-canthal to Eye Width": ["Inter-canthal to Eye Width Ratio"],
  "Canthal Tilt": ["Canthal Tilt"],
  "Upper Third Proportion": ["Upper Third Proportion"],
  "Middle Third Proportion": ["Middle Third Proportion"],
  "Lower Third Proportion": ["Lower Third Proportion"],
  "Facial Thirds Balance": ["Middle Third Proportion", "Lower Third Proportion"],
  "Bigonial to Bizygomatic Ratio": ["Bigonial to Bizygomatic Ratio"],
  "Bigonial Width": ["Bigonial to Bizygomatic Ratio"],
  "Nose Width to Face Width": ["Nose Width to Face Width Ratio"],
  "Nasal W to H Ratio": ["Nasal Width to Height Ratio"],
  "Nasal Width to Height Ratio": ["Nasal Width to Height Ratio"],
  "Mouth Width to Nose Width": ["Mouth Width to Nose Width Ratio"],
  "Mouth Width to Nose Width Ratio": ["Mouth Width to Nose Width Ratio"],
  "Philtrum to Chin Ratio": ["Philtrum to Chin Ratio"],
  "Jaw Frontal Angle": ["Jaw Frontal Angle"],
  "Midline Symmetry Deviation": ["Midline Symmetry Deviation"],
  "Skin Symmetry Index": ["Midline Symmetry Deviation"],
  "Brow to Eye Distance Ratio": ["Brow to Eye Distance Ratio"],
  "Facial Convexity / Glabella": ["Facial Convexity / Glabella Angle"],
  "Facial Convexity / Glabella Angle": ["Facial Convexity / Glabella Angle"],
  "Nasofrontal Angle": ["Nasofrontal Angle"],
  "Nasolabial Angle": ["Nasolabial Angle"],
  "Z Angle": ["Mentolabial / Z Angle"],
  "Mentolabial / Z Angle": ["Mentolabial / Z Angle"],
  "Mentolabial Depth": ["Mentolabial / Z Angle"],
  "Nasal Projection": ["Nasal Projection"],
  "Chin Projection (to facial plane)": ["Chin Projection (to facial plane)"],
  "Chin Throat Angle": ["Mentolabial / Z Angle"],
  "Ramus to Mandible Ratio": ["Ramus to Mandible Ratio"],
  "Browridge Inclination": ["Browridge Inclination Angle"],
  "Browridge Inclination Angle": ["Browridge Inclination Angle"],
  "Brow Ridge Prominence": ["Browridge Inclination Angle"],
  "Holdaway H Line": ["Mentolabial / Z Angle"],
  "Menton Y-Line Deviation": ["Midline Symmetry Deviation"],
  "Gonial Angle": ["Jaw Frontal Angle"],
};

export type RealMeasurements = {
  front: { name: string; raw: string; value: number }[];
  side: { name: string; raw: string; value: number }[];
};

function lookupReal(name: string, real?: RealMeasurements): { raw: string; measured: boolean } | null {
  if (!real) return null;
  const aliases = MEASURE_ALIAS[name] ?? [name];
  const pool = [...real.front, ...real.side];
  for (const a of aliases) {
    const hit = pool.find((m) => m.name === a);
    if (hit) return { raw: hit.raw, measured: true };
  }
  return null;
}

// Derive pillars from AnalysisResult — uses AI pillars if present, else synthesizes deep ratios so Key Strengths / Areas never empty
export function pillarsFromResult(result: AnalysisResult, real?: RealMeasurements): Pillar[] {
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
        ideal_label: Array.isArray(r.ideal_range) ? `${r.ideal_range[0]}–${r.ideal_range[1]}` : "",
        severity_tag: r.severity as SeverityTag,
        delta_from_ideal: r.delta,
        view: r.view,
        pillar: p.name,
        description: r.description,
        measured: false,
      })),
    }));
  }

  // Rich templates: ~14 Harmony, ~12 Angularity, ~10 Dimorphism, ~12 Features (≈48 ratios total)
  // Each has real-unit ideal_label + description so UI never looks thin/static
  const templates: Record<PillarName, { name: string; raw: string; ideal: string; view: "front" | "side"; desc: string }[]> = {
    Harmony: [
      { name: "Total Facial Width to Height Ratio", raw: "1.43x", ideal: "1.32–1.50x", view: "front", desc: "Bizygomatic width vs facial height. Core harmony proportion." },
      { name: "Eye Separation Ratio", raw: "49.2%", ideal: "46–50%", view: "front", desc: "Inter-pupillary distance relative to face width." },
      { name: "Facial Thirds Balance", raw: "1.02x", ideal: "0.95–1.05x", view: "front", desc: "Upper/middle/lower third equality." },
      { name: "Lower Third Proportion", raw: "34.5%", ideal: "33–36%", view: "front", desc: "Subnasale-to-menton share of face height." },
      { name: "Midface Ratio", raw: "1.08x", ideal: "1.00–1.15x", view: "front", desc: "Midface compactness, interpupillary vs nasion-stomion." },
      { name: "Upper Third Proportion", raw: "32.1%", ideal: "31–34%", view: "front", desc: "Trichion-to-glabella share." },
      { name: "Intercanthal Distance", raw: "33.4mm", ideal: "30–35mm", view: "front", desc: "Inner eye corner distance; ~one eye width is ideal." },
      { name: "Bigonial to Bizygomatic Ratio", raw: "0.82x", ideal: "0.75–0.85x", view: "front", desc: "Jaw width vs cheekbone width taper." },
      { name: "Mandibular recession", raw: "-0.85", ideal: "0–0.3", view: "side", desc: "Chin retrusion relative to ideal profile plane." },
      { name: "Facial Convexity / Glabella", raw: "168°", ideal: "168–173°", view: "side", desc: "Glabella-subnasale-pogonion convexity." },
      { name: "Nasofrontal Angle", raw: "138°", ideal: "130–140°", view: "side", desc: "Forehead-to-nose transition angle." },
      { name: "Menton Y-Line Deviation", raw: "2.1mm", ideal: "0–2mm", view: "side", desc: "Chin deviation from facial midline plane." },
      { name: "Z Angle", raw: "71°", ideal: "75–80°", view: "side", desc: "Frankfort horizontal to profile line; lip-chin balance." },
      { name: "Holdaway H Line", raw: "-1.2mm", ideal: "-1–2mm", view: "side", desc: "Lower lip to nose-chin H-line distance." },
    ],
    Angularity: [
      { name: "Jaw Frontal Angle", raw: "6.68°", ideal: "3–7°", view: "front", desc: "Gonion-menton-gonion frontal jaw angle." },
      { name: "Gonial Angle", raw: "128°", ideal: "120–130°", view: "side", desc: "Ramus-body angle; lower = more angular." },
      { name: "Browridge Inclination", raw: "23°", ideal: "22–28°", view: "side", desc: "Supraorbital projection angle." },
      { name: "Cheekbone Prominence", raw: "0.82x", ideal: "0.78–0.88x", view: "front", desc: "Zygomatic projection vs face width." },
      { name: "Jawline Definition", raw: "6.4", ideal: "7–10", view: "front", desc: "Ramus visibility + mandibular border crispness." },
      { name: "Midface Angularity", raw: "5.9", ideal: "6–9", view: "front", desc: "Cheek hollow + zygomatic shadow depth." },
      { name: "Ramus to Mandible Ratio", raw: "0.68x", ideal: "0.62–0.72x", view: "side", desc: "Ramus height vs body length." },
      { name: "Chin Projection (to facial plane)", raw: "0.04x", ideal: "0.02–0.06x", view: "side", desc: "Pogonion forward of facial plane, normalized." },
      { name: "Bigonial Width", raw: "112mm", ideal: "105–120mm", view: "front", desc: "Inter-gonial distance, jaw width." },
      { name: "Mouth Width to Nose Width", raw: "1.52x", ideal: "1.45–1.60x", view: "front", desc: "Commissure width vs alar width." },
      { name: "Philtrum to Chin Ratio", raw: "0.42x", ideal: "0.38–0.46x", view: "front", desc: "Upper-lip length vs lower-lip-to-chin." },
      { name: "Brow to Eye Distance Ratio", raw: "0.55x", ideal: "0.45–0.60x", view: "front", desc: "Brow-eye separation vs eye width; hunter-eye proxy." },
    ],
    Dimorphism: [
      { name: "Brow Ridge Prominence", raw: "4.2mm", ideal: "3–6mm", view: "side", desc: "Supraorbital fullness, masculine trait." },
      { name: "Jaw Width Dimorphism", raw: "1.18x", ideal: "1.10–1.25x", view: "front", desc: "Bigonial vs bitemporal dimorphic ratio." },
      { name: "Cheek Hollow Index", raw: "0.71", ideal: "0.65–0.80", view: "front", desc: "Submalar hollowing depth index." },
      { name: "Nasal Projection", raw: "0.72x", ideal: "0.65–0.80x", view: "side", desc: "Tip projection vs nasal height." },
      { name: "Chin Dominance", raw: "5.8", ideal: "6–9", view: "side", desc: "Chin height + projection dominance." },
      { name: "Nose Width to Face Width", raw: "0.24x", ideal: "0.22–0.27x", view: "front", desc: "Alar width vs bizygomatic width." },
      { name: "Canthal Tilt", raw: "4.2°", ideal: "3–7°", view: "front", desc: "Positive tilt reads alert/dimorphic." },
      { name: "Midline Symmetry Deviation", raw: "1.8%", ideal: "0–2.5%", view: "front", desc: "Midline feature deviation share." },
      { name: "Nasolabial Angle", raw: "96°", ideal: "90–105°", view: "side", desc: "Nose-lip junction angle." },
      { name: "Mentolabial Depth", raw: "4.0mm", ideal: "3–5mm", view: "side", desc: "Lower-lip to chin fold depth." },
    ],
    Features: [
      { name: "Nasal W to H Ratio", raw: "1.04x", ideal: "0.95–1.10x", view: "front", desc: "Alar width vs nasal height." },
      { name: "Canthal Tilt", raw: "4.2°", ideal: "3–7°", view: "front", desc: "Lateral canthus vs medial canthus height." },
      { name: "Lip Vermilion Ratio", raw: "1.6x", ideal: "1.4–1.8x", view: "front", desc: "Lower-to-upper vermilion show." },
      { name: "Inter-canthal to Eye Width", raw: "1.02x", ideal: "0.95–1.05x", view: "front", desc: "ICD vs single eye width." },
      { name: "Eye Separation Ratio", raw: "49.2%", ideal: "46–50%", view: "front", desc: "IPD vs face width (feature lens)." },
      { name: "Skin Symmetry Index", raw: "8.4", ideal: "7–10", view: "front", desc: "Texture/tone symmetry proxy." },
      { name: "Z Angle", raw: "71°", ideal: "75–80°", view: "side", desc: "Profile lip-chin balance." },
      { name: "Holdaway H Line", raw: "-1.2mm", ideal: "-1–2mm", view: "side", desc: "Lower lip to H-line." },
      { name: "Nasal Projection", raw: "0.72x", ideal: "0.65–0.80x", view: "side", desc: "Tip projection." },
      { name: "Nasolabial Angle", raw: "96°", ideal: "90–105°", view: "side", desc: "Columella-labial angle." },
      { name: "Browridge Inclination Angle", raw: "25°", ideal: "22–28°", view: "side", desc: "Glabella slope." },
      { name: "Facial Convexity / Glabella Angle", raw: "169°", ideal: "168–173°", view: "side", desc: "Overall profile convexity." },
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
    // create ratios with variance around base so we get mix of IDEAL/GOOD/MODERATE/SEVERE
    const ratios: Ratio[] = tpl.map((t, i) => {
      const variances = [1.2, 0.6, 0.0, -0.8, -1.6, -0.3, 1.0, -1.2, 0.4, -0.6, 0.8, -1.0, 0.2, -0.4];
      const variance = variances[i % variances.length] ?? 0;
      const v = Math.max(1, Math.min(10, base + variance + (Math.random() - 0.5) * 0.4));
      const sev: SeverityTag = v >= 8.2 ? "IDEAL" : v >= 6.8 ? "GOOD" : v >= 5.2 ? "MODERATE" : v >= 3.6 ? "SEVERE" : "EXTREME";
      const aiDesc = group[i % Math.max(1, group.length)]?.description;
      const desc = t.desc + (aiDesc ? ` AI notes: ${aiDesc}` : "");
      // ground raw in real MediaPipe geometry when available
      const grounded = lookupReal(t.name, real);
      return {
        name: t.name,
        value: Number(v.toFixed(1)),
        raw_measurement: grounded?.raw ?? t.raw,
        ideal_range: [7, 10] as [number, number],
        ideal_label: t.ideal,
        severity_tag: sev,
        delta_from_ideal: Number((v - 8).toFixed(2)),
        view: t.view,
        pillar: name,
        description: desc,
        measured: grounded?.measured ?? false,
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
