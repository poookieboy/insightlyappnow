import { useCallback, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PayStage = "idle" | "sending" | "waiting" | "success" | "failed";

interface StartArgs {
  type: "subscription" | "sponsorship";
  plan?: "monthly" | "sixmonth" | "yearly";
  amount?: number;
  phone: string;
  message?: string;
}

async function authHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export function usePayment() {
  const [stage, setStage] = useState<PayStage>("idle");
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reset = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setStage("idle");
    setError(null);
  }, []);

  const start = useCallback(async (args: StartArgs): Promise<boolean> => {
    setError(null);
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setError("You're offline — connect to the internet to complete your payment.");
      setStage("failed");
      return false;
    }
    setStage("sending");
    try {
      const res = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify(args),
      });
      const json = (await res.json()) as { paymentId?: string; error?: string };
      if (!res.ok || !json.paymentId) {
        setError(json.error ?? "Could not start the payment.");
        setStage("failed");
        return false;
      }

      setStage("waiting");
      const paymentId = json.paymentId;
      const deadline = Date.now() + 3 * 60 * 1000;

      return await new Promise<boolean>((resolve) => {
        const poll = async () => {
          try {
            const r = await fetch(`/api/payments/status?id=${paymentId}`, { headers: await authHeaders() });
            const s = (await r.json()) as { status?: string; error?: string };
            if (s.status === "success") {
              setStage("success");
              return resolve(true);
            }
            if (s.status === "failed" || s.status === "cancelled") {
              setError(
                s.status === "cancelled"
                  ? "The M-Pesa prompt was cancelled or timed out."
                  : "The payment did not go through. No money was taken.",
              );
              setStage("failed");
              return resolve(false);
            }
          } catch {
            /* keep polling */
          }
          if (Date.now() > deadline) {
            setError("We haven't received a confirmation yet. If you paid, it will unlock shortly.");
            setStage("failed");
            return resolve(false);
          }
          timer.current = setTimeout(poll, 3000);
        };
        timer.current = setTimeout(poll, 3000);
      });
    } catch {
      setError("Network problem. Check your connection and try again.");
      setStage("failed");
      return false;
    }
  }, []);

  return { stage, error, start, reset };
}
