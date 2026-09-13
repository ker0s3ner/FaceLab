import { TREATMENTS } from "./treatments";
import type { Analysis } from "./types";

// ---------------------------------------------------------------------------
// Auto-plan: worst flaws → highest-impact catalog treatments,
// plus daily habits (hydration, sleep, oral hygiene, skincare by skin type).
// Educational only — never a prescription. Steroids are never recommended.
// ---------------------------------------------------------------------------

export type SkinType = "oily" | "dry" | "combination" | "sensitive";

/** Flaw/ratio name → candidate catalog treatments (first match wins). */
const FLAW_TREATMENTS: [RegExp, string[]][] = [
  [/mandibular recession|chin projection|menton/i, ["Genioplasty", "Chin Filler", "Jawline Filler"]],
  [/convex|nasofrontal|holdaway|z angle/i, ["Non-Surgical Rhinoplasty", "Rhinoplasty", "Genioplasty"]],
  [/midface|thirds|cheek.*(hollow|prominence|leanness)/i, ["Cheek Filler", "Thread Lift", "Cheek Implants"]],
  [/width.*height|bigonial|jaw.*(width|definition|asymmetry)/i, ["Jawline Filler", "Botox Masseter", "Jaw Implants"]],
  [/eye separation|intercanthal|canthal tilt|scleral|eyelid|eye bags|dark circles|undereye|droopy|lashes/i, ["Tear Trough", "Botox Brow Lift"]],
  [/brow.*(ridge|density|asymmetry|thickness|color)/i, ["Botox Brow Lift", "Brow Lift"]],
  [/nose|nasal|nostril|alar/i, ["Non-Surgical Rhinoplasty", "Rhinoplasty"]],
  [/lip|mouth|vermilion|mentolabial/i, ["Lip Filler", "Chin Filler"]],
  [/submental|double chin|platysmal/i, ["Kybella", "Submental Liposuction"]],
  [/chin definition|chin dominance/i, ["Chin Filler", "Genioplasty"]],
  [/hair loss|thinning hair/i, ["Hair Transplant"]],
  [/forehead|hairline/i, ["Brow Lift", "Hair Transplant"]],
  [/temple/i, ["Temple Filler"]],
  [/acne scar/i, ["Cheek Filler"]],
];

/** Generate up to `max` treatment names for the worst flagged ratios. */
export function treatmentsForAnalysis(a: Analysis, existing: string[], max = 6): string[] {
  if (!a || !Array.isArray(a.pillars)) return [];
  const flagged = a.pillars
    .flatMap((p) => (Array.isArray(p?.ratios) ? p.ratios : []))
    .filter((r) => r.severity_tag === "SEVERE" || r.severity_tag === "EXTREME")
    .sort((x, y) => x.delta_from_ideal - y.delta_from_ideal);
  const picked: string[] = [];
  const have = new Set(existing);
  const catalog = new Set(TREATMENTS.map((t) => t.name));
  for (const r of flagged) {
    if (picked.length >= max) break;
    for (const [re, names] of FLAW_TREATMENTS) {
      if (!re.test(r.name)) continue;
      const choice = names.find((n) => catalog.has(n) && !have.has(n) && !picked.includes(n));
      if (choice) {
        picked.push(choice);
        break;
      }
    }
  }
  return picked;
}

export interface Habit {
  title: string;
  detail: string;
  tag: string;
}

