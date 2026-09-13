import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/celebs")({
  head: () => ({
    meta: [
      { title: "Celebs — FaceIQ Labs" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CelebsPage,
});

function CelebsPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950 px-6 py-16">
      <div className="max-w-2xl mx-auto text-center">
        <p className="text-xs tracking-widest uppercase text-zinc-400">FaceIQ Labs</p>
        <h1 className="brand-display mt-3 text-3xl tracking-tight">Celebrity harmony wiki</h1>
        <p className="mt-3 text-sm text-zinc-500">Compare your scan with a celebrity profile — coming soon in this free clone.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/dashboard" className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white dark:bg-white dark:text-zinc-900">Go to dashboard →</Link>
          <a href="/" className="rounded-full border border-zinc-200 px-6 py-3 text-sm dark:border-zinc-800">Back home</a>
        </div>
      </div>
    </main>
  );
}
