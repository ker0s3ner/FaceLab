import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";

const title = "Sign in — FaceLab";
const description = "Sign in to FaceLab to access your account dashboard.";

export const Route = createFileRoute("/auth")({
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
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) navigate({ to: "/dashboard", replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) navigate({ to: "/dashboard", replace: true });
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  async function signIn() {
    setLoading(true);
    setError(null);
    // Preserve ?source=... per spec §2 /login?source=landing_signup
    const sp = new URLSearchParams(window.location.search);
    const source = sp.get("source");
    const redirectUri = source ? `${window.location.origin}?source=${encodeURIComponent(source)}` : window.location.origin;
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: redirectUri,
    });
    if (result.error) {
      setError("Sign in failed. Please try again.");
      setLoading(false);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-white dark:bg-zinc-950">
      <div className="w-full max-w-sm text-center">
        <h1 className="brand-display text-3xl tracking-tight text-zinc-900 dark:text-zinc-100">
          Sign in
        </h1>
        <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
          Continue with Google to access your FaceLab account.
        </p>

        <button
          type="button"
          onClick={signIn}
          disabled={loading}
          className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-5 py-3 text-sm font-medium text-zinc-900 dark:text-zinc-100 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-60"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.1-4 1.1-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24z"
            />
            <path fill="#FBBC05" d="M5.4 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.4a12 12 0 0 0 0 10.8l4-3.1z" />
            <path
              fill="#EA4335"
              d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.4 6.6l4 3.1C6.3 6.9 8.9 4.8 12 4.8z"
            />
          </svg>
          {loading ? "Opening Google…" : "Continue with Google"}
        </button>

        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

        <a
          href="/"
          className="mt-8 inline-block text-xs tracking-wide text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          Back to home
        </a>
      </div>
    </main>
  );
}
