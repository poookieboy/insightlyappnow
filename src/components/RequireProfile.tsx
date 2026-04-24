import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useStore } from "@/lib/store";

export function RequireProfile({ children }: { children: ReactNode }) {
  const { state } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    // wait one tick for hydration of localStorage
    const t = setTimeout(() => {
      if (!state.profile) navigate({ to: "/" });
    }, 50);
    return () => clearTimeout(t);
  }, [state.profile, navigate]);

  if (!state.profile) return null;
  return <>{children}</>;
}
