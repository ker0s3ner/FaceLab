import type { Analysis, PillarName, Ratio, SeverityTag } from "./types";

// ---------------------------------------------------------------------------
// Overlay taxonomy: how the photo overlay draws for a ratio
// line   — straight segment between two landmark points, ticks at ends, raw pill at midpoint
// curve  — multi-point polyline (jaw/contour), dots at vertices
// region — translucent area shading + scattered sample dots
// angle  — vertex + two rays
// ruler  — multi-segment vertical ruler with per-segment labels (facial thirds)
// ---------------------------------------------------------------------------

export type OverlayKind = "line" | "curve" | "region" | "angle" | "ruler";

export function overlayKindFor(ratioName: string, pillar: PillarName): OverlayKind {
  const n = ratioName.toLowerCase();
  if (n.includes("third") || n.includes("proportion") || n.includes("balance")) return "ruler";
  if (
    n.includes("angle") ||
    n.includes("inclination") ||
    n.includes("convexity") ||
    n.includes("tilt") ||
    n === "brow ridge"
  )
    return "angle";
  if (
    n.includes("jaw") ||
    n.includes("submental") ||
    n.includes("mandib") ||
    n.includes("chin") ||
    n.includes("ramus") ||
    n.includes("gonial") ||
    n.includes("mentolabial") ||
    n.includes("menton")
  )
    return "curve";
  if (
    pillar === "Features" ||
    pillar === "Dimorphism" ||
    n.includes("prominence") ||
    n.includes("leanness") ||
    n.includes("fullness") ||
    n.includes("hollow") ||
    n.includes("hair") ||
    n.includes("skin") ||
    n.includes("acne") ||
    n.includes("eczema") ||
    n.includes("pigmentation") ||
    n.includes("rosacea") ||
    n.includes("sclera") ||
    n.includes("eyelid") ||
    n.includes("eyebrow") ||
    n.includes("eyelash") ||
    n.includes("asymmetry")
  )
    return "region";
  return "line";
}

// Line overlays: landmark key pairs (keys from landmarks.ts I.*)
export const LINE_DEFS: Record<string, { a: string; b: string; vertical?: boolean }> = {
  "Total Facial Width to Height Ratio": { a: "foreheadTop", b: "chin", vertical: true },
  "Eye Separation Ratio": { a: "irisR", b: "irisL" },
  "Intercanthal Distance": { a: "eyeInnerR", b: "eyeInnerL" },
  "Inter-canthal to Eye Width": { a: "eyeInnerR", b: "eyeInnerL" },
  "Inter-canthal to Eye Width Ratio": { a: "eyeInnerR", b: "eyeInnerL" },
  "Lower Third Proportion": { a: "subnasale", b: "chin", vertical: true },
  "Midface Ratio": { a: "eyeInnerR", b: "subnasale", vertical: true },
  "Upper Third Proportion": { a: "foreheadTop", b: "browGlabella", vertical: true },
  "Bigonial to Bizygomatic Ratio": { a: "cheekR", b: "cheekL" },
  "Bigonial Width": { a: "gonionR", b: "gonionL" },
  "Nose Width to Face Width": { a: "alarR", b: "alarL" },
  "Nasal W to H Ratio": { a: "alarR", b: "alarL" },
  "Nasal Width to Height Ratio": { a: "alarR", b: "alarL" },
  "Mouth Width to Nose Width": { a: "mouthR", b: "mouthL" },
  "Mouth Width to Nose Width Ratio": { a: "mouthR", b: "mouthL" },
  "Nostril Exposure": { a: "alarR", b: "alarL" },
  "Philtrum to Chin Ratio": { a: "subnasale", b: "chin", vertical: true },
  "Brow to Eye Distance Ratio": { a: "browR", b: "eyeOuterR", vertical: true },
  "Nasal Projection": { a: "subnasale", b: "noseTip" },
  "Nose Width to Face Width Ratio": { a: "alarR", b: "alarL" },
  "Scleral Show": { a: "eyeInnerR", b: "eyeOuterR" },
  "Upper Eyelid Exposure": { a: "browR", b: "eyeOuterR", vertical: true },
  "Lip Vermilion Ratio": { a: "mouthR", b: "mouthL" },
  Eyes: { a: "eyeOuterR", b: "eyeOuterL" },
  Nose: { a: "nasion", b: "noseTip", vertical: true },
  Lips: { a: "mouthR", b: "mouthL" },
  "Eyebrow Thickness": { a: "browR", b: "browL" },
};

