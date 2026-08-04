import { useEffect, useSyncExternalStore } from "react";
import { useAuth } from "./useAuth";
import { getSyncSnapshot, startSync, stopSync, subscribeSync, type SyncStatus } from "@/lib/cloud-sync";

const serverSnapshot = { status: "idle" as SyncStatus, lastSyncedAt: null as string | null };

/** Subscribe to sync state without starting the engine. */
export function useSyncStatus() {
  return useSyncExternalStore(subscribeSync, getSyncSnapshot, () => serverSnapshot);
}

/**
 * Multi-device account synchronization. Mount once (AccountSync).
 * Pulls the cloud snapshot on sign-in, merges it with local data, then pushes
 * debounced updates. Polls periodically and on focus so a second device converges.
 */
export function useCloudSync() {
  const { user } = useAuth();
  const snapshot = useSyncStatus();

  useEffect(() => {
    if (!user) { stopSync(); return; }
    startSync(user.id);
  }, [user]);

  return snapshot;
}

export type { SyncStatus };
