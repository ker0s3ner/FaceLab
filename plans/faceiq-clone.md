# FaceIQ Labs Clone — Phased Implementation Plan

**Source spec:** user-provided "FaceIQ Labs Clone — Product & Technical Spec" (12 sections) + landing fetch + 17 screenshots.
**Goal:** Free-unlocked clone of faceiqlabs.com dashboard (Overview, Analysis, Plan, Simulate, FaceGPT) with no paywall blur/PRO badges.

---

## Phase 0: Documentation Discovery (DONE)

**Findings consolidated from subagent:**
- Stack: TanStack Start 1.168.32, Router 1.170.18, Query 5.101.1, Supabase 2.116.0, Vite 8.1.5, Tailwind 4.2.1, framer-motion 13.2.0, zod 3.25.76 — `package.json:17-72`
- Vite config is ` @lovable.dev/vite-tanstack-config` wrapper — do not add plugins — `vite.config.ts:1-15`. Tailwind v4 via `src/styles.css:1-57` `@theme inline`.
- File-route only: `src/routes/README.md:5-18`, `src/routeTree.gen.ts` auto-generated, `src/router.tsx:8-12` `createRouter`, `src/start.ts:28-31` `attachSupabaseAuth` + CSRF.
- Auth: `src/integrations/supabase/client.ts:31-69`, `src/integrations/lovable/index.ts:15` `lovable.auth.signInWithOAuth("google")`, guarded layout `src/routes/_authenticated/route.tsx:4-12` `ssr:false + throw redirect`.
- Analyzer: `src/lib/analyze.functions.ts:49-100` `createServerFn POST` to `ai.gateway.lovable.dev` `google/gemini-3.8-flash`, `src/routes/_authenticated/dashboard.tsx:392-559` `AnalyzerWithSave` + `src/components/image-upload.tsx:15-125` + `src/components/rating-display.tsx:14-80`.
- Allowed APIs listed; anti-patterns: don't edit routeTree.gen, don't use supabase OAuth directly, don't use import.meta for LOVABLE_API_KEY, etc.

---

## Phase 1: Data Model & Global Shell

**What to implement:**
- Copy types from spec §1.1 into `src/lib/faceiq/types.ts`: `User`, `Analysis`, `Pillar` (Harmony|Angularity|Dimorphism|Features), `Ratio` (severity IDEAL/GOOD/MODERATE/SEVERE/EXTREME, view front|side, ideal_range, delta), `Treatment` (36 catalog from §1.5), `PlanAction`, `SimulationSession`. Reference `src/lib/analyze.functions.ts:9-15` AnalysisResult as base and extend.
- Copy store pattern from `src/routes/_authenticated/dashboard.tsx:34-48` `useScanHistory` localStorage hook, generalize to `src/lib/faceiq/store.ts` with `analyses`, `selectedId`, `planActions`, persist key `faceiq_state`. No DB (types.ts shows empty).
- Build global shell per spec §3: Left Sidebar ~400px collapsible (logo, user card without FREE badge, NO Upgrade Plan button, History + New + Compare, EXPLORE nav), Top Nav Tabs Overview|Analysis|Plan|Simulate|Face GPT (no PRO badges, active underline) per `src/routes/index.tsx:90-106` sticky nav pattern and `src/routes/home-ui.tsx:5-44` CtaButton style. Use `src/routes/_authenticated/route.tsx:4-12` as layout route that renders shell + `<Outlet/>`.
- Wire routing map per spec §2: `/_authenticated/dashboard/$analysisId/*` with tabs. Use `createFileRoute("/_authenticated/dashboard/$analysisId")` + children. Keep existing `/`, `/auth`, `/_authenticated/dashboard` as redirect to latest analysis or new flow.

**Docs to copy:**
- `src/routes/_authenticated/route.tsx:4-12` guard + Outlet
- `src/routes/_authenticated/dashboard.tsx:84-106` header + `34-48` localStorage hook
- `src/routes/home-ui.tsx:5-44` CtaButton/Eyebrow

