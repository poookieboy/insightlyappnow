import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { useAuth } from "@/hooks/useAuth";

export function RequireProfile({ children }: { children: ReactNode }) {
  const { state } = useStore();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    if (state.hydrated && !state.profile) navigate({ to: "/" });
  }, [loading, user, state.hydrated, state.profile, navigate]);

  if (loading || !user || !state.hydrated || !state.profile) return null;
  return <>{children}</>;
}
