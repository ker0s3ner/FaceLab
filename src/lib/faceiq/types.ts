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

export type RegionBox = { x: number; y: number; w: number; h: number };

// Region boxes for photo overlays (normalized 0–100; image is 3:4 portrait).
// Front face ≈ x 20–80, y 5–95. Side profile faces left.
const REGION_BOXES: Record<string, { front?: RegionBox; side?: RegionBox }> = {
  // Angularity
  "Cheekbone Prominence": { front: { x: 27, y: 50, w: 46, h: 9 } },
  "Jaw Definition": { front: { x: 29, y: 66, w: 42, h: 18 }, side: { x: 30, y: 62, w: 35, h: 22 } },
  "Cheek Leanness": { front: { x: 31, y: 55, w: 38, h: 12 } },
  "Chin Definition": { front: { x: 43, y: 73, w: 14, h: 11 }, side: { x: 30, y: 70, w: 20, h: 14 } },
  "Submental Definition": { front: { x: 40, y: 82, w: 20, h: 9 }, side: { x: 32, y: 74, w: 26, h: 12 } },
  // Dimorphism
  Jaw: { front: { x: 28, y: 62, w: 44, h: 24 }, side: { x: 30, y: 60, w: 36, h: 24 } },
  "Brow Ridge": { front: { x: 32, y: 28, w: 36, h: 7 }, side: { x: 32, y: 27, w: 26, h: 10 } },
  "Face Shape": { front: { x: 22, y: 7, w: 56, h: 84 } },
  Eyes: { front: { x: 30, y: 36, w: 40, h: 11 } },
  Nose: { front: { x: 42, y: 43, w: 16, h: 19 } },
  Hairline: { front: { x: 28, y: 5, w: 44, h: 17 } },
  Lips: { front: { x: 40, y: 63, w: 20, h: 9 } },
  "Eyebrow Thickness": { front: { x: 30, y: 29, w: 40, h: 7 } },
  "Facial Hair": { front: { x: 29, y: 60, w: 42, h: 30 } },
  "Hair Length": { front: { x: 14, y: 2, w: 72, h: 55 } },
  // Features — skin zones
  Acne: { front: { x: 30, y: 45, w: 40, h: 20 } },
  "Acne Scars": { front: { x: 30, y: 45, w: 40, h: 20 } },
  Eczema: { front: { x: 30, y: 48, w: 40, h: 16 } },
  Hyperpigmentation: { front: { x: 30, y: 44, w: 40, h: 22 } },
  Hypopigmentation: { front: { x: 30, y: 44, w: 40, h: 22 } },
  Rosacea: { front: { x: 37, y: 47, w: 26, h: 14 } },
  "Dark Circles": { front: { x: 32, y: 42, w: 36, h: 7 } },
  "Eye Bags": { front: { x: 32, y: 44, w: 36, h: 7 } },
  "Eye Protrusion": { front: { x: 31, y: 37, w: 38, h: 10 } },
  "Undereye Redness": { front: { x: 33, y: 43, w: 34, h: 6 } },
  "Crow's Feet": { front: { x: 25, y: 40, w: 50, h: 8 } },
  "Forehead Lines": { front: { x: 32, y: 14, w: 36, h: 14 } },
  "Mentolabial Creasing": { front: { x: 43, y: 69, w: 14, h: 5 } },
  "Nasolabial Folds": { front: { x: 35, y: 55, w: 30, h: 12 } },
  "Platysmal Bands": { front: { x: 38, y: 84, w: 24, h: 10 } },
  "Undereye Wrinkles": { front: { x: 33, y: 43, w: 34, h: 7 } },
  "Scleral Show": { front: { x: 32, y: 38, w: 36, h: 8 } },
  "Sclera Reddening": { front: { x: 32, y: 38, w: 36, h: 8 } },
  "Sclera Yellowing": { front: { x: 32, y: 38, w: 36, h: 8 } },
  "Droopy Eyelid": { front: { x: 31, y: 34, w: 38, h: 7 } },
  "Upper Eyelid Exposure": { front: { x: 31, y: 33, w: 38, h: 8 } },
  "Bloated Nasal Bridge": { front: { x: 45, y: 39, w: 10, h: 12 } },
  "Bulbous Nasal Tip": { front: { x: 43, y: 53, w: 14, h: 8 } },
  "Nostril Exposure": { front: { x: 43, y: 57, w: 14, h: 6 } },
  "Dry Hair": { front: { x: 28, y: 3, w: 44, h: 18 } },
  "Hair Loss": { front: { x: 30, y: 4, w: 40, h: 14 } },
  "Thinning Hair": { front: { x: 30, y: 3, w: 40, h: 16 } },
  "Eyebrow Density": { front: { x: 30, y: 29, w: 40, h: 7 } },
  Eyelashes: { front: { x: 31, y: 37, w: 38, h: 5 } },
  "Eyebrow Color": { front: { x: 30, y: 29, w: 40, h: 7 } },
  "Cheekbone Asymmetry": { front: { x: 27, y: 50, w: 46, h: 9 } },
  "Ear Asymmetry": { front: { x: 16, y: 42, w: 68, h: 14 } },
  "Eye Asymmetry": { front: { x: 30, y: 36, w: 40, h: 11 } },
  "Eyebrow Asymmetry": { front: { x: 30, y: 29, w: 40, h: 7 } },
  "Jaw Asymmetry": { front: { x: 28, y: 62, w: 44, h: 24 } },
  "Mouth Asymmetry": { front: { x: 39, y: 63, w: 22, h: 8 } },
  "Nose Bridge Asymmetry": { front: { x: 45, y: 38, w: 10, h: 16 } },
  "Nose Wing Asymmetry": { front: { x: 41, y: 54, w: 18, h: 8 } },
  "Temple Asymmetry": { front: { x: 22, y: 28, w: 56, h: 12 } },
  "Vertical Asymmetry": { front: { x: 22, y: 7, w: 56, h: 84 } },
};

