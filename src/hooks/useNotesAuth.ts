import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { externalSupabase } from "@/integrations/external-supabase/client";

/** Notes uses the already-configured external service, not the app's managed connection. */
export function useNotesAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    const { data: { subscription } } = externalSupabase.auth.onAuthStateChange((_event, session) => {
      if (active) { setUser(session?.user ?? null); setLoading(false); }
    });
    externalSupabase.auth.getSession().then(({ data }) => {
      if (active) { setUser(data.session?.user ?? null); setLoading(false); }
    }).catch(() => { if (active) setLoading(false); });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);
  return { user, loading };
}