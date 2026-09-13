import { Component, type ReactNode } from "react";

/** Catches render/effect crashes and shows diagnostics instead of a blank screen. */
export class ErrorBoundary extends Component<
  { children: ReactNode; name?: string },
  { error: Error | null }
> {
  override state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  override componentDidCatch(error: Error) {
    console.error(`[ErrorBoundary:${this.props.name ?? "app"}]`, error);
  }

  override render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-6 dark:bg-zinc-950">
        <div className="w-full max-w-md rounded-2xl border border-zinc-200 p-6 text-center dark:border-zinc-800">
          <p className="text-xs tracking-widest uppercase text-zinc-400">Something broke</p>
          <h1 className="brand-display mt-2 text-xl">This view crashed</h1>
          <p className="mt-2 rounded-lg bg-zinc-50 p-3 text-left font-mono text-xs break-words text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-300">
            {error.message || String(error)}
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <button
              onClick={() => this.setState({ error: null })}
              className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white dark:bg-white dark:text-zinc-900"
            >
              Try again
            </button>
            <button
              onClick={() => {
                try {
                  localStorage.removeItem("faceiq_state_v2");
                  localStorage.removeItem("faceiq_scans");
                  localStorage.removeItem("faceiq_pending_push");
                } catch {}
                window.location.reload();
              }}
              className="rounded-full border border-zinc-200 px-5 py-2.5 text-sm dark:border-zinc-800"
            >
              Clear local data & reload
            </button>
            <a href="/" className="text-xs text-zinc-400 underline">
              Back home
            </a>
          </div>
        </div>
      </div>
    );
  }
}
