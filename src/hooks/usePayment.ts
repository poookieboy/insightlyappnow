import { useCallback, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PayStage =
  | "idle"
  | "sending"
  | "waiting"
  | "success"
  | "failed";

interface StartArgs {
  type: "subscription" | "sponsorship";
  plan?: "monthly" | "sixmonth" | "yearly";
  amount?: number;
  phone: string;
  message?: string;
}

export function usePayment() {
  const [stage, setStage] = useState<PayStage>("idle");
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reset = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }

    setStage("idle");
    setError(null);
  }, []);

  const start = useCallback(async (args: StartArgs): Promise<boolean> => {
    setError(null);

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setError(
        "You're offline — connect to the internet to complete your payment.",
      );
      setStage("failed");
      return false;
    }

    setStage("sending");

    try {
      // Get the currently signed-in Supabase user/session.
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        setError("Please sign in first.");
        setStage("failed");
        return false;
      }

      // The Edge Function expects "sponsor", not "sponsorship".
      const kind =
        args.type === "subscription" ? "subscription" : "sponsor";

      // Start the payment directly through Supabase.
      const { data, error: functionError } =
        await supabase.functions.invoke("payments-initiate", {
          body: {
            phone: args.phone,
            amount: args.amount,
            kind,
            plan: args.plan,
            message: args.message,
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

      if (functionError) {
        console.error("Payment initiation error:", functionError);

        setError(
          functionError.message || "Could not start the payment.",
        );
        setStage("failed");
        return false;
      }

      if (!data?.success) {
        console.error("Payment initiation response:", data);

        setError(
          data?.error ||
            data?.message ||
            "Could not start the payment.",
        );
        setStage("failed");
        return false;
      }

      setStage("waiting");

      /*
       * Sponsor Scholar payments do not unlock a subscription.
       * Once the payment provider accepts the request, we can finish
       * this payment flow.
       */
      if (kind === "sponsor") {
        setStage("success");
        return true;
      }

      /*
       * Subscription payments must NOT be considered successful merely
       * because the M-Pesa/STK request was created.
       *
       * The backend webhook should update user_subscription_status.
       * We therefore wait for pro_until to become active.
       */
      const deadline = Date.now() + 3 * 60 * 1000;

      return await new Promise<boolean>((resolve) => {
        const poll = async () => {
          try {
            const {
              data: subscription,
              error: subscriptionError,
            } = await supabase
              .from("user_subscription_status")
              .select("pro_until")
              .eq("user_id", session.user.id)
              .maybeSingle();

            if (!subscriptionError && subscription?.pro_until) {
              const proUntil = new Date(
                subscription.pro_until,
              ).getTime();

              if (
                Number.isFinite(proUntil) &&
                proUntil > Date.now()
              ) {
                setStage("success");
                return resolve(true);
              }
            }
          } catch (pollError) {
            console.error(
              "Subscription status check failed:",
              pollError,
            );
          }

          if (Date.now() > deadline) {
            setError(
              "We haven't received a confirmation yet. If you paid, your subscription will unlock shortly.",
            );
            setStage("failed");
            return resolve(false);
          }

          timer.current = setTimeout(poll, 3000);
        };

        timer.current = setTimeout(poll, 3000);
      });
    } catch (err) {
      console.error("Payment error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Network problem. Check your connection and try again.",
      );

      setStage("failed");
      return false;
    }
  }, []);

  return {
    stage,
    error,
    start,
    reset,
  };
}
