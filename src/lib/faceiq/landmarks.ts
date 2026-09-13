/**
 * Client-side facial landmark extraction (MediaPipe Face Mesh, 478 points)
 * and anthropometric measurement computation.
 *
 * These measurements are sent to the AI model so its scoring is grounded in
 * real geometry instead of a pure visual impression.
 */
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

export type Point = { x: number; y: number };

export type Measurement = {
  name: string;
  value: number;
  unit: "ratio" | "deg" | "percent";
  raw: string;
};

export type FaceGeometry = {
  detected: boolean;
  measurements: Measurement[];
  /** normalized landmark points, useful for overlays */
  points?: Point[];
};

const WASM_BASE =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

let landmarkerPromise: Promise<FaceLandmarker> | null = null;

export function getFaceLandmarker(): Promise<FaceLandmarker> {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const fileset = await FilesetResolver.forVisionTasks(WASM_BASE);
      return FaceLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
        runningMode: "IMAGE",
        numFaces: 1,
        outputFaceBlendshapes: false,
        outputFacialTransformationMatrixes: false,
      });
    })().catch((err) => {
      landmarkerPromise = null;
      throw err;
    });
  }
  return landmarkerPromise;
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read the photo"));
    img.src = dataUrl;
  });
}

// --- landmark indices (MediaPipe canonical face mesh) ---
const I = {
  chin: 152,
  foreheadTop: 10,
  glabella: 9,
  nasion: 168,
  noseTip: 1,
  subnasale: 94,
  alarR: 129,
  alarL: 358,
  cheekR: 234,
  cheekL: 454,
  gonionR: 172,
  gonionL: 397,
  eyeOuterR: 33,
  eyeInnerR: 133,
  eyeInnerL: 362,
  eyeOuterL: 263,
  irisR: 468,
  irisL: 473,
  browR: 105,
  browL: 334,
  mouthR: 61,
  mouthL: 291,
  upperLip: 0,
  lowerLip: 17,
  browGlabella: 8,
} as const;

const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

function angleAt(a: Point, vertex: Point, c: Point) {
  const v1 = { x: a.x - vertex.x, y: a.y - vertex.y };
  const v2 = { x: c.x - vertex.x, y: c.y - vertex.y };
  const dot = v1.x * v2.x + v1.y * v2.y;
  const mag = Math.hypot(v1.x, v1.y) * Math.hypot(v2.x, v2.y);
  if (!mag) return 0;
  return (Math.acos(Math.max(-1, Math.min(1, dot / mag))) * 180) / Math.PI;
}

const r2 = (n: number) => Math.round(n * 100) / 100;
const r1 = (n: number) => Math.round(n * 10) / 10;

function frontMeasurements(p: Point[]): Measurement[] {
  const out: Measurement[] = [];
  const push = (name: string, value: number, unit: Measurement["unit"]) => {
    if (!Number.isFinite(value)) return;
    const v = unit === "deg" ? r1(value) : r2(value);
    out.push({
      name,
      value: v,
      unit,
      raw: unit === "deg" ? `${v}°` : unit === "percent" ? `${v}%` : `${v}x`,
    });
  };

  const faceWidth = dist(p[I.cheekR], p[I.cheekL]);
  const faceHeight = dist(p[I.foreheadTop], p[I.chin]);
  push("Total Facial Width to Height Ratio", faceWidth / faceHeight, "ratio");

  const ipd = dist(p[I.irisR] ?? p[I.eyeInnerR], p[I.irisL] ?? p[I.eyeInnerL]);
  push("Eye Separation Ratio", (ipd / faceWidth) * 100, "percent");

  const icd = dist(p[I.eyeInnerR], p[I.eyeInnerL]);
  const eyeWidth = dist(p[I.eyeOuterR], p[I.eyeInnerR]);
  push("Inter-canthal to Eye Width Ratio", icd / eyeWidth, "ratio");

  // canthal tilt: inner -> outer canthus, positive = upward tilt
  const tiltR =
    (Math.atan2(p[I.eyeInnerR].y - p[I.eyeOuterR].y, Math.abs(p[I.eyeOuterR].x - p[I.eyeInnerR].x)) *
      180) /
    Math.PI;
  const tiltL =
    (Math.atan2(p[I.eyeInnerL].y - p[I.eyeOuterL].y, Math.abs(p[I.eyeOuterL].x - p[I.eyeInnerL].x)) *
      180) /
    Math.PI;
  push("Canthal Tilt", (tiltR + tiltL) / 2, "deg");

  // facial thirds
  const upper = Math.abs(p[I.browGlabella].y - p[I.foreheadTop].y);
  const middle = Math.abs(p[I.subnasale].y - p[I.browGlabella].y);
  const lower = Math.abs(p[I.chin].y - p[I.subnasale].y);
  const total = upper + middle + lower;
  push("Upper Third Proportion", (upper / total) * 100, "percent");
  push("Middle Third Proportion", (middle / total) * 100, "percent");
  push("Lower Third Proportion", (lower / total) * 100, "percent");

  push("Bigonial to Bizygomatic Ratio", dist(p[I.gonionR], p[I.gonionL]) / faceWidth, "ratio");
  push("Nose Width to Face Width Ratio", dist(p[I.alarR], p[I.alarL]) / faceWidth, "ratio");
  push("Mouth Width to Nose Width Ratio", dist(p[I.mouthR], p[I.mouthL]) / dist(p[I.alarR], p[I.alarL]), "ratio");
  push(
    "Philtrum to Chin Ratio",
    Math.abs(p[I.upperLip].y - p[I.subnasale].y) / Math.abs(p[I.chin].y - p[I.lowerLip].y),
    "ratio",
  );
  push("Jaw Frontal Angle", angleAt(p[I.gonionR], p[I.chin], p[I.gonionL]), "deg");

  // symmetry: horizontal offset of midline features vs. cheek midpoint
  const midX = (p[I.cheekR].x + p[I.cheekL].x) / 2;
  const devs = [I.noseTip, I.subnasale, I.chin, I.glabella].map(
    (i) => Math.abs(p[i].x - midX) / faceWidth,
  );
  push("Midline Symmetry Deviation", (devs.reduce((a, b) => a + b, 0) / devs.length) * 100, "percent");

  push(
    "Brow to Eye Distance Ratio",
    ((Math.abs(p[I.browR].y - p[I.eyeOuterR].y) + Math.abs(p[I.browL].y - p[I.eyeOuterL].y)) / 2) /
      eyeWidth,
    "ratio",
  );

  return out;
}

