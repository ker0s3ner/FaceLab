import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, Shield, Zap, Brain, ChevronDown } from "lucide-react";
import { FaceAnalyzer } from "@/components/face-analyzer";

const title = "FaceRate AI - Analyze Your Facial Features";
const description =
  "Upload your front and side profile photos to get an AI-powered facial analysis and rating from 1-10.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen">
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />

        <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-foreground">FaceRate AI</span>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <a
              href="#how-it-works"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              How it works
            </a>
            <a
              href="#analyze"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Analyze
            </a>
          </div>
        </nav>

        <div className="relative z-10 mx-auto max-w-7xl px-6 pb-24 pt-16 text-center sm:pt-24">
          <div className="mx-auto mb-6 flex w-fit items-center justify-center gap-2 rounded-full border border-border/50 bg-muted/50 px-4 py-2 text-sm backdrop-blur-sm">
            <Brain className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">Powered by Advanced AI</span>
          </div>

          <h1 className="mx-auto max-w-4xl text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
            Your Face.{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Analyzed.
            </span>{" "}
            Scored.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground sm:text-xl">
            Upload your front and side profile photos to receive an instant AI-powered facial
            analysis with detailed ratings from 1-10.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href="#analyze"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25"
            >
              <Sparkles className="h-5 w-5" />
              Start Analysis
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background/50 px-8 py-3 font-medium text-foreground backdrop-blur-sm transition-colors hover:bg-muted"
            >
              Learn More
              <ChevronDown className="h-4 w-4" />
            </a>
          </div>

          <div className="mt-16 grid grid-cols-3 gap-8 border-t border-border/50 pt-8 sm:mx-auto sm:max-w-xl">
            <div>
              <div className="text-2xl font-bold text-foreground sm:text-3xl">100+</div>
              <div className="text-sm text-muted-foreground">Metrics Analyzed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground sm:text-3xl">{"<"}10s</div>
              <div className="text-sm text-muted-foreground">Analysis Time</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground sm:text-3xl">0%</div>
              <div className="text-sm text-muted-foreground">Data Stored</div>
            </div>
          </div>
        </div>
      </header>

      <section id="how-it-works" className="border-t border-border/50 bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">How It Works</h2>
            <p className="mt-4 text-muted-foreground">
              Three simple steps to get your facial analysis
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            {[
              {
                title: "Upload Photos",
                body: "Upload a clear front-facing photo and a side profile photo for the most accurate analysis.",
              },
              {
                title: "AI Analysis",
                body: "Our advanced AI analyzes facial symmetry, bone structure, harmony, and profile aesthetics.",
              },
              {
                title: "Get Your Score",
                body: "Receive a detailed breakdown with scores from 1-10 and personalized insights about your features.",
              },
            ].map((step, i) => (
              <div
                key={step.title}
                className="group rounded-2xl bg-card p-8 shadow-sm transition-all hover:shadow-lg"
              >
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-2xl font-bold text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  {i + 1}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">{step.title}</h3>
                <p className="text-muted-foreground">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="flex items-start gap-4 rounded-xl border border-border/50 bg-card/50 p-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Instant Results</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Get your comprehensive analysis in under 10 seconds.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-xl border border-border/50 bg-card/50 p-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                <Shield className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">100% Private</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Photos are processed and immediately deleted. Never stored.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-xl border border-border/50 bg-card/50 p-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Advanced AI</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Powered by state-of-the-art vision AI for accurate analysis.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="analyze" className="bg-gradient-to-b from-muted/50 to-background py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">Start Your Analysis</h2>
            <p className="mt-4 text-muted-foreground">
              Upload your photos below to get your personalized facial rating
            </p>
          </div>

          <FaceAnalyzer />
        </div>
      </section>

      <footer className="border-t border-border/50 bg-muted/30 py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">FaceRate AI</span>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              For entertainment purposes only. Your photos are never stored.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