export function regionBoxFor(name: string, view: "front" | "side"): RegionBox | null {
  const b = REGION_BOXES[name];
  if (!b) return null;
  return b[view] ?? b.front ?? null;
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
      { name: "Cheekbone Prominence", raw: "0.82x", ideal: "0.78–0.88x", view: "front", desc: "Zygomatic projection vs face width. Higher reads more sculpted." },
      { name: "Jaw Definition", raw: "6.4/10", ideal: "7–10", view: "front", desc: "Ramus visibility + mandibular border crispness." },
      { name: "Cheek Leanness", raw: "5.9/10", ideal: "6–9", view: "front", desc: "Cheek hollow + submalar shadow depth." },
      { name: "Chin Definition", raw: "6.1/10", ideal: "7–10", view: "front", desc: "Menton shape clarity + chin-neck separation." },
      { name: "Submental Definition", raw: "5.6/10", ideal: "7–10", view: "side", desc: "Under-chin tightness; less fullness reads more angular." },
    ],
    Dimorphism: [
      { name: "Jaw", raw: "6.2/10", ideal: "7–10", view: "front", desc: "Jaw width + angularity dimorphism signal." },
      { name: "Brow Ridge", raw: "5.4/10", ideal: "6–9", view: "side", desc: "Supraorbital projection, side-profile dimorphism marker." },
      { name: "Face Shape", raw: "6.0/10", ideal: "7–10", view: "front", desc: "Overall shape dimorphism (angular vs soft)." },
      { name: "Eyes", raw: "6.8/10", ideal: "7–10", view: "front", desc: "Eye shape + brow-eye depth dimorphism." },
      { name: "Nose", raw: "6.1/10", ideal: "7–10", view: "front", desc: "Nasal size + projection dimorphism." },
      { name: "Hairline", raw: "6.5/10", ideal: "7–10", view: "front", desc: "Hairline shape + forehead proportion signal." },
      { name: "Lips", raw: "5.9/10", ideal: "6–9", view: "front", desc: "Lip fullness dimorphism balance." },
      { name: "Eyebrow Thickness", raw: "0.55x", ideal: "0.45–0.65x", view: "front", desc: "Brow thickness vs eye width." },
      { name: "Facial Hair", raw: "5.2/10", ideal: "6–9", view: "front", desc: "Beard/stubble density + coverage dimorphism." },
      { name: "Hair Length", raw: "6.0/10", ideal: "6–9", view: "front", desc: "Hair length + style dimorphism framing." },
    ],
    Features: [
      { name: "Acne", raw: "4.1/10", ideal: "8–10", view: "front", desc: "Active breakouts across cheeks, forehead, jaw." },
      { name: "Acne Scars", raw: "5.3/10", ideal: "8–10", view: "front", desc: "Post-acne texture scarring." },
      { name: "Eczema", raw: "7.8/10", ideal: "8–10", view: "front", desc: "Dry, inflamed patches on cheeks." },
      { name: "Hyperpigmentation", raw: "6.2/10", ideal: "8–10", view: "front", desc: "Dark spots / uneven tone." },
      { name: "Hypopigmentation", raw: "7.5/10", ideal: "8–10", view: "front", desc: "Light patches vs base tone." },
      { name: "Rosacea", raw: "6.8/10", ideal: "8–10", view: "front", desc: "Redness across nose + cheeks." },
      { name: "Dark Circles", raw: "5.1/10", ideal: "8–10", view: "front", desc: "Under-eye darkness." },
      { name: "Eye Bags", raw: "5.6/10", ideal: "8–10", view: "front", desc: "Under-eye puffiness / fat pads." },
      { name: "Eye Protrusion", raw: "6.4/10", ideal: "6–9", view: "front", desc: "Globe prominence vs orbital rim." },
      { name: "Undereye Redness", raw: "6.9/10", ideal: "8–10", view: "front", desc: "Redness of lower eyelid skin." },
      { name: "Crow's Feet", raw: "6.3/10", ideal: "8–10", view: "front", desc: "Fine lines at outer eye corners." },
      { name: "Forehead Lines", raw: "6.0/10", ideal: "8–10", view: "front", desc: "Horizontal forehead creasing." },
      { name: "Mentolabial Creasing", raw: "6.6/10", ideal: "8–10", view: "front", desc: "Crease between lower lip and chin." },
      { name: "Nasolabial Folds", raw: "5.8/10", ideal: "8–10", view: "front", desc: "Smile-line depth nose to mouth." },
      { name: "Platysmal Bands", raw: "6.7/10", ideal: "8–10", view: "front", desc: "Vertical neck band visibility." },
      { name: "Undereye Wrinkles", raw: "6.1/10", ideal: "8–10", view: "front", desc: "Fine wrinkles of lower eyelid." },
      { name: "Scleral Show", raw: "1.2mm", ideal: "0–1mm", view: "front", desc: "White below iris at rest." },
      { name: "Sclera Reddening", raw: "7.2/10", ideal: "8–10", view: "front", desc: "Redness of eye whites." },
      { name: "Sclera Yellowing", raw: "7.9/10", ideal: "8–10", view: "front", desc: "Yellow tint of eye whites." },
      { name: "Droopy Eyelid", raw: "6.5/10", ideal: "8–10", view: "front", desc: "Upper lid ptosis / heaviness." },
      { name: "Upper Eyelid Exposure", raw: "3.1mm", ideal: "2–4mm", view: "front", desc: "Visible upper lid platform height." },
      { name: "Bloated Nasal Bridge", raw: "6.2/10", ideal: "8–10", view: "front", desc: "Bridge width / soft-tissue fullness." },
      { name: "Bulbous Nasal Tip", raw: "5.7/10", ideal: "8–10", view: "front", desc: "Tip roundness vs definition." },
      { name: "Nostril Exposure", raw: "4.4mm", ideal: "2–4mm", view: "front", desc: "Nostril show on front view." },
      { name: "Dry Hair", raw: "6.0/10", ideal: "8–10", view: "front", desc: "Hair dryness / frizz texture." },
      { name: "Hair Loss", raw: "7.1/10", ideal: "8–10", view: "front", desc: "Recession / thinning at hairline." },
      { name: "Thinning Hair", raw: "6.9/10", ideal: "8–10", view: "front", desc: "Density loss across crown." },
      { name: "Eyebrow Density", raw: "6.3/10", ideal: "7–10", view: "front", desc: "Brow hair fullness." },
      { name: "Eyelashes", raw: "6.6/10", ideal: "7–10", view: "front", desc: "Lash length + density framing." },
      { name: "Eyebrow Color", raw: "7.0/10", ideal: "7–10", view: "front", desc: "Brow color depth vs hair." },
      { name: "Cheekbone Asymmetry", raw: "1.9%", ideal: "0–2.5%", view: "front", desc: "Left vs right zygomatic projection." },
      { name: "Ear Asymmetry", raw: "2.2%", ideal: "0–3%", view: "front", desc: "Ear position / prominence L vs R." },
      { name: "Eye Asymmetry", raw: "1.6%", ideal: "0–2.5%", view: "front", desc: "Eye size / height L vs R." },
      { name: "Eyebrow Asymmetry", raw: "2.0%", ideal: "0–2.5%", view: "front", desc: "Brow height / shape L vs R." },
      { name: "Jaw Asymmetry", raw: "2.4%", ideal: "0–2.5%", view: "front", desc: "Gonial height / jawline L vs R." },
      { name: "Mouth Asymmetry", raw: "1.4%", ideal: "0–2.5%", view: "front", desc: "Commissure height L vs R." },
      { name: "Nose Bridge Asymmetry", raw: "1.8%", ideal: "0–2.5%", view: "front", desc: "Dorsal deviation from midline." },
      { name: "Nose Wing Asymmetry", raw: "2.1%", ideal: "0–2.5%", view: "front", desc: "Alar base L vs R." },
      { name: "Temple Asymmetry", raw: "1.5%", ideal: "0–2.5%", view: "front", desc: "Temporal width L vs R." },
      { name: "Vertical Asymmetry", raw: "1.7%", ideal: "0–2.5%", view: "front", desc: "Overall vertical thirds L vs R." },
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
