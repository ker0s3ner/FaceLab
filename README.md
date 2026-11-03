# FaceLab

A facial analysis web app. Upload a front and a side photo and FaceLab measures facial proportions from detected landmarks, scores them across four pillars, and turns the result into a dashboard with flaws, suggested treatments and a plan.

## What it does

- **Landmark measurements.** [MediaPipe](https://ai.google.dev/edge/mediapipe) face landmarks give real geometry (ratios, angles, percentages) from each photo, with overlays drawn on the image.
- **Four pillars.** Ratios are scored 0-10 and grouped into Harmony, Angularity, Dimorphism and Features, each with front and side scores and an overall score.
- **Severity and ideal ranges.** Every ratio shows its raw measurement, the ideal range and a severity tag from `IDEAL` to `EXTREME`.
- **AI assessment.** A server function sends the photos to a Gemini model through the Lovable AI gateway for a written analysis.
- **Treatment catalog and plan.** A catalog of surgical and non-surgical options, an auto-generated plan, and a simulate view for morph previews.
- **History.** Scans are saved per account and synced through Supabase, so you can compare over time.

## Stack

| | |
|---|---|
| Framework | [TanStack Start](https://tanstack.com/start) (file-based routes, server functions) with React and TypeScript |
| Build | Vite |
| UI | Tailwind CSS v4, shadcn/ui (Radix), framer-motion |
| Vision | `@mediapipe/tasks-vision` |
| Backend | Supabase (auth, Postgres), Drizzle schema, Lovable Cloud |

## Running locally

You need Node.js and either `npm` or [Bun](https://bun.sh).

```bash
git clone https://github.com/ker0s3ner/FaceLab.git
cd FaceLab
bun install      # or: npm install
bun run dev      # or: npm run dev
```

The Supabase URL and publishable key are read from `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, plus the server-side `SUPABASE_*` equivalents). The AI assessment also needs a Lovable AI gateway key available to the server.

Other scripts: `build`, `preview`, `lint`, `format`.

## Project layout

```
src/
├── routes/            pages: landing, auth, dashboard and its tabs
├── components/        analyzer, ratio overlays, rating display, shadcn/ui
├── lib/faceiq/        landmarks, ratios, flaws, treatments, plan, morphing, store
├── lib/analyze.functions.ts   AI analysis server function
└── integrations/      Supabase and Lovable clients
supabase/migrations/   database migrations
plans/                 phased implementation plan
```

## Privacy

Photos are analyzed for the signed-in user only. See the in-app [privacy](src/routes/privacy.tsx) and [terms](src/routes/terms.tsx) pages.

## Built with Lovable

This project is connected to [Lovable](https://lovable.dev): commits pushed to `main` sync back into the Lovable editor, so avoid rewriting published history.