// Angle overlays: vertex + two rays
export const ANGLE_DEFS: Record<string, { vertex: string; r1: string; r2: string }> = {
  "Brow Ridge": { vertex: "glabella", r1: "foreheadTop", r2: "nasion" },
  "Browridge Inclination": { vertex: "glabella", r1: "foreheadTop", r2: "noseTip" },
  "Browridge Inclination Angle": { vertex: "glabella", r1: "foreheadTop", r2: "noseTip" },
  "Facial Convexity / Glabella": { vertex: "subnasale", r1: "glabella", r2: "chin" },
  "Facial Convexity / Glabella Angle": { vertex: "subnasale", r1: "glabella", r2: "chin" },
  "Nasofrontal Angle": { vertex: "nasion", r1: "glabella", r2: "noseTip" },
  "Nasolabial Angle": { vertex: "subnasale", r1: "noseTip", r2: "upperLip" },
  "Z Angle": { vertex: "chin", r1: "noseTip", r2: "glabella" },
  "Mentolabial / Z Angle": { vertex: "chin", r1: "noseTip", r2: "glabella" },
  "Jaw Frontal Angle": { vertex: "chin", r1: "gonionR", r2: "gonionL" },
  "Gonial Angle": { vertex: "gonionL", r1: "cheekL", r2: "chin" },
  "Canthal Tilt": { vertex: "eyeInnerR", r1: "eyeOuterR", r2: "eyeInnerL" },
  "Holdaway H Line": { vertex: "noseTip", r1: "chin", r2: "upperLip" },
  "Jaw Definition": { vertex: "chin", r1: "gonionR", r2: "gonionL" },
};

// Curve overlays: ordered key sequences (jaw ear-to-ear etc.)
export const CURVE_DEFS: Record<string, string[]> = {
  "Jaw Definition": ["cheekR", "gonionR", "chin", "gonionL", "cheekL"],
  Jaw: ["cheekR", "gonionR", "chin", "gonionL", "cheekL"],
  "Jaw Asymmetry": ["cheekR", "gonionR", "chin", "gonionL", "cheekL"],
  "Submental Definition": ["gonionR", "chin", "gonionL"],
  "Mandibular recession": ["gonionR", "chin", "gonionL"],
  "Chin Definition": ["mouthR", "chin", "mouthL"],
  "Menton Y-Line Deviation": ["noseTip", "subnasale", "chin"],
  "Philtrum to Chin Ratio": ["subnasale", "lowerLip", "chin"],
};

// Ruler overlays: ordered keys top→bottom with segment labels
export const RULER_DEFS: Record<string, string[]> = {
  "Facial Thirds Balance": ["foreheadTop", "browGlabella", "subnasale", "chin"],
  "Lower Third Proportion": ["subnasale", "lowerLip", "chin"],
  "Upper Third Proportion": ["foreheadTop", "browGlabella", "glabella"],
  "Midface Ratio": ["browGlabella", "subnasale", "upperLip"],
  default: ["foreheadTop", "browGlabella", "subnasale", "chin"],
};

// Estimated anatomy (normalized 0–1) used when the mesh didn't detect
// (common on side profiles). Real detected keys always override these,
// so overlays draw true-to-type instead of collapsing to a box or nothing.
const EST_FRONT: Record<string, { x: number; y: number }> = {
  foreheadTop: { x: 0.5, y: 0.08 },
  browGlabella: { x: 0.5, y: 0.24 },
  glabella: { x: 0.5, y: 0.27 },
  nasion: { x: 0.5, y: 0.33 },
  noseTip: { x: 0.5, y: 0.47 },
  subnasale: { x: 0.5, y: 0.55 },
  upperLip: { x: 0.5, y: 0.63 },
  lowerLip: { x: 0.5, y: 0.68 },
  chin: { x: 0.5, y: 0.8 },
  eyeOuterR: { x: 0.33, y: 0.38 },
  eyeInnerR: { x: 0.43, y: 0.38 },
  eyeInnerL: { x: 0.57, y: 0.38 },
  eyeOuterL: { x: 0.67, y: 0.38 },
  irisR: { x: 0.38, y: 0.38 },
  irisL: { x: 0.62, y: 0.38 },
  browR: { x: 0.38, y: 0.31 },
  browL: { x: 0.62, y: 0.31 },
  alarR: { x: 0.44, y: 0.53 },
  alarL: { x: 0.56, y: 0.53 },
  cheekR: { x: 0.28, y: 0.52 },
  cheekL: { x: 0.72, y: 0.52 },
  gonionR: { x: 0.33, y: 0.68 },
  gonionL: { x: 0.67, y: 0.68 },
  mouthR: { x: 0.42, y: 0.64 },
  mouthL: { x: 0.58, y: 0.64 },
};