const SKIN_TIPS: Record<SkinType, Habit[]> = {
  oily: [
    { title: "Salicylic acid cleanser", detail: "Gel cleanser with 2% salicylic acid, morning + night to control sebum.", tag: "Skincare" },
    { title: "Niacinamide serum", detail: "4–10% niacinamide helps regulate oil and refine pores.", tag: "Skincare" },
    { title: "Lightweight gel moisturizer", detail: "Oil-free gel — skipping moisturizer makes oily skin worse.", tag: "Skincare" },
  ],
  dry: [
    { title: "Cream cleanser only", detail: "Non-foaming cream cleanser; avoid hot water stripping the barrier.", tag: "Skincare" },
    { title: "Ceramide moisturizer", detail: "Ceramides + hyaluronic acid on damp skin, then seal with cream.", tag: "Skincare" },
    { title: "Humidifier at night", detail: "Dry air worsens flaking and fine lines while you sleep.", tag: "Skincare" },
  ],
  combination: [
    { title: "Zone your routine", detail: "Light gel on the T-zone, richer cream on dry cheeks.", tag: "Skincare" },
    { title: "Clay mask weekly", detail: "Clay on oily zones only, 10 minutes max.", tag: "Skincare" },
    { title: "Balanced cleanser", detail: "Gentle foaming cleanser — strong enough for oil, mild enough for cheeks.", tag: "Skincare" },
  ],
  sensitive: [
    { title: "Fragrance-free everything", detail: "Fragrance is the top irritant — keep the routine minimal.", tag: "Skincare" },
    { title: "Azelaic acid", detail: "10% azelaic acid calms redness (rosacea-type) — patch test first.", tag: "Skincare" },
    { title: "Patch test actives", detail: "Test any new product behind the ear for 48h before full face.", tag: "Skincare" },
  ],
};

/** Daily habits generated from the live analysis + skin type. */
export function habitsFor(a: Analysis, skin: SkinType): Habit[] {
  const safeSkin: SkinType =
    skin === "oily" || skin === "dry" || skin === "combination" || skin === "sensitive" ? skin : "combination";
  if (!a || !Array.isArray(a.pillars)) return [...SKIN_TIPS[safeSkin]];
  const out: Habit[] = [
    { title: "Drink 2–3L water daily", detail: "Hydration reduces puffiness and under-eye hollowness appearance.", tag: "Habit" },
    { title: "Sleep 7–9 hours", detail: "Poor sleep shows first in dark circles, eye bags and skin tone.", tag: "Habit" },
    { title: "Brush + floss twice daily", detail: "Oral posture and dental health frame the lower third; see a dentist regularly.", tag: "Habit" },
    { title: "SPF 50 every morning", detail: "Sunscreen prevents hyperpigmentation, wrinkles and rosacea flares.", tag: "Skincare" },
  ];
  const names = a.pillars.flatMap((p) => p.ratios.map((r) => r.name));
  const has = (re: RegExp) => names.some((n) => re.test(n));
  if (has(/acne/i)) {
    out.push(
      { title: "OTC acne baseline", detail: "Benzoyl peroxide or adapalene nightly; change pillowcases twice weekly.", tag: "Skincare" },
      { title: "Ask a dermatologist about tretinoin", detail: "Prescription retinoid for acne + texture — needs medical guidance, not DIY.", tag: "Skincare" },
    );
  }
  if (has(/dark circles|eye bags|undereye/i)) {
    out.push({ title: "Cold compress mornings", detail: "5 minutes cold reduces under-eye puffiness; elevate pillows at night.", tag: "Skincare" });
  }
  if (has(/hair loss|thinning/i)) {
    out.push({ title: "See a dermatologist early", detail: "Ask about minoxidil/finasteride options — earlier treatment works better.", tag: "Hair" });
  }
  if (has(/dry hair/i)) {
    out.push({ title: "Sulfate-free wash + condition", detail: "Wash 2–3x weekly, condition ends, limit heat styling.", tag: "Hair" });
  }
  if (has(/platysmal|submental|double chin/i)) {
    out.push({ title: "Cut excess sodium + alcohol", detail: "Both drive facial bloating and submental fullness day-to-day.", tag: "Habit" });
  }
  if (has(/nasolabial|forehead lines|wrinkle|crow/i)) {
    out.push({ title: "Peptide moisturizer", detail: "Signal peptides support barrier repair — manage expectations, stay consistent 8–12 weeks.", tag: "Skincare" });
  }
  out.push(...SKIN_TIPS[safeSkin]);
  return out;
}