function sideMeasurements(p: Point[]): Measurement[] {
  const out: Measurement[] = [];
  const push = (name: string, value: number, unit: Measurement["unit"]) => {
    if (!Number.isFinite(value)) return;
    const v = unit === "deg" ? r1(value) : r2(value);
    out.push({
      name,
      value: v,
      unit,
      raw: unit === "deg" ? `${v}°` : unit === "percent" ? `${v}%` : `${v}x`,
    });
  };

  push("Facial Convexity / Glabella Angle", angleAt(p[I.glabella], p[I.subnasale], p[I.chin]), "deg");
  push("Nasofrontal Angle", angleAt(p[I.glabella], p[I.nasion], p[I.noseTip]), "deg");
  push("Nasolabial Angle", angleAt(p[I.noseTip], p[I.subnasale], p[I.upperLip]), "deg");
  push("Mentolabial / Z Angle", angleAt(p[I.noseTip], p[I.chin], p[I.glabella]), "deg");

  const nasalHeight = dist(p[I.nasion], p[I.subnasale]);
  push("Nasal Projection", dist(p[I.subnasale], p[I.noseTip]) / nasalHeight, "ratio");
  push("Nasal Width to Height Ratio", dist(p[I.alarR], p[I.alarL]) / nasalHeight, "ratio");

  const faceHeight = dist(p[I.foreheadTop], p[I.chin]);
  push("Chin Projection (to facial plane)", Math.abs(p[I.chin].x - p[I.upperLip].x) / faceHeight, "ratio");
  push("Ramus to Mandible Ratio", dist(p[I.gonionL], p[I.cheekL]) / dist(p[I.gonionL], p[I.chin]), "ratio");
  push("Browridge Inclination Angle", angleAt(p[I.foreheadTop], p[I.glabella], p[I.noseTip]), "deg");

  return out;
}

async function measure(dataUrl: string, view: "front" | "side"): Promise<FaceGeometry> {
  try {
    const [landmarker, img] = await Promise.all([getFaceLandmarker(), loadImage(dataUrl)]);
    const res = landmarker.detect(img);
    const lm = res.faceLandmarks?.[0];
    if (!lm || lm.length < 468) return { detected: false, measurements: [] };

    // scale to pixel space so aspect ratio doesn't distort ratios/angles
    const pts: Point[] = lm.map((l) => ({ x: l.x * img.naturalWidth, y: l.y * img.naturalHeight }));
    return {
      detected: true,
      measurements: view === "front" ? frontMeasurements(pts) : sideMeasurements(pts),
      points: lm.map((l) => ({ x: l.x, y: l.y })),
    };
  } catch (err) {
    console.error("Landmark detection failed", err);
    return { detected: false, measurements: [] };
  }
}

export type FaceMeasurements = {
  front: Measurement[];
  side: Measurement[];
  frontDetected: boolean;
  sideDetected: boolean;
};

/** Runs landmark detection on both photos and returns anthropometric measurements. */
export async function measureFaces(
  frontImage: string,
  sideImage: string,
): Promise<FaceMeasurements> {
  const [front, side] = await Promise.all([
    measure(frontImage, "front"),
    measure(sideImage, "side"),
  ]);
  return {
    front: front.measurements,
    side: side.measurements,
    frontDetected: front.detected,
    sideDetected: side.detected,
  };
}
