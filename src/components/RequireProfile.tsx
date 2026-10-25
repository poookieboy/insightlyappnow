import { useEffect, type ReactNode } from "react";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { LegalAcceptanceGate } from "./LegalAcceptanceGate";
import { AccountSync } from "./AccountSync";
import { Loader2 } from "lucide-react";

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

  if (authLoading || !user || !state.hydrated || !state.profile) return <main className="flex min-h-screen items-center justify-center gap-3 bg-background text-muted-foreground" role="status"><Loader2 className="h-5 w-5 animate-spin" />Opening Insightly…</main>;

  return (
    <>
      <LegalAcceptanceGate />
      <AccountSync />
      {children}
    </>
  );
}
