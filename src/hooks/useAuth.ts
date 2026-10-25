import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const apply = (s: Session | null) => {
      if (!active) return;
      setSession(s);
      setUser(s?.user ?? null);
      setError("");
      setLoading(false);
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      apply(s);
    });

    const timer = window.setTimeout(() => {
      if (!active) return;
      setLoading(false);
      setError("We couldn’t restore your sign-in. Check your connection and try again.");
    }, 12000);
    void supabase.auth.getSession().then(({ data: { session: s }, error: failure }) => {
      if (failure) throw failure;
      apply(s);
    }).catch(() => {
      if (!active) return;
      setSession(null); setUser(null); setLoading(false);
      setError("We couldn’t restore your sign-in. Check your connection and try again.");
    }).finally(() => window.clearTimeout(timer));

    return () => { active = false; window.clearTimeout(timer); subscription.unsubscribe(); };
  }, []);

  return { session, user, loading, error };
}
