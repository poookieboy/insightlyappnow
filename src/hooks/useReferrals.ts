import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const PENDING_REFERRAL_KEY = "insightly:pending-referral";

export interface ReferralRow {
  id: string;
  referred_user_id: string;
  code_used: string;
  confirmed_at: string;
}

export interface RewardRow {
  id: string;
  milestone: number;
  hours: number;
  created_at: string;
}

export const REFERRALS_PER_REWARD = 4;

export function useReferrals() {
  const { user, loading: authLoading } = useAuth();
  const [code, setCode] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [rewards, setRewards] = useState<RewardRow[]>([]);
  const [joinedAt, setJoinedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setCode(null);
      setReferrals([]);
      setRewards([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const [{ data: profile }, { data: refs }, { data: rews }] = await Promise.all([
      supabase
        .from("profiles")
        .select("referral_code, created_at")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("referrals")
        .select("id, referred_user_id, code_used, confirmed_at")
        .eq("referrer_id", user.id)
        .order("confirmed_at", { ascending: false }),
      supabase
        .from("referral_rewards")
        .select("id, milestone, hours, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    setCode(profile?.referral_code ?? null);
    setJoinedAt(profile?.created_at ?? user.created_at ?? null);
    setReferrals((refs ?? []) as ReferralRow[]);
    setRewards((rews ?? []) as RewardRow[]);
    setLoading(false);
  }, [user]);

  // Redeem a code stored at sign-up, once the account is email-verified.
  useEffect(() => {
    if (authLoading || !user) return;
    if (!user.email_confirmed_at) return;
    const pending =
      typeof window !== "undefined" ? window.localStorage.getItem(PENDING_REFERRAL_KEY) : null;
    if (!pending) return;

    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.rpc("claim_referral", { p_code: pending });
      const result = data as { ok?: boolean; error?: string } | null;
      // Keep the code only when the account is not verified yet; otherwise it's resolved.
      if (!error && result?.error !== "verify_email") {
        window.localStorage.removeItem(PENDING_REFERRAL_KEY);
      }
      if (!cancelled) refresh();
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, user, refresh]);

  useEffect(() => {
    if (!authLoading) refresh();
  }, [authLoading, refresh]);

  const count = referrals.length;
  const nextMilestone = (Math.floor(count / REFERRALS_PER_REWARD) + 1) * REFERRALS_PER_REWARD;
  const toNext = nextMilestone - count;
  const hoursEarned = rewards.reduce((n, r) => n + r.hours, 0);

  return {
    code,
    referrals,
    rewards,
    count,
    nextMilestone,
    toNext,
    hoursEarned,
    joinedAt,
    loading: loading || authLoading,
    refresh,
  };
}