const EST_SIDE: Record<string, { x: number; y: number }> = {
  foreheadTop: { x: 0.55, y: 0.08 },
  browGlabella: { x: 0.52, y: 0.24 },
  glabella: { x: 0.5, y: 0.27 },
  nasion: { x: 0.46, y: 0.34 },
  noseTip: { x: 0.34, y: 0.47 },
  subnasale: { x: 0.42, y: 0.55 },
  upperLip: { x: 0.4, y: 0.62 },
  lowerLip: { x: 0.42, y: 0.67 },
  chin: { x: 0.44, y: 0.78 },
  eyeOuterR: { x: 0.48, y: 0.38 },
  eyeInnerR: { x: 0.47, y: 0.38 },
  eyeInnerL: { x: 0.47, y: 0.38 },
  eyeOuterL: { x: 0.46, y: 0.38 },
  irisR: { x: 0.475, y: 0.38 },
  irisL: { x: 0.47, y: 0.38 },
  browR: { x: 0.5, y: 0.31 },
  browL: { x: 0.49, y: 0.31 },
  alarR: { x: 0.4, y: 0.52 },
  alarL: { x: 0.41, y: 0.52 },
  cheekR: { x: 0.55, y: 0.52 },
  cheekL: { x: 0.56, y: 0.52 },
  gonionR: { x: 0.52, y: 0.66 },
  gonionL: { x: 0.53, y: 0.66 },
  mouthR: { x: 0.4, y: 0.63 },
  mouthL: { x: 0.41, y: 0.63 },
};

export function estimatedKeys(view: "front" | "side"): Record<string, { x: number; y: number }> {
  return view === "side" ? EST_SIDE : EST_FRONT;
}

export function lineDefFor(name: string): { a: string; b: string; vertical?: boolean } | null {
  return LINE_DEFS[name] ?? null;
}

export function angleDefFor(name: string): { vertex: string; r1: string; r2: string } | null {
  return ANGLE_DEFS[name] ?? null;
}

export function curveDefFor(name: string): string[] | null {
  return CURVE_DEFS[name] ?? null;
}

export function rulerDefFor(name: string): string[] {
  return RULER_DEFS[name] ?? RULER_DEFS["default"]!;
}

// ---------------------------------------------------------------------------
// Flaw / Strength hierarchy: ratios roll up into diagnostic concepts
// ---------------------------------------------------------------------------

export interface FlawDef {
  id: string;
  name: string;
  pillar: PillarName;
  what: string;
  why: string;
  ratios: string[];
}

export const FLAWS: FlawDef[] = [
  {
    id: "mandibular-recession",
    name: "Mandibular recession",
    pillar: "Harmony",
    what: "The chin sits behind the ideal profile plane — the lower jaw reads as set back relative to the upper face.",
    why: "Profile balance depends on chin projection. Recession shortens the jawline visually and flattens the side score.",
    ratios: ["Mandibular recession", "Facial Convexity / Glabella", "Z Angle", "Holdaway H Line", "Chin Projection (to facial plane)"],
  },
  {
    id: "midface-imbalance",
    name: "Midface imbalance",
    pillar: "Harmony",
    what: "The middle third of the face is out of proportion with the upper and lower thirds.",
    why: "Facial thirds near equality reads as balanced. A long or short midface shifts perceived age and harmony.",
    ratios: ["Midface Ratio", "Facial Thirds Balance", "Lower Third Proportion", "Upper Third Proportion"],
  },
  {
    id: "width-imbalance",
    name: "Width imbalance",
    pillar: "Harmony",
    what: "Face width vs height and eye spacing sit outside ideal bands.",
    why: "Width-to-height anchors overall harmony. Deviations here move every other proportion off ideal.",
    ratios: ["Total Facial Width to Height Ratio", "Bigonial to Bizygomatic Ratio", "Eye Separation Ratio", "Intercanthal Distance"],
  },
  {
    id: "profile-convexity",
    name: "Convex profile",
    pillar: "Harmony",
    what: "The side profile bows outward — glabella, nose and chin don't sit on a balanced line.",
    why: "A straighter profile with a defined nose-chin relationship scores higher on side harmony.",
    ratios: ["Facial Convexity / Glabella", "Nasofrontal Angle", "Menton Y-Line Deviation"],
  },
];

