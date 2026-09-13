import { supabase } from "@/integrations/supabase/client";
import type { Analysis, FaceIQState, Pillar, PlanAction } from "./types";

// Cloud sync for cross-device scans. Gracefully degrades to local-only when
// the user is signed out or the migration hasn't been run yet (missing tables).

export type CloudStatus = "local" | "syncing" | "synced" | "error";

let cachedUserId: string | null | undefined;
let lastError: string | null = null;

export function lastCloudError(): string | null {
  return lastError;
}

const PENDING_KEY = "faceiq_pending_push";

function readPending(): string[] {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    const arr = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function writePending(ids: string[]) {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(ids));
  } catch {}
}

export function markPending(clientId: string) {
  const cur = readPending();
  if (!cur.includes(clientId)) writePending([...cur, clientId]);
}

function clearPending(clientId: string) {
  writePending(readPending().filter((x) => x !== clientId));
}

export function pendingCount(): number {
  return readPending().length;
}

export async function getUserId(): Promise<string | null> {
  if (cachedUserId !== undefined) return cachedUserId;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      cachedUserId = null;
      return null;
    }
    cachedUserId = data.user.id;
    return cachedUserId;
  } catch {
    cachedUserId = null;
    return null;
  }
}

export function resetCachedUser() {
  cachedUserId = undefined;
}

function isMissingTable(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err ?? "");
  const code = (err as { code?: string })?.code ?? "";
  return (
    code === "42P01" ||
    code === "PGRST205" ||
    msg.includes("Could not find the table") ||
    msg.includes("relation") && msg.includes("does not exist")
  );
}

type CloudSnapshot = {
  analyses: Analysis[];
  planActions: PlanAction[];
  gender: string;
  ethnicity: string;
  skinType: "oily" | "dry" | "combination" | "sensitive";
};

/** Fetch the user's cloud snapshot. Returns null when offline/signed-out/tables-missing. */
export async function fetchCloud(): Promise<{ snapshot: CloudSnapshot; tablesMissing: boolean } | null> {
  const userId = await getUserId();
  if (!userId) return null;
  try {
    const [scansRes, stateRes] = await Promise.all([
      supabase
        .from("scan_analyses")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true }),
      supabase.from("user_state").select("*").eq("user_id", userId).maybeSingle(),
    ]);
    if (scansRes.error) {
      if (isMissingTable(scansRes.error)) return { snapshot: emptySnapshot(), tablesMissing: true };
      throw scansRes.error;
    }
    if (stateRes.error) {
      if (isMissingTable(stateRes.error)) return { snapshot: emptySnapshot(), tablesMissing: true };
      throw stateRes.error;
    }
    const analyses: Analysis[] = (scansRes.data ?? []).map((row) => {
      // landmark_points may pack {front, side, keys} (keys = named points for overlays)
      const lp = row.landmark_points as unknown as
        | { front?: { x: number; y: number }[]; side?: { x: number; y: number }[]; keys?: Analysis["keyPoints"] }
        | null;
      return {
        id: row.client_id,
        created_at: row.created_at,
        label: row.label,
        front_photo: row.front_photo ?? "",
        side_photo: row.side_photo ?? "",
        pillars: (row.pillars as unknown as Pillar[]) ?? [],
        overall_score: Number(row.overall_score ?? 0),
        legacy_result: (row.legacy_result as unknown as Analysis["legacy_result"]) ?? undefined,
        measurements: (row.measurements as unknown as Analysis["measurements"]) ?? undefined,
        landmarkPoints: lp && Array.isArray(lp.front) ? { front: lp.front, side: Array.isArray(lp.side) ? lp.side : [] } : undefined,
        keyPoints: lp?.keys ?? undefined,
      };
    });
    const sRow = stateRes.data as { gender?: string; ethnicity?: string; skin_type?: string; plan_actions?: unknown } | null;
    const skin = sRow?.skin_type;
    return {
      snapshot: {
        analyses,
        planActions: Array.isArray(sRow?.plan_actions) ? (sRow.plan_actions as PlanAction[]) : [],
        gender: typeof sRow?.gender === "string" ? sRow.gender : "Male",
        ethnicity: typeof sRow?.ethnicity === "string" ? sRow.ethnicity : "White / Caucasian",
        skinType: skin === "oily" || skin === "dry" || skin === "combination" || skin === "sensitive" ? skin : "combination",
      },
      tablesMissing: false,
    };
  } catch {
    return null;
  }
}

function emptySnapshot(): CloudSnapshot {
  return { analyses: [], planActions: [], gender: "Male", ethnicity: "White / Caucasian", skinType: "combination" };
}

