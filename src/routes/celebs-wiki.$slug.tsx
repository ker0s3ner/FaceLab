import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/celebs-wiki/$slug")({
  head: () => ({ meta: [{ name: "robots", content: "noindex" }] }),
  component: CelebPage,
});

function CelebPage() {
  const { slug } = Route.useParams();
  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950 px-6 py-16">
      <div className="max-w-2xl mx-auto text-center">
        <p className="text-xs tracking-widest uppercase text-zinc-400">Celebs Wiki</p>
        <h1 className="brand-display mt-3 text-3xl">{slug}</h1>
        <p className="mt-3 text-sm text-zinc-500">Individual celeb analysis — placeholder.</p>
        <Link to="/celebs" className="mt-8 inline-block rounded-full border px-6 py-3 text-sm dark:border-zinc-800">Back to celebs</Link>
      </div>
    </main>
  );
}
