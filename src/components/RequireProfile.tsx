import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useStore } from "@/lib/store";

export function RequireProfile({ children }: { children: ReactNode }) {
  const { state } = useStore();
  const navigate = useNavigate();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Allow one render for localStorage to hydrate into state
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && !state.profile) navigate({ to: "/" });
  }, [hydrated, state.profile, navigate]);

  if (!hydrated || !state.profile) return null;
  return <>{children}</>;
}