**Verification:**
- `npx tsc --noEmit --skipLibCheck` passes (allow lovable import error)
- New routes appear in `routeTree.gen` after vite dev
- Shell renders on all `/dashboard/$id/*` with tabs, no PRO badges, no Upgrade button in DOM grep

**Anti-pattern guards:**
- Don't edit `routeTree.gen.ts` manually
- Don't add tailwind.config.js
- Don't use `supabase.auth.signInWithOAuth` directly

---

## Phase 2: Landing Page & Auth — Unlock Routing

**What to implement:**
- Keep current `src/routes/index.tsx:90-106` simplified sticky nav (Sign In → only) — already removes How it works/Why it works/Try Free/Dashboard per prior fix.
- Remove `#analyze` FaceAnalyzer section entirely (already done) — ensure all CTAs point to `/auth` or `/dashboard/$id` per spec "everything in dashboard".
- Update `/login` redirect handling: spec wants `/login?source=...` and `/celebs`, `/creator-league` etc as placeholder routes per §2 route map. Create stub routes with `robots noindex` and coming-soon.
- Ensure `src/routes/auth.tsx:46` `lovable.auth.signInWithOAuth("google", {redirect_uri})` handles `source` param for post-login redirect to new analysis.

**Docs to copy:**
- `src/routes/index.tsx:17-42` head SEO, `90-106` nav, `109-176` hero
- `src/routes/auth.tsx:9-41` OAuth + redirect pattern

**Verification:**
- Landing nav DOM has 1 CTA only
- No element with id="analyze" on homepage
- Auth flow redirects to dashboard

---

## Phase 3: Overview Tab (`/dashboard/$analysisId` default)

**What to implement per spec §4:**
- 4 pillar cards (Harmony/Angularity/Dimorphism/Features) equal width, all show real scores + View Ratios CTA (no lock) — copy `src/routes/home-ui.tsx:90-108` EvidenceCard pattern but as pillared cards with bar-chart icon.
- Overall Score module: large /10, descriptor, sub-tabs for 4 pillars, front+side photo cards with percentile, bell-curve placeholder — copy `src/components/rating-display.tsx:14-80` for bars.
- Key Strengths + Areas of Improvement modules with severity chips (IDEAL green, EXTREME/SEVERE red per §9), expand "Show N More" — progressive disclosure.
- Score Card module (share card preview, disclaimer checkbox gate per §4.5 — keep liability gate).
- Your Potential module: 3-col CURRENT→TARGET→POTENTIAL, range slider 0-10, front/side breakdown, TOP ACTIONS list.
- Analysis Parameters bottom: Gender/Ethnicity chips editable (calibration inputs).

**Docs to copy:**
- `src/components/rating-display.tsx:14-80` bars + colors
- `src/routes/_authenticated/dashboard.tsx:414-559` analyzer result layout
- `src/routes/home-ui.tsx:56-88` SectionTitle/SubCopy

**Verification:**
- All 4 pillars show scores, no blurred text grep "blur" absent
- No "PRO" or "🔒" in rendered HTML
- Show More toggles work

---

## Phase 4: Analysis Tab (`/dashboard/$analysisId/analysis`)

**What to implement per spec §5:**
- Sub-nav: Harmony (with Front/Side toggle) | Angularity | Dimorphism | Features
- Score summary bar: FRONT/SIDE thumbnail+score
- 3-col layout: Left large photo with landmark overlay (click-to-highlight ratio), Right ratio list with bar + value + chevron, all unlocked + Show N More. Below: Key Strengths / Areas of Improvement per pillar.
- Pillar completion progress module bottom: 4-pillars graphic, N/4 progress, CTAs Start Angularity etc for incomplete.

**Docs to copy:**
- `src/components/image-upload.tsx:15-125` photo panel
- `src/lib/faceiq/types.ts` Ratio list (seed with §1.3-1.4 names)
- `src/routes/_authenticated/dashboard.tsx` grid layout `lg:grid-cols-[340px_1fr]`

