import type { AppState } from "./store";

/**
 * Conflict-resistant merge for multi-device sync.
 *
 * Strategy:
 *  - Collections are merged by stable id (union), so nothing a device created
 *    is ever lost. When both sides have the same id, the newer record wins
 *    (using its own timestamp when it has one, otherwise the newer snapshot).
 *  - Scalars/objects (profile, streak settings) come from the newer snapshot.
 *  - Badge unlocks are unioned — an achievement earned anywhere is kept.
 */

type Rec = Record<string, unknown>;

function ts(v: unknown, keys: string[]): number {
  const r = v as Rec;
  for (const k of keys) {
    const raw = r?.[k];
    if (typeof raw === "string") {
      const t = Date.parse(raw);
      if (!Number.isNaN(t)) return t;
    }
  }
  return 0;
}

function mergeById<T>(
  local: T[] = [],
  remote: T[] = [],
  idKey: string,
  tsKeys: string[],
  localNewer: boolean,
): T[] {
  const out = new Map<string, T>();
  for (const item of remote) {
    const id = String((item as Rec)?.[idKey] ?? "");
    if (id) out.set(id, item);
  }
  for (const item of local) {
    const id = String((item as Rec)?.[idKey] ?? "");
    if (!id) continue;
    const existing = out.get(id);
    if (!existing) { out.set(id, item); continue; }
    const a = ts(item, tsKeys);
    const b = ts(existing, tsKeys);
    if (a > b || (a === b && localNewer)) out.set(id, item);
  }
  return Array.from(out.values());
}

export function mergeStates(local: AppState, remote: Partial<AppState>): AppState {
  const localRev = local.rev ?? 0;
  const remoteRev = remote.rev ?? 0;
  const localNewer = localRev >= remoteRev;
  const newest = <T>(a: T, b: T | undefined) => (localNewer || b === undefined ? a : b);

  return {
    ...local,
    profile: newest(local.profile, remote.profile ?? undefined),
    streakSettings: newest(local.streakSettings, remote.streakSettings),
    badges: {
      unlocked: Array.from(new Set([...(local.badges?.unlocked ?? []), ...(remote.badges?.unlocked ?? [])])),
    },
    tasks: mergeById(local.tasks, remote.tasks, "id", ["completedAt", "deadline"], localNewer),
    timetable: mergeById(local.timetable, remote.timetable, "id", [], localNewer),
    notes: mergeById(local.notes, remote.notes, "id", ["updatedAt", "createdAt"], localNewer),
    tutorConversations: mergeById(local.tutorConversations, remote.tutorConversations, "id", ["updatedAt", "createdAt"], localNewer),
    tutorProjects: mergeById(local.tutorProjects, remote.tutorProjects, "id", ["createdAt"], localNewer),
    generatedPapers: mergeById(local.generatedPapers as unknown as Rec[], (remote.generatedPapers ?? []) as unknown as Rec[], "id", ["createdAt"], localNewer) as unknown as AppState["generatedPapers"],
    examResults: mergeById(local.examResults, remote.examResults, "id", ["date"], localNewer),
    goals: mergeById(local.goals, remote.goals, "id", ["createdAt"], localNewer),
    revisionDone: mergeById(local.revisionDone, remote.revisionDone, "questionId", ["doneAt"], localNewer),
    rev: Math.max(localRev, remoteRev),
    hydrated: true,
  };
}

/** Strip transient/oversized fields before uploading. */
export function toSyncPayload(state: AppState) {
  const { hydrated: _h, ...rest } = state;
  return rest;
}
