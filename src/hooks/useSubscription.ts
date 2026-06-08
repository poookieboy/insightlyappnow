import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface SubscriptionStatus {
  tier: "trial" | "pro" | "expired";
  trial_started_at: string;
  trial_ends_at: string;
  pro_until: string | null;
  provider: "stripe" | "mpesa" | null;
}

export interface SubscriptionInfo extends SubscriptionStatus {
  isActive: boolean;
  isTrial: boolean;
  isPro: boolean;
  daysLeft: number;
  expiresAt: Date;
}

function compute(row: SubscriptionStatus): SubscriptionInfo {
  const now = Date.now();
  const trialEnd = new Date(row.trial_ends_at);
  const proEnd = row.pro_until ? new Date(row.pro_until) : null;

  const proActive = !!(proEnd && proEnd.getTime() > now);
  const trialActive = row.tier === "trial" && trialEnd.getTime() > now;
  const isActive = proActive || trialActive;
  const expiresAt = proActive ? proEnd! : trialEnd;
  const daysLeft = Math.max(0, Math.ceil((expiresAt.getTime() - now) / (1000 * 60 * 60 * 24)));

  return {
    ...row,
    isActive,
    isTrial: !proActive && row.tier === "trial",
    isPro: proActive,
    daysLeft,
    expiresAt,
  };
}

export function useSubscription() {
  const { user, loading: authLoading } = useAuth();
  const [info, setInfo] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setInfo(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("user_subscription_status")
      .select("tier,trial_started_at,trial_ends_at,pro_until,provider")
      .eq("user_id", user.id)
      .maybeSingle();
    if (data) setInfo(compute(data as SubscriptionStatus));
    else setInfo(null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading) refresh();
  }, [authLoading, refresh]);

  return { info, loading: loading || authLoading, refresh };
}
