import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const measurementSchema = z.object({
  name: z.string(),
  value: z.number(),
  unit: z.enum(["ratio", "deg", "percent"]),
  raw: z.string(),
});

const inputSchema = z.object({
  frontImage: z.string().min(1),
  sideImage: z.string().min(1),
  measurements: z
    .object({
      front: z.array(measurementSchema),
      side: z.array(measurementSchema),
    })
    .optional(),
});

export interface AnalysisResult {
  overallScore: number;
  frontScore: number;
  sideScore: number;
  breakdown: { category: string; score: number; description: string }[];
  summary: string;
  // Deep per-pillar data — AI is asked to provide this; fallback synthesized if missing
  pillars?: {
    name: "Harmony" | "Angularity" | "Dimorphism" | "Features";
    score: number;
    percentile?: string;
    ratios: { name: string; value: number; raw_measurement: string; ideal_range: [number, number]; severity: "IDEAL" | "GOOD" | "MODERATE" | "SEVERE" | "EXTREME"; delta: number; view: "front" | "side"; description: string }[];
  }[];
}

const PROMPT = `You are an expert facial analyst AI. Analyze these two photos - one front-facing portrait and one side profile - and provide a detailed, in-depth facial rating grounded in measurable anatomy.

IMPORTANT: You must respond with ONLY a valid JSON object, no other text or markdown.

Provide:
1. overallScore, frontScore, sideScore (0-10, one decimal)
2. breakdown: 5 categories Facial Symmetry, Bone Structure, Facial Harmony, Profile Aesthetics, Overall Impression with score + 1-sentence description.
3. pillars: 4 pillars (Harmony, Angularity, Dimorphism, Features), each with a pillar score (0-10) and 5-6 granular ratios. For each ratio give: name (anatomical, e.g. "Total Facial Width to Height Ratio", "Mandibular recession", "Z Angle", "Eye Separation Ratio", "Nasal Projection"), value (0-10), raw_measurement (e.g. "1.43x", "49.2%", "71°", "-0.85"), ideal_range [min,max], severity (IDEAL/GOOD/MODERATE/SEVERE/EXTREME derived from distance to ideal), delta (distance from ideal), view (front/side), and a short description of what it means. Ensure each pillar has at least one IDEAL and at least one SEVERE/EXTREME so strengths/weaknesses are non-empty. Mix front and side views per pillar.
4. summary: 2-3 sentence holistic summary, constructive and specific.

Respond with this exact JSON structure:
{
  "overallScore": 7.2,
  "frontScore": 7.5,
  "sideScore": 6.9,
  "breakdown": [
    {"category": "Facial Symmetry", "score": 7.5, "description": "Brief observation"},
    {"category": "Bone Structure", "score": 7.0, "description": "Brief observation"},
    {"category": "Facial Harmony", "score": 7.3, "description": "Brief observation"},
    {"category": "Profile Aesthetics", "score": 6.8, "description": "Brief observation"},
    {"category": "Overall Impression", "score": 7.4, "description": "Brief observation"}
  ],
  "pillars": [
    {
      "name": "Harmony",
      "score": 7.1,
      "ratios": [
        {"name": "Total Facial Width to Height Ratio", "value": 6.6, "raw_measurement": "1.43x", "ideal_range": [1.32, 1.5], "severity": "GOOD", "delta": 0.1, "view": "front", "description": "Proportional balance of width to height"},
        {"name": "Eye Separation Ratio", "value": 8.2, "raw_measurement": "49.2%", "ideal_range": [46, 50], "severity": "IDEAL", "delta": 0.0, "view": "front", "description": "Inter-pupillary distance ideal"},
        {"name": "Mandibular recession", "value": 3.1, "raw_measurement": "-0.85", "ideal_range": [0, 0.3], "severity": "SEVERE", "delta": -0.85, "view": "side", "description": "Chin retrusion relative to ideal"},
        {"name": "Facial Convexity / Glabella", "value": 5.4, "raw_measurement": "166.8°", "ideal_range": [168, 173], "severity": "MODERATE", "delta": -0.6, "view": "side", "description": "Forehead to chin convexity"}
      ]
    },
    {"name": "Angularity", "score": 6.8, "ratios": [...]},
    {"name": "Dimorphism", "score": 7.0, "ratios": [...]},
    {"name": "Features", "score": 6.5, "ratios": [...]}
  ],
  "summary": "2-3 sentence summary."
}

Be honest but constructive. Focus on objective anatomy, not vague beauty.`;

export const analyzeFace = createServerFn({ method: "POST" })
  .validator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<AnalysisResult> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI is not configured");

    // Ground scoring in real geometry if measurements were supplied
    const measurementBlock = data.measurements
      ? `\n\nMeasured anthropometry (from 478-point MediaPipe Face Mesh, pixel-scaled — use these numbers to ground your scores, do not ignore):\nFRONT: ${data.measurements.front.map((m) => `${m.name}=${m.raw} (${m.value}${m.unit})`).join("; ")}\nSIDE: ${data.measurements.side.map((m) => `${m.name}=${m.raw} (${m.value}${m.unit})`).join("; ")}\nIncorporate these into pillar ratios where names match; if a ratio has no direct measurement, estimate visually.\n`
      : "";

    const groundedPrompt = PROMPT + measurementBlock;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.8-flash",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: groundedPrompt },
              { type: "image_url", image_url: { url: data.frontImage } },
              { type: "image_url", image_url: { url: data.sideImage } },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`AI request failed [${response.status}]: ${body}`);
      if (response.status === 429) throw new Error("Too many requests. Please try again in a moment.");
      if (response.status === 402) throw new Error("AI credits exhausted. Please top up to continue.");
      throw new Error("Analysis failed. Please try again.");
    }

    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    let text = (payload.choices?.[0]?.message?.content ?? "").trim();

    if (text.startsWith("```json")) text = text.slice(7);
    else if (text.startsWith("```")) text = text.slice(3);
    if (text.endsWith("```")) text = text.slice(0, -3);
    text = text.trim();

    try {
      return JSON.parse(text) as AnalysisResult;
    } catch {
      console.error("Failed to parse AI response:", text);
      throw new Error("Failed to parse analysis results");
    }
  });
