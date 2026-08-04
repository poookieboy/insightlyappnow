import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { getState, replaceState, subscribeStore, type AppState } from "@/lib/store";
import { mergeStates, toSyncPayload } from "@/lib/sync";

export type SyncStatus = "idle" | "syncing" | "synced" | "offline" | "error";

const PUSH_DEBOUNCE = 2500;
const POLL_INTERVAL = 60_000;

/**
 * Multi-device account synchronization.
 * Pulls the cloud snapshot on sign-in, merges it with local data, then pushes
 * debounced updates. Polls periodically and on window focus so a second device
 * converges quickly.
 */
export function useCloudSync() {
  const { user } = useAuth();
  const [status, setStatus] = useState<SyncStatus>("idle");
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pushing = useRef(false);
  const lastPushedRev = useRef(0);
  const pulledOnce = useRef(false);

  useEffect(() => {
    if (!user) {
      pulledOnce.current = false;
      lastPushedRev.current = 0;
      setStatus("idle");
      return;
    }
    let cancelled = false;

    const pull = async () => {
      if (typeof navigator !== "undefined" && !navigator.onLine) { setStatus("offline"); return; }
      setStatus("syncing");
      const { data, error } = await supabase
        .from("user_state")
        .select("data,updated_at")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (error) { setStatus("error"); return; }

      const remote = (data?.data ?? null) as Partial<AppState> | null;
      if (remote && typeof remote === "object") {
        const merged = mergeStates(getState(), remote);
        replaceState(merged);
      }
      pulledOnce.current = true;
      setLastSyncedAt(data?.updated_at ?? new Date().toISOString());
      setStatus("synced");
      // Ensure the cloud has at least what this device knows.
      void push(true);
    };

    const push = async (force = false) => {
      if (!pulledOnce.current && !force) return;
      if (pushing.current) return;
      if (typeof navigator !== "undefined" && !navigator.onLine) { setStatus("offline"); return; }
      const snapshot = getState();
      if (!force && snapshot.rev <= lastPushedRev.current) return;
      pushing.current = true;
      setStatus("syncing");
      const { error } = await supabase
        .from("user_state")
        .upsert(
          { user_id: user.id, data: toSyncPayload(snapshot) as never },
          { onConflict: "user_id" },
        );
      pushing.current = false;
      if (cancelled) return;
      if (error) { setStatus("error"); return; }
      lastPushedRev.current = snapshot.rev;
      setLastSyncedAt(new Date().toISOString());
      setStatus("synced");
    };

    const schedulePush = () => {
      if (pushTimer.current) clearTimeout(pushTimer.current);
      pushTimer.current = setTimeout(() => void push(), PUSH_DEBOUNCE);
    };

    void pull();
    const unsubscribe = subscribeStore(schedulePush);
    const interval = setInterval(() => void pull(), POLL_INTERVAL);
    const onFocus = () => void pull();
    const onOnline = () => void pull();
    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onOnline);

    return () => {
      cancelled = true;
      unsubscribe();
      clearInterval(interval);
      if (pushTimer.current) clearTimeout(pushTimer.current);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("online", onOnline);
    };
  }, [user]);

  return { status, lastSyncedAt };
}
