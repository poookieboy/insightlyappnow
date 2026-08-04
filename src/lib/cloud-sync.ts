import { supabase } from "@/integrations/supabase/client";
import { getState, replaceState, subscribeStore, type AppState } from "./store";
import { mergeStates, toSyncPayload } from "./sync";

export type SyncStatus = "idle" | "syncing" | "synced" | "offline" | "error";

const PUSH_DEBOUNCE = 2500;
const POLL_INTERVAL = 60_000;

let status: SyncStatus = "idle";
let lastSyncedAt: string | null = null;
const listeners = new Set<() => void>();

let userId: string | null = null;
let pulledOnce = false;
let pushing = false;
let lastPushedRev = 0;
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let unsubscribeStore: (() => void) | null = null;

function setStatus(next: SyncStatus) {
  if (status === next) return;
  status = next;
  listeners.forEach((l) => l());
}

export function getSyncSnapshot() {
  return snapshot;
}
let snapshot: { status: SyncStatus; lastSyncedAt: string | null } = { status, lastSyncedAt };
function refreshSnapshot() {
  snapshot = { status, lastSyncedAt };
}
listeners.add(refreshSnapshot);

export function subscribeSync(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function offline() {
  return typeof navigator !== "undefined" && !navigator.onLine;
}

export async function pull() {
  if (!userId) return;
  if (offline()) { setStatus("offline"); refreshSnapshot(); return; }
  setStatus("syncing"); refreshSnapshot();
  const { data, error } = await supabase
    .from("user_state")
    .select("data,updated_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) { setStatus("error"); refreshSnapshot(); return; }

  const remote = (data?.data ?? null) as Partial<AppState> | null;
  if (remote && typeof remote === "object" && Object.keys(remote).length > 0) {
    replaceState(mergeStates(getState(), remote));
  }
  pulledOnce = true;
  lastSyncedAt = data?.updated_at ?? new Date().toISOString();
  setStatus("synced");
  refreshSnapshot();
  await push(true);
}

export async function push(force = false) {
  if (!userId) return;
  if (!pulledOnce && !force) return;
  if (pushing) return;
  if (offline()) { setStatus("offline"); refreshSnapshot(); return; }
  const state = getState();
  if (!force && state.rev <= lastPushedRev) return;
  pushing = true;
  setStatus("syncing"); refreshSnapshot();
  const { error } = await supabase
    .from("user_state")
    .upsert({ user_id: userId, data: toSyncPayload(state) as never }, { onConflict: "user_id" });
  pushing = false;
  if (error) { setStatus("error"); refreshSnapshot(); return; }
  lastPushedRev = state.rev;
  lastSyncedAt = new Date().toISOString();
  setStatus("synced");
  refreshSnapshot();
}

/** Force an immediate two-way sync (used by the "Sync now" action). */
export async function syncNow() {
  await pull();
}

function schedulePush() {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => void push(), PUSH_DEBOUNCE);
}

const onFocus = () => void pull();
const onOnline = () => void pull();

export function startSync(id: string) {
  if (userId === id) return;
  stopSync();
  userId = id;
  pulledOnce = false;
  lastPushedRev = 0;
  void pull();
  unsubscribeStore = subscribeStore(schedulePush);
  pollTimer = setInterval(() => void pull(), POLL_INTERVAL);
  window.addEventListener("focus", onFocus);
  window.addEventListener("online", onOnline);
}

export function stopSync() {
  userId = null;
  pulledOnce = false;
  unsubscribeStore?.();
  unsubscribeStore = null;
  if (pushTimer) clearTimeout(pushTimer);
  if (pollTimer) clearInterval(pollTimer);
  pushTimer = null;
  pollTimer = null;
  if (typeof window !== "undefined") {
    window.removeEventListener("focus", onFocus);
    window.removeEventListener("online", onOnline);
  }
  setStatus("idle");
  refreshSnapshot();
}
