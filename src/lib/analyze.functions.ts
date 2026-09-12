import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  frontImage: z.string().min(1),
  sideImage: z.string().min(1),
});

export interface AnalysisResult {
  overallScore: number;
  frontScore: number;
  sideScore: number;
  breakdown: { category: string; score: number; description: string }[];
  summary: string;
}

const PROMPT = `You are an expert facial analyst AI. Analyze these two photos - one front-facing portrait and one side profile - and provide a detailed facial rating.

IMPORTANT: You must respond with ONLY a valid JSON object, no other text or markdown.

Rate the following aspects on a scale of 1-10:
1. Facial Symmetry - How balanced and symmetrical are the facial features
2. Bone Structure - Quality of jawline, cheekbones, and facial framework
3. Facial Harmony - How well all features work together proportionally
4. Profile Aesthetics - Side profile analysis including nose, chin, and jaw angle
5. Overall Impression - General attractiveness and appeal

For each category, provide a numerical score (1-10, decimals allowed) and a brief description of what you observed.

Also provide an overall score (weighted average, emphasizing harmony and bone structure), a front score, a side score, and a 2-3 sentence summary.

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
  "summary": "2-3 sentence summary of the analysis."
}

Be honest but constructive. Focus on objective facial features rather than subjective beauty standards.`;

export const analyzeFace = createServerFn({ method: "POST" })
  .validator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<AnalysisResult> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI is not configured");

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
              { type: "text", text: PROMPT },
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
