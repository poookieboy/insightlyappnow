import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useStore } from "@/lib/store";

export function RequireProfile({ children }: { children: ReactNode }) {
  const { state } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (state.hydrated && !state.profile) navigate({ to: "/" });
  }, [state.hydrated, state.profile, navigate]);

  if (!state.hydrated || !state.profile) return null;
  return <>{children}</>;
}