export interface StrengthDef {
  id: string;
  name: string;
  pillar: PillarName;
  what: string;
  why: string;
  ratios: string[];
}

export const STRENGTHS: StrengthDef[] = [
  {
    id: "ideal-eye-spacing",
    name: "Ideal eye spacing",
    pillar: "Harmony",
    what: "Inter-pupillary distance and inner-corner spacing sit inside ideal bands.",
    why: "Eye spacing anchors facial balance — ideal spacing lifts symmetry and harmony scores.",
    ratios: ["Eye Separation Ratio", "Intercanthal Distance"],
  },
  {
    id: "ideal-thirds",
    name: "Ideal facial thirds",
    pillar: "Harmony",
    what: "Upper, middle and lower thirds measure close to equality.",
    why: "Balanced thirds are a classic harmony marker and stabilize the overall score.",
    ratios: ["Facial Thirds Balance", "Lower Third Proportion", "Upper Third Proportion", "Midface Ratio"],
  },
  {
    id: "ideal-profile",
    name: "Ideal profile balance",
    pillar: "Harmony",
    what: "Side-profile angles sit in ideal ranges.",
    why: "A balanced profile carries the side score and much of overall impression.",
    ratios: ["Z Angle", "Holdaway H Line", "Nasofrontal Angle"],
  },
  {
    id: "ideal-width",
    name: "Ideal width harmony",
    pillar: "Harmony",
    what: "Width-to-height and taper ratios measure in ideal bands.",
    why: "Correct width framing makes every feature read as proportionate.",
    ratios: ["Total Facial Width to Height Ratio", "Bigonial to Bizygomatic Ratio"],
  },
];

export interface FlawState {
  def: FlawDef | StrengthDef;
  kind: "flaw" | "strength";
  contributing: Ratio[];
  /** point deduction from this concept (negative or 0) */
  impact: number;
  /** change vs earliest scan (progress); 0 when single scan */
  rolling: number;
  active: boolean;
}

function impactOf(ratios: Ratio[]): number {
  let sum = 0;
  for (const r of ratios) {
    if (r.severity_tag === "SEVERE" || r.severity_tag === "EXTREME") sum += r.delta_from_ideal;
  }
  return Number(sum.toFixed(2));
}

function flawImpactIn(analysis: Analysis, names: string[]): number {
  const rs = analysis.pillars.flatMap((p) => p.ratios).filter((r) => names.includes(r.name));
  return impactOf(rs);
}

/** Compute flaw/strength states for an analysis, with rolling progress vs earliest scan. */
export function flawStatesFor(
  analysis: Analysis,
  earliest: Analysis | null,
  pillarFilter?: PillarName,
): FlawState[] {
  if (!analysis || !Array.isArray(analysis.pillars)) return [];
  const all = analysis.pillars.flatMap((p) => (Array.isArray(p?.ratios) ? p.ratios : []));
  const byName = new Map(all.map((r) => [r.name, r]));
  const out: FlawState[] = [];

  const defs: { def: FlawDef | StrengthDef; kind: "flaw" | "strength" }[] = [
    ...FLAWS.map((d) => ({ def: d as FlawDef | StrengthDef, kind: "flaw" as const })),
    ...STRENGTHS.map((d) => ({ def: d as FlawDef | StrengthDef, kind: "strength" as const })),
  ];

  for (const { def, kind } of defs) {
    if (pillarFilter && def.pillar !== pillarFilter) continue;
    const contributing = def.ratios.map((n) => byName.get(n)).filter((r): r is Ratio => !!r);
    if (!contributing.length) continue;
    if (kind === "flaw") {
      const bad = contributing.filter((r) => r.severity_tag === "SEVERE" || r.severity_tag === "EXTREME");
      if (!bad.length) continue;
      const impact = impactOf(contributing);
      const rolling =
        earliest && earliest.id !== analysis.id
          ? Number((impact - flawImpactIn(earliest, def.ratios)).toFixed(2))
          : 0;
      out.push({ def, kind, contributing, impact, rolling, active: true });
    } else {
      const good = contributing.filter((r) => r.severity_tag === "IDEAL" || r.severity_tag === "GOOD");
      if (!good.length) continue;
      out.push({ def, kind, contributing, impact: 0, rolling: 0, active: true });
    }
  }

  // Single-ratio nodes for Angularity / Dimorphism / Features (region-based pillars)
  for (const p of analysis.pillars) {
    if (pillarFilter && p.name !== pillarFilter) continue;
    if (p.name === "Harmony") continue;
    for (const r of p.ratios) {
      const isBad = r.severity_tag === "SEVERE" || r.severity_tag === "EXTREME";
      const isGood = r.severity_tag === "IDEAL" || r.severity_tag === "GOOD";
      if (!isBad && !isGood) continue;
      const def: FlawDef | StrengthDef = {
        id: `${p.name}-${r.name}`,
        name: r.name,
        pillar: p.name,
        what: r.description ?? "",
        why:
          p.name === "Features"
            ? "Skin and feature clarity directly affect perceived health and attractiveness."
            : p.name === "Dimorphism"
              ? "Gendered trait balance shapes overall impression and character of the face."
              : "Bone-structure definition drives the angularity score.",
        ratios: [r.name],
      };
      const impact = isBad ? Number(r.delta_from_ideal.toFixed(2)) : 0;
      const rolling =
        isBad && earliest && earliest.id !== analysis.id
          ? Number(
              (
                impact -
                flawImpactIn(earliest, [r.name])
              ).toFixed(2),
            )
          : 0;
      out.push({ def, kind: isBad ? "flaw" : "strength", contributing: [r], impact, rolling, active: true });
    }
  }

  // Flaws first (most negative impact), then strengths
  return out.sort((a, b) => a.impact - b.impact);
}

