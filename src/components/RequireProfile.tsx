import { useEffect, type ReactNode } from "react";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { LegalAcceptanceGate } from "./LegalAcceptanceGate";
import { AccountSync } from "./AccountSync";

// Routes a user can still access when their trial is expired
const ALLOWED_WHEN_LOCKED = ["/go-pro", "/settings", "/about", "/donate", "/terms", "/privacy", "/auth"];

export function RequireProfile({ children, allowWhenLocked = false }: { children: ReactNode; allowWhenLocked?: boolean }) {
  const { state } = useStore();
  const { user, loading: authLoading } = useAuth();
  const { info, loading: subLoading } = useSubscription();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    if (state.hydrated && !state.profile) {
      navigate({ to: "/" });
      return;
    }
    if (subLoading) return;
    if (info && !info.isActive && !allowWhenLocked) {
      const allowed = ALLOWED_WHEN_LOCKED.some((p) => pathname.startsWith(p));
      if (!allowed) navigate({ to: "/go-pro" });
    }
  }, [authLoading, user, state.hydrated, state.profile, subLoading, info, allowWhenLocked, pathname, navigate]);

  if (authLoading || !user || !state.hydrated || !state.profile) return null;

  return (
    <>
      <LegalAcceptanceGate />
      <AccountSync />
      {children}
    </>
  );
}
