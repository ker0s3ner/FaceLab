import { supabase } from "@/integrations/supabase/client";
import type { Analysis, FaceIQState, Pillar, PlanAction } from "./types";

// Cloud sync for cross-device scans. Gracefully degrades to local-only when
// the user is signed out or the migration hasn't been run yet (missing tables).

export type CloudStatus = "local" | "syncing" | "synced" | "error";

let cachedUserId: string | null | undefined;

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
    const analyses: Analysis[] = (scansRes.data ?? []).map((row) => ({
      id: row.client_id,
      created_at: row.created_at,
      label: row.label,
      front_photo: row.front_photo ?? "",
      side_photo: row.side_photo ?? "",
      pillars: (row.pillars as unknown as Pillar[]) ?? [],
      overall_score: Number(row.overall_score ?? 0),
      legacy_result: (row.legacy_result as unknown as Analysis["legacy_result"]) ?? undefined,
      measurements: (row.measurements as unknown as Analysis["measurements"]) ?? undefined,
      landmarkPoints: (row.landmark_points as unknown as Analysis["landmarkPoints"]) ?? undefined,
    }));
    const sRow = stateRes.data as { gender?: string; ethnicity?: string; plan_actions?: unknown } | null;
    return {
      snapshot: {
        analyses,
        planActions: Array.isArray(sRow?.plan_actions) ? (sRow.plan_actions as PlanAction[]) : [],
        gender: typeof sRow?.gender === "string" ? sRow.gender : "Male",
        ethnicity: typeof sRow?.ethnicity === "string" ? sRow.ethnicity : "White / Caucasian",
      },
      tablesMissing: false,
    };
  } catch {
    return null;
  }
}

function emptySnapshot(): CloudSnapshot {
  return { analyses: [], planActions: [], gender: "Male", ethnicity: "White / Caucasian" };
}

/** Merge cloud + local by client id (union, cloud row wins on conflict). */
export function mergeSnapshots(local: FaceIQState, cloud: CloudSnapshot): FaceIQState {
  const byId = new Map<string, Analysis>();
  for (const a of local.analyses) byId.set(a.id, a);
  for (const a of cloud.analyses) byId.set(a.id, a);
  const analyses = [...byId.values()].sort((x, y) => x.created_at.localeCompare(y.created_at));
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
  };
}

export async function pushAnalysis(a: Analysis): Promise<boolean> {
  const userId = await getUserId();
  if (!userId) return false;
  try {
    const { error } = await supabase.from("scan_analyses").upsert(
      {
        user_id: userId,
        client_id: a.id,
        created_at: a.created_at,
        label: a.label,
        front_photo: a.front_photo,
        side_photo: a.side_photo,
        pillars: a.pillars as unknown as never,
        overall_score: a.overall_score,
        legacy_result: (a.legacy_result ?? null) as never,
        measurements: (a.measurements ?? null) as never,
        landmark_points: (a.landmarkPoints ?? null) as never,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "client_id" },
    );
    if (error) return false;
    return true;
  } catch {
    return false;
  }
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

export async function pushUserState(s: Pick<FaceIQState, "gender" | "ethnicity" | "planActions">): Promise<boolean> {
  const userId = await getUserId();
  if (!userId) return false;
  try {
    const { error } = await supabase.from("user_state").upsert(
      {
        user_id: userId,
        gender: s.gender,
        ethnicity: s.ethnicity,
        plan_actions: s.planActions as unknown as never,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (error) return false;
    return true;
  } catch {
    return false;
  }
}
