import { createFileRoute } from "@tanstack/react-router";
import {
  CtaButton,
  Eyebrow,
  SectionDivider,
  SectionTitle,
  SubCopy,
  ActionRow,
  EvidenceCard,
  bylineCredits,
} from "./home-ui";

const title = "FaceIQ Labs — The Self-Improvement System for Your Appearance";
const description =
  "Analyze your face across 100+ metrics, get a personalized improvement plan, and track your progress over time. Side profile analysis is free.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "/og-image.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: "/og-image.png" },
      { name: "robots", content: "index, follow" },
      { name: "theme-color", content: "#09090b" },
    ],
    links: [
      { rel: "canonical", href: "https://faceiqlabs.com" },
      { rel: "icon", href: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
      { rel: "icon", href: "/favicon.png", sizes: "32x32", type: "image/png" },
      { rel: "icon", href: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { rel: "icon", href: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
    ],
  }),
  component: Index,
});

function NavLink({ label, href }: { label: string; href: string }) {
  return (
    <a
      href={href}
      className="group relative flex items-center text-xs tracking-wide text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors duration-200 before:pointer-events-none before:absolute before:bottom-0 before:left-0 before:h-[0.05em] before:w-full before:bg-current before:content-[''] before:origin-right before:scale-x-0 before:transition-transform before:duration-300 before:[transition-timing-function:cubic-bezier(0.4,0,0.2,1)] hover:before:origin-left hover:before:scale-x-100"
    >
      {label}
    </a>
  );
}

function HeroStats() {
  return (
    <div className="flex flex-wrap items-baseline justify-center gap-x-2 gap-y-1 sm:gap-x-3">
      <div className="flex items-center gap-0.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <svg
            key={i}
            className="w-3 h-3 text-zinc-900 dark:text-zinc-100 fill-current"
            viewBox="0 0 20 20"
            aria-hidden
          >
            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
          </svg>
        ))}
      </div>
      <span className="text-xs tracking-widest uppercase text-zinc-400 dark:text-zinc-500 tabular-nums">
        <span className="inline-flex items-center align-baseline text-zinc-900 dark:text-zinc-100 tabular-nums">
          4<span className="inline-block w-[0.2em] text-center">5</span>0<span>,</span>0
          <span>+</span>
        </span>{" "}
        users
      </span>
      <span className="text-zinc-200 dark:text-zinc-700">·</span>
      <span className="text-xs tracking-widest uppercase text-zinc-400 dark:text-zinc-500 tabular-nums">
        90<span>s</span>
      </span>
    </div>
  );
}