/** Merge cloud + local by client id. On conflict prefer the copy that still has photos. */
export function mergeSnapshots(local: FaceIQState, cloud: CloudSnapshot): FaceIQState {
  const hasPhotos = (a: Analysis) => !!(a.front_photo || a.side_photo);
  const sane = (a: Analysis) =>
    !!a && typeof a.id === "string" && Array.isArray(a.pillars) && a.pillars.length > 0;
  const byId = new Map<string, Analysis>();
  for (const a of local.analyses) if (sane(a)) byId.set(a.id, a);
  for (const a of cloud.analyses) {
    if (!sane(a)) continue;
    const prev = byId.get(a.id);
    if (prev && hasPhotos(prev) && !hasPhotos(a)) continue;
    byId.set(a.id, a);
  }
  const analyses = [...byId.values()].sort((x, y) =>
    String(x.created_at ?? "").localeCompare(String(y.created_at ?? "")),
  );
  const selectedId =
    (local.selectedId && byId.has(local.selectedId) ? local.selectedId : null) ??
    analyses[analyses.length - 1]?.id ??
    null;
  // Plan actions: union by treatment name, keep local order then cloud extras
  const seen = new Set(local.planActions.map((p) => p.treatment));
  const planActions = [
    ...local.planActions,
    ...cloud.planActions.filter((p) => !seen.has(p.treatment)),
  ].map((p, i) => ({ ...p, order_index: i }));
  return {
    analyses,
    selectedId,
    planActions,
    gender: local.gender !== "Male" ? local.gender : cloud.gender,
    ethnicity: local.ethnicity !== "White / Caucasian" ? local.ethnicity : cloud.ethnicity,
    skinType: local.skinType !== "combination" ? local.skinType : cloud.skinType,
  };
}

export async function pushAnalysis(a: Analysis): Promise<boolean> {
  const userId = await getUserId();
  if (!userId) {
    lastError = "Not signed in";
    return false;
  }
  try {
    // Shrink oversized legacy photos before upload so big rows can't fail sync
    let front = a.front_photo;
    let side = a.side_photo;
    if (front.length > 600_000 || side.length > 600_000) {
      try {
        const { downscalePhoto } = await import("./landmarks");
        [front, side] = await Promise.all([downscalePhoto(front, 768, 0.78), downscalePhoto(side, 768, 0.78)]);
      } catch {}
    }
    const { error } = await supabase.from("scan_analyses").upsert(
      {
        user_id: userId,
        client_id: a.id,
        created_at: a.created_at,
        label: a.label,
        front_photo: front,
        side_photo: side,
        pillars: a.pillars as unknown as never,
        overall_score: a.overall_score,
        legacy_result: (a.legacy_result ?? null) as never,
        measurements: (a.measurements ?? null) as never,
        landmark_points: (a.landmarkPoints || a.keyPoints
          ? ({ ...(a.landmarkPoints ?? { front: [], side: [] }), ...(a.keyPoints ? { keys: a.keyPoints } : {}) } as never)
          : null) as never,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "client_id" },
    );
    if (error) {
      lastError = error.message;
      markPending(a.id);
      return false;
    }
    clearPending(a.id);
    return true;
  } catch (e) {
    lastError = e instanceof Error ? e.message : "Upload failed";
    markPending(a.id);
    return false;
  }
}

/** Push one full local state snapshot (manual Sync + reconnect). */
export async function syncAll(s: FaceIQState): Promise<{ pushed: number; failed: number; error: string | null }> {
  const userId = await getUserId();
  if (!userId) {
    lastError = "Not signed in";
    return { pushed: 0, failed: s.analyses.length, error: lastError };
  }
  let pushed = 0;
  let failed = 0;
  for (const a of s.analyses) {
    if (await pushAnalysis(a)) pushed++;
    else failed++;
  }
  const okState = await pushUserState({ gender: s.gender, ethnicity: s.ethnicity, skinType: s.skinType, planActions: s.planActions });
  if (!okState) failed++;
  return { pushed, failed, error: failed ? lastError : null };
}

/** Retry queued uploads for analyses present in state. Returns remaining count. */
export async function retryPending(lookup: (id: string) => Analysis | undefined): Promise<number> {
  const ids = readPending();
  for (const id of ids) {
    const a = lookup(id);
    if (!a) {
      clearPending(id);
      continue;
    }
    await pushAnalysis(a);
  }
  return readPending().length;
}

export async function deleteAnalysis(clientId: string): Promise<void> {
  const userId = await getUserId();
  if (!userId) return;
  try {
    await supabase.from("scan_analyses").delete().eq("user_id", userId).eq("client_id", clientId);
  } catch {
    // local-only fallback
  }
}

export async function clearAnalyses(): Promise<void> {
  const userId = await getUserId();
  if (!userId) return;
  try {
    await supabase.from("scan_analyses").delete().eq("user_id", userId);
  } catch {
    // ignore
  }
}

export async function pushUserState(s: Pick<FaceIQState, "gender" | "ethnicity" | "skinType" | "planActions">): Promise<boolean> {
  const userId = await getUserId();
  if (!userId) {
    lastError = "Not signed in";
    return false;
  }
  try {
    const { error } = await supabase.from("user_state").upsert(
      {
        user_id: userId,
        gender: s.gender,
        ethnicity: s.ethnicity,
        skin_type: s.skinType,
        plan_actions: s.planActions as unknown as never,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (error) {
      // Back-compat: skin_type column may not exist yet (migration 2 not run)
      if (/skin_type/i.test(error.message)) {
        const retry = await supabase.from("user_state").upsert(
          {
            user_id: userId,
            gender: s.gender,
            ethnicity: s.ethnicity,
            plan_actions: s.planActions as unknown as never,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        );
        if (retry.error) {
          lastError = retry.error.message;
          return false;
        }
        return true;
      }
      lastError = error.message;
      return false;
    }
    return true;
  } catch (e) {
    lastError = e instanceof Error ? e.message : "Upload failed";
    return false;
  }
}
