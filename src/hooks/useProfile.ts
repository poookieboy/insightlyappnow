import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface DbProfile {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
}

// Shared cache + listeners so an upload in Settings immediately updates Home.
let cache: DbProfile | null = null;
const subscribers = new Set<(p: DbProfile | null) => void>();

function broadcast(p: DbProfile | null) {
  cache = p;
  subscribers.forEach((cb) => cb(p));
}

/** Notify every mounted useProfile() instance that the profile changed. */
export function notifyProfileChanged(p: DbProfile | null) {
  broadcast(p);
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<DbProfile | null>(cache);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) { broadcast(null); return; }
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("user_id,display_name,avatar_url")
      .eq("user_id", user.id)
      .maybeSingle();
    broadcast((data as DbProfile | null) ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    const cb = (p: DbProfile | null) => setProfile(p);
    subscribers.add(cb);
    refresh();
    return () => { subscribers.delete(cb); };
  }, [refresh]);

  return { profile, loading, refresh };
}