function Index() {
  return (
    <div className="min-h-screen bg-transparent antialiased overflow-x-hidden">
      {/* Nav — simplified: only brand + Sign In, no smushing on small screens */}
      <nav className="sticky top-0 z-50 border-b border-zinc-100 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <a
            href="/"
            className="flex items-center gap-1.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100 min-w-0 shrink-0"
          >
            <span className="brand-display text-lg leading-none">FaceIQ</span>
            <span className="hidden sm:inline text-xs font-normal tracking-widest uppercase text-zinc-400 dark:text-zinc-500">
              Labs
            </span>
          </a>

          <CtaButton href="/login?source=landing_signup" className="shrink-0 px-5 py-2.5 text-sm">
            Sign In →
          </CtaButton>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex flex-col items-center px-6 sm:px-8 md:px-16 lg:px-20 pt-16 sm:pt-20 md:pt-28 pb-20 overflow-hidden hero-light dark:hero-dark">
        {/* atmospheric background layers */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-100 dark:opacity-0 transition-opacity duration-700">
          <div
            className="absolute inset-0 bg-[radial-gradient(circle_at_16%_14%,rgba(255,255,255,0.98),transparent_18%),radial-gradient(circle_at_78%_16%,rgba(197,231,255,0.42),transparent_24%),radial-gradient(circle_at_74%_54%,rgba(186,198,255,0.22),transparent_28%),radial-gradient(circle_at_30%_84%,rgba(161,216,255,0.14),transparent_30%)]"
            aria-hidden
          />
          <div
            className="absolute left-[6%] top-[8%] h-[26rem] w-[44rem] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.74),rgba(255,255,255,0.08)_54%,transparent_74%)] opacity-80 blur-[88px]"
            aria-hidden
          />
          <div
            className="absolute right-[4%] top-[14%] h-[22rem] w-[32rem] rounded-full bg-[radial-gradient(circle,rgba(191,234,255,0.36),rgba(255,255,255,0.06)_56%,transparent_76%)] opacity-75 blur-[80px]"
            aria-hidden
          />
          <div
            className="absolute right-[10%] bottom-[8%] h-[20rem] w-[34rem] rounded-full bg-[radial-gradient(circle,rgba(198,197,255,0.24),rgba(255,255,255,0.04)_58%,transparent_76%)] opacity-70 blur-[88px]"
            aria-hidden
          />
          <div
            className="absolute inset-x-0 bottom-0 h-72 md:h-96 bg-[linear-gradient(to_top,white_0%,white_8%,rgba(255,255,255,0.92)_20%,rgba(255,255,255,0.7)_38%,rgba(255,255,255,0.4)_55%,rgba(255,255,255,0.15)_72%,transparent_100%)]"
            aria-hidden
          />
        </div>

        <div className="absolute inset-0 z-0 pointer-events-none opacity-0 dark:opacity-100 transition-opacity duration-700">
          <div
            className="absolute inset-0 bg-[radial-gradient(circle_at_16%_14%,rgba(30,30,50,0.6),transparent_18%),radial-gradient(circle_at_78%_16%,rgba(40,60,100,0.18),transparent_24%),radial-gradient(circle_at_74%_54%,rgba(50,50,100,0.12),transparent_28%),radial-gradient(circle_at_30%_84%,rgba(30,50,80,0.08),transparent_30%)]"
            aria-hidden
          />
          <div
            className="absolute left-[6%] top-[8%] h-[26rem] w-[44rem] rounded-full bg-[radial-gradient(circle,rgba(30,30,60,0.3),transparent_54%)] opacity-80 blur-[88px]"
            aria-hidden
          />
          <div
            className="absolute right-[4%] top-[14%] h-[22rem] w-[32rem] rounded-full bg-[radial-gradient(circle,rgba(40,60,100,0.15),transparent_56%)] opacity-75 blur-[80px]"
            aria-hidden
          />
          <div
            className="absolute right-[10%] bottom-[8%] h-[20rem] w-[34rem] rounded-full bg-[radial-gradient(circle,rgba(50,40,90,0.12),transparent_58%)] opacity-70 blur-[88px]"
            aria-hidden
          />
          <div
            className="absolute inset-x-0 bottom-0 h-72 md:h-96 bg-[linear-gradient(to_top,rgb(9,9,11)_0%,rgb(9,9,11)_8%,rgba(9,9,11,0.92)_20%,rgba(9,9,11,0.7)_38%,rgba(9,9,11,0.4)_55%,rgba(9,9,11,0.15)_72%,transparent_100%)]"
            aria-hidden
          />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto w-full text-center">
          <HeroStats />

          <h1 className="brand-display text-[28px] sm:text-5xl md:text-6xl tracking-tight text-zinc-900 dark:text-zinc-100 leading-[1.3] mb-8">
            Your Looks.
            <br className="hidden sm:block" />
            Measured. Tracked. Improved.
          </h1>

          <SubCopy>
            Analyze your face across 100+ metrics, get a personalized plan, and track your progress
            over time.
          </SubCopy>

          <ActionRow
            action={<CtaButton href="/login?source=landing_signup">Sign In →</CtaButton>}
            note="All analysis happens inside your dashboard."
          />
        </div>
      </section>

      {/* Trust bar */}
      <section className="relative border-t border-zinc-100 dark:border-zinc-800 py-10 bg-white dark:bg-zinc-950/40">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 md:px-16 lg:px-24 flex items-center justify-center gap-8 sm:gap-12 text-zinc-400 dark:text-zinc-500">
          {[
            {
              label: "100+ metrics",
              value: "FaceIQ Score",
            },
            {
              label: "Side profile",
              value: "Free",
            },
            {
              label: "Privacy-first",
              value: "Not stored",
            },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <div className="brand-display text-lg text-zinc-900 dark:text-zinc-100 tracking-tight">
                {item.value}
              </div>
              <div className="text-[10px] sm:text-xs tracking-widest uppercase text-zinc-400 dark:text-zinc-500 mt-1">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works - editorial single column */}
      <section
        id="how-it-works"
        className="relative py-20 md:py-28 px-8 md:px-16 lg:px-24 bg-white dark:bg-zinc-950/40"
      >
        <div className="max-w-3xl mx-auto">
          <SectionTitle eyebrow={<Eyebrow>The workflow</Eyebrow>} title="One photo at a time." />
          <SubCopy className="mt-6">
            Front. Side. That’s all we need to start mapping your face with real precision.
          </SubCopy>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-0 border-t border-zinc-200 dark:border-zinc-800">
            {[
              {
                eyebrow: "Step 1",
                title: "Upload your front photo",
                body: "Face the camera. Eyes forward. No angles, no filters.",
              },
              {
                eyebrow: "Step 2",
                title: "Add your side profile",
                body: "Turn 90 degrees. Jaw and profile reveal what the front cannot.",
              },
              {
                eyebrow: "Step 3",
                title: "Get a real breakdown",
                body: "Symmetry, bone structure, harmony, profile, and an honest overall score.",
              },
              {
                eyebrow: "Step 4",
                title: "Track the change",
                body: "Come back with new photos and watch what actually moves.",
              },
            ].map((step, i) => (
              <div
                key={i}
                className="flex flex-col items-start gap-2 p-8 sm:p-10 pt-10 text-left min-w-0"
              >
                <Eyebrow>{step.eyebrow}</Eyebrow>
                <p className="brand-display text-2xl tracking-tight text-zinc-900 dark:text-zinc-100">
                  {step.title}
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-sm">
                  {step.body}
                </p>
                {i === 0 && (
                  <div className="mt-6 flex gap-2" aria-hidden>
                    <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                    <div className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                    <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why it works - product pitch with image-free evidence */}
      <section
        id="why-it-works"
        className="relative py-20 md:py-28 px-8 md:px-16 lg:px-24 overflow-hidden hero-light dark:hero-dark"
      >
        <div className="absolute inset-0 z-0 pointer-events-none opacity-100 dark:opacity-0 transition-opacity duration-700">
          <div
            className="absolute inset-0 bg-[radial-gradient(circle_at_16%_14%,rgba(255,255,255,0.98),transparent_18%),radial-gradient(circle_at_78%_16%,rgba(197,231,255,0.42),transparent_24%),radial-gradient(circle_at_74%_54%,rgba(186,198,255,0.22),transparent_28%),radial-gradient(circle_at_30%_84%,rgba(161,216,255,0.14),transparent_30%)]"
            aria-hidden
          />
          <div
            className="absolute left-[6%] top-[8%] h-[26rem] w-[44rem] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.74),rgba(255,255,255,0.08)_54%,transparent_74%)] opacity-80 blur-[88px]"
            aria-hidden
          />
          <div
            className="absolute right-[4%] top-[14%] h-[22rem] w-[32rem] rounded-full bg-[radial-gradient(circle,rgba(191,234,255,0.36),rgba(255,255,255,0.06)_56%,transparent_76%)] opacity-75 blur-[80px]"
            aria-hidden
          />
          <div
            className="absolute right-[10%] bottom-[8%] h-[20rem] w-[34rem] rounded-full bg-[radial-gradient(circle,rgba(198,197,255,0.24),rgba(255,255,255,0.04)_58%,transparent_76%)] opacity-70 blur-[88px]"
            aria-hidden
          />
        </div>

        <div className="absolute inset-0 z-0 pointer-events-none opacity-0 dark:opacity-100 transition-opacity duration-700">
          <div
            className="absolute inset-0 bg-[radial-gradient(circle_at_16%_14%,rgba(30,30,50,0.6),transparent_18%),radial-gradient(circle_at_78%_16%,rgba(40,60,100,0.18),transparent_24%),radial-gradient(circle_at_74%_54%,rgba(50,50,100,0.12),transparent_28%),radial-gradient(circle_at_30%_84%,rgba(30,50,80,0.08),transparent_30%)]"
            aria-hidden
          />
          <div
            className="absolute left-[6%] top-[8%] h-[26rem] w-[44rem] rounded-full bg-[radial-gradient(circle,rgba(30,30,60,0.3),transparent_54%)] opacity-80 blur-[88px]"
            aria-hidden
          />
          <div
            className="absolute right-[4%] top-[14%] h-[22rem] w-[32rem] rounded-full bg-[radial-gradient(circle,rgba(40,60,100,0.15),transparent_56%)] opacity-75 blur-[80px]"
            aria-hidden
          />
          <div
            className="absolute right-[10%] bottom-[8%] h-[20rem] w-[34rem] rounded-full bg-[radial-gradient(circle,rgba(50,40,90,0.12),transparent_58%)] opacity-70 blur-[88px]"
            aria-hidden
          />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto">
          <SectionTitle eyebrow={<Eyebrow>Why FaceIQ Labs</Eyebrow>} title="Not just a score." />
          <SubCopy className="mt-6">
            Most face analyzers give you a number and stop there. We give you a map.
          </SubCopy>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-0">
            <EvidenceCard
              eyebrow="Precision"
              title="Built for faces, not selfies"
              body="Front and side angles give us the geometry a single photo hides. That matters for bone structure, profile, and proportional balance."
            />
            <EvidenceCard
              eyebrow="Honesty"
              title="Constructive, not cruel"
              body="We focus on what you can see and change — structure, balance, and proportion — instead of chasing a vague beauty score."
              accent
            />
            <EvidenceCard
              eyebrow="Privacy"
              title="Nothing is stored by default"
              body="Your photos are used for the analysis and then dropped. If you want a record, you choose that."
              accent
            />
            <EvidenceCard
              eyebrow="Continuity"
              title="Designed to be revisited"
              body="One scan is interesting. A series is useful. The point of FaceIQ Labs is to make change measurable."
            />
          </div>

          <div className="mt-16 border-t border-zinc-200 dark:border-zinc-800 pt-12 text-center">
            <div className="grid grid-cols-2 gap-10 sm:gap-16">
              <div>
                <div className="text-center">
                  <div className="text-[10px] sm:text-xs tracking-widest uppercase text-zinc-400 dark:text-zinc-500 mb-2">
                    Today
                  </div>
                  <div className="brand-display text-5xl sm:text-6xl text-zinc-300 dark:text-zinc-600 tabular-nums leading-none">
                    0.00
                  </div>
                </div>
              </div>
              <div className="flex justify-center">
                <div className="text-zinc-200 dark:text-zinc-700 text-3xl sm:text-4xl font-serif">
                  →
                </div>
              </div>
              <div>
                <div className="text-center">
                  <div className="text-[10px] sm:text-xs tracking-widest uppercase text-zinc-400 dark:text-zinc-500 mb-2">
                    Potential
                  </div>
                  <div className="brand-display text-5xl sm:text-6xl text-zinc-900 dark:text-zinc-100 tabular-nums leading-none">
                    0.00
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 h-[220px] sm:h-[300px] relative" aria-hidden>
              <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-zinc-200/40 dark:to-zinc-800/40" />
            </div>

            <ActionRow
              action={<CtaButton href="/login?source=landing_signup">See your projection →</CtaButton>}
              note="A realistic view of where you start — and where you might go."
            />
            {bylineCredits()}
          </div>
        </div>
      </section>

      {/* Closing editorial callout */}
      <section className="relative py-20 md:py-28 px-8 md:px-16 lg:px-24 overflow-hidden hero-light dark:hero-dark">
        <div className="absolute inset-0 z-0 pointer-events-none opacity-100 dark:opacity-0 transition-opacity duration-700">
          <div
            className="absolute inset-0 bg-[radial-gradient(circle_at_16%_14%,rgba(255,255,255,0.98),transparent_18%),radial-gradient(circle_at_78%_16%,rgba(197,231,255,0.42),transparent_24%),radial-gradient(circle_at_74%_54%,rgba(186,198,255,0.22),transparent_28%),radial-gradient(circle_at_30%_84%,rgba(161,216,255,0.14),transparent_30%)]"
            aria-hidden
          />
          <div
            className="absolute inset-x-0 bottom-0 h-48 bg-[linear-gradient(to_bottom,white_0%,white_10%,rgba(255,255,255,0.85)_30%,rgba(255,255,255,0.4)_60%,transparent_100%)]"
            aria-hidden
          />
          <div
            className="absolute inset-x-0 top-0 h-48 bg-[linear-gradient(to_bottom,white_0%,white_10%,rgba(255,255,255,0.85)_30%,rgba(255,255,255,0.4)_60%,transparent_100%)]"
            aria-hidden
          />
        </div>

        <div className="absolute inset-0 z-0 pointer-events-none opacity-0 dark:opacity-100 transition-opacity duration-700">
          <div
            className="absolute inset-0 bg-[radial-gradient(circle_at_16%_14%,rgba(30,30,50,0.6),transparent_18%),radial-gradient(circle_at_78%_16%,rgba(40,60,100,0.18),transparent_24%),radial-gradient(circle_at_74%_54%,rgba(50,50,100,0.12),transparent_28%),radial-gradient(circle_at_30%_84%,rgba(30,50,80,0.08),transparent_30%)]"
            aria-hidden
          />
          <div
            className="absolute inset-x-0 bottom-0 h-48 bg-[linear-gradient(to_bottom,rgb(9,9,11)_0%,rgb(9,9,11)_10%,rgba(9,9,11,0.85)_30%,rgba(9,9,11,0.4)_60%,transparent_100%)]"
            aria-hidden
          />
          <div
            className="absolute inset-x-0 top-0 h-48 bg-[linear-gradient(to_bottom,rgb(9,9,11)_0%,rgb(9,9,11)_10%,rgba(9,9,11,0.85)_30%,rgba(9,9,11,0.4)_60%,transparent_100%)]"
            aria-hidden
          />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <h2 className="brand-display text-3xl md:text-5xl lg:text-6xl tracking-tight text-zinc-900 dark:text-zinc-100 mb-6">
            Your transformation starts with a single photo.
          </h2>
          <p className="text-base text-zinc-500 dark:text-zinc-400 mb-10">
            The question is not whether you care how you look. It is whether you are willing to see
            it clearly.
          </p>
          <div className="flex justify-center">
            <CtaButton href="/login?source=landing_signup">Sign In →</CtaButton>
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-5 tracking-wide">
            Your future self will thank you.
          </p>
          {bylineCredits()}
        </div>
      </section>

      {/* closing position statement */}
      <section className="relative py-16 md:py-20 px-8 md:px-16 lg:px-24 bg-zinc-950 dark:bg-zinc-900/50 overflow-hidden">
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.03)_0%,transparent_70%)]"
          aria-hidden
        />
        <div className="relative max-w-3xl mx-auto text-center">
          <SectionDivider />
          <Eyebrow className="mt-8 mb-5">A note on who this is for</Eyebrow>
          <h2 className="brand-display text-3xl md:text-4xl tracking-tight text-zinc-100 mb-5">
            This isn’t for everyone.
          </h2>
          <p className="text-sm md:text-base text-zinc-400 leading-relaxed max-w-xl mx-auto">
            Most people see their score and do nothing. They let the number define them. The ones
            who actually transform treat it as a starting point — and commit to the process.
          </p>
          <p className="text-xs tracking-wide text-zinc-500 mt-6 font-medium">
            FaceIQ Labs is built for them.
          </p>
          <SectionDivider />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-100 dark:border-zinc-800">
        <div className="px-8 md:px-16 lg:px-24 py-12">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
            <a
              href="/"
              className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight"
            >
              <span className="brand-display text-base leading-none">FaceIQ Labs</span>
            </a>

            <div className="flex items-center gap-8">
              <NavLink label="Join Us" href="/join-us" />
              <NavLink label="Privacy" href="/privacy" />
              <NavLink label="Terms" href="/terms" />
            </div>

            <div className="text-xs text-zinc-400 dark:text-zinc-500 tracking-wide">
              © 2026 FaceIQ Labs
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