/** Find flaws/strengths a ratio contributes to (for "Contributes to" in modal). */
export function contributorsFor(ratioName: string): { name: string; kind: "flaw" | "strength"; pillar: PillarName }[] {
  const out: { name: string; kind: "flaw" | "strength"; pillar: PillarName }[] = [];
  for (const f of FLAWS) if (f.ratios.includes(ratioName)) out.push({ name: f.name, kind: "flaw", pillar: f.pillar });
  for (const s of STRENGTHS) if (s.ratios.includes(ratioName)) out.push({ name: s.name, kind: "strength", pillar: s.pillar });
  return out;
}

// ---------------------------------------------------------------------------
// Raw-value parsing + scoring curve (score peaks at ideal midpoint, decays out)
// ---------------------------------------------------------------------------

export function parseNumbers(s: string): number[] {
  const m = s.match(/-?\d+(\.\d+)?/g);
  return m ? m.map(Number).filter((n) => Number.isFinite(n)) : [];
}

export function parseIdeal(idealLabel: string | undefined, raw: string): { min: number; max: number } {
  const iv = parseNumbers(idealLabel ?? "");
  if (iv.length >= 2) return { min: iv[0]!, max: iv[1]! };
  const rv = parseNumbers(raw);
  if (raw.includes("/10")) return { min: 7, max: 10 };
  if (raw.includes("%")) {
    const c = rv[0] ?? 50;
    return { min: Number((c - 4).toFixed(1)), max: Number((c + 4).toFixed(1)) };
  }
  if (raw.includes("°")) {
    const c = rv[0] ?? 90;
    return { min: c - 6, max: c + 6 };
  }
  if (raw.includes("mm")) {
    const c = rv[0] ?? 2;
    return { min: Number((c - 1.5).toFixed(1)), max: Number((c + 1.5).toFixed(1)) };
  }
  const c = rv[0] ?? 1;
  return { min: Number((c * 0.92).toFixed(2)), max: Number((c * 1.08).toFixed(2)) };
}

/** Non-linear scoring curve: 10 at ideal midpoint, decaying toward 0 at extremes. */
export function scoreCurveFn(idealMin: number, idealMax: number): (x: number) => number {
  const mid = (idealMin + idealMax) / 2;
  const half = Math.max(1e-6, (idealMax - idealMin) / 2);
  const width = half * 2.2;
  return (x: number) => {
    const z = (x - mid) / width;
    return Math.max(0, Math.min(10, 10 * Math.exp(-z * z * 2.2)));
  };
}

export function severityForScore(v: number): SeverityTag {
  return v >= 8.2 ? "IDEAL" : v >= 6.8 ? "GOOD" : v >= 5.2 ? "MODERATE" : v >= 3.6 ? "SEVERE" : "EXTREME";
}
