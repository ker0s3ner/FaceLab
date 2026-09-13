import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "Privacy — FaceIQ Labs" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <main className="min-h-screen bg-white dark:bg-zinc-950 px-6 py-16">
      <div className="max-w-2xl mx-auto">
        <h1 className="brand-display text-3xl">Privacy</h1>
        <p className="mt-3 text-sm text-zinc-500">Placeholder privacy policy — photos are deleted after analysis. No tracking.</p>
        <a href="/" className="mt-8 inline-block text-sm underline">Back home</a>
      </div>
    </main>
  ),
});
