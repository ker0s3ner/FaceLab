import { Link } from "@tanstack/react-router";
import type { Analysis } from "@/lib/faceiq/types";

export type DashboardTab = "overview" | "analysis" | "plan" | "simulate";

const TABS: { id: DashboardTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "analysis", label: "Analysis" },
  { id: "plan", label: "Plan" },
  { id: "simulate", label: "Simulate" },
];

export function DashboardShell({
  analyses,
  selectedId,
  onSelect,
  onNew,
  onCompare,
  compareActive,
  userName,
  userEmail,
  onSignOut,
  activeTab,
  onTabChange,
  cloudStatus = "local",
  children,
}: {
  analyses: Analysis[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onCompare: () => void;
  compareActive: boolean;
  userName: string;
  userEmail: string;
  onSignOut: () => void;
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  cloudStatus?: "local" | "syncing" | "synced" | "error";
  children: React.ReactNode;
}) {
  const canCompare = analyses.length >= 2;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex">
      {/* Left sidebar */}
      <aside className="hidden lg:flex w-[400px] shrink-0 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex h-14 items-center gap-2 border-b border-zinc-200 px-5 dark:border-zinc-800">
          <Link to="/" className="flex items-center gap-2">
            <span className="brand-display text-lg leading-none text-zinc-900 dark:text-zinc-100">FaceLab</span>
          </Link>
          <span className="ml-auto text-zinc-400">‹›</span>
        </div>

        <div className="p-4">
          <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 text-sm font-medium text-white dark:bg-white dark:text-zinc-900">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{userName}</p>
                <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{userEmail}</p>
              </div>
              <button className="text-zinc-400">⋯</button>
            </div>
          </div>
        </div>

        {/* No Upgrade Plan button — removed per spec §10 */}

        <div className="px-4 pb-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] tracking-widest uppercase text-zinc-400">History</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                cloudStatus === "synced"
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                  : cloudStatus === "syncing"
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                    : cloudStatus === "error"
                      ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                      : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
              }`}
              title={
                cloudStatus === "synced"
                  ? "Scans are backed up to your account and shared across devices"
                  : cloudStatus === "syncing"
                    ? "Syncing with your account…"
                    : "Stored on this device only — run the cloud migration to sync"
              }
            >
              {cloudStatus === "synced" ? "● Synced" : cloudStatus === "syncing" ? "○ Syncing…" : cloudStatus === "error" ? "○ Sync issue" : "○ This device"}
            </span>
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={onNew} className="flex-1 rounded-full bg-zinc-900 py-2 text-sm font-medium text-white dark:bg-white dark:text-zinc-900">+ New</button>
            <button
              onClick={onCompare}
              disabled={!canCompare}
              className={`rounded-full border px-4 py-2 text-sm font-medium ${compareActive ? "bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-900" : "border-zinc-200 bg-white text-zinc-700 disabled:opacity-40 dark:border-zinc-800 dark:text-zinc-300"}`}
            >
              ⇄ Compare
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto px-4 pb-4">
          {analyses.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-zinc-200 p-6 text-center dark:border-zinc-800">
              <p className="text-sm text-zinc-500">No analyses yet</p>
              <p className="mt-1 text-xs text-zinc-400">Start with + New</p>
            </div>
          ) : (
            <ul className="mt-2 space-y-2">
              {analyses.slice().reverse().map((a) => {
                const active = a.id === selectedId;
                const h = a.pillars.find((p) => p.name === "Harmony")?.front_score.toFixed(1) ?? "-";
                return (
                  <li key={a.id}>
                    <button
                      onClick={() => onSelect(a.id)}
                      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left ${active ? "border-zinc-900 bg-zinc-50 dark:border-white dark:bg-zinc-800" : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900"}`}
                    >
                      <img src={a.front_photo} alt="" className="h-12 w-9 rounded-lg object-cover bg-zinc-100" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs tabular-nums text-zinc-600 dark:text-zinc-300">H {h} · {a.overall_score.toFixed(1)} overall</p>
                        <p className="text-xs text-zinc-400">{a.label} · {new Date(a.created_at).toLocaleDateString()}</p>
                      </div>
                      <span className="text-zinc-400">›</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Explore removed per user request */}
      </aside>

      {/* main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* top tab bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-6 border-b border-zinc-200 bg-white px-4 sm:px-6 dark:border-zinc-800 dark:bg-zinc-900 overflow-x-auto">
          <nav className="flex items-center gap-6 shrink-0">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => onTabChange(t.id)}
                className={`relative py-3 text-sm font-medium whitespace-nowrap ${activeTab === t.id ? "text-zinc-900 dark:text-white" : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"}`}
              >
                {t.label}
                {activeTab === t.id && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-zinc-900 dark:bg-white" />}
              </button>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3 shrink-0">
            <span className="hidden sm:block truncate text-xs text-zinc-500 max-w-[160px]">{userEmail}</span>
            <button onClick={onSignOut} className="rounded-full border border-zinc-200 px-4 py-1.5 text-xs font-medium dark:border-zinc-800">Sign out</button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-zinc-50 dark:bg-zinc-950">{children}</main>
      </div>
    </div>
  );
}
