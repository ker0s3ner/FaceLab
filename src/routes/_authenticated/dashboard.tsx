import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const title = "Your dashboard — FaceIQ Labs";
const description = "Your FaceIQ Labs account dashboard.";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950 px-6 sm:px-8 md:px-16 lg:px-24 py-20">
      <div className="max-w-3xl mx-auto">
        <p className="text-[10px] sm:text-xs tracking-widest uppercase text-zinc-400 dark:text-zinc-500">
          Account
        </p>
        <h1 className="brand-display mt-3 text-3xl md:text-4xl tracking-tight text-zinc-900 dark:text-zinc-100">
          Your dashboard
        </h1>
        <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
          Signed in as{" "}
          <span className="text-zinc-900 dark:text-zinc-100">{user?.email ?? "your account"}</span>.
        </p>

        <div className="mt-10 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            This is your account space. More will live here soon.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-zinc-200 dark:border-zinc-800 px-5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900"
          >
            Back to home
          </a>
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center justify-center rounded-full bg-zinc-900 dark:bg-zinc-100 px-5 py-2.5 text-sm font-medium text-white dark:text-zinc-900 transition-opacity hover:opacity-90"
          >
            Sign out
          </button>
        </div>
      </div>
    </main>
  );
}
