import type { Ratio } from "./types";

// Confirmed ratios from spec §1.3 / §1.4
export const HARMONY_FRONT_RATIOS: Omit<Ratio, "pillar" | "view">[] = [
  { name: "Total Facial Width to Height Ratio", value: 5.66, raw_measurement: "1.43x", ideal_range: [1.3, 1.5], ideal_label: "1.32–1.50x", severity_tag: "GOOD", delta_from_ideal: 0.0 },
  { name: "Eye Separation Ratio", value: 4.2, raw_measurement: "49.17%", ideal_range: [45, 50], ideal_label: "46–50%", severity_tag: "GOOD", delta_from_ideal: 0.0 },
  { name: "Mandibular recession", value: 3.1, raw_measurement: "-0.85", ideal_range: [0, 0.5], ideal_label: "0–0.3", severity_tag: "SEVERE", delta_from_ideal: -0.85 },
  { name: "Facial Width / Lower Third", value: 4.7, raw_measurement: "-0.97", ideal_range: [0, 0.3], ideal_label: "0–0.3", severity_tag: "EXTREME", delta_from_ideal: -0.97 },
  { name: "Midface Proportion", value: 4.6, raw_measurement: "-0.95", ideal_range: [0, 0.3], ideal_label: "0–0.3", severity_tag: "EXTREME", delta_from_ideal: -0.95 },
  { name: "Upper Forehead Slope", value: 10, raw_measurement: "10.0", ideal_range: [9, 10], ideal_label: "9–10", severity_tag: "IDEAL", delta_from_ideal: 0 },
];

export const SIMULATE_RATIOS = [
  { name: "Nasal W to H ratio", before: "1.02x", after: "1.06x", tag: "Ideal" },
  { name: "Browridge Inclination Angle", before: "23°", after: "28°", tag: "Ideal" },
  { name: "Holdaway H Line", before: "-1.76mm", after: "0.2mm", tag: "Ideal" },
  { name: "Lower Lip E-Line Position", before: "5.9mm", after: "4.0mm", tag: "Ideal" },
  { name: "Z Angle", before: "71.0°", after: "79.2°", tag: "Ideal" },
  { name: "Facial Convexity / Glabella", before: "166.8°", after: "171.9°", tag: "Ideal" },
];