**Verification:**
- All ratios from §1.3 visible when Harmony Front selected
- No lock icons in ratio rows
- Photo overlay responds to ratio click

---

## Phase 5: Plan Tab (`/dashboard/$analysisId/plan`)

**What to implement per spec §6 (skip marketing hero, go straight to Your Plan):**
- Your Plan module: header + N actions tag, Overall/Harmony etc sub-tabs, CURRENT→TARGET/POTENTIAL, front+side pair + distribution graph (mock with percentile "Top 0.018%").
- Your Timeline: Timeline/Impact/Ratio Impact tabs, draggable re-orderable action rows (drag grip, order number, title, SURGICAL/NON-SURGICAL tag, deltas H+0.55, price, recovery, delete) + Add Actions modal over 36-treatment catalog — copy catalog from spec §1.5.
- 4-icon explainer row (Projected score / Real costs / In order / Tracked) kept as help copy.
- Remove pricing card, PRO badges, Get Pro CTAs.

**Docs to copy:**
- Treatment catalog §1.5 exhaustive list as `src/lib/faceiq/treatments.ts`
- Drag pattern: use native or `framer-motion` Reorder (already in deps) per `face-analyzer.tsx:8` AnimatePresence

**Verification:**
- 36 treatments searchable in Add Actions modal
- Reordering persists to store
- No "€49.99" price in DOM

---

## Phase 6: Simulate Tab (`/dashboard/$analysisId/simulate`)

**What to implement per spec §7:**
- Before/After viewer with vertical drag slider divider, labels BEFORE/AFTER, right sidebar treatment name + mm sliders (Advancement +8.0mm etc), Harmony before→after + Ratios Moved list (green Ideal tag).
- Full catalog browser: SURGICAL 25 / NON-SURGICAL 11 grid, clickable to load.
- Advanced panel: Left ACTIVE MOVEMENTS list (region/param + mm + edit/remove, Clear All) + ADD ANOTHER region tree (Forehead/Hairline, Brows, Orbits, Eyes, Nose, Midface, Maxilla, Jaw, BSSO, Chin) per §1.6, each with sliders + descriptions. Right dual photo viewer Front+Profile with Lines toggle, before→after scores, Play scrubber 0-100%, sortable ratio-impact table with Lowest/Highest/Improved/Declined tabs.

**Docs to copy:**
- Parameter tree §1.6 as `src/lib/faceiq/simulateParams.ts` (Brows: 6 sliders etc, Chin: Advancement/Vertical)
- Slider primitive `@/components/ui/slider`

**Verification:**
- Millimetre sliders update Ratios Moved in real time (mock morph)
- 36 treatments grid matches spec counts
- No PRO badges

---

## Phase 7: FaceGPT Tab (`/dashboard/$analysisId/facegpt`)

**What to implement per spec §8:**
- Chat interface aware of current analysis data (scores, ratios, plan). Two modes: general Q&A + Plan Mode pill.
- Trigger Simulate morphs via natural language (e.g. "make my jaw more defined" → apply jaw preset, show before/after inline).
- Ask FaceGPT links from Analysis ratio panels route here with context.

**Docs to copy:**
- `src/lib/analyze.functions.ts:49-100` serverFn pattern for chat completions (reuse gateway, new prompt)
- Existing `lovable` AI gateway pattern

**Verification:**
- Chat renders, context injection includes analysisId scores
- Natural language morph command updates Simulate state

---

## Phase 8: Verification & Polish

- Grep removals: no `blur`, `🔒`, `PRO`, `Upgrade Plan`, `FREE` badge, `€49.99`, pricing cards.
- Keep "Show N More" (legit), surgical disclaimer + checkbox gate, educational disclaimer, pillar completion nudge, gender/ethnicity inputs per §10/11.
- Run `npx tsc --noEmit`, `vite build` (expect pre-existing lovable auth external warn — ignore), manual responsive check for smushed header (Phase 1 shell), no invented APIs.
- Optional: seed ideal_range data per §12 notes (research task).

