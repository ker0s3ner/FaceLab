import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/join-us")({
  head: () => ({ meta: [{ title: "Join Us — FaceLab" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <main className="min-h-screen bg-white dark:bg-zinc-950 px-6 py-16">
      <div className="max-w-2xl mx-auto">
        <h1 className="brand-display text-3xl">Join Us</h1>
        <p className="mt-3 text-sm text-zinc-500">Placeholder — legal/Join page per spec §2. This clone is free and unlocks everything.</p>
        <a href="/" className="mt-8 inline-block text-sm text-zinc-600 underline">Back home</a>
      </div>
    </main>
  ),
});
