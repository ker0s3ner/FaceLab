import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "Terms — FaceIQ Labs" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <main className="min-h-screen bg-white dark:bg-zinc-950 px-6 py-16">
      <div className="max-w-2xl mx-auto">
        <h1 className="brand-display text-3xl">Terms</h1>
        <p className="mt-3 text-sm text-zinc-500">Educational only — surgical options require professional consultation. No endorsement.</p>
        <a href="/" className="mt-8 inline-block text-sm underline">Back home</a>
      </div>
    </main>
  ),
});
